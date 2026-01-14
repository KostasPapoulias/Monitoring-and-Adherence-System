import { MedicationModel } from 'src/app/global/models/medications/medication.model';

export enum DeviceMode {
  WALL = 'wall-display',
  MOBILE = 'smartphone',
  WATCH = 'smartwatch',
  SPEAKER = 'smart-speaker'
}

export type MedStatus = 'confirmed' | 'postponed';

export interface DashboardState {
  todaysMeds: MedicationModel[];
  nextMedication: MedicationModel | null;
  medStatuses: Map<string, MedStatus>;
  deviceMode: DeviceMode;
}
