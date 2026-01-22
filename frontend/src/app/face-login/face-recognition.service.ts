import { Injectable } from '@angular/core';
import * as faceapi from 'face-api.js';

type KnownUser = { label: string; images: string[] };

const KNOWN_USERS: KnownUser[] = [
  { label: 'Eleni Papadaki', images: ['me1.jpg'] },
  { label: 'Maria Kostaki', images: ['me2.jpg'] },
];

@Injectable({ providedIn: 'root' })
export class FaceRecognitionService {
  private modelsLoaded = false;
  private matcher: any | null = null;
  private loadingMatcher: Promise<any> | null = null;
  // Threshold for face recognition match: lower = stricter matching
  // 0.5 is moderate - good balance between matching same person multiple times and not false-matching different people
  public readonly threshold = 0.5;
  // Load models from CDN (jsdelivr) to avoid local asset issues
  private readonly modelsBasePath = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

  async loadModels(): Promise<void> {
    if (this.modelsLoaded) return;
    try {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(this.modelsBasePath),
        faceapi.nets.faceLandmark68Net.loadFromUri(this.modelsBasePath),
        faceapi.nets.faceRecognitionNet.loadFromUri(this.modelsBasePath),
      ]);
      this.modelsLoaded = true;
    } catch (err) {
      throw new Error('Failed to load face recognition models');
    }
  }

  async loadKnownFaces(forceReload = false): Promise<any> {
    // Clear cache if force reload requested
    if (forceReload) {
      console.log('[face-recognition] Force reload - clearing cached matcher');
      this.matcher = null;
      this.loadingMatcher = null;
    }
    
    if (this.matcher && !forceReload) return this.matcher;
    if (this.loadingMatcher && !forceReload) return this.loadingMatcher;

    this.loadingMatcher = (async () => {
      if (!this.modelsLoaded) {
        await this.loadModels();
      }

      console.log('[face-recognition] Loading known faces:', KNOWN_USERS.map(u => u.label).join(', '));
      const labeled: any[] = [];
      for (const user of KNOWN_USERS) {
        const descriptor = await this.computeLabeledDescriptor(user);
        if (descriptor) {
          labeled.push(descriptor);
          console.log('[face-recognition] Loaded face for:', user.label, '(descriptors:', descriptor.descriptors.length + ')');
        } else {
          console.warn('[face-recognition] Failed to load face for:', user.label);
        }
      }

      if (labeled.length === 0) {
        throw new Error('No known faces. Add /assets/known-faces/me1.jpg and me2.jpg');
      }

      this.matcher = new (faceapi as any).FaceMatcher(labeled, this.threshold);
      console.log('[face-recognition] Matcher created with', labeled.length, 'known faces, threshold:', this.threshold);
      return this.matcher;
    })();

    try {
      return await this.loadingMatcher;
    } finally {
      this.loadingMatcher = null;
    }
  }

  async recognizeFromVideo(videoEl: HTMLVideoElement, noCache = false): Promise<{ label: string; distance: number } | null> {
    if (!this.modelsLoaded) {
      await this.loadModels();
    }
    const matcher = await this.loadKnownFaces(noCache);

    const detection = await faceapi
      .detectSingleFace(videoEl, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) return null;

    const best = matcher.findBestMatch(detection.descriptor);
    
    // Log all candidate matches to help debug recognition
    const allMatches = KNOWN_USERS.map(user => {
      const labeledDescriptors = matcher.labeledDescriptors.find((ld: any) => ld.label === user.label);
      if (!labeledDescriptors) return null;
      const distances = labeledDescriptors.descriptors.map((desc: Float32Array) => 
        faceapi.euclideanDistance(detection.descriptor, desc)
      );
      const minDistance = Math.min(...distances);
      return { label: user.label, distance: minDistance };
    }).filter(Boolean);
    
    console.log('[face-recognition] Match results:', allMatches, '| Best:', best.label, 'at', best.distance.toFixed(3), '| Threshold:', this.threshold);
    
    return { label: best.label, distance: best.distance };
  }

  private async computeLabeledDescriptor(user: KnownUser): Promise<any | null> {
    const descriptors: Float32Array[] = [];

    for (const imgName of user.images) {
      try {
        console.log(`[face-recognition] Loading image: ${imgName} for user: ${user.label}`);
        const img = await faceapi.fetchImage(`assets/known-faces/${imgName}`);
        console.log(`[face-recognition] Image loaded successfully: ${imgName}, size: ${img.width}x${img.height}`);
        
        const detection = await faceapi
          .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptor();
        
        if (detection) {
          console.log(`[face-recognition] ✓ Face detected in ${imgName}`, {
            faceBox: { x: detection.detection.box.x, y: detection.detection.box.y, width: detection.detection.box.width, height: detection.detection.box.height },
            confidence: detection.detection.score
          });
          descriptors.push(detection.descriptor);
        } else {
          console.warn(`[face-recognition] ✗ NO FACE DETECTED in ${imgName} - image loaded but no face found`);
        }
      } catch (err) {
        console.warn(`[face-recognition] ERROR loading ${imgName}:`, err);
      }
    }

    if (descriptors.length === 0) {
      console.warn(`[face-recognition] No valid descriptors for ${user.label} - this user will NOT be recognized`);
      return null;
    }

    console.log(`[face-recognition] Created LabeledFaceDescriptors for ${user.label} with ${descriptors.length} descriptor(s)`);
    return new (faceapi as any).LabeledFaceDescriptors(user.label, descriptors);
  }
}
