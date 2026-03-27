export type AgeGroup = 'child' | 'adult' | 'elderly';

export interface NotificationPrefs {
  audio: boolean;
  visual: boolean;
  haptic: boolean;
}

export class ProfileModel {
  public ageGroup: AgeGroup = 'adult';
  public cognitiveProfile: 'simplified' | 'standard' = 'standard';
  public notification: NotificationPrefs = { audio: true, visual: true, haptic: false };

  constructor(model?: Partial<ProfileModel>) {
    Object.assign(this, model);
  }
}
