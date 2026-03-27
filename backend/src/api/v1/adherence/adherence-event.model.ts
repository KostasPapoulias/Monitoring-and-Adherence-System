import { Document, Schema, Model, model } from 'mongoose';
import { DefaultSchemaOptions } from '../../../models/shared';

export type AdherenceEventType = 'taken' | 'missed' | 'postponed' | 'alert';
export type ConfirmationMethod = 'touch' | 'voice' | 'gesture' | 'presence';

export interface IAdherenceEvent extends Document {
  userId?: string;
  medicationId: string;
  scheduledAt: Date;
  confirmedAt?: Date;
  type: AdherenceEventType;
  method?: ConfirmationMethod;
  device?: string;
  postponeMinutes?: number;
  withinWindow?: boolean;
  windowMinutes?: number;
  corrected?: boolean;
  alertReason?: 'thresholdExceeded' | 'overdue' | 'missed';
}

const adherenceEventSchema = new Schema(
  {
    userId: { type: String, index: true },
    medicationId: { type: String, required: true },
    scheduledAt: { type: Date, required: true },
    confirmedAt: { type: Date },
    type: { type: String, enum: ['taken', 'missed', 'postponed', 'alert'], required: true },
    method: { type: String, enum: ['touch', 'voice', 'gesture', 'presence'] },
    device: { type: String },
    postponeMinutes: { type: Number },
    withinWindow: { type: Boolean, default: true },
    windowMinutes: { type: Number },
    corrected: { type: Boolean, default: false },
    alertReason: { type: String, enum: ['thresholdExceeded', 'overdue', 'missed'] }
  },
  { ...DefaultSchemaOptions }
);

adherenceEventSchema.index({ medicationId: 1, scheduledAt: 1 });

export const AdherenceEventModel: Model<IAdherenceEvent> = model<IAdherenceEvent>(
  'AdherenceEvent', adherenceEventSchema, 'AdherenceEvent'
);

// TODO(integration): Alert events are emitted when thresholds are exceeded (e.g., total postpone minutes).
// Future work: add scheduled background checks to emit 'alert' for overdue/missed doses
// when scheduledAt + windowMinutes or postponedUntil passes without confirmation.
