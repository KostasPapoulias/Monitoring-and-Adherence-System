import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

interface PresenceState { present: boolean; distanceMeters: number | null; device: string | null }

@Injectable({ providedIn: 'root' })
export class PresenceService {
  private base = `${environment.host}/api/presence`;
  private state$ = new BehaviorSubject<PresenceState>({ present: false, distanceMeters: null, device: null });

  constructor(private http: HttpClient) {}

  get(): Observable<PresenceState> { return this.http.get<PresenceState>(this.base).pipe(tap(s => this.state$.next(s))); }
  update(payload: Partial<PresenceState>): Observable<PresenceState> { return this.http.post<PresenceState>(this.base, payload).pipe(tap(s => this.state$.next(s))); }
  state(): Observable<PresenceState> { return this.state$.asObservable(); }
}
