import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser, signInWithPopup } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  query,
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
  setDoc,
  orderBy,
} from 'firebase/firestore';
import { auth, db, googleProvider } from './services/firebase';
import type { User, Project, DailyReport, ProjectReview, Role } from './types';
import { permissions } from './services/permissions';

// Components
import Login from './components/Login';
import Header from './components/Header';
import ProjectCard from './components/ProjectCard';
import ProjectDetails from './components/ProjectDetails';
import AddProjectForm from './components/AddProjectForm';
import UserManagement from './components/UserManagement';
import ConfirmationModal from './components/ConfirmationModal';
import Toast from './components/Toast';
import ProjectCardSkeleton from './components/ProjectCardSkeleton';
import Footer from './components/Footer';
import ApproveUserModal from './components/ApproveUserModal';


type AppView = 'dashboard' | 'projectDetails' | 'addProject' | 'userManagement';
type ToastMessage = { id: number; message: string; type: 'success' | 'error' };

const App: React.FC = () => {
    // Authentication state
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);


    // Data state
    const [projects, setProjects] = useState<Project[]>([]);
    const [reports, setReports] = useState<DailyReport[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    // UI/Navigation state
    const [view, setView] = useState<AppView>('dashboard');
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [isProjectsLoading, setIsProjectsLoading] = useState(true);
    const [isReportsLoading, setIsReportsLoading] = useState(true);
    const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
    const [userToApprove, setUserToApprove] = useState<User | null>(null);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    
    const addToast = (message: string, type: 'success' | 'error') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 4000);
    };

    // Effect for handling auth state changes and creating user profiles.
    // This is the most reliable place to handle user profile creation.
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);

                if (!userDoc.exists()) {
                    // This is a new user. Create their profile document in Firestore.
                    try {
                        await setDoc(userDocRef, {
                            email: user.email,
                            name: user.displayName || 'Người dùng mới',
                            role: null, // Pending approval
                        });
                        console.log(`Created user document for ${user.email}`);
                    } catch (error) {
                        console.error("Error creating user document:", error);
                    }
                }
                setFirebaseUser(user);
            } else {
                // User is signed out
                setFirebaseUser(null);
                setCurrentUser(null);
                setIsAuthLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // Effect for fetching the current user's profile from Firestore
    // This runs after onAuthStateChanged sets the firebaseUser
    useEffect(() => {
        if (!firebaseUser) {
            setIsAuthLoading(false);
            return;
        };

        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribe = onSnapshot(userDocRef, (userDoc: DocumentSnapshot<DocumentData>) => {
            if (userDoc.exists()) {
                const data = userDoc.data();
                const userData = { id: userDoc.id, ...data } as User;
                setCurrentUser(userData);
            } else {
                // This state can happen briefly for a new user while their doc is being created.
                // The listener will fire again once the document is created by onAuthStateChanged.
                setCurrentUser(null);
            }
            setIsAuthLoading(false);
        }, (error) => {
            console.error("Error fetching user data:", error);
            setAuthError("Failed to load user profile.");
            signOut(auth);
            setIsAuthLoading(false);
        });

        return () => unsubscribe();
    }, [firebaseUser]);

    // Effect for fetching projects and users for ADMINS (who can see everything)
    useEffect(() => {
        if (!currentUser || !currentUser.role) { // Don't fetch data for pending users
            setProjects([]);
            // Still need to fetch users if admin, to see pending users
             if (currentUser && permissions.canFetchAllUsers(currentUser)) {
                 // continue
             } else {
                setUsers([]);
                setIsProjectsLoading(false);
                return () => {};
             }
        }

        setIsProjectsLoading(true);
        const unsubs: (() => void)[] = [];

        // For non-Admins, set the users array to just them. Others will be loaded if needed.
        if (!permissions.canFetchAllUsers(currentUser)) {
           if(currentUser) setUsers([currentUser]);
        }
        // Fetch all users only for Admins
        else {
            const usersQuery = query(collection(db, 'users'));
            const usersUnsubscribe = onSnapshot(usersQuery, (snapshot: QuerySnapshot<DocumentData>) => {
                const fetchedUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
                // Sort client-side to handle users that might be missing a 'name' field
                fetchedUsers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                setUsers(fetchedUsers);
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
                setIsProjectsLoading(false);
            }, (error) => {
                console.error("Error fetching projects:", error);
                setIsProjectsLoading(false);
            });
            unsubs.push(projectsUnsubscribe);
        } else if (currentUser) { // PMs and Supervisors get assigned projects
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
                setIsProjectsLoading(false);
            };

            const unsubPM = onSnapshot(pmQuery, (snapshot: QuerySnapshot<DocumentData>) => {
                pmProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
                mergeAndSetProjects();
            }, (error) => {
                console.error("Error fetching manager projects:", error);
                setIsProjectsLoading(false);
            });

            const unsubLS = onSnapshot(lsQuery, (snapshot: QuerySnapshot<DocumentData>) => {
                lsProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
                mergeAndSetProjects();
            }, (error) => {
                console.error("Error fetching supervisor projects:", error);
                setIsProjectsLoading(false);
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
        if (!currentUser || !currentUser.role || projects.length === 0) {
            setReports([]);
            setIsReportsLoading(false);
            return () => {};
        }
        
        setIsReportsLoading(true);
        const projectIds = projects.map(p => p.id);
        
        if (projectIds.length > 30) {
             console.warn(`User has access to ${projectIds.length} projects. Firestore can only query 30 at a time. Data may be incomplete.`);
        }
        const queryableIds = projectIds.slice(0, 30);
        if(queryableIds.length === 0) {
          setReports([]);
          setIsReportsLoading(false);
          return;
        }

        const reportsQuery = query(collection(db, 'reports'), where('projectId', 'in', queryableIds));
        const reportsUnsubscribe = onSnapshot(reportsQuery, (snapshot: QuerySnapshot<DocumentData>) => {
            const allReports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyReport));
            setReports(allReports);
            setIsReportsLoading(false);
        }, (error) => {
            console.error("Error fetching reports:", error);
            setReports([]);
            setIsReportsLoading(false);
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
    
    const handleGoogleLogin = async () => {
        setAuthError(null);
        try {
            // The onAuthStateChanged listener will handle profile creation.
            // This function just needs to initiate the sign-in process.
            await signInWithPopup(auth, googleProvider);
        } catch (error: any) {
            console.error("Google login error:", error);
            if (error.code === 'auth/popup-closed-by-user') {
                return;
            }
            setAuthError("Đã xảy ra lỗi khi đăng nhập với Google. Vui lòng thử lại.");
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        setCurrentUser(null);
        setFirebaseUser(null);
        setView('dashboard');
        setSelectedProjectId(null);
    };

    // Project handlers
    const handleAddProject = async (projectData: Omit<Project, 'id'>) => {
        try {
            await addDoc(collection(db, 'projects'), projectData);
            setView('dashboard');
            addToast('Dự án đã được tạo thành công!', 'success');
        } catch (error) {
            console.error("Error adding project:", error);
            addToast('Lỗi khi tạo dự án.', 'error');
        }
    };

    const handleUpdateProject = async (projectData: Project) => {
         try {
            const projectRef = doc(db, 'projects', projectData.id);
            const { id, ...dataToUpdate } = projectData;
            await updateDoc(projectRef, dataToUpdate);
            addToast('Dự án đã được cập nhật!', 'success');
        } catch (error) {
            console.error("Error updating project:", error);
            addToast('Lỗi khi cập nhật dự án.', 'error');
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

            addToast(`Dự án "${projectToDelete.name}" đã được xóa.`, 'success');
            setProjectToDelete(null);
            if (selectedProjectId === projectId) {
                setView('dashboard');
                setSelectedProjectId(null);
            }
        } catch (error) {
            console.error("Error performing cascading delete for project:", error);
            addToast('Lỗi khi xóa dự án.', 'error');
            setProjectToDelete(null);
        }
    };
    
    // Report handlers
    const handleAddReport = async (reportData: Omit<DailyReport, 'id'>) => {
        try {
            await addDoc(collection(db, 'reports'), reportData);
            addToast('Báo cáo đã được gửi thành công!', 'success');
        } catch (error) {
            console.error("Error adding report:", error);
            addToast('Lỗi khi gửi báo cáo.', 'error');
        }
    };

    const handleUpdateReport = async (reportData: DailyReport) => {
        try {
            const reportRef = doc(db, 'reports', reportData.id);
            const { id, ...dataToUpdate } = reportData;
            await updateDoc(reportRef, dataToUpdate);
            addToast('Báo cáo đã được cập nhật!', 'success');
        } catch (error) {
            console.error("Error updating report:", error);
            addToast('Lỗi khi cập nhật báo cáo.', 'error');
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
            addToast('Báo cáo đã được xóa.', 'success');
        } catch (error) {
            console.error("Error deleting report and its review:", error);
            addToast('Lỗi khi xóa báo cáo.', 'error');
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
            addToast('Nhận xét đã được lưu.', 'success');
        } catch (error) {
            console.error("Error adding report review:", error);
            addToast('Không thể lưu nhận xét.', 'error');
        }
    };

    // User handlers
    const handleUpdateUser = async (userData: User) => {
        try {
            const userRef = doc(db, 'users', userData.id);
            const { id, ...dataToUpdate } = userData;
            await updateDoc(userRef, dataToUpdate);
            addToast('Thông tin người dùng đã được cập nhật.', 'success');
        } catch (error) {
            console.error("Error updating user:", error);
            addToast('Lỗi khi cập nhật người dùng.', 'error');
        }
    };

    const handleApproveUser = (user: User, role: Role) => {
        handleUpdateUser({ ...user, role });
        setUserToApprove(null);
    };

    const handleDeleteUser = async (userId: string) => {
        if (currentUser && userId === currentUser.id) {
            addToast("Bạn không thể tự xóa chính mình.", 'error');
            return;
        }
        try {
            await deleteDoc(doc(db, 'users', userId));
            addToast('Người dùng đã được xóa.', 'success');
        } catch (error) {
            console.error("Error deleting user:", error);
            addToast('Lỗi khi xóa người dùng.', 'error');
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
    if (isAuthLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200">
                <p className="text-xl">Đang tải ứng dụng...</p>
            </div>
        );
    }

    if (!firebaseUser) {
        return <Login onLogin={handleLogin} onGoogleLogin={handleGoogleLogin} error={authError} />;
    }

    if (!currentUser) {
         return (
            <div className="min-h-screen bg-neutral flex flex-col">
                <Header user={{id: firebaseUser.uid, email: firebaseUser.email || '', name: firebaseUser.displayName || '', role: null}} onLogout={handleLogout} />
                <main className="flex-grow flex items-center justify-center p-4">
                     <div className="text-center bg-base-100 p-8 sm:p-12 rounded-2xl shadow-xl max-w-lg mx-auto border border-gray-200">
                        <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-4">Đang xử lý...</h2>
                        <p className="text-gray-600">
                            Đang kiểm tra thông tin tài khoản của bạn. Vui lòng đợi trong giây lát.
                        </p>
                     </div>
                </main>
                <Footer />
            </div>
        );
    }
    
    if (!currentUser.role) {
        return (
            <div className="min-h-screen bg-neutral flex flex-col">
                <Header user={currentUser} onLogout={handleLogout} />
                <main className="flex-grow flex items-center justify-center p-4">
                    <div className="text-center bg-base-100 p-8 sm:p-12 rounded-2xl shadow-xl max-w-lg mx-auto border border-gray-200">
                        <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-4">Tài khoản đang chờ phê duyệt</h2>
                        <p className="text-gray-600 mb-6">
                            Tài khoản của bạn (<span className="font-semibold">{currentUser.email}</span>) đã được tạo thành công và đang chờ quản trị viên cấp quyền truy cập.
                        </p>
                        <p className="text-gray-600">
                            Vui lòng liên hệ quản trị viên để hoàn tất quá trình.
                        </p>
                         <button
                            onClick={handleLogout}
                            className="mt-8 bg-accent hover:opacity-90 text-white font-bold py-2 px-8 rounded-md transition-colors"
                        >
                            Đăng xuất
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const renderContent = () => {
        switch (view) {
            case 'projectDetails':
                if (selectedProject) {
                    return (
                        <ProjectDetails
                            project={selectedProject}
                            reports={reportsForSelectedProject}
                            isReportsLoading={isReportsLoading}
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
                return <UserManagement users={users} currentUser={currentUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} onBack={handleBackToDashboard} onApproveUser={setUserToApprove} />;
            case 'dashboard':
            default:
                const pendingUsers = users.filter(u => !u.role);
                return (
                    <div className="animate-fade-in">
                        {permissions.canManageUsers(currentUser) && pendingUsers.length > 0 && (
                            <div className="mb-8 p-4 sm:p-6 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg shadow-md animate-fade-in">
                                <h3 className="text-lg sm:text-xl font-bold text-yellow-800 mb-4">Tài khoản chờ Phê duyệt ({pendingUsers.length})</h3>
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                    {pendingUsers.map(user => (
                                        <div key={user.id} className="flex justify-between items-center bg-white p-3 rounded-md shadow-sm">
                                            <div>
                                                <p className="font-semibold text-gray-800">{user.name}</p>
                                                <p className="text-sm text-gray-500">{user.email}</p>
                                            </div>
                                            <button 
                                                onClick={() => setUserToApprove(user)}
                                                className="bg-success text-white font-bold py-1 px-3 rounded-md hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                                            >
                                                Phê duyệt
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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
                        {isProjectsLoading ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => <ProjectCardSkeleton key={i} />)}
                            </div>
                        ) : (
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
        <div className="min-h-screen bg-neutral flex flex-col">
            <Header user={currentUser} onLogout={handleLogout} />
            <main className="p-4 sm:p-6 lg:p-8 flex-grow">
                {renderContent()}
            </main>
            <Footer />
            {projectToDelete && (
                <ConfirmationModal 
                    message={`Bạn có chắc chắn muốn xóa dự án "${projectToDelete.name}"?\nTất cả báo cáo và nhận xét liên quan cũng sẽ bị xóa vĩnh viễn.`}
                    onConfirm={confirmDeleteProject}
                    onCancel={() => setProjectToDelete(null)}
                />
            )}
             {userToApprove && (
                <ApproveUserModal 
                    user={userToApprove}
                    onApprove={handleApproveUser}
                    onCancel={() => setUserToApprove(null)}
                />
            )}
            <div className="fixed bottom-4 right-4 z-50 space-y-2">
                {toasts.map(toast => (
                    <Toast 
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                    />
                ))}
            </div>
        </div>
    );
};

export default App;