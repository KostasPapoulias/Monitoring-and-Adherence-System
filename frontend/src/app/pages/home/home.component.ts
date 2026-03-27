import { Component, OnInit } from '@angular/core';
import { VoiceRecognitionService } from 'src/app/global/services/voice';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(private voice: VoiceRecognitionService) { }

  ngOnInit() { }

  startSpeechRecognition() {
    this.voice.startListening();
  }

}
