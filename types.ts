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
}

export interface RevenueStats {
  predicted: number; // Pending
  realized: number; // Completed
}

export type ViewState = 'LOGIN' | 'DASHBOARD' | 'SERVICES' | 'SETTINGS';