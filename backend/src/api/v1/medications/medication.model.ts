import { Document, Schema, Model, model } from 'mongoose';
import { DefaultSchemaOptions } from '../../../models/shared';

export interface IMedication extends Document {
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  sideEffects?: string[];
  userId?: string;
}

const medicationSchema = new Schema(
  {
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    times: { type: [String], default: [] },
    sideEffects: { type: [String], default: [] },
    userId: { type: String }
  },
  { ...DefaultSchemaOptions }
);

export const MedicationModel: Model<IMedication> = model<IMedication>(
  'Medication', medicationSchema, 'Medication'
);
