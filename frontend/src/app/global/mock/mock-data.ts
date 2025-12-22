import { PersonaModel } from '../models/personas/persona.model';
import { MedicationModel } from '../models/medications/medication.model';
import { ReportSummaryModel } from '../models/reports/report-summary.model';

// Generate a time close to "now" to make one card actionable in UI
function currentHHMM(offsetMinutes = 0): string {
  const d = new Date(Date.now() + offsetMinutes * 60000);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export const MOCK_PERSONAS: any[] = [
  {
    _id: '1',
    name: 'Eleni Papadaki',
    age: 76,
    occupation: 'Retired primary school teacher',
    livingSituation: 'Lives alone in Heraklion, Greece; her children live in Athens.',
    healthProfile: 'Chronic heart failure and hypertension. Takes five pills daily. Mild short-term memory issues.',
    technologyProfile: 'Basic smartphone user; relies on wall-mounted smart display. Prefers large text, high contrast, voice or touch.',
    behavioralTraits: 'Routine-driven; appreciates calm reminders; anxious if devices behave unpredictably.',
    devicePrefs: { primaryDevice: 'wall-display', modalities: { audio: true, visual: true, haptic: false }, ui: { textSize: 'large', contrast: 'high', cognitiveMode: 'simplified' } }
  },
  {
    _id: '2',
    name: 'Maria Kostaki',
    age: 42,
    occupation: 'Accountant',
    livingSituation: 'Married, mother of three (ages 5, 9, and 13).',
    healthProfile: 'Iron supplements and vitamin D; occasional antibiotics for sinus infections.',
    technologyProfile: 'Highly familiar with smartphone apps. Prefers visual dashboards and push notifications.',
    behavioralTraits: 'Multitasks; tends to forget medication; wants low-effort systems.',
    devicePrefs: { primaryDevice: 'smartphone', modalities: { audio: true, visual: true, haptic: true }, ui: { textSize: 'medium', contrast: 'normal', cognitiveMode: 'standard' } }
  },
  {
    _id: '3',
    name: 'Sofia Lianou',
    age: 9,
    occupation: 'Primary school student',
    livingSituation: 'Lives with parents and older brother.',
    healthProfile: '2-week antibiotics and syrup.',
    technologyProfile: 'Loves using the smart speaker; limited reading skills; relies on audio feedback.',
    behavioralTraits: 'Finds routines boring but loves praise; supervised by parents; encouraged independence.',
    devicePrefs: { primaryDevice: 'smart-speaker', modalities: { audio: true, visual: false, haptic: false }, ui: { textSize: 'large', contrast: 'high', cognitiveMode: 'simplified' } }
  },
  {
    _id: '4',
    name: 'Andreas Michas',
    age: 23,
    occupation: 'Junior software engineer',
    livingSituation: 'Lives alone; commutes and travels for work.',
    healthProfile: 'Asthma and seasonal allergies. Preventive inhaler and vitamin B complex.',
    technologyProfile: 'Heavy smartwatch/smartphone user. Prefers haptic alerts and quick interactions.',
    behavioralTraits: 'Tech-savvy but forgetful; tracks workouts and sleep; wants non-intrusive reminders.',
    devicePrefs: { primaryDevice: 'smartwatch', modalities: { audio: false, visual: true, haptic: true }, ui: { textSize: 'small', contrast: 'normal', cognitiveMode: 'standard' } }
  }
];

export const MOCK_MEDICATIONS: any[] = [
  // Make ACE inhibitor actionable right now
  { _id: 'm1', name: 'ACE inhibitor', dosage: '10mg', frequency: 'daily', times: [currentHHMM()], sideEffects: ['dizziness'], userId: '1', limits: { maxPostponeMinutes: 30, windowMinutes: 30 }, alert: { active: false } },
  { _id: 'm2', name: 'Beta blocker', dosage: '5mg', frequency: 'daily', times: ['20:00'], sideEffects: ['fatigue'], userId: '1', limits: { maxPostponeMinutes: 30, windowMinutes: 30 }, alert: { active: false } },
  { _id: 'm3', name: 'Diuretic', dosage: '20mg', frequency: 'daily', times: ['14:00'], sideEffects: ['increased urination'], userId: '1', limits: { maxPostponeMinutes: 30, windowMinutes: 30 }, alert: { active: false } },
  { _id: 'm4', name: 'Iron supplement', dosage: '325mg', frequency: 'daily', times: ['09:00'], sideEffects: [], userId: '2', limits: { maxPostponeMinutes: 30, windowMinutes: 30 }, alert: { active: false } },
  { _id: 'm5', name: 'Vitamin D', dosage: '2000 IU', frequency: 'daily', times: ['09:00'], sideEffects: [], userId: '2', limits: { maxPostponeMinutes: 30, windowMinutes: 30 }, alert: { active: false } },
  { _id: 'm6', name: 'Antibiotic', dosage: '250mg', frequency: 'twice daily', times: ['08:00','20:00'], sideEffects: [], userId: '3', limits: { maxPostponeMinutes: 30, windowMinutes: 30 }, alert: { active: false } },
  { _id: 'm7', name: 'Syrup', dosage: '5ml', frequency: 'twice daily', times: ['08:00','20:00'], sideEffects: [], userId: '3', limits: { maxPostponeMinutes: 30, windowMinutes: 30 }, alert: { active: false } },
  { _id: 'm8', name: 'Preventive inhaler', dosage: '2 puffs', frequency: 'daily', times: ['07:30'], sideEffects: [], userId: '4', limits: { maxPostponeMinutes: 15, windowMinutes: 20 }, alert: { active: false } },
  { _id: 'm9', name: 'Vitamin B complex', dosage: '1 tab', frequency: 'daily', times: ['08:00'], sideEffects: [], userId: '4', limits: { maxPostponeMinutes: 30, windowMinutes: 30 }, alert: { active: false } }
];

export const MOCK_SUMMARY: ReportSummaryModel = {
  taken: 10,
  missed: 2,
  postponed: 1
} as any;

export const MOCK_POSTPONED: any[] = [
  { medicationId: 'm1', scheduledAt: new Date().toISOString(), type: 'postponed' }
];

function daysAgoIso(daysAgo: number, hhmm: string): string {
  const now = new Date();
  const d = new Date(now);
  d.setDate(now.getDate() - daysAgo);
  const [hh, mm] = String(hhmm).split(':').map(x => parseInt(x, 10));
  d.setHours(hh || 0, mm || 0, 0, 0);
  return d.toISOString();
}

function addMinutesIso(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60000).toISOString();
}

