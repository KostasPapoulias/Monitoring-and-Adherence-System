import { Document, Schema, Model, model } from 'mongoose';
import { DefaultSchemaOptions } from '../../../models/shared';

export interface IMedication extends Document {
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  sideEffects?: string[];
  userId?: string;
  limits?: { maxPostponeMinutes: number; windowMinutes: number };
}

const medicationSchema = new Schema(
  {
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    times: { type: [String], default: [] },
    sideEffects: { type: [String], default: [] },
    userId: { type: String },
    limits: {
      type: {
        maxPostponeMinutes: { type: Number, default: 30 },
        windowMinutes: { type: Number, default: 30 }
      },
      default: { maxPostponeMinutes: 30, windowMinutes: 30 }
    }
  },
  { ...DefaultSchemaOptions }
);

// TODO(integration): When wiring the frontend to backend, consider returning computed fields
// (status, postponedUntil, alert) in a dedicated endpoint, e.g. GET /medications/:userId/today.
// These can be derived by joining the medication with the latest AdherenceEvents for each scheduledAt.

export const MedicationModel: Model<IMedication> = model<IMedication>(
  'Medication', medicationSchema, 'Medication'
);
