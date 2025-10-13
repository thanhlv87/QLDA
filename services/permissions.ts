import type { User, Project } from '../types';
import { Role } from '../types';

// A central object to hold all permission-related logic.
export const permissions = {
  /**
   * Checks if a user has permission to manage users (view list, edit, delete).
   * This controls the visibility of the User Management button and feature access.
   */
  canManageUsers(user: User | null): boolean {
    if (!user) return false;
    // Only Admin can manage users.
    return user.role === Role.Admin;
  },

  /**
   * Checks if a user has the permission to fetch from the 'users' collection.
   * Due to Firestore rules, this is restricted to Admin to prevent permission errors.
   */
  canFetchAllUsers(user: User | null): boolean {
    if (!user) return false;
    // Only Admin can read from the users collection.
    return user.role === Role.Admin;
  },

  /**
   * Checks if a user can add a new project.
   */
  canAddProject(user: User | null): boolean {
    if (!user) return false;
    // Admin and Department Head can add new projects.
    return [Role.Admin, Role.DepartmentHead].includes(user.role);
  },

  /**
   * Checks if a user can edit a specific project's details.
   */
  canEditProject(user: User | null, project: Project): boolean {
    if (!user) return false;
    return (
      user.role === Role.Admin ||
      (user.role === Role.ProjectManager && project.projectManagerIds.includes(user.id))
    );
  },

  /**
   * Checks if a user can edit the personnel assignments for a project.
   */
  canEditPersonnel(user: User | null): boolean {
    if (!user) return false;
    // Only Admin and DepartmentHead can edit personnel assignments.
    return [Role.Admin, Role.DepartmentHead].includes(user.role);
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
  },
  
  /**
   * Checks if a user can edit a daily report for a specific project.
   */
  canEditReport(user: User | null, project: Project): boolean {
    if (!user) return false;
    // Admin and assigned LeadSupervisors can edit reports.
    return (
        user.role === Role.Admin ||
        (user.role === Role.LeadSupervisor && project.leadSupervisorIds.includes(user.id))
    );
  },
  
  /**
   * Checks if a user can review/comment on a report.
   * This is restricted to Project Managers assigned to the project.
   */
  canReviewReport(user: User | null, project: Project): boolean {
    if (!user) return false;
    // Only assigned Project Managers can review reports.
    return user.role === Role.ProjectManager && project.projectManagerIds.includes(user.id);
  },

  /**
   * Checks if a user can delete a daily report for a specific project.
   */
  canDeleteReport(user: User | null, project: Project): boolean {
    if (!user) return false;
    // FIX: The "Missing or insufficient permissions" error indicates that server-side rules
    // likely only permit Admins to delete reports. This change aligns the client-side check
    // with the inferred server-side reality to resolve the error.
    return user.role === Role.Admin;
  },

  /**
   * Checks if a user can delete a project. Only Admin can.
   */
  canDeleteProject(user: User | null): boolean {
    if (!user) return false;
    return user.role === Role.Admin;
  },

  /**
   * Checks if a user can delete another user. Only Admin can.
   */
  canDeleteUser(user: User | null): boolean {
    if (!user) return false;
    return user.role === Role.Admin;
  },
};