import { Injectable } from '@angular/core';

declare var webkitSpeechRecognition: any;
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

@Injectable({
  providedIn: 'root'
})
export class VoiceRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;

  constructor() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new webkitSpeechRecognition();
      if (this.recognition) {
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[event.results.length - 1][0].transcript;
          console.log('Voice transcript:', transcript);
          // TODO: handle the transcript for later 
        };

        this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
        };

        this.recognition.onend = () => {
          this.isListening = false;
          console.log('Speech recognition ended');
        };
      }
    } else {
      console.warn('Speech recognition not supported in this browser');
    }
  }

  startListening(): void {
    if (this.recognition && !this.isListening) {
      this.recognition.start();
      this.isListening = true;
      console.log('Started listening for voice');
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      console.log('Stopped listening for voice');
    }
  }

  isSupported(): boolean {
    return !!this.recognition;
  }
}