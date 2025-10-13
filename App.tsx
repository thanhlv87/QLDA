
import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { auth, db } from './services/firebase';
import type { User, Project, DailyReport } from './types';
import { permissions } from './services/permissions';

// Components
import Login from './components/Login';
import Header from './components/Header';
import ProjectCard from './components/ProjectCard';
import ProjectDetails from './components/ProjectDetails';
import AddProjectForm from './components/AddProjectForm';
import UserManagement from './components/UserManagement';
import ConfirmationModal from './components/ConfirmationModal';

type AppView = 'dashboard' | 'projectDetails' | 'addProject' | 'userManagement';

const App: React.FC = () => {
    // Authentication state
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);

    // Data state
    const [projects, setProjects] = useState<Project[]>([]);
    const [reports, setReports] = useState<DailyReport[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    // UI/Navigation state
    const [view, setView] = useState<AppView>('dashboard');
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);

    // Effect for handling auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setFirebaseUser(user);
            if (!user) {
                setCurrentUser(null);
                setIsLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // Effect for fetching user profile once authenticated
    useEffect(() => {
        if (!firebaseUser) return;

        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribe = onSnapshot(userDocRef, (userDoc) => {
            if (userDoc.exists()) {
                const userData = { id: userDoc.id, ...userDoc.data() } as User;
                setCurrentUser(userData);
            } else {
                console.error("User document not found in Firestore!");
                signOut(auth); // Log out if profile doesn't exist
            }
        }, (error) => {
            console.error("Error fetching user data:", error);
            setAuthError("Failed to load user profile.");
            signOut(auth);
        });

        return () => unsubscribe();
    }, [firebaseUser]);

    // Effect for fetching data (projects, reports, users) based on current user
    useEffect(() => {
        if (!currentUser) {
            setProjects([]);
            setReports([]);
            setUsers([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        // Fetch projects with real-time updates
        const projectsQuery = query(collection(db, 'projects'), orderBy('name'));
        const projectsUnsubscribe = onSnapshot(projectsQuery, (snapshot) => {
            const allProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
            
            if (permissions.canAddProject(currentUser)) { // Admin, DeptHead see all
                setProjects(allProjects);
            } else { // Filter for assigned projects for other roles
                const visibleProjects = allProjects.filter(p => 
                    p.projectManagerIds.includes(currentUser.id) || p.leadSupervisorIds.includes(currentUser.id)
                );
                setProjects(visibleProjects);
            }
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching projects:", error);
            setIsLoading(false);
        });

        // Fetch reports with real-time updates
        const reportsQuery = query(collection(db, 'reports'), orderBy('date', 'desc'));
        const reportsUnsubscribe = onSnapshot(reportsQuery, (snapshot) => {
            const allReports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyReport));
            setReports(allReports);
        }, (error) => console.error("Error fetching reports:", error));

        // Fetch all users for name lookups and management, respecting permissions
        let usersUnsubscribe = () => {};
        if (permissions.canFetchAllUsers(currentUser)) {
            const usersQuery = query(collection(db, 'users'), orderBy('name'));
            usersUnsubscribe = onSnapshot(usersQuery, (snapshot) => {
                const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
                setUsers(allUsers);
            }, (error) => {
                console.error("Error fetching users:", error);
                setUsers([]);
            });
        } else {
            setUsers([]);
        }

        return () => {
            projectsUnsubscribe();
            reportsUnsubscribe();
            usersUnsubscribe();
        };
    }, [currentUser]);


    // Memoized derived state
    const selectedProject = useMemo(() => {
        return projects.find(p => p.id === selectedProjectId);
    }, [projects, selectedProjectId]);

    const reportsForSelectedProject = useMemo(() => {
        if (!selectedProjectId) return [];
        return reports
            .filter(r => r.projectId === selectedProjectId)
            .sort((a, b) => { // Sort by date DD/MM/YYYY descending
                const [dayA, monthA, yearA] = a.date.split('/').map(Number);
                const [dayB, monthB, yearB] = b.date.split('/').map(Number);
                return new Date(yearB, monthB - 1, dayB).getTime() - new Date(yearA, monthA - 1, dayA).getTime();
            });
    }, [reports, selectedProjectId]);

    // Auth handlers
    const handleLogin = async (email: string, password: string) => {
        setAuthError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error: any) {
            console.error(error);
            setAuthError("Email hoặc mật khẩu không đúng.");
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        setCurrentUser(null);
        setView('dashboard');
        setSelectedProjectId(null);
    };

    // Project handlers
    const handleAddProject = async (projectData: Omit<Project, 'id'>) => {
        try {
            await addDoc(collection(db, 'projects'), projectData);
            setView('dashboard');
        } catch (error) {
            console.error("Error adding project:", error);
            alert("Failed to add project. See console for details.");
        }
    };

    const handleUpdateProject = async (projectData: Project) => {
         try {
            const projectRef = doc(db, 'projects', projectData.id);
            const { id, ...dataToUpdate } = projectData;
            await updateDoc(projectRef, dataToUpdate);
        } catch (error) {
            console.error("Error updating project:", error);
            alert("Failed to update project. See console for details.");
        }
    };

    const handleDeleteProject = (projectId: string, projectName: string) => {
        setProjectToDelete({ id: projectId, name: projectName });
    };

    const confirmDeleteProject = async () => {
        if (!projectToDelete) return;
        try {
            await deleteDoc(doc(db, 'projects', projectToDelete.id));
            setProjectToDelete(null);
            if (selectedProjectId === projectToDelete.id) {
                setView('dashboard');
                setSelectedProjectId(null);
            }
        } catch (error) {
            console.error("Error deleting project:", error);
            alert("Failed to delete project. See console for details.");
            setProjectToDelete(null);
        }
    };
    
    // Report handler
    const handleAddReport = async (reportData: Omit<DailyReport, 'id'>) => {
        try {
            await addDoc(collection(db, 'reports'), reportData);
        } catch (error) {
            console.error("Error adding report:", error);
            alert("Failed to add report. See console for details.");
        }
    };

    // User handlers
    const handleUpdateUser = async (userData: User) => {
        try {
            const userRef = doc(db, 'users', userData.id);
            const { id, ...dataToUpdate } = userData;
            await updateDoc(userRef, dataToUpdate);
        } catch (error) {
            console.error("Error updating user:", error);
            alert("Failed to update user. See console for details.");
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (currentUser && userId === currentUser.id) {
            alert("You cannot delete yourself.");
            return;
        }
        try {
            // NOTE: This only deletes the Firestore user document, not the Firebase Auth user.
            // A Cloud Function would be needed for a complete user deletion.
            await deleteDoc(doc(db, 'users', userId));
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Failed to delete user. See console for details.");
        }
    };

    // Navigation handlers
    const handleSelectProject = (projectId: string) => {
        setSelectedProjectId(projectId);
        setView('projectDetails');
    };

    const handleBackToDashboard = () => {
        setSelectedProjectId(null);
        setView('dashboard');
    };

    // Render logic
    if (isLoading && !currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200">
                <p className="text-xl">Đang tải ứng dụng...</p>
            </div>
        );
    }

    if (!currentUser) {
        return <Login onLogin={handleLogin} error={authError} />;
    }

    const renderContent = () => {
        switch (view) {
            case 'projectDetails':
                if (selectedProject) {
                    return (
                        <ProjectDetails
                            project={selectedProject}
                            reports={reportsForSelectedProject}
                            currentUser={currentUser}
                            users={users}
                            onBack={handleBackToDashboard}
                            onAddReport={handleAddReport}
                            onUpdateProject={handleUpdateProject}
                            onDeleteProject={handleDeleteProject}
                        />
                    );
                }
                // If project not found (e.g., deleted), go back to dashboard
                handleBackToDashboard();
                return null;
            case 'addProject':
                 return <AddProjectForm onAddProject={handleAddProject} onCancel={handleBackToDashboard} users={users} />;
            case 'userManagement':
                return <UserManagement users={users} currentUser={currentUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} onBack={handleBackToDashboard} />;
            case 'dashboard':
            default:
                return (
                    <div>
                        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                            <h2 className="text-3xl font-bold text-gray-800">Danh sách Dự án</h2>
                            <div className="flex gap-2 sm:gap-4">
                                {permissions.canManageUsers(currentUser) && (
                                    <button onClick={() => setView('userManagement')} className="bg-neutral text-primary font-bold py-2 px-4 rounded-md hover:bg-gray-300 transition-colors">
                                        Quản lý User
                                    </button>
                                )}
                                {permissions.canAddProject(currentUser) && (
                                    <button onClick={() => setView('addProject')} className="bg-primary text-white font-bold py-2 px-4 rounded-md hover:opacity-90 transition-opacity">
                                        Thêm Dự án +
                                    </button>
                                )}
                            </div>
                        </div>
                        {isLoading ? <p>Đang tải dự án...</p> : projects.length > 0 ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {projects.map(project => (
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                        currentUser={currentUser}
                                        onSelectProject={handleSelectProject}
                                        onDeleteProject={handleDeleteProject}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-base-100 rounded-lg shadow-md">
                                <h3 className="text-lg font-medium text-gray-900">Không tìm thấy dự án nào.</h3>
                                {permissions.canAddProject(currentUser) 
                                    ? <p className="mt-1 text-sm text-gray-500">Hãy bắt đầu bằng cách thêm một dự án mới.</p>
                                    : <p className="mt-1 text-sm text-gray-500">Bạn chưa được gán vào dự án nào.</p>
                                }
                            </div>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-base-200 text-base-content font-sans">
            <Header user={currentUser} onLogout={handleLogout} />
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                {renderContent()}
            </main>
            {projectToDelete && (
                 <ConfirmationModal
                    message={`Bạn có chắc chắn muốn xóa dự án "${projectToDelete.name}"?\nHành động này không thể hoàn tác.`}
                    onConfirm={confirmDeleteProject}
                    onCancel={() => setProjectToDelete(null)}
                />
            )}
        </div>
    );
};

export default App;