export class MedicationModel {
  public _id?: string;
  public name!: string;
  public dosage!: string;
  public frequency!: string;
  public times: string[] = [];
  public sideEffects: string[] = [];
  public userId?: string;

  constructor(model?: Partial<MedicationModel>) {
    Object.assign(this, model);
    this.times = this.times || [];
    this.sideEffects = this.sideEffects || [];
  }
}
