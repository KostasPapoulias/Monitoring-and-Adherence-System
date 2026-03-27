import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { AssistiveInputService } from 'src/app/global/services/assistive-input/assistive-input.service';

@Component({
  selector: 'app-assistive-controls',
  templateUrl: './assistive-controls.component.html',
  styleUrls: ['./assistive-controls.component.scss']
})
export class AssistiveControlsComponent implements OnInit, OnDestroy {
  @ViewChild('video', { static: true }) videoRef!: ElementRef<HTMLVideoElement>;

  state = {
    running: false,
    hasFace: false,
    hasHand: false,
    pinching: false,
    lastClickAt: null as number | null,
    u: null as number | null,
    v: null as number | null,
    x: null as number | null,
    y: null as number | null,
    calibration: null as any,
    corners: {} as any,
    error: null as string | null,
  };

  mirrorX = true;
  pinchRatio = 0.35;
  cooldownMs = 700;

  private sub: Subscription | null = null;

  constructor(public readonly assistive: AssistiveInputService) {}

  ngOnInit(): void {
    this.sub = this.assistive.state$.subscribe((s) => {
      this.state = s as any;
      if (s?.calibration?.mirrorX != null) this.mirrorX = s.calibration.mirrorX;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  async start(): Promise<void> {
    this.assistive.setMirrorX(this.mirrorX);
    this.assistive.setPinchThresholdRatio(this.pinchRatio);
    this.assistive.setClickCooldownMs(this.cooldownMs);
    await this.assistive.start(this.videoRef.nativeElement);
  }

  stop(): void {
    this.assistive.stop();
  }

  capture(name: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'): void {
    this.assistive.captureCorner(name);
  }

  clearCalibration(): void {
    this.assistive.clearCalibration();
  }
}
