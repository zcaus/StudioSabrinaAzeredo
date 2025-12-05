export enum AppointmentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes?: number;
}

export interface Appointment {
  id: string;
  client_name: string;
  client_phone?: string;
  service_id: string;
  date: string; // ISO String
  status: AppointmentStatus;
  notes?: string;
  deposit_paid?: boolean; // Indica se os 30% foram adiantados
}

export interface RevenueStats {
  predicted: number; // A Receber (Saldo restante)
  realized: number; // Faturamento (Já pago: Completos + Sinais)
}

export type ViewState = 'LOGIN' | 'DASHBOARD' | 'SERVICES' | 'SETTINGS';