import { getSupabase } from './supabaseClient';
import { Appointment, Service, AppointmentStatus } from '../types';
import { DEFAULT_SERVICES } from '../constants';

// Keys for LocalStorage
const LS_SERVICES = 'studio_services';
const LS_APPOINTMENTS = 'studio_appointments';

class DataManager {
  private isSupabaseConfigured() {
    return !!getSupabase();
  }

  // --- SERVICES ---

  async getServices(): Promise<Service[]> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('services').select('*');
      if (error) throw error;
      return data || [];
    }
    // Local fallback
    const local = localStorage.getItem(LS_SERVICES);
    if (!local) {
      localStorage.setItem(LS_SERVICES, JSON.stringify(DEFAULT_SERVICES));
      return DEFAULT_SERVICES;
    }
    return JSON.parse(local);
  }

  async addService(service: Omit<Service, 'id'>): Promise<Service> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('services').insert([service]).select().single();
      if (error) throw error;
      return data;
    }
    // Local
    const services = await this.getServices();
    const newService = { ...service, id: Math.random().toString(36).substr(2, 9) };
    services.push(newService);
    localStorage.setItem(LS_SERVICES, JSON.stringify(services));
    return newService;
  }

  async deleteService(id: string): Promise<void> {
    const sb = getSupabase();
    if (sb) {
      const { error } = await sb.from('services').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    // Local
    const services = await this.getServices();
    const filtered = services.filter(s => s.id !== id);
    localStorage.setItem(LS_SERVICES, JSON.stringify(filtered));
  }

  // --- APPOINTMENTS ---

  async getAppointments(monthIndex: number, year: number): Promise<Appointment[]> {
    // Determine start and end date for filtering
    const startDate = new Date(year, monthIndex, 1).toISOString();
    const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59).toISOString();

    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb
        .from('appointments')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });
        
      if (error) throw error;
      return data || [];
    }

    // Local
    const local = localStorage.getItem(LS_APPOINTMENTS);
    const all: Appointment[] = local ? JSON.parse(local) : [];
    return all.filter(a => {
      const d = new Date(a.date);
      return d.getMonth() === monthIndex && d.getFullYear() === year;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async addAppointment(appt: Omit<Appointment, 'id'>): Promise<Appointment> {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('appointments').insert([appt]).select().single();
      if (error) throw error;
      return data;
    }
    // Local
    const local = localStorage.getItem(LS_APPOINTMENTS);
    const all: Appointment[] = local ? JSON.parse(local) : [];
    const newAppt = { ...appt, id: Math.random().toString(36).substr(2, 9) };
    all.push(newAppt);
    localStorage.setItem(LS_APPOINTMENTS, JSON.stringify(all));
    return newAppt;
  }

  async updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<void> {
    const sb = getSupabase();
    if (sb) {
      const { error } = await sb.from('appointments').update({ status }).eq('id', id);
      if (error) throw error;
      return;
    }
    // Local
    const local = localStorage.getItem(LS_APPOINTMENTS);
    let all: Appointment[] = local ? JSON.parse(local) : [];
    all = all.map(a => a.id === id ? { ...a, status } : a);
    localStorage.setItem(LS_APPOINTMENTS, JSON.stringify(all));
  }

  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<void> {
    const sb = getSupabase();
    if (sb) {
      const { error } = await sb.from('appointments').update(updates).eq('id', id);
      if (error) throw error;
      return;
    }
    // Local
    const local = localStorage.getItem(LS_APPOINTMENTS);
    let all: Appointment[] = local ? JSON.parse(local) : [];
    all = all.map(a => a.id === id ? { ...a, ...updates } : a);
    localStorage.setItem(LS_APPOINTMENTS, JSON.stringify(all));
  }

  async deleteAppointment(id: string): Promise<void> {
    const sb = getSupabase();
    if (sb) {
      const { error } = await sb.from('appointments').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    // Local
    const local = localStorage.getItem(LS_APPOINTMENTS);
    let all: Appointment[] = local ? JSON.parse(local) : [];
    all = all.filter(a => a.id !== id);
    localStorage.setItem(LS_APPOINTMENTS, JSON.stringify(all));
  }
}

export const dataManager = new DataManager();