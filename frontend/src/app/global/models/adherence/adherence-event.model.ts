export type AdherenceEventType = 'taken' | 'missed' | 'postponed';
export type ConfirmationMethod = 'touch' | 'voice' | 'gesture' | 'presence';

export class AdherenceEventModel {
  public _id?: string;
  public medicationId!: string;
  public scheduledAt!: string | Date;
  public confirmedAt?: string | Date;
  public type!: AdherenceEventType;
  public method?: ConfirmationMethod;
  public device?: string;
  public postponeMinutes?: number;
  public withinWindow?: boolean;

  constructor(model?: Partial<AdherenceEventModel>) {
    Object.assign(this, model);
  }
}
