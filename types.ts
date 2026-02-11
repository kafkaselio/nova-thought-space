
export enum Priority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
  SOMEDAY = 'Someday'
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface GoogleAccount {
  id: string;
  email: string;
  verified: boolean;
  lastSyncedAt?: number;
}

export interface UserProfile {
  name: string;
  bio: string;
  avatarUrl: string | null;
  socials: SocialLink[];
  googleAccount?: GoogleAccount;
}

export interface Bucket {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export interface SubTask {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  bucketId: string;
  priority: Priority;
  category: string;
  tags: string[];
  images: string[];
  links: string[];
  subTasks: SubTask[];
  reminder?: string;
  createdAt: number;
  updatedAt: number;
  isCompleted: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  isDeleted?: boolean;
  order: number; // For manual reordering
}

export interface PomoHistoryItem {
  id: string;
  label: string;
  taskId?: string;
  taskTitle?: string;
  duration: number; // in seconds
  mode: 'work' | 'short' | 'long';
  timestamp: number;
}

export interface PomoSettings {
  work: number;
  short: number;
  long: number;
}

export type ViewType = 'notes' | 'timeline' | 'buckets' | 'pomodoro' | 'settings' | 'create' | 'bucket_detail' | 'archived' | 'trash';

export interface AppState {
  notes: Note[];
  buckets: Bucket[];
  activeView: ViewType;
  selectedNoteId?: string;
  selectedBucketId?: string;
  profile: UserProfile;
}