// Analytics-ready adherence history (frontend-only / offline)
// NOTE: includes userId for filtering in UI.
export const MOCK_ADHERENCE_EVENTS: any[] = [
  // Eleni (wall-display)
  { _id: 'e1', userId: '1', medicationId: 'ACE inhibitor', type: 'taken', scheduledAt: daysAgoIso(0, currentHHMM(-5)), confirmedAt: daysAgoIso(0, currentHHMM(-3)), method: 'touch', device: 'wall-display', withinWindow: true },
  { _id: 'e2', userId: '1', medicationId: 'Beta blocker', type: 'taken', scheduledAt: daysAgoIso(1, '20:00'), confirmedAt: addMinutesIso(daysAgoIso(1, '20:00'), 2), method: 'touch', device: 'wall-display', withinWindow: true },
  { _id: 'e3', userId: '1', medicationId: 'Diuretic', type: 'postponed', scheduledAt: daysAgoIso(2, '14:00'), confirmedAt: addMinutesIso(daysAgoIso(2, '14:00'), 15), postponeMinutes: 15, method: 'touch', device: 'wall-display', withinWindow: true },
  { _id: 'e4', userId: '1', medicationId: 'Diuretic', type: 'taken', scheduledAt: daysAgoIso(2, '14:15'), confirmedAt: addMinutesIso(daysAgoIso(2, '14:15'), 3), method: 'touch', device: 'wall-display', withinWindow: true },
  { _id: 'e5', userId: '1', medicationId: 'Beta blocker', type: 'missed', scheduledAt: daysAgoIso(4, '20:00'), method: 'touch', device: 'wall-display', withinWindow: false },

  // Maria (smartphone)
  { _id: 'm1', userId: '2', medicationId: 'Iron supplement', type: 'taken', scheduledAt: daysAgoIso(0, '09:00'), confirmedAt: addMinutesIso(daysAgoIso(0, '09:00'), 22), method: 'touch', device: 'smartphone', withinWindow: false },
  { _id: 'm2', userId: '2', medicationId: 'Vitamin D', type: 'postponed', scheduledAt: daysAgoIso(1, '09:00'), confirmedAt: addMinutesIso(daysAgoIso(1, '09:00'), 10), postponeMinutes: 10, method: 'touch', device: 'smartphone', withinWindow: true },
  { _id: 'm3', userId: '2', medicationId: 'Vitamin D', type: 'taken', scheduledAt: daysAgoIso(1, '09:10'), confirmedAt: addMinutesIso(daysAgoIso(1, '09:10'), 18), method: 'touch', device: 'smartphone', withinWindow: false },
  { _id: 'm4', userId: '2', medicationId: 'Iron supplement', type: 'missed', scheduledAt: daysAgoIso(3, '09:00'), method: 'touch', device: 'smartphone', withinWindow: false },
  { _id: 'm5', userId: '2', medicationId: 'Vitamin D', type: 'taken', scheduledAt: daysAgoIso(5, '09:00'), confirmedAt: addMinutesIso(daysAgoIso(5, '09:00'), 4), method: 'touch', device: 'smartphone', withinWindow: true },

  // Sofia (family / speaker)
  { _id: 's1', userId: '3', medicationId: 'Antibiotic', type: 'taken', scheduledAt: daysAgoIso(0, '08:00'), confirmedAt: addMinutesIso(daysAgoIso(0, '08:00'), 1), method: 'voice', device: 'smart-speaker', withinWindow: true },
  { _id: 's2', userId: '3', medicationId: 'Syrup', type: 'taken', scheduledAt: daysAgoIso(0, '20:00'), confirmedAt: addMinutesIso(daysAgoIso(0, '20:00'), 2), method: 'voice', device: 'smart-speaker', withinWindow: true },
  { _id: 's3', userId: '3', medicationId: 'Antibiotic', type: 'postponed', scheduledAt: daysAgoIso(2, '20:00'), confirmedAt: addMinutesIso(daysAgoIso(2, '20:00'), 5), postponeMinutes: 5, method: 'voice', device: 'smart-speaker', withinWindow: true },
  { _id: 's4', userId: '3', medicationId: 'Antibiotic', type: 'taken', scheduledAt: daysAgoIso(2, '20:05'), confirmedAt: addMinutesIso(daysAgoIso(2, '20:05'), 1), method: 'voice', device: 'smart-speaker', withinWindow: true },

  // Andreas (smartwatch)
  { _id: 'a1', userId: '4', medicationId: 'Preventive inhaler', type: 'taken', scheduledAt: daysAgoIso(0, '07:30'), confirmedAt: addMinutesIso(daysAgoIso(0, '07:30'), 0), method: 'gesture', device: 'smartwatch', withinWindow: true },
  { _id: 'a2', userId: '4', medicationId: 'Vitamin B complex', type: 'taken', scheduledAt: daysAgoIso(1, '08:00'), confirmedAt: addMinutesIso(daysAgoIso(1, '08:00'), 6), method: 'touch', device: 'smartwatch', withinWindow: true },
  { _id: 'a3', userId: '4', medicationId: 'Preventive inhaler', type: 'missed', scheduledAt: daysAgoIso(3, '07:30'), method: 'gesture', device: 'smartwatch', withinWindow: false }
];
