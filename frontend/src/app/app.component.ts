import { Component, OnInit, OnDestroy } from '@angular/core';

import { PersonasService } from './global/services/personas/personas.service';
import { PersonaStateService } from './global/services/personas/persona-state.service';
import { PersonaModel } from './global/models/personas/persona.model';

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
  private pendingPersonaId: string | null = null;

  constructor(
    private personasSvc: PersonasService,
    private personaState: PersonaStateService
  ) {}

  ngOnInit() {
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 1000);

    this.personasSvc.list().subscribe(list => {
      this.personas = list;
      const current = this.personaState.current() || list[0]?._id;
      if (current) {
        this.personaState.set(current);
        this.applyPersona(current);
      }
    });

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
    this.isPhoneMode = persona.devicePrefs?.primaryDevice === 'smartphone';
  }
}
