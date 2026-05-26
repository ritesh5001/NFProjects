import { getDb } from './db';
import { Project } from '../types';
import { generateId } from '../utils/idUtils';

const SELECT_WITH_CLIENT = `
  SELECT p.*, c.name as client_name
  FROM projects p
  LEFT JOIN clients c ON p.client_id = c.id
`;

export async function getProjects(): Promise<Project[]> {
  const db = await getDb();
  return db.getAllAsync<Project>(`${SELECT_WITH_CLIENT} ORDER BY p.deadline ASC`);
}

export async function getProject(id: string): Promise<Project | null> {
  const db = await getDb();
  return db.getFirstAsync<Project>(`${SELECT_WITH_CLIENT} WHERE p.id = ?`, [id]);
}

export async function addProject(data: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'client_name'>): Promise<Project> {
  const db = await getDb();
  const now = Date.now();
  const project: Project = { ...data, id: generateId(), created_at: now, updated_at: now };
  await db.runAsync(
    `INSERT INTO projects (id, title, type, status, client_id, start_date, deadline,
      budget_quoted, budget_received, website_category, website_platform, description, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      project.id, project.title, project.type, project.status, project.client_id,
      project.start_date, project.deadline, project.budget_quoted, project.budget_received,
      project.website_category, project.website_platform,
      project.description, project.created_at, project.updated_at,
    ]
  );
  return project;
}

export async function updateProject(id: string, data: Partial<Omit<Project, 'id' | 'created_at' | 'client_name'>>): Promise<void> {
  const db = await getDb();
  const payload = { ...data, updated_at: Date.now() };
  const fields = Object.keys(payload).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(payload), id];
  await db.runAsync(`UPDATE projects SET ${fields} WHERE id = ?`, values);
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM projects WHERE id = ?', [id]);
  await db.runAsync('DELETE FROM tasks WHERE project_id = ?', [id]);
  await db.runAsync('DELETE FROM attachments WHERE project_id = ?', [id]);
  await db.runAsync('DELETE FROM notes WHERE project_id = ?', [id]);
}
