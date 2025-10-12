export enum Role {
  Admin = 'Admin',
  DepartmentHead = 'Lãnh đạo phòng',
  ProjectManager = 'Cán bộ quản lý dự án',
  LeadSupervisor = 'Giám sát trưởng',
}

export interface User {
  id: string;
  name: string;
  role: Role;
  username?: string;
  password?: string;
}

export interface Contact {
  name: string;
  phone: string;
}

export interface ApprovalInfo {
  decisionNumber: string;
  date: string;
}

export interface Project {
  id: string;
  name: string;
  capitalPlanApproval: ApprovalInfo;
  technicalPlanApproval: ApprovalInfo;
  budgetApproval: ApprovalInfo;
  constructionStartDate: string;
  plannedAcceptanceDate: string;
  designUnit: Contact;
  constructionUnit: Contact;
  supervisionUnit: Contact;
  projectManagerIds: string[];
  leadSupervisorIds: string[];
}

export interface DailyReport {
  id: string;
  projectId: string;
  date: string;
  tasks: string;
  images: string[];
  submittedBy: string; // User name
}
