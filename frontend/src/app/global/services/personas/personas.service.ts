import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { PersonaModel } from '../../models/personas/persona.model';

@Injectable({ providedIn: 'root' })
export class PersonasService {
  private base = `${environment.host}/api/personas`;
  constructor(private http: HttpClient) {}
  list(): Observable<PersonaModel[]> { return this.http.get<PersonaModel[]>(this.base); }
}
