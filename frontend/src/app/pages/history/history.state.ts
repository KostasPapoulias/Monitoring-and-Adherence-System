import { AdherenceEventModel } from 'src/app/global/models/adherence/adherence-event.model';
import { ReportSummaryModel } from 'src/app/global/models/reports/report-summary.model';

export enum DeviceMode {
  WALL = 'wall-display',
  MOBILE = 'smartphone',
  WATCH = 'smartwatch',
  SPEAKER = 'smart-speaker'
}

export type TextSize = 'small' | 'medium' | 'large';

export interface MedicationBreakdown {
  medicationId: string;
  medicationName?: string;
  taken: number;
  missed: number;
  postponed: number;
  total: number;
}

export interface HistoryState {
  events: AdherenceEventModel[];
  summary: ReportSummaryModel;
  adherenceRatePct: number;
  avgConfirmDelayMin: number | null;
  lastActionAt: Date | null;
  medicationBreakdown: MedicationBreakdown[];
  medications?: any[];
  deviceMode: DeviceMode;
  isCompactMode: boolean;
  uiTextSize: TextSize;
  currentEvent: AdherenceEventModel | null;
}
