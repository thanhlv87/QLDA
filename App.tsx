import React, { useState, useMemo } from 'react';
import type { User, Project, DailyReport } from './types';
import { Role } from './types';
import Header from './components/Header';
import ProjectCard from './components/ProjectCard';
import ProjectDetails from './components/ProjectDetails';
import AddUserForm from './components/AddUserForm';
import EditUserForm from './components/EditUserForm';
import UserList from './components/UserList';

// --- MOCK DATA ---
// In a real application, this data would come from a Firebase backend.

const MOCK_USERS_DATA: User[] = [
  { id: 'user-1', name: 'Nguyễn Văn A', role: Role.Admin, username: 'admin', password: 'password' },
  { id: 'user-2', name: 'Trần Thị B', role: Role.DepartmentHead, username: 'headb', password: 'password' },
  { id: 'user-3', name: 'Lê Văn C', role: Role.ProjectManager, username: 'managerc', password: 'password' },
  { id: 'user-4', name: 'Phạm Thị D', role: Role.LeadSupervisor, username: 'supervisord', password: 'password' },
  { id: 'user-5', name: 'Võ Văn E', role: Role.LeadSupervisor, username: 'supervisore', password: 'password' },
  { id: 'user-6', name: 'Đặng Thị F', role: Role.ProjectManager, username: 'managerf', password: 'password' },
];

const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-hg',
    name: '2025-SCL-Kiến trúc Hà Giang',
    capitalPlanApproval: { decisionNumber: '12/QĐ-BQP', date: '10/01/2025' },
    technicalPlanApproval: { decisionNumber: '34/QĐ-TCT', date: '20/01/2025' },
    budgetApproval: { decisionNumber: '56/QĐ-TCT', date: '01/02/2025' },
    constructionStartDate: '15/02/2025',
    plannedAcceptanceDate: '15/08/2025',
    designUnit: { name: 'Công ty TK Xây Dựng ABC', phone: '0901234567' },
    constructionUnit: { name: 'Công ty XD Thăng Long', phone: '0912345678' },
    supervisionUnit: { name: 'Công ty GS Chất Lượng XYZ', phone: '0987654321' },
    projectManagerIds: ['user-3'],
    leadSupervisorIds: ['user-4'],
  },
  {
    id: 'proj-tn',
    name: '2025-SCL-Kiến trúc Thái Nguyên',
    capitalPlanApproval: { decisionNumber: '15/QĐ-BQP', date: '15/01/2025' },
    technicalPlanApproval: { decisionNumber: '40/QĐ-TCT', date: '25/01/2025' },
    budgetApproval: { decisionNumber: '61/QĐ-TCT', date: '05/02/2025' },
    constructionStartDate: '20/02/2025',
    plannedAcceptanceDate: '20/09/2025',
    designUnit: { name: 'Viện Thiết Kế An Toàn', phone: '0901122334' },
    constructionUnit: { name: 'Công ty PCCC Số 1', phone: '0913344556' },
    supervisionUnit: { name: 'Đơn vị Giám Sát PCCC', phone: '0988899900' },
    projectManagerIds: ['user-6'],
    leadSupervisorIds: ['user-5'],
  },
  {
    id: 'proj-th',
    name: '2025-SCL-Kiến trúc Thanh Hóa',
    capitalPlanApproval: { decisionNumber: '21/QĐ-BQP', date: '01/02/2025' },
    technicalPlanApproval: { decisionNumber: '55/QĐ-TCT', date: '10/02/2025' },
    budgetApproval: { decisionNumber: '78/QĐ-TCT', date: '20/02/2025' },
    constructionStartDate: '01/03/2025',
    plannedAcceptanceDate: '30/10/2025',
    designUnit: { name: 'Công ty Cảnh Quan Xanh', phone: '0905556677' },
    constructionUnit: { name: 'Công ty Thi Công Vườn Đẹp', phone: '0915554433' },
    supervisionUnit: { name: 'Đơn vị Giám Sát Cây Xanh', phone: '0986667788' },
    projectManagerIds: ['user-3'],
    leadSupervisorIds: ['user-5'],
  },
  {
    id: 'proj-nd',
    name: '2025-SCL-Kiến trúc Nam Định',
    capitalPlanApproval: { decisionNumber: '25/QĐ-BQP', date: '10/02/2025' },
    technicalPlanApproval: { decisionNumber: '60/QĐ-TCT', date: '20/02/2025' },
    budgetApproval: { decisionNumber: '82/QĐ-TCT', date: '01/03/2025' },
    constructionStartDate: '15/03/2025',
    plannedAcceptanceDate: '15/11/2025',
    designUnit: { name: 'Công ty TK Xây Dựng ABC', phone: '0901234567' },
    constructionUnit: { name: 'Công ty XD Thăng Long', phone: '0912345678' },
    supervisionUnit: { name: 'Đơn vị Giám Sát PCCC', phone: '0988899900' },
    projectManagerIds: ['user-6'],
    leadSupervisorIds: ['user-4'],
  },
  {
    id: 'proj-db',
    name: '2025-SCL-Kiến trúc Điện Biên',
    capitalPlanApproval: { decisionNumber: '33/QĐ-BQP', date: '05/03/2025' },
    technicalPlanApproval: { decisionNumber: '71/QĐ-TCT', date: '15/03/2025' },
    budgetApproval: { decisionNumber: '99/QĐ-TCT', date: '25/03/2025' },
    constructionStartDate: '01/04/2025',
    plannedAcceptanceDate: '01/12/2025',
    designUnit: { name: 'Viện Thiết Kế An Toàn', phone: '0901122334' },
    constructionUnit: { name: 'Công ty Thi Công Vườn Đẹp', phone: '0915554433' },
    supervisionUnit: { name: 'Công ty GS Chất Lượng XYZ', phone: '0987654321' },
    projectManagerIds: ['user-3', 'user-6'],
    leadSupervisorIds: ['user-5'],
  },
  {
    id: 'proj-npsc',
    name: '2025-SCL-Kiến trúc tòa nhà NPSC',
    capitalPlanApproval: { decisionNumber: '45/QĐ-BQP', date: '20/03/2025' },
    technicalPlanApproval: { decisionNumber: '88/QĐ-TCT', date: '01/04/2025' },
    budgetApproval: { decisionNumber: '112/QĐ-TCT', date: '10/04/2025' },
    constructionStartDate: '20/04/2025',
    plannedAcceptanceDate: '20/12/2025',
    designUnit: { name: 'Công ty Cảnh Quan Xanh', phone: '0905556677' },
    constructionUnit: { name: 'Công ty PCCC Số 1', phone: '0913344556' },
    supervisionUnit: { name: 'Đơn vị Giám Sát Cây Xanh', phone: '0986667788' },
    projectManagerIds: ['user-3'],
    leadSupervisorIds: ['user-4', 'user-5'],
  },
];

