import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PersonaModel } from '../../models/personas/persona.model';

@Injectable({ providedIn: 'root' })
export class PersonaStateService {
  private readonly KEY = 'mams.selectedPersonaId';
  private selected$ = new BehaviorSubject<string | null>(null);

  constructor() {
    const saved = localStorage.getItem(this.KEY);
    if (saved) this.selected$.next(saved);
  }

  set(id: string) { localStorage.setItem(this.KEY, id); this.selected$.next(id); }
  get() { return this.selected$.asObservable(); }
  current() { return this.selected$.value; }
}
