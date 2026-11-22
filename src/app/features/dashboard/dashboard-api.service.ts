import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_ADMIN } from '../../core/http/api-base';

export interface ContagemFila {
  pending: number;
  processing: number;
  failed: number;
}

export interface ResumoPainel {
  totals: { trips: number; users: number; admins: number; itineraries: number; agents: number };
  users: { day: string; total: number }[];
  trips: { day: string; total: number }[];
  acquisitions: { free: number; pro: number };
  activePro: number;
  queues: { itinerary: ContagemFila; notification: ContagemFila; ingestion: ContagemFila };
  workers: { itinerary: string; notification: string; ingestion: string };
}

/** `PANEL/01-dashboard.md` — `GET /v1/admin/platform/dashboard`. */
@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly http = inject(HttpClient);

  buscar(periodo: { from: string; to: string; year: string }) {
    return this.http.get<ResumoPainel>(`${API_ADMIN}/platform/dashboard`, { params: periodo });
  }
}
