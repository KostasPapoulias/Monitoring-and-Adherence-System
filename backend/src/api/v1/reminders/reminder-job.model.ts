import { Document, Model, Schema, model } from 'mongoose';
import { DefaultSchemaOptions } from '../../../models/shared';

export type ReminderStatus = 'pending' | 'sent' | 'acknowledged' | 'missed' | 'cancelled';

export interface IReminderJob extends Document {
  medicationId: string;
  userId: string;
  scheduledAt: Date;
  status: ReminderStatus;
  sentAt?: Date;
  channels: { audio: boolean; visual: boolean; haptic: boolean };
  deviceHint?: string;
}

const reminderJobSchema = new Schema(
  {
    medicationId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    scheduledAt: { type: Date, required: true, index: true },
    status: { type: String, enum: ['pending', 'sent', 'acknowledged', 'missed', 'cancelled'], default: 'pending', index: true },
    sentAt: { type: Date },
    channels: {
      audio: { type: Boolean, default: true },
      visual: { type: Boolean, default: true },
      haptic: { type: Boolean, default: false }
    },
    deviceHint: { type: String }
  },
  { ...DefaultSchemaOptions }
);

reminderJobSchema.index({ medicationId: 1, scheduledAt: 1 }, { unique: true });

export const ReminderJobModel: Model<IReminderJob> = model<IReminderJob>('ReminderJob', reminderJobSchema, 'ReminderJob');
