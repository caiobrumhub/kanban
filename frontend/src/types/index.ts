export interface User {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isActive?: boolean;
  lastLogin?: string;
  shareCode?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Label {
  id: number;
  name: string;
  color: string;
  cardId: number;
}

export interface ChecklistItem {
  id: number;
  text: string;
  isCompleted: boolean;
  isMandatory: boolean;
  checklistId: number;
}

export interface Checklist {
  id: number;
  title: string;
  cardId: number;
  items: ChecklistItem[];
}

export interface Card {
  id: number;
  title: string;
  description?: string;
  priority: Priority;
  order: number;
  isDone: boolean;
  columnId: number;
  clientId?: number;
  client?: Pick<Client, 'id' | 'name'>;
  labels: Label[];
  checklists?: Checklist[];
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: number;
  title: string;
  order: number;
  boardId: number;
  cards: Card[];
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  id: number;
  title: string;
  color?: string;
  icon?: string;
  userId: number;
  user?: Pick<User, 'id' | 'name' | 'email'>;
  columns: Column[];
  _count?: { columns: number };
  sharedWith?: { userId: number; user: Pick<User, 'id' | 'name' | 'email'> }[];
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: number;
  name: string;
  document?: string;
  stateRegistration?: string;
  email?: string;
  phone?: string;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: Pick<User, 'id' | 'name' | 'email'>;
  updatedBy?: Pick<User, 'id' | 'name' | 'email'>;
}
