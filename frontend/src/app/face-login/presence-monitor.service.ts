import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { FaceRecognitionService } from './face-recognition.service';

/**
 * Continuous presence monitoring service
 * Monitors camera for user's face after login
 * Auto-logout if no face detected for 5 seconds
 */
@Injectable({ providedIn: 'root' })
export class PresenceMonitorService implements OnDestroy {
  private monitoringActive = false;
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private detectionIntervalId: number | null = null;
  private lastFaceSeenAt = 0;
  private readonly logoutAfterMs = 5000; // 5 seconds
  private readonly checkIntervalMs = 500; // Check every 500ms
  private tickInFlight = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private face: FaceRecognitionService
  ) {}

  /**
   * Start monitoring user presence after login
   * Creates hidden video element and monitors for face
   */
  async startMonitoring(): Promise<void> {
    if (this.monitoringActive) {
      console.log('[presence-monitor] Already monitoring');
      return;
    }
    if (!this.auth.isAuthenticated()) {
      console.log('[presence-monitor] Not authenticated, cannot start monitoring');
      return;
    }

    try {
      console.log('[presence-monitor] Starting presence monitoring...');
      this.monitoringActive = true;
      this.lastFaceSeenAt = Date.now();

      // Create hidden video element
      const video = document.createElement('video');
      video.style.display = 'none';
      video.setAttribute('autoplay', 'true');
      video.setAttribute('muted', 'true');
      video.setAttribute('playsinline', 'true');
      document.body.appendChild(video);
      this.videoElement = video;

      // Start camera
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });

      // If monitoring was stopped while awaiting camera, abort
      if (!this.monitoringActive) {
        console.warn('[presence-monitor] Monitoring stopped before camera ready');
        this.cleanup();
        return;
      }

      // Guard: element might have been cleaned up before the stream arrived
      if (!this.videoElement) {
        console.warn('[presence-monitor] Video element missing before attaching stream');
        this.cleanup();
        return;
      }

      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();

      console.log('[presence-monitor] Camera started, beginning detection loop');
      // Start detection loop
      this.startDetectionLoop();
    } catch (err) {
      console.warn('[presence-monitor] Failed to start monitoring:', err);
      this.cleanup();
    }
  }

  /**
   * Stop monitoring (called on logout or error)
   */
  stopMonitoring(): void {
    this.cleanup();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private startDetectionLoop(): void {
    if (this.detectionIntervalId !== null) {
      clearInterval(this.detectionIntervalId);
    }
    this.detectionIntervalId = window.setInterval(() => {
      this.runDetectionTick();
    }, this.checkIntervalMs);
  }

  private stopDetectionLoop(): void {
    if (this.detectionIntervalId !== null) {
      clearInterval(this.detectionIntervalId);
      this.detectionIntervalId = null;
    }
  }

  private async runDetectionTick(): Promise<void> {
    if (this.tickInFlight) return;
    if (!this.monitoringActive) return;
    if (!this.videoElement || this.videoElement.readyState < 2) return;
    if (!this.auth.isAuthenticated()) {
      this.cleanup();
      return;
    }

    this.tickInFlight = true;

    try {
      // Force fresh recognition (no cache) for accurate monitoring
      const result = await this.face.recognizeFromVideo(this.videoElement, true);
      
      const now = Date.now();
      const timeSinceLastFace = now - this.lastFaceSeenAt;
      
      // Get the logged-in user's name
      const session = this.auth.getSession();
      const loggedInUser = session?.name;
      
      // Check if the LOGGED-IN user's face is recognized
      if (result && result.label === loggedInUser && result.distance <= this.face.threshold) {
        // Correct user's face detected - update timestamp
        this.lastFaceSeenAt = now;
        console.log('[presence-monitor] Logged-in user face recognized:', result.label, 'distance:', result.distance);
      } else {
        // No face, wrong person, or unrecognized face
        if (result) {
          console.log('[presence-monitor] Different person detected:', result.label, '(logged in as:', loggedInUser + '). Time since last correct face:', Math.round(timeSinceLastFace / 1000) + 's');
        } else {
          console.log('[presence-monitor] No face detected. Time since last face:', Math.round(timeSinceLastFace / 1000) + 's');
        }
        
        // Check timeout
        if (timeSinceLastFace >= this.logoutAfterMs) {
          // User has been away for 5 seconds - logout
          this.handleAutoLogout();
        }
      }
    } catch (err) {
      // Silently ignore detection errors but log them
      console.warn('[presence-monitor] Detection error:', err);
    } finally {
      this.tickInFlight = false;
    }
  }

  private handleAutoLogout(): void {
    console.log('[presence-monitor] No face detected for 5s - auto-logout');
    this.cleanup();
    this.auth.logout();
    this.router.navigate(['/face-login']);
  }

  private cleanup(): void {
    this.monitoringActive = false;
    this.stopDetectionLoop();

    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      if (this.videoElement.parentNode) {
        this.videoElement.parentNode.removeChild(this.videoElement);
      }
      this.videoElement = null;
    }
  }
}
