import type { User, Project } from '../types';
import { Role } from '../types';

// A central object to hold all permission-related logic.
export const permissions = {
  /**
   * Checks if a user can see the high-level admin buttons on the dashboard
   * (e.g., User Management, Add Project).
   */
  canViewDashboardAdminButtons(user: User | null): boolean {
    if (!user) return false;
    return [Role.Admin, Role.DepartmentHead].includes(user.role);
  },

  /**
   * Checks if a user has the permission to fetch the complete list of all users.
   */
  canFetchAllUsers(user: User | null): boolean {
      if (!user) return false;
      // In the current setup, only Admins and Dept Heads need the full list for user management and project assignment.
      return [Role.Admin, Role.DepartmentHead].includes(user.role);
  },

  /**
   * Checks if a user can edit a specific project's details.
   */
  canEditProject(user: User | null, project: Project): boolean {
    if (!user) return false;
    return (
      user.role === Role.Admin ||
      user.role === Role.DepartmentHead ||
      (user.role === Role.ProjectManager && project.projectManagerIds.includes(user.id))
    );
  },

  /**
   * Checks if a user can add a daily report to a specific project.
   */
  canAddReport(user: User | null, project: Project): boolean {
    if (!user) return false;
    return (
      (user.role === Role.ProjectManager && project.projectManagerIds.includes(user.id)) ||
      (user.role === Role.LeadSupervisor && project.leadSupervisorIds.includes(user.id))
    );
  }
};
