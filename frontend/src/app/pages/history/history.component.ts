import { Component, OnInit } from '@angular/core';
import { AdherenceService } from 'src/app/global/services/adherence/adherence.service';
import { AdherenceEventModel } from 'src/app/global/models/adherence/adherence-event.model';
import { ReportSummaryModel } from 'src/app/global/models/reports/report-summary.model';
import { PersonasService } from 'src/app/global/services/personas/personas.service';
import { PersonaModel } from 'src/app/global/models/personas/persona.model';
import { PersonaStateService } from 'src/app/global/services/personas/persona-state.service';

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

  constructor(private adherence: AdherenceService, private personasSvc: PersonasService, private personaState: PersonaStateService) {}

  ngOnInit(): void {
    this.personasSvc.list().subscribe(list => {
      this.personas = list;
      const stored = this.personaState.current() || (list[0]?._id ?? null);
      if (stored) { this.onPersonaChange(stored); }
    });
    this.personaState.get().subscribe(id => { if (id) this.refreshData(id); });
  }

  onPersonaChange(id: string) { this.selectedPersonaId = id; this.personaState.set(id); }
  private refreshData(userId: string) {
    this.adherence.list({ userId }).subscribe(e => this.events = e);
    this.adherence.summary({ userId }).subscribe(s => this.summary = s);
  }
}
