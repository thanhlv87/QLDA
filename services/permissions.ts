import type { User, Project } from '../types.ts';

// A central object to hold all permission-related logic.
// This version uses robust, case-insensitive, trimmed string comparisons
// to definitively resolve recurring permission issues.
export const permissions = {
  /**
   * Checks if a user can manage users (view list, edit, delete).
   */
  canManageUsers(user: User | null): boolean {
    if (!user || typeof user.role !== 'string') return false;
    return user.role.trim().toLowerCase() === 'admin';
  },

  /**
   * Checks if a user has permission to fetch all users from the 'users' collection.
   */
  canFetchAllUsers(user: User | null): boolean {
    if (!user || typeof user.role !== 'string') return false;
    return user.role.trim().toLowerCase() === 'admin';
  },

  /**
   * Checks if a user can add a new project.
   */
  canAddProject(user: User | null): boolean {
    if (!user || typeof user.role !== 'string') return false;
    const userRole = user.role.trim().toLowerCase();
    return ['admin', 'departmenthead'].includes(userRole);
  },

  /**
   * Checks if a user can edit a specific project's details.
   */
  canEditProject(user: User | null, project: Project): boolean {
    if (!user || typeof user.role !== 'string') return false;
    const userRole = user.role.trim().toLowerCase();
    return (
      userRole === 'admin' ||
      (userRole === 'projectmanager' && project.projectManagerIds.includes(user.id))
    );
  },

  /**
   * Checks if a user can edit the personnel assignments for a project.
   */
  canEditPersonnel(user: User | null): boolean {
    if (!user || typeof user.role !== 'string') return false;
    const userRole = user.role.trim().toLowerCase();
    return ['admin', 'departmenthead'].includes(userRole);
  },

  /**
   * Checks if a user can add a daily report to a specific project.
   */
  canAddReport(user: User | null, project: Project): boolean {
    if (!user || typeof user.role !== 'string') return false;
    const userRole = user.role.trim().toLowerCase();
    return (
      (userRole === 'projectmanager' && project.projectManagerIds.includes(user.id)) ||
      (userRole === 'leadsupervisor' && project.leadSupervisorIds.includes(user.id))
    );
  },
  
  /**
   * Checks if a user can edit a daily report.
   * Adheres to the server-side rule that only Admins can edit existing reports.
   */
  canEditReport(user: User | null, project: Project): boolean {
    if (!user || typeof user.role !== 'string') return false;
    return user.role.trim().toLowerCase() === 'admin';
  },
  
  /**
   * Checks if a user can view the Approvals tab.
   */
  canViewApprovalsTab(user: User | null): boolean {
    if (!user || typeof user.role !== 'string') return false;
    const userRole = user.role.trim().toLowerCase();
    return ['admin', 'departmenthead', 'projectmanager'].includes(userRole);
  },
  
  /**
   * Checks if a user can use the AI summary feature.
   */
  canUseAiSummary(user: User | null): boolean {
    if (!user || typeof user.role !== 'string') return false;
    const userRole = user.role.trim().toLowerCase();
    return ['admin', 'departmenthead'].includes(userRole);
  },

  /**
   * Checks if a user can review/comment on a report.
   * Department Heads can review any report for oversight.
   * Project Managers can review reports for projects they are assigned to.
   */
  canReviewReport(user: User | null, project: Project): boolean {
    if (!user || typeof user.role !== 'string') return false;
    const userRole = user.role.trim().toLowerCase();
    // Department Heads have global review permissions
    if (userRole === 'departmenthead') {
      return true;
    }
    // Project Managers can only review reports on their assigned projects
    return userRole === 'projectmanager' && project.projectManagerIds.includes(user.id);
  },

  /**
   * Checks if a user can delete a daily report.
   * Adheres to the server-side rule that only Admins can delete existing reports.
   */
  canDeleteReport(user: User | null, project: Project): boolean {
    if (!user || typeof user.role !== 'string') return false;
    return user.role.trim().toLowerCase() === 'admin';
  },

  /**
   * Checks if a user can delete a project.
   */
  canDeleteProject(user: User | null): boolean {
    if (!user || typeof user.role !== 'string') return false;
    return user.role.trim().toLowerCase() === 'admin';
  },

  /**
   * Checks if a user can delete another user.
   */
  canDeleteUser(user: User | null): boolean {
    if (!user || typeof user.role !== 'string') return false;
    return user.role.trim().toLowerCase() === 'admin';
  },
};