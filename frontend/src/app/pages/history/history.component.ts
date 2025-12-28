import { Component, OnInit } from '@angular/core';
import { AdherenceService } from 'src/app/global/services/adherence/adherence.service';
import { AdherenceEventModel } from 'src/app/global/models/adherence/adherence-event.model';
import { ReportSummaryModel } from 'src/app/global/models/reports/report-summary.model';
import { PersonasService } from 'src/app/global/services/personas/personas.service';
import { PersonaModel } from 'src/app/global/models/personas/persona.model';
import { PersonaStateService } from 'src/app/global/services/personas/persona-state.service';
import { environment } from 'src/environments/environment';
import { MOCK_ADHERENCE_EVENTS, MOCK_PERSONAS } from 'src/app/global/mock/mock-data';
import { HistoryState, DeviceMode, TextSize, MedicationBreakdown } from './history.state';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {
  events: AdherenceEventModel[] = [];
  summary: ReportSummaryModel = new ReportSummaryModel();
  personas: PersonaModel[] = [];
  selectedPersonaId: string | null = null;
  selectedPersona: PersonaModel | null = null;

  deviceMode: DeviceMode = DeviceMode.WALL;
  isCompactMode = false;
  uiTextSize: TextSize = 'medium';

  showKpi = true;
  showMedBreakdown = true;

  eventIndex = 0;

  adherenceRatePct = 0;
  avgConfirmDelayMin: number | null = null;
  lastActionAt: Date | null = null;
  medicationBreakdown: MedicationBreakdown[] = [];

  state: HistoryState = {
    events: [],
    summary: new ReportSummaryModel(),
    adherenceRatePct: 0,
    avgConfirmDelayMin: null,
    lastActionAt: null,
    medicationBreakdown: [],
    deviceMode: DeviceMode.WALL,
    isCompactMode: false,
    uiTextSize: 'medium',
    currentEvent: null,
  };

  constructor(private adherence: AdherenceService, private personasSvc: PersonasService, private personaState: PersonaStateService) {}

  ngOnInit(): void {
    if (environment.offline) {
      this.personas = [...(MOCK_PERSONAS as any[])];
      const stored = this.personaState.current() || (this.personas[0]?._id ?? null);
      if (stored) { this.onPersonaChange(stored); this.refreshData(stored); }
      this.personaState.get().subscribe(id => {
        if (id) {
          this.onPersonaChange(id);
          this.refreshData(id);
        }
      });
      return;
    }

    this.personasSvc.list().subscribe(list => {
      this.personas = list;
      const stored = this.personaState.current() || (list[0]?._id ?? null);
      if (stored) { this.onPersonaChange(stored); }
    });
    this.personaState.get().subscribe(id => {
      if (id) {
        this.onPersonaChange(id);
        this.refreshData(id);
      }
    });
  }

  onPersonaChange(id: string) {
    if (this.selectedPersonaId === id) return; // Prevent infinite loop
    this.selectedPersonaId = id;
    this.personaState.set(id);
    this.selectedPersona = this.personas.find(p => (p as any)._id === id) || null;
    this.deviceMode = (this.selectedPersona?.devicePrefs?.primaryDevice as DeviceMode) || DeviceMode.WALL;
    this.isCompactMode = this.deviceMode !== DeviceMode.WALL;
    this.uiTextSize = (this.selectedPersona?.devicePrefs?.ui?.textSize as TextSize) || 'medium';
    this.eventIndex = 0;
    this.state = this.buildState();
  }

  get currentEvent(): AdherenceEventModel | null {
    if (!this.events || this.events.length === 0) return null;
    const idx = Math.min(Math.max(this.eventIndex, 0), this.events.length - 1);
    return this.events[idx] || null;
  }

  prevEvent() {
    if (!this.events || this.events.length === 0) return;
    this.eventIndex = (this.eventIndex - 1 + this.events.length) % this.events.length;
  }

  nextEvent() {
    if (!this.events || this.events.length === 0) return;
    this.eventIndex = (this.eventIndex + 1) % this.events.length;
  }

  toggleKpi() {
    this.showKpi = !this.showKpi;
  }

  toggleMedBreakdown() {
    this.showMedBreakdown = !this.showMedBreakdown;
  }
  
  private refreshData(userId: string) {
    if (environment.offline) {
      const all = (MOCK_ADHERENCE_EVENTS as any[]).filter(e => e.userId === userId);
      // newest first
      all.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
      this.events = all.map(e => new AdherenceEventModel(e as any));
      this.eventIndex = 0;
      this.computeAnalytics();
      return;
    }

    this.adherence.list({ userId }).subscribe(e => {
      this.events = e;
      this.eventIndex = 0;
      this.computeAnalytics();
    });
    this.adherence.summary({ userId }).subscribe(s => {
      this.summary = s;
      this.computeAnalytics();
    });
  }

  private computeAnalytics() {
    const taken = this.events.filter(e => e.type === 'taken').length;
    const missed = this.events.filter(e => e.type === 'missed').length;
    const postponed = this.events.filter(e => e.type === 'postponed').length;
    this.summary = { taken, missed, postponed } as any;

    const denom = taken + missed;
    this.adherenceRatePct = denom > 0 ? Math.round((taken / denom) * 100) : 0;

    const takenDelays = this.events
      .filter(e => e.type === 'taken' && e.confirmedAt && e.scheduledAt)
      .map(e => (new Date(e.confirmedAt as any).getTime() - new Date(e.scheduledAt as any).getTime()) / 60000)
      .filter(v => Number.isFinite(v));

    if (takenDelays.length > 0) {
      const avg = takenDelays.reduce((a, b) => a + b, 0) / takenDelays.length;
      this.avgConfirmDelayMin = Math.round(avg);
    } else {
      this.avgConfirmDelayMin = null;
    }

    const last = this.events
      .map(e => (e.confirmedAt ? new Date(e.confirmedAt as any) : new Date(e.scheduledAt as any)))
      .sort((a, b) => b.getTime() - a.getTime())[0];
    this.lastActionAt = last || null;

    const byMed = new Map<string, { medicationId: string; taken: number; missed: number; postponed: number; total: number }>();
    for (const e of this.events) {
      const med = e.medicationId || 'Unknown';
      const entry = byMed.get(med) || { medicationId: med, taken: 0, missed: 0, postponed: 0, total: 0 };
      entry.total += 1;
      if (e.type === 'taken') entry.taken += 1;
      if (e.type === 'missed') entry.missed += 1;
      if (e.type === 'postponed') entry.postponed += 1;
      byMed.set(med, entry);
    }
    this.medicationBreakdown = Array.from(byMed.values()).sort((a, b) => b.total - a.total);
    this.state = this.buildState();
  }

  cancelTaken(e: AdherenceEventModel) {
    if (!e.medicationId || !e.scheduledAt) return;
    const postponeMinutes = 30;
    if (environment.offline) {
      // In offline/demo mode treat "revoke" as a postpone event for analytics.
      e.type = 'postponed';
      (e as any).postponeMinutes = postponeMinutes;
      e.confirmedAt = new Date().toISOString();
      this.computeAnalytics();
      return;
    }
    this.adherence.postpone({ medicationId: e.medicationId, scheduledAt: e.scheduledAt, postponeMinutes })
      .subscribe(() => {
        const id = this.selectedPersonaId;
        if (id) this.refreshData(id);
      });
  }

  setEventType(e: AdherenceEventModel, type: 'taken' | 'postponed' | 'missed') {
    if (!e) return;

    // Online mode: we only support Taken->Postponed via existing API.
    if (!environment.offline) {
      if (type === 'postponed' && e.type === 'taken') {
        this.cancelTaken(e);
      }
      return;
    }

    e.type = type as any;
    if (type === 'postponed') {
      (e as any).postponeMinutes = (e as any).postponeMinutes || 30;
    } else {
      delete (e as any).postponeMinutes;
    }
    // keep timestamps consistent for analytics display
    e.confirmedAt = new Date().toISOString();
    this.computeAnalytics();
  }

  private buildState(): HistoryState {
    return {
      events: this.events,
      summary: this.summary,
      adherenceRatePct: this.adherenceRatePct,
      avgConfirmDelayMin: this.avgConfirmDelayMin,
      lastActionAt: this.lastActionAt,
      medicationBreakdown: this.medicationBreakdown,
      deviceMode: this.deviceMode,
      isCompactMode: this.isCompactMode,
      uiTextSize: this.uiTextSize,
      currentEvent: this.currentEvent,
    };
  }
}
