export enum Role {
  Admin = 'Admin',
  DepartmentHead = 'DepartmentHead',
  ProjectManager = 'ProjectManager',
  LeadSupervisor = 'LeadSupervisor',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface Approval {
  decisionNumber: string;
  date: string; // Format: DD/MM/YYYY
}

export interface ContactUnit {
  companyName: string;
  personnelName: string;
  phone: string;
}

export interface ProjectManagementContact {
  departmentName: string;
  personnelName: string;
  phone: string;
}

export interface SupervisorAContact {
  enterpriseName: string;
  personnelName: string;
  phone: string;
}

export interface ProjectReview {
  comment: string;
  reviewedById: string; // User ID of the reviewer
  reviewedByName: string; // Denormalized user name to avoid permission issues
  reviewedAt: string; // ISO 8601 timestamp
}

export interface Project {
  id: string;
  name: string;
  projectManagerIds: string[];
  leadSupervisorIds: string[];
  constructionStartDate: string; // Format: DD/MM/YYYY
  plannedAcceptanceDate: string; // Format: DD/MM/YYYY
  capitalPlanApproval: Approval;
  technicalPlanApproval: Approval;
  budgetApproval: Approval;
  designUnit: ContactUnit;
  constructionUnit: ContactUnit;
  supervisionUnit: ContactUnit;
  projectManagementUnit: ProjectManagementContact;
  supervisorA: SupervisorAContact;
  reviews?: Record<string, ProjectReview>; // Map of reportId to review data
  scheduleSheetUrl?: string; // URL for embedding Google Sheet schedule
  scheduleSheetEditUrl?: string; // URL for editing the Google Sheet
}

export interface DailyReport {
  id: string;
  projectId: string;
  date: string; // Format: DD/MM/YYYY
  tasks: string;
  images: string[]; // base64 data URLs
  submittedBy: string;
}