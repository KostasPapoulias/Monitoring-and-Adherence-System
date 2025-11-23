import 'reflect-metadata';
import mongoose from 'mongoose';
import { MongoAdapter } from '../database';
import { PersonaModel } from '../api/v1/personas/persona.model';
import { MedicationModel } from '../api/v1/medications/medication.model';
import { AdherenceEventModel } from '../api/v1/adherence/adherence-event.model';

async function upsertPersona(persona: any) {
  const existing = await PersonaModel.findOne({ name: persona.name }).exec();
  if (existing) { return existing; }
  return await new PersonaModel(persona).save();
}

async function seed() {
  await MongoAdapter.connect();

  const personas = [
    {
      name: 'Eleni Papadaki', age: 76, occupation: 'Retired primary school teacher',
      livingSituation: 'Lives alone in Heraklion, Greece; her children live in Athens.',
      healthProfile: 'Chronic heart failure and hypertension. Takes five pills daily. Mild short-term memory issues.',
      technologyProfile: 'Basic smartphone user; relies on wall-mounted smart display. Prefers large text, high contrast, voice or touch.',
      behavioralTraits: 'Routine-driven; appreciates calm reminders; anxious if devices behave unpredictably.',
      devicePrefs: { primaryDevice: 'wall-display', modalities: { audio: true, visual: true, haptic: false }, ui: { textSize: 'large', contrast: 'high', cognitiveMode: 'simplified' } }
    },
    {
      name: 'Maria Kostaki', age: 42, occupation: 'Accountant',
      livingSituation: 'Married, mother of three (ages 5, 9, and 13).',
      healthProfile: 'Iron supplements and vitamin D; occasional antibiotics for sinus infections.',
      technologyProfile: 'Highly familiar with smartphone apps. Prefers visual dashboards and push notifications.',
      behavioralTraits: 'Multitasks; tends to forget medication; wants low-effort systems.',
      devicePrefs: { primaryDevice: 'smartphone', modalities: { audio: true, visual: true, haptic: true }, ui: { textSize: 'medium', contrast: 'normal', cognitiveMode: 'standard' } }
    },
    {
      name: 'Sofia Lianou', age: 9, occupation: 'Primary school student',
      livingSituation: 'Lives with parents and older brother.',
      healthProfile: '2-week antibiotics and syrup.',
      technologyProfile: 'Loves using the smart speaker; limited reading skills; relies on audio feedback.',
      behavioralTraits: 'Finds routines boring but loves praise; supervised by parents; encouraged independence.',
      devicePrefs: { primaryDevice: 'smart-speaker', modalities: { audio: true, visual: false, haptic: false }, ui: { textSize: 'large', contrast: 'high', cognitiveMode: 'simplified' } }
    },
    {
      name: 'Andreas Michas', age: 23, occupation: 'Junior software engineer',
      livingSituation: 'Lives alone; commutes and travels for work.',
      healthProfile: 'Asthma and seasonal allergies. Preventive inhaler and vitamin B complex.',
      technologyProfile: 'Heavy smartwatch/smartphone user. Prefers haptic alerts and quick interactions.',
      behavioralTraits: 'Tech-savvy but forgetful; tracks workouts and sleep; wants non-intrusive reminders.',
      devicePrefs: { primaryDevice: 'smartwatch', modalities: { audio: false, visual: true, haptic: true }, ui: { textSize: 'small', contrast: 'normal', cognitiveMode: 'standard' } }
    }
  ];

  const medsByPersona: Record<string, any[]> = {
    'Eleni Papadaki': [
      { name: 'ACE inhibitor', dosage: '10mg', frequency: 'daily', times: ['08:00'], sideEffects: ['dizziness'] },
      { name: 'Beta blocker', dosage: '5mg', frequency: 'daily', times: ['20:00'], sideEffects: ['fatigue'] },
    ],
    'Maria Kostaki': [
      { name: 'Iron supplement', dosage: '325mg', frequency: 'daily', times: ['09:00'] },
      { name: 'Vitamin D', dosage: '2000 IU', frequency: 'daily', times: ['09:00'] },
    ],
    'Sofia Lianou': [
      { name: 'Antibiotic', dosage: '250mg', frequency: 'twice daily', times: ['08:00','20:00'] },
      { name: 'Syrup', dosage: '5ml', frequency: 'twice daily', times: ['08:00','20:00'] },
    ],
    'Andreas Michas': [
      { name: 'Preventive inhaler', dosage: '2 puffs', frequency: 'daily', times: ['07:30'] },
      { name: 'Vitamin B complex', dosage: '1 tab', frequency: 'daily', times: ['08:00'] },
    ]
  };

  for (const p of personas) {
    const personaDoc = await upsertPersona(p);

    // medications: upsert by name+userId
    const meds = medsByPersona[p.name] || [];
    const medDocs: any[] = [];
    for (const m of meds) {
      const existingMed = await MedicationModel.findOne({ name: m.name, userId: String(personaDoc._id) }).exec();
      const med = existingMed || await new MedicationModel({ ...m, userId: String(personaDoc._id) }).save();
      medDocs.push(med);
    }

    // seed simple recent adherence history (last 5 days for each medication)
    for (const med of medDocs) {
      for (let d = 1; d <= 5; d++) {
        const day = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
        const scheduledAt = new Date(day);
        await new AdherenceEventModel({ medicationId: String(med._id), scheduledAt, confirmedAt: scheduledAt, type: 'taken', method: 'touch', device: p.devicePrefs.primaryDevice, withinWindow: true }).save();
      }
    }
  }
}

seed()
  .then(() => { console.log('Seed completed'); return mongoose.connection.close(); })
  .catch(e => { console.error('Seed failed', e); return mongoose.connection.close(); });
