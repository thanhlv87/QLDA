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
   * Checks if a user can add a new project.
   */
  canAddProject(user: User | null): boolean {
    if (!user) return false;
    // Admin and Department Head can add new projects.
    return [Role.Admin, Role.DepartmentHead].includes(user.role);
  },

  /**
   * Checks if a user has the permission to fetch the complete list of all users.
   * This is tied to user management permissions.
   */
  canFetchAllUsers(user: User | null): boolean {
      if (!user) return false;
      // Only users who can manage users should fetch the full list.
      return this.canManageUsers(user);
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
  }
};