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
  role: Role | null;
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

export interface ApprovalStage {
  submissionDate: string; // Ngày nộp
  approvalDate: string;   // Ngày duyệt
}

export interface BiddingPackage {
  itbIssuanceDate: string;  // Ngày phát hành HSMT
  contractSignDate: string; // Ngày ký hợp đồng
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
  projectManagementUnits?: ProjectManagementContact[];
  supervisorA: SupervisorAContact;
  reviews?: Record<string, ProjectReview>; // Map of reportId to review data
  scheduleSheetUrl?: string; // URL for embedding Google Sheet schedule
  scheduleSheetEditUrl?: string; // URL for editing the Google Sheet

  // NEW DETAILED DATE FIELDS - All optional for backward compatibility
  portfolioAssignmentDate?: string;     // Giao danh mục
  technicalPlanStage?: ApprovalStage;   // Phê duyệt Phương án kỹ thuật
  budgetStage?: ApprovalStage;          // Phê duyệt Dự toán
  designBidding?: BiddingPackage;       // Gói thầu: Tư vấn thiết kế
  supervisionBidding?: BiddingPackage;  // Gói thầu: Giám sát thi công
  constructionBidding?: BiddingPackage; // Gói thầu: Thi công sửa chữa
  finalSettlementStage?: ApprovalStage; // Phê duyệt Quyết toán
}

export interface DailyReport {
  id: string;
  projectId: string;
  date: string; // Format: DD/MM/YYYY
  tasks: string;
  images: string[]; // base64 data URLs
  submittedBy: string;
}