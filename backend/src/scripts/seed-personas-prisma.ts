import { PrismaClient } from '@prisma/client';

// Create a Prisma Client instance
const prisma = new PrismaClient();

async function () {
  console.log('Starting to  personas...');

  const personas = [
    {
      name: 'Eleni Papadaki',
      age: 76,
      occupation: 'Retired primary school teacher',
      livingSituation: 'Lives alone in Heraklion, Greece; her children live in Athens.',
      healthProfile: 'Chronic heart failure and hypertension. Takes five pills daily. Mild short-term memory issues.',
      technologyProfile: 'Basic smartphone user; relies on wall-mounted smart display. Prefers large text, high contrast, voice or touch.',
      behavioralTraits: 'Routine-driven; appreciates calm reminders; anxious if devices behave unpredictably.',
      primaryDevice: 'wall-display',
      modalityAudio: true,
      modalityVisual: true,
      modalityHaptic: false,
      textSize: 'large',
      contrast: 'high',
      cognitiveMode: 'simplified',
    },
    {
      name: 'Maria Kostaki',
      age: 42,
      occupation: 'Accountant',
      livingSituation: 'Married, mother of three (ages 5, 9, and 13).',
      healthProfile: 'Iron supplements and vitamin D; occasional antibiotics for sinus infections.',
      technologyProfile: 'Highly familiar with smartphone apps. Prefers visual dashboards and push notifications.',
      behavioralTraits: 'Multitasks; tends to forget medication; wants low-effort systems.',
      primaryDevice: 'smartphone',
      modalityAudio: true,
      modalityVisual: true,
      modalityHaptic: true,
      textSize: 'medium',
      contrast: 'normal',
      cognitiveMode: 'standard',
    },
    {
      name: 'Sofia Lianou',
      age: 9,
      occupation: 'Primary school student',
      livingSituation: 'Lives with parents and older brother.',
      healthProfile: '2-week antibiotics and syrup.',
      technologyProfile: 'Loves using the smart speaker; limited reading skills; relies on audio feedback.',
      behavioralTraits: 'Finds routines boring but loves praise; supervised by parents; encouraged independence.',
      primaryDevice: 'smart-speaker',
      modalityAudio: true,
      modalityVisual: false,
      modalityHaptic: false,
      textSize: 'large',
      contrast: 'high',
      cognitiveMode: 'simplified',
    },
    {
      name: 'Andreas Michas',
      age: 23,
      occupation: 'Junior software engineer',
      livingSituation: 'Lives alone; commutes and travels for work.',
      healthProfile: 'Asthma and seasonal allergies. Preventive inhaler and vitamin B complex.',
      technologyProfile: 'Heavy smartwatch/smartphone user. Prefers haptic alerts and quick interactions.',
      behavioralTraits: 'Tech-savvy but forgetful; tracks workouts and sleep; wants non-intrusive reminders.',
      primaryDevice: 'smartwatch',
      modalityAudio: false,
      modalityVisual: true,
      modalityHaptic: true,
      textSize: 'small',
      contrast: 'normal',
      cognitiveMode: 'standard',
    },
  ];

  try {
    for (const persona of personas) {
      const existing = await prisma.persona.findUnique({
        where: { name: persona.name },
      });

      if (existing) {
        console.log(`Persona ${persona.name} already exists, skipping...`);
        continue;
      }

      const created = await prisma.persona.create({
        data: persona,
      });
      console.log(`Created persona: ${created.name}`);
    }

    console.log('ing completed successfully!');
  } catch (error) {
    console.error('Error ing database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

();
