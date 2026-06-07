import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface HealthResponse {
  ok: boolean;
  backend: string;
  base_url: string;
  model_id: string;
  hf_token_configured: boolean;
  audio_note?: string;
}

export interface AskResponse {
  result: string;
  model: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = '/api';

  constructor(private readonly http: HttpClient) {}

  health(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.baseUrl}/health`);
  }

  ask(form: FormData): Observable<AskResponse> {
    return this.http.post<AskResponse>(`${this.baseUrl}/v1/ask`, form);
  }
}
