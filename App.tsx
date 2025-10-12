import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  collection,
  query,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  orderBy,
  where,
  Query,
  DocumentData,
} from 'firebase/firestore';
import { auth, db } from './services/firebase';
import { permissions } from './services/permissions';
import type { User, Project, DailyReport } from './types';
import { Role } from './types';
import Login from './components/Login';
import Header from './components/Header';
import ProjectCard from './components/ProjectCard';
import ProjectDetails from './components/ProjectDetails';
import UserList from './components/UserList';
import EditUserForm from './components/EditUserForm';
import AddProjectForm from './components/AddProjectForm';

const App: React.FC = () => {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Data state
  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // UI state
  type View = 'dashboard' | 'projectDetails' | 'userManagement' | 'addProject';
  const [view, setView] = useState<View>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const parseDate = (dateStr: string): number => {
    if (!dateStr || typeof dateStr !== 'string') return 0;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return 0;
    const [day, month, year] = parts.map(Number);
    // Handle potential NaN from map
    if (isNaN(day) || isNaN(month) || isNaN(year)) return 0;
    return new Date(year, month - 1, day).getTime();
  };

  // Auth effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setCurrentUser({ id: userDocSnap.id, ...userDocSnap.data() } as User);
          } else {
            console.error("User document not found in Firestore.");
            setCurrentUser(null);
            await signOut(auth);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setCurrentUser(null);
          await signOut(auth);
        }
      } else {
        setCurrentUser(null);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Main data fetching effect, now role-aware
  useEffect(() => {
    if (!currentUser) {
      setProjects([]);
      setReports([]);
      setUsers([]);
      if(isDataLoading) setIsDataLoading(false);
      return;
    }

    setIsDataLoading(true);

    // 1. Determine the correct projects query based on user role
    let projectsQuery: Query<DocumentData>;
    if (currentUser.role === Role.LeadSupervisor) {
        projectsQuery = query(collection(db, 'projects'), where('leadSupervisorIds', 'array-contains', currentUser.id));
    } else if (currentUser.role === Role.ProjectManager) {
        projectsQuery = query(collection(db, 'projects'), where('projectManagerIds', 'array-contains', currentUser.id));
    } else {
        // Admins, DeptHeads see all projects
        projectsQuery = query(collection(db, 'projects'));
    }

    // 2. Set up the projects listener
    const unsubProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      projectsData.sort((a, b) => parseDate(b.constructionStartDate) - parseDate(a.constructionStartDate));
      setProjects(projectsData);
      setIsDataLoading(false);

      // 3. Once projects are fetched, set up the reports listener based on the visible projects
      const projectIds = projectsData.map(p => p.id);
      if (projectIds.length > 0) {
        const reportsQuery = query(collection(db, 'reports'), where('projectId', 'in', projectIds));
        const unsubReports = onSnapshot(reportsQuery, (reportSnapshot) => {
          const reportsData = reportSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyReport));
          reportsData.sort((a, b) => parseDate(b.date) - parseDate(a.date));
          setReports(reportsData);
        }, (error) => console.error("Error fetching reports:", error));
        
        return () => unsubReports(); // Cleanup reports listener when projects change
      } else {
        setReports([]); // No projects, so no reports
      }
    }, (error) => {
        console.error("Error fetching projects:", error);
        setIsDataLoading(false);
    });

    // 4. Set up a separate, conditional listener for the users list
    let unsubUsers = () => {};
    if (permissions.canFetchAllUsers(currentUser)) {
       unsubUsers = onSnapshot(query(collection(db, 'users'), orderBy('name')), (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(usersData);
      }, (error) => {
          console.error("Error fetching users:", error);
      });
    } else {
      setUsers([]); // Clear user list for roles without permission
    }
    

    return () => {
      unsubProjects();
      unsubUsers();
      // The reports listener is cleaned up inside the projects listener
    };
  }, [currentUser]);


  // Handlers
  const handleLogin = async (email: string, password: string) => {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setAuthError('Email hoặc mật khẩu không chính xác.');
      } else {
        setAuthError('Đã xảy ra lỗi khi đăng nhập.');
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setView('dashboard');
    setSelectedProjectId(null);
  };
  
  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setView('projectDetails');
  };
  
  const handleAddReport = async (report: Omit<DailyReport, 'id'>) => {
    try {
        await addDoc(collection(db, 'reports'), report);
        alert('Báo cáo đã được thêm thành công!');
    } catch (error) {
        console.error("Error adding report: ", error);
        alert('Đã xảy ra lỗi khi thêm báo cáo.');
    }
  };

  const handleUpdateProject = async (project: Project) => {
      try {
          const projectRef = doc(db, 'projects', project.id);
          const { id, ...projectData } = project;
          await updateDoc(projectRef, projectData);
          alert('Dự án đã được cập nhật thành công!');
          // No need to change view, it should stay on details
      } catch (error) {
          console.error("Error updating project: ", error);
          alert('Đã xảy ra lỗi khi cập nhật dự án.');
      }
  };
  
  const handleAddProject = async (project: Omit<Project, 'id'>) => {
      try {
        await addDoc(collection(db, 'projects'), project);
        alert('Dự án đã được tạo thành công!');
        setView('dashboard');
      } catch (error) {
        console.error("Error adding project: ", error);
        alert('Đã xảy ra lỗi khi tạo dự án.');
      }
  };

  const handleUpdateUser = async (user: User) => {
      try {
          const userRef = doc(db, 'users', user.id);
          const { id, ...userData } = user;
          await updateDoc(userRef, userData);
          alert('Người dùng đã được cập nhật!');
          setEditingUser(null);
      } catch (error) {
          console.error("Error updating user: ", error);
          alert('Đã xảy ra lỗi khi cập nhật người dùng.');
      }
  };

  // The displayedProjects logic can now be simplified as the fetching logic already filters the data.
  const displayedProjects = projects;

  const selectedProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId);
  }, [selectedProjectId, projects]);

  const reportsForSelectedProject = useMemo(() => {
    return reports.filter(r => r.projectId === selectedProjectId);
  }, [selectedProjectId, reports]);

  // Render logic
  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-base-200">Đang tải ứng dụng...</div>;
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} error={authError} />;
  }

  const canViewAdminButtons = permissions.canViewDashboardAdminButtons(currentUser);

  const renderContent = () => {
    if (isDataLoading && view === 'dashboard') {
        return <p>Đang tải dự án...</p>;
    }

    switch (view) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-fade-in">
             <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-800">Danh sách Dự án</h1>
                {canViewAdminButtons && (
                  <div className="flex flex-wrap gap-2 sm:gap-4">
                     <button 
                        onClick={() => setView('userManagement')}
                        className="bg-accent text-white font-bold py-2 px-4 rounded-md hover:opacity-90 transition-opacity"
                    >
                        Quản lý Người dùng
                    </button>
                    <button 
                        onClick={() => setView('addProject')}
                        className="bg-primary text-white font-bold py-2 px-4 rounded-md hover:opacity-90 transition-opacity"
                    >
                        Thêm Dự án
                    </button>
                  </div>
                )}
            </div>
            {displayedProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayedProjects.map(project => (
                  <ProjectCard key={project.id} project={project} onSelectProject={handleSelectProject} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 mt-4">Không có dự án nào được tìm thấy.</p>
            )}
          </div>
        );

      case 'projectDetails':
        if (selectedProject) {
            return (
              <ProjectDetails
                project={selectedProject}
                reports={reportsForSelectedProject}
                currentUser={currentUser}
                users={users}
                onBack={() => { setView('dashboard'); setSelectedProjectId(null); }}
                onAddReport={handleAddReport}
                onUpdateProject={handleUpdateProject}
              />
            );
        }
        // Fallback if project is not found
        setView('dashboard');
        return null;
      
      case 'addProject':
        return (
            <AddProjectForm 
                onAddProject={handleAddProject}
                onCancel={() => setView('dashboard')}
                users={users}
            />
        );

      case 'userManagement':
        return (
          <div className="animate-fade-in max-w-4xl mx-auto">
              <button 
                onClick={() => setView('dashboard')}
                className="text-secondary hover:text-accent font-semibold mb-6 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                  Trở về Dashboard
              </button>
              {editingUser ? (
                  <EditUserForm 
                    user={editingUser}
                    onUpdateUser={handleUpdateUser}
                    onCancel={() => setEditingUser(null)}
                  />
              ) : (
                  <UserList users={users} onEditUser={setEditingUser} />
              )}
          </div>
        );
      
      default:
        return <p>Lỗi: Chế độ xem không hợp lệ.</p>;
    }
  };

  return (
    <div className="min-h-screen bg-base-200 font-sans">
      <Header user={currentUser} onLogout={handleLogout} />
      <main className="p-4 sm:p-6 lg:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;