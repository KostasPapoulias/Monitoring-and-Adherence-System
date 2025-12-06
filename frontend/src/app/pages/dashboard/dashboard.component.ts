import { Component, OnInit } from '@angular/core';
import { MedicationsService } from 'src/app/global/services/medications/medications.service';
import { AdherenceService } from 'src/app/global/services/adherence/adherence.service';
import { MedicationModel } from 'src/app/global/models/medications/medication.model';
import { ReportSummaryModel } from 'src/app/global/models/reports/report-summary.model';
import { PersonasService } from 'src/app/global/services/personas/personas.service';
import { PersonaModel } from 'src/app/global/models/personas/persona.model';
import { PersonaStateService } from 'src/app/global/services/personas/persona-state.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  medications: MedicationModel[] = [];
  summary: ReportSummaryModel = new ReportSummaryModel();
  personas: PersonaModel[] = [];
  selectedPersonaId: string | null = null;
  postponedEvents: any[] = [];
  nextMedication: MedicationModel | null = null;
  nextTime: string | null = null;

  constructor(
    private meds: MedicationsService,
    private adherence: AdherenceService,
    private personasSvc: PersonasService,
    private personaState: PersonaStateService
  ) {}

  ngOnInit(): void {
    this.personasSvc.list().subscribe(list => {
      this.personas = list;
      const stored = this.personaState.current() || (list[0]?._id ?? null);
      if (stored) { this.onPersonaChange(stored); }
    });
    this.personaState.get().subscribe(id => { if (id) this.refreshData(id); });
  }

  onPersonaChange(id: string) {
    this.selectedPersonaId = id;
    this.personaState.set(id);
  }

  private refreshData(userId: string) {
    this.meds.getAll().subscribe(ms => this.medications = ms.filter(m => m.userId === userId));
    this.adherence.summary({ userId }).subscribe(s => this.summary = s);
    this.adherence.list({ userId, type: 'postponed' }).subscribe(evts => this.postponedEvents = evts || []);
    // compute next medication by soonest upcoming time today
    this.computeNextMedication();
  }

  private computeNextMedication() {
    const now = new Date();
    let best: { med: MedicationModel; time: string; date: Date } | null = null;
    for (const m of this.medications) {
      for (const t of m.times || []) {
        const [hh, mm] = t.split(':').map(x => parseInt(x, 10));
        const dt = new Date(now);
        dt.setHours(hh || 0, mm || 0, 0, 0);
        if (dt < now) continue; // only upcoming today
        if (!best || dt < best.date) best = { med: m, time: t, date: dt };
      }
    }
    this.nextMedication = best?.med || null;
    this.nextTime = best?.time || null;
  }

  openMedicationDetails(med: MedicationModel) {
    const info = `${med.name}\nDose: ${med.dosage}\nFrequency: ${med.frequency}\nTimes: ${(med.times||[]).join(', ')}`;
    alert(info);
  }
}
