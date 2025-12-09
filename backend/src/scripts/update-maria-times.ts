import 'reflect-metadata';
import mongoose from 'mongoose';
import { MongoAdapter } from '../database';
import { PersonaModel } from '../api/v1/personas/persona.model';
import { MedicationModel } from '../api/v1/medications/medication.model';

async function run() {
  await MongoAdapter.connect();

  const targetName = 'Maria Kostaki';
  const targetTimes = ['23:59']; // keep it upcoming for same-day tests

  const persona = await PersonaModel.findOne({ name: targetName }).exec();
  if (!persona) {
    throw new Error(`Persona '${targetName}' not found`);
  }

  const res = await MedicationModel.updateMany(
    { userId: String(persona._id) },
    { $set: { times: targetTimes } }
  ).exec();

  console.log(`Updated ${res.modifiedCount} medication(s) for ${targetName} to times=${targetTimes.join(',')}`);
}

run()
  .then(() => mongoose.connection.close())
  .catch(err => { console.error(err); mongoose.connection.close(); });