const MOCK_REPORTS: DailyReport[] = [];

interface NewUserData extends Omit<User, 'id'> {
  selectedProjectIds: string[];
}

interface UpdateUserData {
    userId: string;
    name: string;
    role: Role;
    username: string;
    selectedProjectIds: string[];
}


const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS_DATA);
  const [currentUser, setCurrentUser] = useState<User>(users[0]); // Default to Admin
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [reports, setReports] = useState<DailyReport[]>(MOCK_REPORTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isAddingUser, setIsAddingUser] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const visibleProjects = useMemo(() => {
    if (!currentUser) return [];
    switch (currentUser.role) {
      case Role.Admin:
      case Role.DepartmentHead:
        return projects;
      case Role.ProjectManager:
        return projects.filter(p => p.projectManagerIds.includes(currentUser.id));
      case Role.LeadSupervisor:
        return projects.filter(p => p.leadSupervisorIds.includes(currentUser.id));
      default:
        return [];
    }
  }, [currentUser, projects]);
  
  const isStaffManagementVisible = useMemo(() => {
    if (!currentUser) return false;
    return [Role.Admin, Role.DepartmentHead].includes(currentUser.role);
  }, [currentUser]);

  const manageableUsers = useMemo(() => {
    return users.filter(u => u.role === Role.ProjectManager || u.role === Role.LeadSupervisor);
  }, [users]);


  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
  };
  
  const handleBackToDashboard = () => {
    setSelectedProjectId(null);
  };

  const handleAddReport = (report: Omit<DailyReport, 'id'>) => {
    const newReport: DailyReport = {
        ...report,
        id: `rep-${Date.now()}`
    };
    setReports(prevReports => [newReport, ...prevReports]);
  };

  const handleAddNewUser = (userData: NewUserData) => {
    const { selectedProjectIds, ...user } = userData;
    const newUser: User = {
      ...user,
      id: `user-${Date.now()}`,
    };
    
    setUsers(prevUsers => [...prevUsers, newUser]);

    setProjects(prevProjects => {
        return prevProjects.map(project => {
            if (selectedProjectIds.includes(project.id)) {
                if (newUser.role === Role.ProjectManager) {
                    return { ...project, projectManagerIds: [...project.projectManagerIds, newUser.id] };
                }
                if (newUser.role === Role.LeadSupervisor) {
                    return { ...project, leadSupervisorIds: [...project.leadSupervisorIds, newUser.id] };
                }
            }
            return project;
        });
    });

    setIsAddingUser(false);
  };
  
  const handleUpdateUser = (updatedData: UpdateUserData) => {
    // 1. Update user info in the main users list
    setUsers(prevUsers =>
      prevUsers.map(u =>
        u.id === updatedData.userId ? { ...u, name: updatedData.name, role: updatedData.role, username: updatedData.username } : u
      )
    );

    // 2. Update project assignments across all projects
    setProjects(prevProjects => {
      return prevProjects.map(project => {
        // Remove the user from both potential assignment lists first
        let newProjectManagerIds = project.projectManagerIds.filter(id => id !== updatedData.userId);
        let newLeadSupervisorIds = project.leadSupervisorIds.filter(id => id !== updatedData.userId);

        // If this project is in the user's new assignment list, add them back to the correct role list
        if (updatedData.selectedProjectIds.includes(project.id)) {
          if (updatedData.role === Role.ProjectManager) {
            newProjectManagerIds.push(updatedData.userId);
          } else if (updatedData.role === Role.LeadSupervisor) {
            newLeadSupervisorIds.push(updatedData.userId);
          }
        }
        return { ...project, projectManagerIds: newProjectManagerIds, leadSupervisorIds: newLeadSupervisorIds };
      });
    });

    setEditingUser(null); // Close the form
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(prevProjects =>
      prevProjects.map(p => (p.id === updatedProject.id ? updatedProject : p))
    );
  };

  const handleSetCurrentUser = (user: User) => {
    setCurrentUser(user);
    // Close any open forms when switching users
    setIsAddingUser(false);
    setEditingUser(null);
  }

  const handleStartEdit = (user: User) => {
    setIsAddingUser(false); // Make sure add form is closed
    setEditingUser(user);
  }

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedProjectReports = reports
    .filter(r => r.projectId === selectedProjectId)
    .sort((a, b) => new Date(b.date.split('/').reverse().join('-')).getTime() - new Date(a.date.split('/').reverse().join('-')).getTime());

  return (
    <div className="min-h-screen bg-neutral">
      <Header currentUser={currentUser} setCurrentUser={handleSetCurrentUser} users={users} />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {!selectedProject ? (
            <div>
                 {isStaffManagementVisible && (
                    <div className="mb-8 p-6 bg-base-100 rounded-lg shadow-md border border-gray-200">
                        <div className="flex justify-between items-center">
                             <h3 className="text-2xl font-bold text-gray-800">Quản lý Nhân sự</h3>
                             <button 
                                onClick={() => { setIsAddingUser(true); setEditingUser(null); }}
                                disabled={isAddingUser || !!editingUser}
                                className="bg-accent text-white font-bold py-2 px-4 rounded-md hover:opacity-90 transition-opacity disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                + Thêm Nhân sự
                            </button>
                        </div>
                        
                        {isAddingUser && (
                            <AddUserForm 
                                onAddUser={handleAddNewUser} 
                                onCancel={() => setIsAddingUser(false)}
                                projects={projects}
                            />
                        )}

                        {editingUser && (
                            <EditUserForm 
                                user={editingUser}
                                projects={projects}
                                onUpdateUser={handleUpdateUser}
                                onCancel={() => setEditingUser(null)}
                            />
                        )}

                        {!isAddingUser && !editingUser && (
                           <UserList users={manageableUsers} onEditUser={handleStartEdit} />
                        )}
                    </div>
                 )}

                 <h2 className="text-3xl font-bold text-gray-800 mb-6">Danh sách dự án</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {visibleProjects.map(project => (
                        <ProjectCard key={project.id} project={project} onSelectProject={handleSelectProject} />
                    ))}
                 </div>
            </div>
        ) : (
            <ProjectDetails 
                project={selectedProject} 
                reports={selectedProjectReports}
                currentUser={currentUser}
                users={users}
                onBack={handleBackToDashboard}
                onAddReport={handleAddReport}
                onUpdateProject={handleUpdateProject}
            />
        )}
      </main>
    </div>
  );
};

export default App;