import { getDb } from './db';
import { Attachment, FileType } from '../types';
import { generateId } from '../utils/idUtils';
import { Paths, File, Directory } from 'expo-file-system';

export async function getAttachments(projectId: string): Promise<Attachment[]> {
  const db = await getDb();
  return db.getAllAsync<Attachment>(
    'SELECT * FROM attachments WHERE project_id = ? ORDER BY created_at DESC',
    [projectId]
  );
}

export async function addAttachment(
  projectId: string,
  sourceUri: string,
  fileName: string,
  fileType: FileType
): Promise<Attachment> {
  const db = await getDb();

  const destDir = new Directory(Paths.document, `attachments/${projectId}`);
  if (!destDir.exists) destDir.create();

  const destFile = new File(destDir, `${generateId()}_${fileName}`);
  const sourceFile = new File(sourceUri);
  sourceFile.copy(destFile);

  const attachment: Attachment = {
    id: generateId(),
    project_id: projectId,
    file_uri: destFile.uri,
    file_name: fileName,
    file_type: fileType,
    created_at: Date.now(),
  };
  await db.runAsync(
    'INSERT INTO attachments (id, project_id, file_uri, file_name, file_type, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [attachment.id, attachment.project_id, attachment.file_uri, attachment.file_name, attachment.file_type, attachment.created_at]
  );
  return attachment;
}

export async function deleteAttachment(id: string, fileUri: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM attachments WHERE id = ?', [id]);
  try {
    const f = new File(fileUri);
    if (f.exists) f.delete();
  } catch {}
}
