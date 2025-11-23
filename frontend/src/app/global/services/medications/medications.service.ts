import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { MedicationModel } from '../../models/medications/medication.model';

@Injectable({ providedIn: 'root' })
export class MedicationsService {
  private base = `${environment.host}/api/medications`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<MedicationModel[]> {
    return this.http.get<MedicationModel[]>(this.base);
  }

  getOne(id: string): Observable<MedicationModel> {
    return this.http.get<MedicationModel>(`${this.base}/${id}`);
  }

  create(payload: Partial<MedicationModel>): Observable<MedicationModel> {
    return this.http.post<MedicationModel>(this.base, payload);
  }

  update(id: string, payload: Partial<MedicationModel>): Observable<MedicationModel> {
    return this.http.put<MedicationModel>(`${this.base}/${id}`, payload);
  }

  delete(id: string): Observable<MedicationModel> {
    return this.http.delete<MedicationModel>(`${this.base}/${id}`);
  }
}
