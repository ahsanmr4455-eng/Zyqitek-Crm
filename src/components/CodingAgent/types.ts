export interface VirtualFile {
  path: string;
  content: string;
  language: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  techStack: string;
  files: VirtualFile[];
  createdAt: string;
}

export interface Brain {
  id: 'atlas' | 'forge' | 'nova';
  name: string;
  role: string;
  description: string;
  strength: string;
  features: string[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  techStack: string;
  files: VirtualFile[];
}

export interface RoadmapItem {
  id: string;
  task: string;
  status: 'pending' | 'completed';
  estimatedMinutes: number;
}

export interface ArchitectureNote {
  title: string;
  content: string;
}

export interface ProjectMemory {
  projectStructure: string;
  previousDecisions: string[];
  codingStandards: string;
  architectureNotes: ArchitectureNote[];
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  message: string;
}

export interface BackupVersion {
  id: string;
  timestamp: string;
  description: string;
  filesSnapshot: VirtualFile[];
}

export interface ProposedRevision {
  path: string;
  content: string;
  description: string;
}
