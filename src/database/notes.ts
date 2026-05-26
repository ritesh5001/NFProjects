import { getDb } from './db';
import { Note } from '../types';
import { generateId } from '../utils/idUtils';

export async function getNoteByProject(projectId: string): Promise<Note | null> {
  const db = await getDb();
  return db.getFirstAsync<Note>('SELECT * FROM notes WHERE project_id = ?', [projectId]);
}

export async function upsertNote(projectId: string, body: string): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  const existing = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM notes WHERE project_id = ?', [projectId]
  );
  if (existing) {
    await db.runAsync('UPDATE notes SET body = ?, updated_at = ? WHERE project_id = ?', [body, now, projectId]);
  } else {
    await db.runAsync(
      'INSERT INTO notes (id, project_id, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [generateId(), projectId, body, now, now]
    );
  }
}
