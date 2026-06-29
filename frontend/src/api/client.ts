import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

export default api;

// --- Admin API ---

export interface AdminEvent {
  uuid: string;
  createdAt: string;
  name: string;
  dateTime: string;
  address: string;
  deadline: string;
  capacity: number;
  registrationCount: number;
  handler: { uuid: string; name: string };
}

export interface AdminEventsResponse {
  total: number;
  events: AdminEvent[];
}

export interface TrendEntry {
  date: string;
  registrationCount: number;
  newRegistrationCount: number;
}

export interface Employee {
  uuid: string;
  name: string;
}

export async function fetchAdminEvents(params: {
  page: number;
  search?: string;
  open?: true;
}): Promise<AdminEventsResponse> {
  const { data } = await api.get('/api/admin/events', { params });
  return data;
}

export async function createEvent(body: {
  name: string;
  dateTime: string;
  postalCode: string;
  deadline: string;
  capacity: number;
  handlerUuid: string;
}): Promise<void> {
  await api.post('/api/admin/events', body);
}

export async function fetchEventTrend(uuid: string): Promise<TrendEntry[]> {
  const { data } = await api.post(`/api/admin/events/${uuid}/trend`);
  return data;
}

export async function fetchEmployees(): Promise<Employee[]> {
  const { data } = await api.get('/api/admin/employees');
  return data;
}

// --- Public API ---

export interface PublicEvent {
  uuid: string;
  name: string;
  dateTime: string;
  address: string;
  deadline: string;
}

export async function fetchPublicEvents(): Promise<PublicEvent[]> {
  const { data } = await api.get('/api/public/events');
  return data;
}

export async function registerForEvent(body: {
  eventUuid: string;
  emailAddress: string;
}): Promise<{ registrationNo: string }> {
  const { data } = await api.post('/api/public/register', body);
  return data;
}
