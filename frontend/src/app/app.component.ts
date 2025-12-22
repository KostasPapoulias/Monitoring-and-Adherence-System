import { Component, OnInit, OnDestroy } from '@angular/core';

import { PersonasService } from './global/services/personas/personas.service';
import { PersonaStateService } from './global/services/personas/persona-state.service';
import { PersonaModel } from './global/models/personas/persona.model';
import { environment } from 'src/environments/environment';
import { MOCK_PERSONAS } from 'src/app/global/mock/mock-data';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit, OnDestroy {
  title = 'frontend';
  currentTime: string = '';
  private timeInterval: any;

  personas: PersonaModel[] = [];
  selectedPersona: PersonaModel | null = null;

  isPhoneMode = false;
  isWatchMode = false;
  isSpeakerMode = false;
  isWallMode = true;
  isCompactMode = false;

  deviceMode: 'wall-display' | 'smartphone' | 'smartwatch' | 'smart-speaker' = 'wall-display';
  private pendingPersonaId: string | null = null;

  constructor(
    private personasSvc: PersonasService,
    private personaState: PersonaStateService
  ) {}

  ngOnInit() {
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 1000);

    if (environment.offline) {
      this.personas = [...(MOCK_PERSONAS as any[])];
      const current = this.personaState.current() || this.personas[0]?._id;
      if (current) {
        this.personaState.set(current);
        this.applyPersona(current);
      }
    } else {
      this.personasSvc.list().subscribe(list => {
        this.personas = list;
        const current = this.personaState.current() || list[0]?._id;
        if (current) {
          this.personaState.set(current);
          this.applyPersona(current);
        }
      });
    }

    this.personaState.get().subscribe(id => {
      if (id) this.applyPersona(id);
    });
  }

  ngOnDestroy() {
    clearInterval(this.timeInterval);
  }

  updateTime() {
    this.currentTime = new Date().toLocaleTimeString();
  }

  private applyPersona(id: string) {
    const persona = this.personas.find(p => p._id === id);
    if (!persona) {
      this.pendingPersonaId = id;
      return;
    }

    this.selectedPersona = persona;
    const device = (persona.devicePrefs?.primaryDevice as any) || 'wall-display';
    this.deviceMode = device;

    this.isPhoneMode = device === 'smartphone';
    this.isWatchMode = device === 'smartwatch';
    this.isSpeakerMode = device === 'smart-speaker';
    this.isWallMode = device === 'wall-display';

    // Compact mode removes the top "wall" nav and uses the bottom nav.
    this.isCompactMode = this.isPhoneMode || this.isWatchMode || this.isSpeakerMode;
  }
}
