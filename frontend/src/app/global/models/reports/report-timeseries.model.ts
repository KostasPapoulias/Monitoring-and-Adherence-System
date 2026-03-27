export interface ReportBucket {
  label: string;
  taken: number;
  missed: number;
  postponed: number;
}

export class ReportTimeSeriesModel {
  period: 'day' | 'week' | 'month' = 'week';
  buckets: ReportBucket[] = [];

  constructor(model?: Partial<ReportTimeSeriesModel>) {
    Object.assign(this, model);
  }
}
