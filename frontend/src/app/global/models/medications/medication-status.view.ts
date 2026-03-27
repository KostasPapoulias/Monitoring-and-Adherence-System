// Pending API integration shape for frontend consumption
// This interface is NOT wired yet; it's here as documentation/stub for future services.
export interface MedicationStatusView {
  _id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  userId?: string;
  status: 'scheduled' | 'postponed' | 'confirmed' | 'missed';
  postponedUntil?: string;
  alert?: { active: boolean; reason?: 'missed' | 'overdue' | 'thresholdExceeded' };
  limits?: { maxPostponeMinutes: number; windowMinutes: number };
}
