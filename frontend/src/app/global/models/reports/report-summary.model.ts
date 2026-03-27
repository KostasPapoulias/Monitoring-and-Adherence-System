export class ReportSummaryModel {
  public taken: number = 0;
  public missed: number = 0;
  public postponed: number = 0;

  constructor(model?: Partial<ReportSummaryModel>) {
    Object.assign(this, model);
  }
}
