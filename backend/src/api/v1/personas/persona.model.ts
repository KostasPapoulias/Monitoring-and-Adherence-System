import { Document, Schema, Model, model } from 'mongoose';
import { DefaultSchemaOptions } from '../../../models/shared';

export interface IDevicePrefs {
  primaryDevice: 'wall-display' | 'smartphone' | 'smart-speaker' | 'smartwatch';
  modalities: { audio: boolean; visual: boolean; haptic: boolean };
  ui: { textSize: 'small' | 'medium' | 'large'; contrast: 'normal' | 'high'; cognitiveMode: 'simplified' | 'standard' };
}

export interface IPersona extends Document {
  name: string;
  age: number;
  occupation?: string;
  livingSituation?: string;
  healthProfile?: string;
  technologyProfile?: string;
  behavioralTraits?: string;
  devicePrefs: IDevicePrefs;
}

const personaSchema = new Schema(
  {
    name: { type: String, required: true, index: true, unique: true },
    age: { type: Number, required: true },
    occupation: { type: String },
    livingSituation: { type: String },
    healthProfile: { type: String },
    technologyProfile: { type: String },
    behavioralTraits: { type: String },
    devicePrefs: {
      primaryDevice: { type: String, enum: ['wall-display', 'smartphone', 'smart-speaker', 'smartwatch'], required: true },
      modalities: {
        audio: { type: Boolean, default: true },
        visual: { type: Boolean, default: true },
        haptic: { type: Boolean, default: false }
      },
      ui: {
        textSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
        contrast: { type: String, enum: ['normal', 'high'], default: 'normal' },
        cognitiveMode: { type: String, enum: ['simplified', 'standard'], default: 'standard' }
      }
    }
  },
  { ...DefaultSchemaOptions }
);

export const PersonaModel: Model<IPersona> = model<IPersona>('Persona', personaSchema, 'Persona');
