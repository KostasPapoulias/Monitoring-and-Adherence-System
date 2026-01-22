import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { FaceRecognitionService } from './face-recognition.service';
import { PresenceMonitorService } from './presence-monitor.service';

type FaceState = 'INIT' | 'SCANNING' | 'SLEEP' | 'RECOGNIZED' | 'ERROR';

@Component({
  selector: 'app-face-login',
  templateUrl: './face-login.component.html',
  styleUrls: ['./face-login.component.scss']
})
export class FaceLoginComponent implements OnInit, OnDestroy {
  @ViewChild('videoEl') videoRef!: ElementRef<HTMLVideoElement>;

  // Expose Date to template
  Date = Date;

  state: FaceState = 'INIT';
  statusText = 'Initializing camera…';
  
  // For display purposes (not shown in minimal UI)
  sleepingSince: number | null = null;

  private readonly sleepAfterMs = 5000;
  private readonly scanIntervalMs = 250;
  private readonly sleepProbeIntervalMs = 1200;
  private lastFaceAt = 0;
  private lastProbeAt = 0;
  private detectionIntervalId: number | null = null;
  private stream: MediaStream | null = null;
  private loginCooldown = false;
  private tickInFlight = false;
  private redirectTo: string | null = null;

  constructor(
    private face: FaceRecognitionService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private presenceMonitor: PresenceMonitorService
  ) {}

  async ngOnInit(): Promise<void> {
    // Stop presence monitoring while on login page to avoid duplicate camera access
    this.presenceMonitor.stopMonitoring();
    
    this.redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');
    
    // Already logged in? Redirect now
    if (this.auth.isAuthenticated()) {
      this.router.navigate([this.redirectTo || '/dashboard']);
      return;
    }

    // Start the login flow
    await this.bootstrap();
  }

  ngOnDestroy(): void {
    this.stopDetectionLoop();
    this.stopCamera();
  }

  private async bootstrap(): Promise<void> {
    try {
      this.state = 'INIT';
      this.statusText = 'Loading models…';
      
      await this.face.loadModels();
      await this.face.loadKnownFaces();
      
      this.statusText = 'Starting camera…';
      await this.startCamera();
      
      this.state = 'SCANNING';
      this.statusText = 'Scanning face…';
      this.startDetectionLoop();
    } catch (err: any) {
      this.state = 'ERROR';
      this.statusText = 'Unable to start';
      console.error('[face-login] Bootstrap error:', err);
    }
  }

  private async startCamera(): Promise<void> {
    try {
      const video = await this.waitForVideoEl();
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      video.srcObject = this.stream;
      await video.play();
    } catch (err: any) {
      console.error('[face-login] Camera error:', err);
      throw new Error('Camera access denied or unavailable');
    }
  }

  private stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }

  private startDetectionLoop(): void {
    if (this.detectionIntervalId !== null) {
      clearInterval(this.detectionIntervalId);
    }
    this.detectionIntervalId = window.setInterval(() => {
      this.runDetectionTick();
    }, this.scanIntervalMs);
  }

  private stopDetectionLoop(): void {
    if (this.detectionIntervalId !== null) {
      clearInterval(this.detectionIntervalId);
      this.detectionIntervalId = null;
    }
  }

  private async runDetectionTick(): Promise<void> {
    if (this.tickInFlight) return;
    this.tickInFlight = true;

    const video = this.videoRef?.nativeElement;
    if (!video || video.readyState < 2) {
      this.tickInFlight = false;
      return;
    }

    const now = Date.now();
    const inSleep = this.state === 'SLEEP';
    const shouldProbe = !inSleep || now - this.lastProbeAt >= this.sleepProbeIntervalMs;
    
    if (!shouldProbe) {
      this.tickInFlight = false;
      return;
    }
    
    this.lastProbeAt = now;

    try {
      // Use fresh recognition (no cache) for accurate login
      const result = await this.face.recognizeFromVideo(video, true);
      if (!result) {
        this.handleNoFace(now);
      } else {
        this.handleFace(result, now);
      }
    } catch (err: any) {
      // Silently ignore recognition errors
    } finally {
      this.tickInFlight = false;
    }
  }

  private handleNoFace(now: number): void {
    if (this.state === 'RECOGNIZED') return;

    if (this.state !== 'SLEEP') {
      this.state = 'SCANNING';
      this.statusText = 'Scanning face…';
    }

    // Enter sleep mode after 5s of no face
    if (now - this.lastFaceAt >= this.sleepAfterMs && this.state !== 'SLEEP') {
      this.state = 'SLEEP';
      this.sleepingSince = now;
      this.statusText = 'Waiting for face…';
    }
  }

  private handleFace(result: { label: string; distance: number }, now: number): void {
    this.lastFaceAt = now;

    // Wake up from sleep
    if (this.state === 'SLEEP') {
      this.state = 'SCANNING';
      this.statusText = 'Scanning face…';
      this.sleepingSince = null;
      this.lastProbeAt = 0;
    }

    // Check if this is a recognized user
    const recognized = result.label !== 'unknown' && result.distance <= this.face.threshold;
    if (recognized && !this.loginCooldown) {
      this.triggerLogin(result.label);
    }
  }

  private async triggerLogin(label: string): Promise<void> {
    this.loginCooldown = true;
    this.state = 'RECOGNIZED';
    this.statusText = 'Welcome…';

    this.auth.login({ id: label, name: label });
    this.stopDetectionLoop();
    this.stopCamera();

    // Small delay for UX, then navigate
    await new Promise(r => setTimeout(r, 500));
    const target = this.redirectTo || '/dashboard';
    this.router.navigate([target]);
  }

  private waitForVideoEl(timeoutMs = 1500): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      const start = performance.now();
      const check = () => {
        if (this.videoRef?.nativeElement) {
          resolve(this.videoRef.nativeElement);
          return;
        }
        if (performance.now() - start > timeoutMs) {
          reject(new Error('Video element not ready'));
          return;
        }
        requestAnimationFrame(check);
      };
      check();
    });
  }
}

