export type PrimaryDevice = 'wall-display' | 'smartphone' | 'smart-speaker' | 'smartwatch';

export interface DevicePrefs {
  primaryDevice: PrimaryDevice;
  modalities: { audio: boolean; visual: boolean; haptic: boolean };
  ui: { textSize: 'small' | 'medium' | 'large'; contrast: 'normal' | 'high'; cognitiveMode: 'simplified' | 'standard' };
}

export class PersonaModel {
  public _id!: string;
  public name!: string;
  public age!: number;
  public occupation?: string;
  public livingSituation?: string;
  public healthProfile?: string;
  public technologyProfile?: string;
  public behavioralTraits?: string;
  public devicePrefs!: DevicePrefs;
  constructor(model?: Partial<PersonaModel>) { Object.assign(this, model); }
}
