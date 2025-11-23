import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class AlertsService {
  private base = `${environment.host}/api/alerts`;

  constructor(private http: HttpClient) {}

  trigger(payload: { channel?: 'app' | 'email' | 'sms'; reason?: string }): Observable<any> {
    return this.http.post(`${this.base}/trigger`, payload);
  }
}
