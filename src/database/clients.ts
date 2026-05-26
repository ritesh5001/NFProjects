import { getDb } from './db';
import { Client } from '../types';
import { generateId } from '../utils/idUtils';

export async function getClients(): Promise<Client[]> {
  const db = await getDb();
  return db.getAllAsync<Client>('SELECT * FROM clients ORDER BY name ASC');
}

export async function getClient(id: string): Promise<Client | null> {
  const db = await getDb();
  return db.getFirstAsync<Client>('SELECT * FROM clients WHERE id = ?', [id]);
}

export async function addClient(data: Omit<Client, 'id' | 'created_at'>): Promise<Client> {
  const db = await getDb();
  const client: Client = { ...data, id: generateId(), created_at: Date.now() };
  await db.runAsync(
    'INSERT INTO clients (id, name, email, phone, company, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [client.id, client.name, client.email, client.phone, client.company, client.created_at]
  );
  return client;
}

export async function updateClient(id: string, data: Partial<Omit<Client, 'id' | 'created_at'>>): Promise<void> {
  const db = await getDb();
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(data), id];
  await db.runAsync(`UPDATE clients SET ${fields} WHERE id = ?`, values);
}

export async function deleteClient(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM clients WHERE id = ?', [id]);
}

export async function getClientProjectCount(clientId: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM projects WHERE client_id = ?', [clientId]
  );
  return row?.count ?? 0;
}
