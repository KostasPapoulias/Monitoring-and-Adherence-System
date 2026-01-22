import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { PersonasService } from './global/services/personas/personas.service';
import { PersonaStateService } from './global/services/personas/persona-state.service';
import { PersonaModel } from './global/models/personas/persona.model';
import { environment } from 'src/environments/environment';
import { MOCK_PERSONAS } from 'src/app/global/mock/mock-data';
import { AuthService } from './face-login/auth.service';
import { PresenceMonitorService } from './face-login/presence-monitor.service';

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
  isLoggedIn = false;

  deviceMode: 'wall-display' | 'smartphone' | 'smartwatch' | 'smart-speaker' = 'wall-display';
  private pendingPersonaId: string | null = null;

  constructor(
    private personasSvc: PersonasService,
    private personaState: PersonaStateService,
    private router: Router,
    private auth: AuthService,
    private presenceMonitor: PresenceMonitorService
  ) {}

  private readonly watchRouteOrder = ['/dashboard', '/schedule', '/history', '/emergency'];

  ngOnInit() {
    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 1000);
    
    // Check if user is logged in and show/hide shell accordingly
    this.isLoggedIn = this.auth.isAuthenticated();
    
    // Start presence monitoring if already logged in
    if (this.isLoggedIn) {
      console.log('[app] User already logged in, starting presence monitor');
      this.presenceMonitor.startMonitoring();
      this.setPersonaForLoggedInUser();
    }
    
    // Subscribe to route changes to update login state and presence monitoring
    this.router.events.subscribe(() => {
      const wasLoggedIn = this.isLoggedIn;
      this.isLoggedIn = this.auth.isAuthenticated();
      
      // Start monitoring when user logs in
      if (!wasLoggedIn && this.isLoggedIn) {
        console.log('[app] User logged in, starting presence monitor');
        this.presenceMonitor.startMonitoring();
        this.setPersonaForLoggedInUser();
      }
      // Stop monitoring when user logs out
      else if (wasLoggedIn && !this.isLoggedIn) {
        console.log('[app] User logged out, stopping presence monitor');
        this.presenceMonitor.stopMonitoring();
      }
    });

    if (environment.offline) {
      this.personas = [...(MOCK_PERSONAS as any[])];
      // If logged in, map persona by name; otherwise fall back to previous selection
      const matched = this.setPersonaForLoggedInUser();
      const current = matched || this.personaState.current() || this.personas[0]?._id;
      if (current) {
        this.personaState.set(current);
        this.applyPersona(current);
      }
    } else {
      this.personasSvc.list().subscribe(list => {
        this.personas = list;
        // If logged in, map persona by name; otherwise fall back to previous selection
        const matched = this.setPersonaForLoggedInUser();
        const current = matched || this.personaState.current() || list[0]?._id;
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
    this.presenceMonitor.stopMonitoring();
  }

  updateTime() {
    this.currentTime = new Date().toLocaleTimeString();
  }

  logout(): void {
    this.presenceMonitor.stopMonitoring();
    this.auth.logout();
    this.router.navigate(['/face-login']);
  }

  // Map logged-in face label to the matching persona by name
  private setPersonaForLoggedInUser(): string | null {
    const session = this.auth.getSession();
    if (!session) return null;

    // Try current personas list
    let match: PersonaModel | null = this.personas.find(p => p.name.toLowerCase() === session.name.toLowerCase()) || null;

    // Fallback: try mock personas when API data does not contain this user
    if (!match) {
      const fallback = (MOCK_PERSONAS as any[]).find(p => (p.name || '').toLowerCase() === session.name.toLowerCase());
      if (fallback) {
        // Avoid duplicating if already added
        const exists = this.personas.some(p => p._id === fallback._id);
        if (!exists) {
          this.personas.push(fallback as any);
        }
        match = fallback as any;
      }
    }

    // Last resort: synthesize a minimal persona so UI reflects the logged-in user
    if (!match) {
      const syntheticId = `face-${session.name}`;
      match = {
        _id: syntheticId,
        name: session.name,
        devicePrefs: { primaryDevice: 'wall-display' },
      } as PersonaModel;
      this.personas.push(match);
      console.warn('[app] Synthesized persona for logged-in user (not found in data):', session.name);
    }

    // At this point, match is guaranteed to be non-null (either found, from fallback, or synthesized)
    // Ensure persona exists in list before applying (for fallback case where we might not have pushed yet)
    if (!this.personas.some(p => p._id === match!._id)) {
      this.personas.push(match);
    }

    this.personaState.set(match._id);
    this.applyPersona(match._id);
    return match._id;
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

  watchPrev() {
    const next = this.resolveWatchTarget(-1);
    this.router.navigateByUrl(next);
  }

  watchNext() {
    const next = this.resolveWatchTarget(+1);
    this.router.navigateByUrl(next);
  }

  private resolveWatchTarget(delta: -1 | 1): string {
    const path = (this.router.url || '').split('?')[0].split('#')[0] || '/dashboard';
    const idx = this.watchRouteOrder.indexOf(path);
    if (idx === -1) return this.watchRouteOrder[0];

    const nextIdx = (idx + delta + this.watchRouteOrder.length) % this.watchRouteOrder.length;
    return this.watchRouteOrder[nextIdx];
  }
}
