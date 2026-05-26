export type ProjectType = 'website' | 'app' | 'both' | 'other';
export type ProjectStatus = 'ongoing' | 'completed' | 'paused' | 'cancelled';
export type WebsiteCategory = 'ecommerce' | 'service' | 'other';
export type WebsitePlatform = 'wordpress' | 'shopify' | 'custom_code' | 'other';
export type FileType = 'image' | 'document';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  created_at: number;
}

export interface Project {
  id: string;
  title: string;
  type: ProjectType;
  status: ProjectStatus;
  client_id: string;
  start_date: number;
  deadline: number;
  budget_quoted: number;
  budget_received: number;
  website_category: WebsiteCategory | '';
  website_platform: WebsitePlatform | '';
  description: string;
  created_at: number;
  updated_at: number;
  // joined fields
  client_name?: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  is_completed: boolean;
  order_index: number;
  created_at: number;
}

export interface Attachment {
  id: string;
  project_id: string;
  file_uri: string;
  file_name: string;
  file_type: FileType;
  created_at: number;
}

export interface Note {
  id: string;
  project_id: string;
  body: string;
  created_at: number;
  updated_at: number;
}

export interface NotificationSettings {
  enabled: boolean;
  remind7Days: boolean;
  remind3Days: boolean;
  remind1Day: boolean;
}

export type RootStackParamList = {
  Main: undefined;
  ProjectDetail: { projectId: string };
  AddEditProject: { projectId?: string };
  AddEditClient: { clientId?: string };
};

export type BottomTabParamList = {
  Home: undefined;
  Projects: undefined;
  Clients: undefined;
  Settings: undefined;
};
