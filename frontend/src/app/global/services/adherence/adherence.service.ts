import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { AdherenceEventModel } from '../../models/adherence/adherence-event.model';
import { ReportSummaryModel } from '../../models/reports/report-summary.model';
import { ReportTimeSeriesModel } from '../../models/reports/report-timeseries.model';

@Injectable({ providedIn: 'root' })
export class AdherenceService {
  private base = `${environment.host}/api/adherence`;

  constructor(private http: HttpClient) {}

  list(params?: any): Observable<AdherenceEventModel[]> { return this.http.get<AdherenceEventModel[]>(`${this.base}`, { params }); }

  summary(params?: any): Observable<ReportSummaryModel> { return this.http.get<ReportSummaryModel>(`${this.base}/summary`, { params }); }

  timeseries(params?: any): Observable<ReportTimeSeriesModel> { return this.http.get<ReportTimeSeriesModel>(`${this.base}/report/timeseries`, { params }); }

  export(params?: any): Observable<Blob> { return this.http.get(`${this.base}/export`, { params, responseType: 'blob' }); }

  confirm(payload: Partial<AdherenceEventModel>): Observable<AdherenceEventModel> {
    return this.http.post<AdherenceEventModel>(`${this.base}/confirm`, payload);
  }

  postpone(payload: { medicationId: string; scheduledAt: string | Date; postponeMinutes: number }): Observable<AdherenceEventModel> {
    return this.http.post<AdherenceEventModel>(`${this.base}/postpone`, payload);
  }
}
