import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FaceRecognitionService } from 'src/app/global/services/face/face-recognition.service';
import { PresenceService } from 'src/app/global/services/presence/presence.service';
import { PersonaStateService } from 'src/app/global/services/personas/persona-state.service';

@Component({
  selector: 'app-locked',
  templateUrl: './locked.component.html',
  styleUrls: ['./locked.component.scss']
})
export class LockedComponent implements OnInit, OnDestroy {
  @ViewChild('videoEl') videoRef!: ElementRef<HTMLVideoElement>;

  scanning = false;
  recognized = false;
  loadingModels = true;
  distance: number | null = null;
  proximity: 'near' | 'far' | null = null;
  cameraError: string | null = null;
  refImgUrl: string | null = null;
  attemptedAssetUrls: string[] = [];
  private stream: MediaStream | null = null;
  private rafId: number | null = null;

  constructor(
    private router: Router,
    private face: FaceRecognitionService,
    private presence: PresenceService,
    private personaState: PersonaStateService
  ) {}

  async ngOnInit() {
    try {
      // Always show the preview image first, without depending on models
      await this.tryLoadAssetReference(false);

      // Then load models and enroll reference if not already set
      await this.face.loadModels();
      await this.face.loadReferenceFromStorage();
      if (!this.face.hasReference() && this.refImgUrl) {
        const img = await this.loadImage(this.refImgUrl);
        await this.face.setReferenceFromImageElement(img);
      }
    } catch (e) {
      console.error(e);
    } finally {
      this.loadingModels = false;
    }
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  async onUploadRef(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    try {
      await this.face.setReferenceFromFile(file);
      // Show preview for the session only
      const dataUrl = await this.readFileAsDataUrl(file);
      this.refImgUrl = dataUrl;
    } catch (e) {
      alert('Could not set reference image. Make sure a single face is visible.');
      console.error(e);
    }
  }

  async startScan() {
    if (this.scanning) return;
    // Ensure models are available before starting
    if (!this.face.modelsAreLoaded()) {
      try {
        await this.face.loadModels();
      } catch (e) {
        this.cameraError = 'Face models failed to load. Check network or model assets.';
        return;
      }
    }
    this.scanning = true;
    await this.startCamera();
    this.loopCompare();
  }

  stopScan() {
    this.scanning = false;
    this.stopCamera();
    // mark not present when stopping
    this.presence.update({ present: false, device: 'wall-display' }).subscribe();
  }

  private async startCamera() {
    try {
      // Ensure the video element exists before assigning the stream
      const video = await this.waitForVideoEl();
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      video.srcObject = this.stream;
      await video.play();
      this.cameraError = null;
    } catch (e: any) {
      this.scanning = false;
      const name = e?.name || 'Error';
      const msg = e?.message || '';
      let hint = '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        hint = 'Permission blocked. Allow Camera in browser Site settings for localhost:4200.';
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        hint = 'No camera found or constraints not met. Ensure a webcam is connected and enabled.';
      } else if (name === 'NotReadableError') {
        hint = 'Camera is in use by another app. Close other apps using the camera and retry.';
      } else {
        hint = 'General error acquiring camera stream.';
      }
      this.cameraError = `${name}: ${msg}. ${hint}`;
      console.error('getUserMedia error:', e);
    }
  }

  private async waitForVideoEl(timeoutMs = 1500): Promise<HTMLVideoElement> {
    const start = performance.now();
    while (!this.videoRef || !this.videoRef.nativeElement) {
      await new Promise((r) => requestAnimationFrame(r));
      if (performance.now() - start > timeoutMs) {
        throw new Error('Video element not ready');
      }
    }
    return this.videoRef.nativeElement;
  }

  private stopCamera() {
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
  }

  private async tryLoadAssetReference(setAsReference: boolean) {
    // Use the exact asset the user specified
    const url = `assets/fault.jpg`;
    try {
      const img = await this.loadImage(url);
      this.refImgUrl = url;
      if (setAsReference || !this.face.hasReference()) {
        await this.face.setReferenceFromImageElement(img);
      }
      return;
    } catch (e) {
      this.attemptedAssetUrls.push(url);
      console.warn('Asset not found:', url);
    }
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      // cache-bust in case the asset was just added while dev server is running
      const bust = `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`;
      img.src = bust;
    });
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  private loopCompare = async () => {
    if (!this.scanning) return;
    try {
      const res = await this.face.compareFromVideo(this.videoRef.nativeElement);
      this.distance = res.distance;
      this.proximity = res.proximity || null;
      console.log('face distance:', res.distance);

      // send presence hints to backend so dashboard can react
      const distanceMeters = this.proximity === 'near' ? 1 : this.proximity === 'far' ? 3 : null;
      const personaId = this.personaState.current();
      if (distanceMeters !== null) {
        this.presence.update({ present: true, device: 'wall-display', distanceMeters, personaId }).subscribe();
      }

      if (res.matched) {
        this.recognized = true;
        this.scanning = false;
        this.stopCamera();
      }
    } catch (err: any) {
      const msg = String(err?.message || err || '');
      if (msg.includes('Models not loaded')) {
        this.cameraError = 'Models not loaded yet. Please wait until they finish loading.';
        this.scanning = false;
        this.stopCamera();
        return;
      }
      console.error(err);
    }
    this.rafId = requestAnimationFrame(this.loopCompare);
  }

  unlock() {
    if (!this.recognized) return;
    this.router.navigateByUrl('/home');
  }

  resetReference() {
    try {
      this.face.clearReference();
      this.refImgUrl = null;
      this.recognized = false;
      this.distance = null;
      this.proximity = null;
      this.presence.update({ present: false, device: 'wall-display' }).subscribe();
    } catch (e) {
      console.error(e);
    }
  }
}
