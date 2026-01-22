import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { Camera } from '@mediapipe/camera_utils';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Hands } from '@mediapipe/hands';

type CornerName = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

type CalibrationCorners = Partial<Record<CornerName, { u: number; v: number }>>;

type CalibrationV1 = {
  version: 1;
  minU: number;
  maxU: number;
  minV: number;
  maxV: number;
  mirrorX: boolean;
  updatedAt: number;
};

type AssistiveState = {
  running: boolean;
  hasFace: boolean;
  hasHand: boolean;
  pinching: boolean;
  lastClickAt: number | null;
  u: number | null;
  v: number | null;
  x: number | null;
  y: number | null;
  calibration: CalibrationV1 | null;
  corners: CalibrationCorners;
  error: string | null;
};

const STORAGE_KEY_CALIBRATION = 'assistive_calibration_v1';
const STORAGE_KEY_CORNERS = 'assistive_calibration_corners_v1';

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function dist2D(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

@Injectable({ providedIn: 'root' })
export class AssistiveInputService {
  private readonly stateSubject = new BehaviorSubject<AssistiveState>({
    running: false,
    hasFace: false,
    hasHand: false,
    pinching: false,
    lastClickAt: null,
    u: null,
    v: null,
    x: null,
    y: null,
    calibration: null,
    corners: {},
    error: null,
  });

  readonly state$: Observable<AssistiveState> = this.stateSubject.asObservable();

  private camera: any | null = null;
  private faceMesh: any | null = null;
  private hands: any | null = null;

  private videoEl: HTMLVideoElement | null = null;

  private cursorEl: HTMLDivElement | null = null;
  private lastPinching = false;
  private lastClickTs = 0;

  // EMA smoothing for cursor
  private smoothedX: number | null = null;
  private smoothedY: number | null = null;

  // last raw gaze in normalized eye coords
  private lastU: number | null = null;
  private lastV: number | null = null;

  // Tunables
  private clickCooldownMs = 700;
  private pinchRatioThreshold = 0.35;
  private mirrorX = true;

  constructor(private readonly zone: NgZone) {
    this.loadCalibration();
    this.loadCorners();
  }

  setMirrorX(mirror: boolean) {
    this.mirrorX = mirror;
    const current = this.stateSubject.value.calibration;
    if (current) {
      const updated: CalibrationV1 = { ...current, mirrorX: mirror, updatedAt: Date.now() };
      this.persistCalibration(updated);
    }
    this.patchState({ calibration: this.stateSubject.value.calibration ? { ...this.stateSubject.value.calibration, mirrorX: mirror, updatedAt: Date.now() } : null });
  }

  setPinchThresholdRatio(ratio: number) {
    this.pinchRatioThreshold = Math.max(0.1, Math.min(0.8, ratio));
  }

  setClickCooldownMs(ms: number) {
    this.clickCooldownMs = Math.max(150, Math.min(3000, ms));
  }

  async start(videoEl: HTMLVideoElement): Promise<void> {
    if (this.stateSubject.value.running) return;

    this.videoEl = videoEl;

    this.patchState({ running: true, error: null });

    try {
      this.ensureCursor();

      const faceMesh = new FaceMesh({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      faceMesh.onResults((results: any) => {
        this.zone.runOutsideAngular(() => {
          this.onFaceResults(results);
        });
      });

      const hands = new Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      hands.onResults((results: any) => {
        this.zone.runOutsideAngular(() => {
          this.onHandsResults(results);
        });
      });

      this.faceMesh = faceMesh;
      this.hands = hands;

      const camera = new Camera(videoEl, {
        onFrame: async () => {
          if (!this.faceMesh || !this.hands) return;
          // Run both models on the same frame
          await this.faceMesh.send({ image: videoEl });
          await this.hands.send({ image: videoEl });
        },
        width: 640,
        height: 480,
      });
      this.camera = camera;

      await camera.start();

      this.patchState({ running: true, error: null });
    } catch (e: any) {
      this.stop();
      this.patchState({ error: e?.message || 'Failed to start assistive input' });
      throw e;
    }
  }

  stop(): void {
    try {
      this.camera?.stop?.();
    } catch {
      // ignore
    }

    this.camera = null;
    this.faceMesh = null;
    this.hands = null;
    this.videoEl = null;

    this.lastPinching = false;
    this.smoothedX = null;
    this.smoothedY = null;
    this.lastU = null;
    this.lastV = null;

    this.patchState({
      running: false,
      hasFace: false,
      hasHand: false,
      pinching: false,
      u: null,
      v: null,
      x: null,
      y: null,
    });
  }

  clearCalibration(): void {
    localStorage.removeItem(STORAGE_KEY_CALIBRATION);
    localStorage.removeItem(STORAGE_KEY_CORNERS);
    this.patchState({ calibration: null, corners: {} });
  }

  captureCorner(name: CornerName): void {
    const u = this.lastU;
    const v = this.lastV;
    if (u == null || v == null) {
      console.warn('[assistive-input] Cannot capture corner - no gaze data available');
      return;
    }

    console.log(`[assistive-input] Captured ${name}: u=${u.toFixed(3)}, v=${v.toFixed(3)}`);

    const corners: CalibrationCorners = { ...this.stateSubject.value.corners, [name]: { u, v } };
    localStorage.setItem(STORAGE_KEY_CORNERS, JSON.stringify(corners));
    this.patchState({ corners });

    const tl = corners.topLeft;
    const tr = corners.topRight;
    const bl = corners.bottomLeft;
    const br = corners.bottomRight;

    if (tl && tr && bl && br) {
      const minU = (tl.u + bl.u) / 2;
      const maxU = (tr.u + br.u) / 2;
      const minV = (tl.v + tr.v) / 2;
      const maxV = (bl.v + br.v) / 2;

      console.log(`[assistive-input] Calibration computed: u range [${minU.toFixed(3)}, ${maxU.toFixed(3)}], v range [${minV.toFixed(3)}, ${maxV.toFixed(3)}]`);

      const calibration: CalibrationV1 = {
        version: 1,
        minU,
        maxU,
        minV,
        maxV,
        mirrorX: this.mirrorX,
        updatedAt: Date.now(),
      };

      this.persistCalibration(calibration);
      this.patchState({ calibration });
    }
  }

  private persistCalibration(calibration: CalibrationV1) {
    localStorage.setItem(STORAGE_KEY_CALIBRATION, JSON.stringify(calibration));
  }

  private loadCalibration() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CALIBRATION);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CalibrationV1;
      if (!parsed || parsed.version !== 1) return;
      this.mirrorX = parsed.mirrorX ?? true;
      this.patchState({ calibration: parsed });
    } catch {
      // ignore
    }
  }

  private loadCorners() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CORNERS);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CalibrationCorners;
      this.patchState({ corners: parsed || {} });
    } catch {
      // ignore
    }
  }

  private onFaceResults(results: any) {
    const landmarks = results?.multiFaceLandmarks?.[0];

    if (!landmarks || !Array.isArray(landmarks)) {
      this.patchState({ hasFace: false, u: null, v: null });
      return;
    }

    const uv = this.computeEyeUV(landmarks);
    if (!uv) {
      this.patchState({ hasFace: true, u: null, v: null });
      return;
    }

    const { u, v } = uv;
    this.lastU = u;
    this.lastV = v;

    const mapped = this.mapUVToScreen(u, v);
    if (!mapped) {
      this.patchState({ hasFace: true, u, v, x: null, y: null });
      return;
    }

    const { x, y } = this.smoothXY(mapped.x, mapped.y);
    this.updateCursor(x, y);

    this.patchState({ hasFace: true, u, v, x, y });
  }

  private onHandsResults(results: any) {
    const lm = results?.multiHandLandmarks?.[0];

    if (!lm || !Array.isArray(lm)) {
      this.lastPinching = false;
      this.patchState({ hasHand: false, pinching: false });
      return;
    }

    const pinch = this.detectPinch(lm);

    const pinching = pinch;

    const now = Date.now();
    if (pinching && !this.lastPinching) {
      if (now - this.lastClickTs >= this.clickCooldownMs) {
        const { x, y } = this.stateSubject.value;
        if (x != null && y != null) {
          const ok = this.clickAt(x, y);
          if (ok) {
            this.lastClickTs = now;
            this.patchState({ lastClickAt: now });
          }
        }
      }
    }

    this.lastPinching = pinching;
    this.patchState({ hasHand: true, pinching });
  }

  private detectPinch(handLandmarks: any[]): boolean {
    // MediaPipe Hands landmark indices
    // Thumb tip: 4, Index tip: 8
    // Use a scale-invariant ratio: tip distance / palm width
    const thumb = handLandmarks[4];
    const index = handLandmarks[8];
    const indexMcp = handLandmarks[5];
    const pinkyMcp = handLandmarks[17];

    if (!thumb || !index || !indexMcp || !pinkyMcp) return false;

    const tipDist = dist2D(thumb.x, thumb.y, index.x, index.y);
    const palmWidth = Math.max(1e-6, dist2D(indexMcp.x, indexMcp.y, pinkyMcp.x, pinkyMcp.y));

    const ratio = tipDist / palmWidth;
    return ratio < this.pinchRatioThreshold;
  }

  private computeEyeUV(landmarks: any[]): { u: number; v: number } | null {
    // Eye boundary landmarks
    // Left eye: inner=133, outer=33
    // Right eye: inner=362, outer=263
    const leftInner = landmarks[133];
    const leftOuter = landmarks[33];
    const leftTop = landmarks[159];
    const leftBottom = landmarks[145];

    const rightInner = landmarks[362];
    const rightOuter = landmarks[263];
    const rightTop = landmarks[386];
    const rightBottom = landmarks[374];

    if (!leftInner || !leftOuter || !leftTop || !leftBottom || !rightInner || !rightOuter || !rightTop || !rightBottom) {
      return null;
    }

    const leftIris = this.irisCenter(landmarks, 'left');
    const rightIris = this.irisCenter(landmarks, 'right');

    if (!leftIris || !rightIris) return null;

    // For LEFT eye: outer is on the LEFT side, inner is on the RIGHT side
    // When looking left, iris moves toward outer (smaller x)
    // When looking right, iris moves toward inner (larger x)
    // u should be 0 when looking left, 1 when looking right
    const leftEyeWidth = Math.abs(leftInner.x - leftOuter.x);
    const leftU = clamp01((leftIris.x - leftOuter.x) / Math.max(1e-6, leftEyeWidth));
    const leftV = clamp01((leftIris.y - leftTop.y) / Math.max(1e-6, leftBottom.y - leftTop.y));

    // For RIGHT eye: inner is on the LEFT side, outer is on the RIGHT side
    // When looking left, iris moves toward inner (smaller x)
    // When looking right, iris moves toward outer (larger x)
    const rightEyeWidth = Math.abs(rightOuter.x - rightInner.x);
    const rightU = clamp01((rightIris.x - rightInner.x) / Math.max(1e-6, rightEyeWidth));
    const rightV = clamp01((rightIris.y - rightTop.y) / Math.max(1e-6, rightBottom.y - rightTop.y));

    // Debug logging every 60 frames
    if (Math.random() < 0.016) {
      console.log(`[eye-debug] leftU=${leftU.toFixed(3)}, rightU=${rightU.toFixed(3)}, leftIris.x=${leftIris.x.toFixed(3)}, leftOuter.x=${leftOuter.x.toFixed(3)}, leftInner.x=${leftInner.x.toFixed(3)}`);
    }

    // Average both eyes
    const u = (leftU + rightU) / 2;
    const v = (leftV + rightV) / 2;

    return { u, v };
  }

  private irisCenter(landmarks: any[], which: 'left' | 'right'): { x: number; y: number } | null {
    // MediaPipe FaceMesh with refineLandmarks=true provides iris landmarks
    // Left iris: 468-472 (5 points around iris)
    // Right iris: 473-477 (5 points around iris)
    // But the actual center is at specific indices:
    // Left iris center: 468, Right iris center: 473
    
    if (which === 'left') {
      // Try iris landmarks 468-472
      const irisPts = [468, 469, 470, 471, 472]
        .map(i => landmarks[i])
        .filter(p => p && typeof p.x === 'number' && typeof p.y === 'number');
      
      if (irisPts.length >= 3) {
        const x = irisPts.reduce((a, p) => a + p.x, 0) / irisPts.length;
        const y = irisPts.reduce((a, p) => a + p.y, 0) / irisPts.length;
        console.log(`[iris-left] Found ${irisPts.length} points, center: ${x.toFixed(3)}, ${y.toFixed(3)}`);
        return { x, y };
      }
      
      // Fallback: use eye center estimate
      const leftInner = landmarks[133];
      const leftOuter = landmarks[33];
      const leftTop = landmarks[159];
      const leftBottom = landmarks[145];
      if (leftInner && leftOuter && leftTop && leftBottom) {
        const x = (leftInner.x + leftOuter.x) / 2;
        const y = (leftTop.y + leftBottom.y) / 2;
        console.log(`[iris-left] Using fallback eye center: ${x.toFixed(3)}, ${y.toFixed(3)}`);
        return { x, y };
      }
    } else {
      // Try iris landmarks 473-477
      const irisPts = [473, 474, 475, 476, 477]
        .map(i => landmarks[i])
        .filter(p => p && typeof p.x === 'number' && typeof p.y === 'number');
      
      if (irisPts.length >= 3) {
        const x = irisPts.reduce((a, p) => a + p.x, 0) / irisPts.length;
        const y = irisPts.reduce((a, p) => a + p.y, 0) / irisPts.length;
        console.log(`[iris-right] Found ${irisPts.length} points, center: ${x.toFixed(3)}, ${y.toFixed(3)}`);
        return { x, y };
      }
      
      // Fallback: use eye center estimate
      const rightInner = landmarks[362];
      const rightOuter = landmarks[263];
      const rightTop = landmarks[386];
      const rightBottom = landmarks[374];
      if (rightInner && rightOuter && rightTop && rightBottom) {
        const x = (rightInner.x + rightOuter.x) / 2;
        const y = (rightTop.y + rightBottom.y) / 2;
        console.log(`[iris-right] Using fallback eye center: ${x.toFixed(3)}, ${y.toFixed(3)}`);
        return { x, y };
      }
    }

    return null;
  }

  private mapUVToScreen(u: number, v: number): { x: number; y: number } | null {
    const calib = this.stateSubject.value.calibration;
    if (!calib) return null;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Normalize using calibration ranges first
    const du = Math.max(1e-6, calib.maxU - calib.minU);
    const dv = Math.max(1e-6, calib.maxV - calib.minV);

    let nx = (u - calib.minU) / du;
    const ny = (v - calib.minV) / dv;

    // Debug every 60 frames
    if (Math.random() < 0.016) {
      console.log(`[map-debug] u=${u.toFixed(3)}, minU=${calib.minU.toFixed(3)}, maxU=${calib.maxU.toFixed(3)}, nx=${nx.toFixed(3)}, mirror=${calib.mirrorX}`);
    }

    // Then apply mirror flip if needed
    if (calib.mirrorX) {
      nx = 1 - nx;
    }

    const x = Math.round(Math.min(width - 1, Math.max(0, nx * width)));
    const y = Math.round(Math.min(height - 1, Math.max(0, ny * height)));

    return { x, y };
  }

  private smoothXY(x: number, y: number): { x: number; y: number } {
    const alpha = 0.22;

    if (this.smoothedX == null || this.smoothedY == null) {
      this.smoothedX = x;
      this.smoothedY = y;
      return { x, y };
    }

    this.smoothedX = this.smoothedX + alpha * (x - this.smoothedX);
    this.smoothedY = this.smoothedY + alpha * (y - this.smoothedY);

    return { x: Math.round(this.smoothedX), y: Math.round(this.smoothedY) };
  }

  private clickAt(x: number, y: number): boolean {
    if (typeof document === 'undefined') return false;

    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    if (!el) return false;

    try {
      // Many components need focus first
      (el as any).focus?.();

      const common = { bubbles: true, cancelable: true, clientX: x, clientY: y, view: window };

      el.dispatchEvent(new MouseEvent('mousemove', common));
      el.dispatchEvent(new MouseEvent('mousedown', { ...common, button: 0 }));
      el.dispatchEvent(new MouseEvent('mouseup', { ...common, button: 0 }));
      el.dispatchEvent(new MouseEvent('click', { ...common, button: 0 }));

      return true;
    } catch {
      return false;
    }
  }

  private ensureCursor() {
    if (typeof document === 'undefined') return;
    if (this.cursorEl) return;

    const el = document.createElement('div');
    el.id = 'assistive-gaze-cursor';
    el.style.position = 'fixed';
    el.style.left = '0px';
    el.style.top = '0px';
    el.style.width = '28px';
    el.style.height = '28px';
    el.style.borderRadius = '50%';
    el.style.background = 'radial-gradient(circle, rgba(59, 130, 246, 0.95) 0%, rgba(37, 99, 235, 0.85) 100%)';
    el.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.95), 0 0 20px rgba(59, 130, 246, 0.6)';
    el.style.transform = 'translate(-9999px, -9999px)';
    el.style.zIndex = '2147483646';
    el.style.pointerEvents = 'none';
    el.style.transition = 'box-shadow 0.15s ease';
    
    // Add pulsing animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes gaze-cursor-pulse {
        0%, 100% { transform: translate(var(--cx), var(--cy)) scale(1); }
        50% { transform: translate(var(--cx), var(--cy)) scale(1.15); }
      }
      #assistive-gaze-cursor {
        animation: gaze-cursor-pulse 1.5s ease-in-out infinite;
      }
      #assistive-gaze-cursor.pinching {
        box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.95), 0 0 25px rgba(34, 197, 94, 0.8) !important;
        background: radial-gradient(circle, rgba(34, 197, 94, 0.95) 0%, rgba(21, 128, 61, 0.85) 100%) !important;
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(el);

    this.cursorEl = el;
  }

  private updateCursor(x: number, y: number) {
    if (!this.cursorEl) return;
    const tx = x - 14;
    const ty = y - 14;
    this.cursorEl.style.setProperty('--cx', `${tx}px`);
    this.cursorEl.style.setProperty('--cy', `${ty}px`);
    this.cursorEl.style.transform = `translate(${tx}px, ${ty}px)`;
    
    // Visual feedback when pinching
    if (this.lastPinching) {
      this.cursorEl.classList.add('pinching');
    } else {
      this.cursorEl.classList.remove('pinching');
    }
  }

  private patchState(patch: Partial<AssistiveState>) {
    this.stateSubject.next({ ...this.stateSubject.value, ...patch, calibration: patch.calibration ?? this.stateSubject.value.calibration });
  }
}
