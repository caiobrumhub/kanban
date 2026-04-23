export interface User {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isActive?: boolean;
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

export interface Card {
  id: number;
  title: string;
  description?: string;
  priority: Priority;
  order: number;
  columnId: number;
  labels: Label[];
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
  userId: number;
  columns: Column[];
  _count?: { columns: number };
  createdAt: string;
  updatedAt: string;
}
