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
