import { MedicationModel } from 'src/app/global/models/medications/medication.model';
import { PersonaModel } from 'src/app/global/models/personas/persona.model';

export enum DeviceMode {
  WALL = 'wall-display',
  MOBILE = 'smartphone',
  WATCH = 'smartwatch',
  SPEAKER = 'smart-speaker'
}

export type ViewMode = 'day' | 'week' | 'month';
export type TextSize = 'small' | 'medium' | 'large';

export interface ScheduleState {
  medications: MedicationModel[];
  view: ViewMode;
  deviceMode: DeviceMode;
  isCompactMode: boolean;
  uiTextSize: TextSize;
  currentMed: MedicationModel | null;
}
