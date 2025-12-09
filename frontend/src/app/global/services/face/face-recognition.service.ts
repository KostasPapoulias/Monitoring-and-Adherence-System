import { Injectable } from '@angular/core';
import * as faceapi from 'face-api.js';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class FaceRecognitionService {
  private modelsLoaded = false;
  private referenceDescriptor: Float32Array | null = null;
  private matcher: any | null = null;
  public readonly threshold = 0.9; // lower = stricter

  async loadModels(modelsBasePath?: string): Promise<void> {
    if (this.modelsLoaded) return;
    const base = modelsBasePath || environment.faceModelsPath || 'assets/models';
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(base),
        faceapi.nets.faceLandmark68Net.loadFromUri(base),
        faceapi.nets.faceRecognitionNet.loadFromUri(base),
      ]);
      this.modelsLoaded = true;
      return;
    } catch (err) {
      // Fallback to public CDN if local assets are missing
      const cdn = 'https://justadudewhohacks.github.io/face-api.js/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(cdn),
        faceapi.nets.faceLandmark68Net.loadFromUri(cdn),
        faceapi.nets.faceRecognitionNet.loadFromUri(cdn),
      ]);
      this.modelsLoaded = true;
      return;
    }
  }

  async detectOnly(video: HTMLVideoElement): Promise<{ detected: boolean; proximity?: 'near' | 'far'; box?: { width: number; height: number; x: number; y: number } }> {
    if (!this.modelsLoaded) throw new Error('Models not loaded');
    const det = await faceapi.detectSingleFace(
      video,
      new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
    );
    if (!det) return { detected: false };
    const box = det.box;
    const frameArea = (video.videoWidth || 1) * (video.videoHeight || 1);
    const faceArea = box.width * box.height;
    const ratio = faceArea / Math.max(frameArea, 1);
    const proximity: 'near' | 'far' = ratio >= 0.08 ? 'near' : 'far';
    return { detected: true, proximity, box: { width: box.width, height: box.height, x: box.x, y: box.y } };
  }

  hasReference(): boolean {
    return !!this.referenceDescriptor || !!localStorage.getItem('face_ref_descriptor');
  }

  clearReference() {
    this.referenceDescriptor = null;
    this.matcher = null;
    localStorage.removeItem('face_ref_descriptor');
  }

  async loadReferenceFromStorage(): Promise<boolean> {
    const raw = localStorage.getItem('face_ref_descriptor');
    if (!raw) return false;
    const arr = new Float32Array(JSON.parse(raw));
    this.referenceDescriptor = arr;
    this.matcher = new faceapi.FaceMatcher([new faceapi.LabeledFaceDescriptors('user', [arr])]);
    return true;
  }

  async setReferenceFromImageElement(img: HTMLImageElement): Promise<void> {
    if (!this.modelsLoaded) throw new Error('Models not loaded');
    const detection = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) throw new Error('No face detected in the reference image');
    this.referenceDescriptor = detection.descriptor;
    localStorage.setItem('face_ref_descriptor', JSON.stringify(Array.from(detection.descriptor)));
    this.matcher = new faceapi.FaceMatcher([new faceapi.LabeledFaceDescriptors('user', [detection.descriptor])]);
  }

  async setReferenceFromFile(file: File): Promise<void> {
    const img = await this.fileToImage(file);
    await this.setReferenceFromImageElement(img);
  }

  async compareFromVideo(video: HTMLVideoElement): Promise<{
    matched: boolean;
    distance: number | null;
    box?: { width: number; height: number; x: number; y: number };
    proximity?: 'near' | 'far';
  }>{
    if (!this.modelsLoaded) throw new Error('Models not loaded');
    if (!this.referenceDescriptor || !this.matcher) {
      const ok = await this.loadReferenceFromStorage();
      if (!ok) return { matched: false, distance: null };
    }
    const det = await faceapi
      .detectSingleFace(
        video,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
      )
      .withFaceLandmarks()
      .withFaceDescriptor();
    if (!det) return { matched: false, distance: null, box: undefined, proximity: undefined };

    const best = this.matcher!.findBestMatch(det.descriptor);
    const box = det.detection.box;
    // crude proximity estimate: face area relative to frame
    const frameArea = (video.videoWidth || 1) * (video.videoHeight || 1);
    const faceArea = box.width * box.height;
    const ratio = faceArea / Math.max(frameArea, 1);
    const proximity: 'near' | 'far' = ratio >= 0.08 ? 'near' : 'far';

    return {
      matched: best.distance <= this.threshold,
      distance: best.distance,
      box: { width: box.width, height: box.height, x: box.x, y: box.y },
      proximity
    };
  }

  private fileToImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = (e) => reject(e);
      img.src = url;
    });
  }

  modelsAreLoaded(): boolean {
    return this.modelsLoaded;
  }
}
