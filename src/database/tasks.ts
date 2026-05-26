import { getDb } from './db';
import { Task } from '../types';
import { generateId } from '../utils/idUtils';

export async function getTasksByProject(projectId: string): Promise<Task[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM tasks WHERE project_id = ? ORDER BY order_index ASC, created_at ASC',
    [projectId]
  );
  return rows.map(r => ({ ...r, is_completed: r.is_completed === 1 }));
}

export async function addTask(projectId: string, title: string): Promise<Task> {
  const db = await getDb();
  const countRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM tasks WHERE project_id = ?', [projectId]
  );
  const task: Task = {
    id: generateId(),
    project_id: projectId,
    title,
    is_completed: false,
    order_index: countRow?.count ?? 0,
    created_at: Date.now(),
  };
  await db.runAsync(
    'INSERT INTO tasks (id, project_id, title, is_completed, order_index, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [task.id, task.project_id, task.title, 0, task.order_index, task.created_at]
  );
  return task;
}

export async function toggleTask(id: string, completed: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE tasks SET is_completed = ? WHERE id = ?', [completed ? 1 : 0, id]);
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM tasks WHERE id = ?', [id]);
}
