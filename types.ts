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
  name: string;
  phone: string;
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
}

export interface DailyReport {
  id: string;
  projectId: string;
  date: string; // Format: DD/MM/YYYY
  tasks: string;
  images: string[]; // base64 data URLs
  submittedBy: string;
}
