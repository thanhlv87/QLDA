import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  QuerySnapshot,
  DocumentData,
  where,
  DocumentSnapshot,
  getDocs,
  getDoc,
  deleteField,
} from 'firebase/firestore';
import { auth, db } from './services/firebase';
import type { User, Project, DailyReport, ProjectReview } from './types';
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
        const unsubscribe = onSnapshot(userDocRef, (userDoc: DocumentSnapshot<DocumentData>) => {
            if (userDoc.exists()) {
                const data = userDoc.data();
                const userData = { id: userDoc.id, ...data } as User;
                setCurrentUser(userData);
            } else {
                console.error("User document not found in Firestore!");
                signOut(auth);
            }
        }, (error) => {
            console.error("Error fetching user data:", error);
            setAuthError("Failed to load user profile.");
            signOut(auth);
        });

        return () => unsubscribe();
    }, [firebaseUser]);

    // Effect for fetching projects and users for ADMINS (who can see everything)
    useEffect(() => {
        if (!currentUser) {
            setProjects([]);
            setUsers([]);
            setIsLoading(false);
            return () => {};
        }

        setIsLoading(true);
        const unsubs: (() => void)[] = [];

        // For non-Admins, set the users array to just them. Others will be loaded if needed.
        if (!permissions.canFetchAllUsers(currentUser)) {
            setUsers([currentUser]);
        }
        // Fetch all users only for Admins
        else {
            const usersQuery = query(collection(db, 'users'), orderBy('name'));
            const usersUnsubscribe = onSnapshot(usersQuery, (snapshot: QuerySnapshot<DocumentData>) => {
                setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
            }, (error) => {
                console.error("Error fetching users:", error);
                setUsers([]);
            });
            unsubs.push(usersUnsubscribe);
        }

        // Fetch projects based on permissions
        if (permissions.canAddProject(currentUser)) { // Admins and Department Heads get all projects
            const projectsQuery = query(collection(db, 'projects'), orderBy('name'));
            const projectsUnsubscribe = onSnapshot(projectsQuery, (snapshot: QuerySnapshot<DocumentData>) => {
                setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
                setIsLoading(false);
            }, (error) => {
                console.error("Error fetching projects:", error);
                setIsLoading(false);
            });
            unsubs.push(projectsUnsubscribe);
        } else { // PMs and Supervisors get assigned projects
            const pmQuery = query(collection(db, 'projects'), where('projectManagerIds', 'array-contains', currentUser.id));
            const lsQuery = query(collection(db, 'projects'), where('leadSupervisorIds', 'array-contains', currentUser.id));

            let pmProjects: Project[] = [];
            let lsProjects: Project[] = [];

            const mergeAndSetProjects = () => {
                const projectMap = new Map<string, Project>();
                pmProjects.forEach(p => projectMap.set(p.id, p));
                lsProjects.forEach(p => projectMap.set(p.id, p));
                const sortedProjects = Array.from(projectMap.values()).sort((a, b) => a.name.localeCompare(b.name));
                setProjects(sortedProjects);
                setIsLoading(false);
            };

            const unsubPM = onSnapshot(pmQuery, (snapshot: QuerySnapshot<DocumentData>) => {
                pmProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
                mergeAndSetProjects();
            }, (error) => {
                console.error("Error fetching manager projects:", error);
                setIsLoading(false);
            });

            const unsubLS = onSnapshot(lsQuery, (snapshot: QuerySnapshot<DocumentData>) => {
                lsProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
                mergeAndSetProjects();
            }, (error) => {
                console.error("Error fetching supervisor projects:", error);
                setIsLoading(false);
            });
            
            unsubs.push(unsubPM);
            unsubs.push(unsubLS);
        }

        return () => {
            unsubs.forEach(unsub => unsub());
        };
    }, [currentUser]);

    // Effect for fetching reports for visible projects
    useEffect(() => {
        if (!currentUser || projects.length === 0) {
            setReports([]);
            return () => {};
        }

        const projectIds = projects.map(p => p.id);
        
        if (projectIds.length > 30) {
             console.warn(`User has access to ${projectIds.length} projects. Firestore can only query 30 at a time. Data may be incomplete.`);
        }
        const queryableIds = projectIds.slice(0, 30);
        if(queryableIds.length === 0) {
          setReports([]);
          return;
        }

        const reportsQuery = query(collection(db, 'reports'), where('projectId', 'in', queryableIds));
        const reportsUnsubscribe = onSnapshot(reportsQuery, (snapshot: QuerySnapshot<DocumentData>) => {
            const allReports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyReport));
            setReports(allReports);
        }, (error) => {
            console.error("Error fetching reports:", error);
            setReports([]);
        });
        
        return () => reportsUnsubscribe();
    }, [projects, currentUser]);

    // Memoized derived state
    const selectedProject = useMemo(() => {
        return projects.find(p => p.id === selectedProjectId);
    }, [projects, selectedProjectId]);

    const reportsForSelectedProject = useMemo(() => {
        if (!selectedProject) return [];
        
        const reviewsMap = selectedProject.reviews || {};

        return reports
            .filter(r => r.projectId === selectedProjectId)
            .map(report => ({
                ...report,
                managerReview: reviewsMap[report.id],
            }))
            .sort((a, b) => { // Sort by date DD/MM/YYYY descending
                const [dayA, monthA, yearA] = a.date.split('/').map(Number);
                const [dayB, monthB, yearB] = b.date.split('/').map(Number);
                return new Date(yearB, monthB - 1, dayB).getTime() - new Date(yearA, monthA - 1, dayA).getTime();
            });
    }, [reports, selectedProject]);

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
            const projectId = projectToDelete.id;
            // Batch delete reports 
            const reportsQuery = query(collection(db, 'reports'), where('projectId', '==', projectId));
            const reportsSnapshot = await getDocs(reportsQuery);

            const deletePromises: Promise<void>[] = [];
            reportsSnapshot.docs.forEach(d => deletePromises.push(deleteDoc(d.ref)));
            
            await Promise.all(deletePromises);
            
            await deleteDoc(doc(db, 'projects', projectId));

            setProjectToDelete(null);
            if (selectedProjectId === projectId) {
                setView('dashboard');
                setSelectedProjectId(null);
            }
        } catch (error) {
            console.error("Error performing cascading delete for project:", error);
            alert("Failed to delete project and its data. See console for details.");
            setProjectToDelete(null);
        }
    };
    
    // Report handlers
    const handleAddReport = async (reportData: Omit<DailyReport, 'id'>) => {
        try {
            await addDoc(collection(db, 'reports'), reportData);
        } catch (error) {
            console.error("Error adding report:", error);
            alert("Failed to add report. See console for details.");
        }
    };

    const handleUpdateReport = async (reportData: DailyReport) => {
        try {
            const reportRef = doc(db, 'reports', reportData.id);
            const { id, ...dataToUpdate } = reportData;
            await updateDoc(reportRef, dataToUpdate);
        } catch (error) {
            console.error("Error updating report:", error);
            alert("Failed to update report. See console for details.");
        }
    };

    const handleDeleteReport = async (reportId: string, projectId: string) => {
        try {
            const projectRef = doc(db, 'projects', projectId);
            // Atomically delete the review field and the report document
            await updateDoc(projectRef, {
                [`reviews.${reportId}`]: deleteField()
            });
            await deleteDoc(doc(db, 'reports', reportId));
        } catch (error) {
            console.error("Error deleting report and its review:", error);
            alert("Failed to delete report. See console for details.");
        }
    };
    
    const handleAddReportReview = async (projectId: string, reportId: string, comment: string, user: User) => {
        try {
            const projectRef = doc(db, 'projects', projectId);
            const reviewData: ProjectReview = {
                comment,
                reviewedById: user.id,
                reviewedByName: user.name, // Denormalize user name
                reviewedAt: new Date().toISOString(),
            };
            await updateDoc(projectRef, {
                [`reviews.${reportId}`]: reviewData
            });
        } catch (error) {
            console.error("Error adding report review:", error);
            alert("Không thể lưu nhận xét. Vui lòng thử lại.");
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
                            onUpdateReport={handleUpdateReport}
                            onDeleteReport={handleDeleteReport}
                            onAddReportReview={handleAddReportReview}
                        />
                    );
                }
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
                        {isLoading ? <p>Đang tải dự án...</p> : (
                            projects.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                <p className="text-center text-gray-500 mt-8">Không có dự án nào để hiển thị.</p>
                            )
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-neutral">
            <Header user={currentUser} onLogout={handleLogout} />
            <main className="p-4 sm:p-6 lg:p-8">
                {renderContent()}
            </main>
            {projectToDelete && (
                <ConfirmationModal 
                    message={`Bạn có chắc chắn muốn xóa dự án "${projectToDelete.name}"?\nTất cả báo cáo và nhận xét liên quan cũng sẽ bị xóa vĩnh viễn.`}
                    onConfirm={confirmDeleteProject}
                    onCancel={() => setProjectToDelete(null)}
                />
            )}
        </div>
    );
};

export default App;