import { of } from 'rxjs';
import { PersonasService } from '../services/personas/personas.service';
import { MedicationsService } from '../services/medications/medications.service';
import { AdherenceService } from '../services/adherence/adherence.service';
import { MOCK_PERSONAS, MOCK_MEDICATIONS, MOCK_SUMMARY, MOCK_POSTPONED } from './mock-data';

class MockPersonasService {
  list() { return of(MOCK_PERSONAS as any); }
}

class MockMedicationsService {
  getAll() { return of(MOCK_MEDICATIONS as any); }
}

class MockAdherenceService {
  summary(params: any) { return of(MOCK_SUMMARY as any); }
  list(params: any) { return of(MOCK_POSTPONED as any); }
  confirm(_: any) { return of(true); }
  postpone(_: any) { return of(true); }
}

export const MOCK_PROVIDERS = [
  { provide: PersonasService, useClass: MockPersonasService },
  { provide: MedicationsService, useClass: MockMedicationsService },
  { provide: AdherenceService, useClass: MockAdherenceService }
];
