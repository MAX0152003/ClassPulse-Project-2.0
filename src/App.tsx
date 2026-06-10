import React from 'react';
import { 
  Role, 
  ClassSession, 
  AppNotification, 
  AttendanceRecord, 
  UserProfile, 
  AccessibilityConfig, 
  FacultyStatus, 
  Enrollment,
  Announcement
} from './types';
import { 
  INITIAL_CLASSES, 
  INITIAL_FACULTY_STATUSES, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_ATTENDANCE_RECORDS,
  DEFAULT_STUDENT_PROFILE,
  DEFAULT_FACULTY_PROFILE,
  DEFAULT_ADMIN_PROFILE
} from './data';
import Sidebar from './components/Sidebar';
import DashboardStudent from './components/DashboardStudent';
import DashboardFaculty from './components/DashboardFaculty';
import DashboardAdmin from './components/DashboardAdmin';
import AuthScreens from './components/AuthScreens';
import AccessibilitySettings, { speakText } from './components/AccessibilitySettings';
import { 
  Wifi, 
  WifiOff, 
  Type, 
  Settings, 
  X, 
  RefreshCw, 
  CheckCircle,
  HelpCircle,
  Bell
} from 'lucide-react';

// Safe Local Storage Wrapper to prevent app crashes due to QuotaExceededError or browser iframe restrictions
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`[ClassPulse] Failed to read "${key}" from localStorage:`, e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[ClassPulse] Failed to write "${key}" to localStorage:`, e);
      // If we hit QuotaExceededError, try to prune non-critical state (like cached history/toasts) to recover workspace
      if (e instanceof Error && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.message?.includes('quota'))) {
        try {
          localStorage.removeItem('cp_notifications');
          localStorage.removeItem('cp_records');
          localStorage.setItem(key, value);
        } catch (_) {}
      }
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[ClassPulse] Failed to remove "${key}" from localStorage:`, e);
    }
  }
};

export default function App() {
  // 1. Core State Managers (Local Storage integrated)
  const [user, setUser] = React.useState<UserProfile | null>(() => {
    const cached = safeStorage.getItem('cp_user');
    return cached ? JSON.parse(cached) : null;
  });

  const [activeScreen, setActiveScreen] = React.useState<string>(() => {
    return safeStorage.getItem('cp_screen') || 'dashboard';
  });

  const [classes, setClasses] = React.useState<ClassSession[]>(() => {
    const cached = safeStorage.getItem('cp_classes');
    return cached ? JSON.parse(cached) : INITIAL_CLASSES;
  });

  const [attendanceRecords, setAttendanceRecords] = React.useState<AttendanceRecord[]>(() => {
    const cached = safeStorage.getItem('cp_records');
    return cached ? JSON.parse(cached) : INITIAL_ATTENDANCE_RECORDS;
  });

  const [notifications, setNotifications] = React.useState<AppNotification[]>(() => {
    const cached = safeStorage.getItem('cp_notifications');
    return cached ? JSON.parse(cached) : INITIAL_NOTIFICATIONS;
  });

  const [facultyStatuses, setFacultyStatuses] = React.useState<FacultyStatus[]>(() => {
    const cached = safeStorage.getItem('cp_faculty_statuses');
    return cached ? JSON.parse(cached) : INITIAL_FACULTY_STATUSES;
  });

  const [accessibility, setAccessibility] = React.useState<AccessibilityConfig>(() => {
    const cached = safeStorage.getItem('cp_accessibility');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.theme === 'light' || parsed.theme === 'dark') {
          return {
            theme: parsed.theme,
            readAloud: !!parsed.readAloud
          };
        }
      } catch (e) {}
    }
    return {
      theme: 'light', // default theme is now an elegant light/warm-slate vibe
      readAloud: false
    };
  });

  const [enrollments, setEnrollments] = React.useState<Enrollment[]>(() => {
    const cached = safeStorage.getItem('cp_enrollments');
    if (cached) return JSON.parse(cached);
    
    // Seed initial clean class enrollments for current student (and others)
    return [
      {
        id: 'enr-1',
        studentId: '2023-10492',
        studentName: 'John Doe',
        studentEmail: 'john.doe@msu.edu.ph',
        studentAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150',
        classId: 'class-1',
        enrolledAt: '10:00 AM'
      },
      {
        id: 'enr-2',
        studentId: '2023-10492',
        studentName: 'John Doe',
        studentEmail: 'john.doe@msu.edu.ph',
        studentAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150',
        classId: 'class-3',
        enrolledAt: '10:15 AM'
      },
      {
        id: 'enr-3',
        studentId: '2023-88211',
        studentName: 'Alice Vance',
        studentEmail: 'alice.vance@msu.edu.ph',
        studentAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
        classId: 'class-1',
        enrolledAt: '09:00 AM'
      },
      {
        id: 'enr-4',
        studentId: '2023-88211',
        studentName: 'Alice Vance',
        studentEmail: 'alice.vance@msu.edu.ph',
        studentAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
        classId: 'class-2',
        enrolledAt: '01:00 PM'
      },
      {
        id: 'enr-5',
        studentId: '2023-99124',
        studentName: 'Bob Carter',
        studentEmail: 'bob.carter@msu.edu.ph',
        studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
        classId: 'class-1',
        enrolledAt: '09:05 AM'
      },
      {
        id: 'enr-6',
        studentId: '2023-99124',
        studentName: 'Bob Carter',
        studentEmail: 'bob.carter@msu.edu.ph',
        studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
        classId: 'class-2',
        enrolledAt: '01:10 PM'
      }
    ];
  });

  const [announcements, setAnnouncements] = React.useState<Announcement[]>(() => {
    const cached = safeStorage.getItem('cp_announcements');
    if (cached) return JSON.parse(cached);
    return [
      {
        id: 'ann-1',
        title: 'End of Term Clearance Notice',
        content: 'All graduating students must verify their credentials and clearance forms with the Dean of Academic Affairs before May 25, 2026.',
        target: 'student',
        createdAt: new Date().toISOString()
      },
      {
        id: 'ann-2',
        title: 'Submission of Term Grade Rosters',
        content: 'Esteemed faculty: please upload your finalized Class check-in reports and grade booklets to the web registrar database by next Friday.',
        target: 'faculty',
        createdAt: new Date().toISOString()
      },
      {
        id: 'ann-3',
        title: 'University Campus Maintenance Closure',
        content: 'The campus IT server node and libraries will be closed for quarterly system optimization this weekend. All online access remains active.',
        target: 'all',
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [isOffline, setIsOffline] = React.useState<boolean>(() => {
    return safeStorage.getItem('cp_offline') === 'true';
  });

  // Action/simulation trackers
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [syncDoneBanner, setSyncDoneBanner] = React.useState(false);
  const [isAccPanelOpen, setIsAccPanelOpen] = React.useState(false);

  // Synchronize Dark / Light class on the HTML document element
  React.useEffect(() => {
    if (accessibility.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [accessibility.theme]);

  // 2. Persistent side-effects
  React.useEffect(() => {
    if (user) {
      safeStorage.setItem('cp_user', JSON.stringify(user));
    } else {
      safeStorage.removeItem('cp_user');
    }
  }, [user]);

  React.useEffect(() => {
    safeStorage.setItem('cp_screen', activeScreen);
  }, [activeScreen]);

  React.useEffect(() => {
    safeStorage.setItem('cp_classes', JSON.stringify(classes));
  }, [classes]);

  React.useEffect(() => {
    safeStorage.setItem('cp_records', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  React.useEffect(() => {
    safeStorage.setItem('cp_notifications', JSON.stringify(notifications));
  }, [notifications]);

  React.useEffect(() => {
    safeStorage.setItem('cp_faculty_statuses', JSON.stringify(facultyStatuses));
  }, [facultyStatuses]);

  React.useEffect(() => {
    safeStorage.setItem('cp_accessibility', JSON.stringify(accessibility));
  }, [accessibility]);

  React.useEffect(() => {
    safeStorage.setItem('cp_enrollments', JSON.stringify(enrollments));
  }, [enrollments]);

  React.useEffect(() => {
    safeStorage.setItem('cp_announcements', JSON.stringify(announcements));
  }, [announcements]);

  React.useEffect(() => {
    safeStorage.setItem('cp_offline', String(isOffline));
  }, [isOffline]);

  // Synchronize when offline state is flipped back to online
  const handleToggleOffline = () => {
    if (isOffline) {
      // Transitioning to online -> Simulate synchronization
      setIsOffline(false);
      setIsSyncing(true);
      speakText("Restoring network link. Synchronizing local cache with main campus nodes.", accessibility.readAloud);
      
      setTimeout(() => {
        setIsSyncing(false);
        setSyncDoneBanner(true);
        speakText("Database synchronization completed. All attendance rosters are fully persistent.", accessibility.readAloud);
        
        // Add a notification toast dynamically
        const newNotif: AppNotification = {
          id: 'notif-sync-' + Date.now(),
          title: 'Offline records synchronized',
          message: 'Local logs for schedules and scan codes successfully merged into cloud registry.',
          timestamp: 'Just Now',
          type: 'success',
          read: false
        };
        setNotifications(prev => [newNotif, ...prev]);
 
        setTimeout(() => setSyncDoneBanner(false), 3500);
      }, 1500);
    } else {
      setIsOffline(true);
      speakText("Network connection paused. You are now working using persistent local-storage database mode.", accessibility.readAloud);
    }
  };
 
  // Auth operations
  const handleLoginSuccess = (role: Role, name?: string, email?: string) => {
    let profile: UserProfile;
    if (role === 'student') {
      profile = {
        ...DEFAULT_STUDENT_PROFILE,
        name: name || DEFAULT_STUDENT_PROFILE.name,
        email: email || DEFAULT_STUDENT_PROFILE.email
      };
    } else if (role === 'faculty') {
      profile = {
        ...DEFAULT_FACULTY_PROFILE,
        name: name || DEFAULT_FACULTY_PROFILE.name,
        email: email || DEFAULT_FACULTY_PROFILE.email
      };
    } else {
      profile = {
        ...DEFAULT_ADMIN_PROFILE,
        name: name || DEFAULT_ADMIN_PROFILE.name,
        email: email || DEFAULT_ADMIN_PROFILE.email
      };
    }
 
    setUser(profile);
    setActiveScreen('dashboard');
    speakText(`Welcome to ClassPulse. Successfully loaded your ${role} dashboard.`, accessibility.readAloud);
  };
 
  const handleLogout = () => {
    setUser(null);
    setActiveScreen('dashboard');
    safeStorage.removeItem('cp_user');
  };

  // Student logs attendance via QR code simulation scan
  const handleRecordAttendance = (classId: string, status: 'present' | 'late') => {
    const matchedClass = classes.find(c => c.id === classId);
    if (!matchedClass) return;

    // A. AUTOMATIC ENROLLMENT SERVICE INTERCEPTOR
    const isAlreadyEnrolled = enrollments.some(
      e => e.classId === classId && (e.studentId === user?.studentId || e.studentEmail === user?.email)
    );

    if (!isAlreadyEnrolled && user && user.role === 'student') {
      const newEnrolID = 'enr-' + Date.now();
      const newEnrollmentRecord: Enrollment = {
        id: newEnrolID,
        studentId: user.studentId || '2023-10492',
        studentName: user.name,
        studentEmail: user.email,
        studentAvatar: user.avatar,
        classId: classId,
        enrolledAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setEnrollments(prev => [...prev, newEnrollmentRecord]);

      // Trigger educational success toast
      const automaticNotif: AppNotification = {
        id: 'notif-autoenr-' + Date.now(),
        title: 'Auto-Enrolled in Subject',
        message: `System scan verified: You were not joined in ${matchedClass.code} (${matchedClass.name}). Automatically created student enrollment ledger record in system table successfully!`,
        timestamp: 'Just Now',
        type: 'success',
        read: false
      };
      setNotifications(prev => [automaticNotif, ...prev]);
      speakText(`Auto-registered course registration for ${matchedClass.name}`, accessibility.readAloud);
    }

    // B. LOG ATTENDANCE LOG
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const todayISO = new Date().toISOString().split('T')[0];

    const newRecord: AttendanceRecord = {
      id: 'rec-' + Date.now(),
      classId,
      className: matchedClass.name,
      classCode: matchedClass.code,
      date: todayISO,
      time: timeString,
      status,
      role: 'student',
      studentName: user?.name || 'John Doe',
      studentId: user?.studentId || '2023-10492'
    };

    setAttendanceRecords(prev => [...prev, newRecord]);

    // Send warning if late, else success
    const alertType = status === 'late' ? 'warning' : 'success';
    const msg = status === 'late' 
      ? `Recorded attendance for ${matchedClass.code} at ${timeString} marked as late.`
      : `Checked into ${matchedClass.code} successfully as present.`;

    const newNotif: AppNotification = {
      id: 'notif-' + Date.now(),
      title: status === 'late' ? 'Checked in late' : 'Checked In successfully',
      message: msg,
      timestamp: 'Just Now',
      type: alertType,
      read: false
    };

    setNotifications(prev => [newNotif, ...prev]);
  };

  // Profile Update callback - ensures propagation to enrollments globally
  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    setUser(updatedProfile);

    // Update the local enrollments list matching this student IDs
    setEnrollments(prev => prev.map(e => {
      if (e.studentId === updatedProfile.studentId || e.studentEmail === updatedProfile.email) {
        return {
          ...e,
          studentName: updatedProfile.name,
          studentEmail: updatedProfile.email,
          studentAvatar: updatedProfile.avatar
        };
      }
      return e;
    }));

    // If faculty, update faculty statuses array
    if (updatedProfile.role === 'faculty') {
      setFacultyStatuses(prev => prev.map(f => {
        if (f.id === updatedProfile.facultyId || f.name === user?.name) {
          return {
            ...f,
            name: updatedProfile.name,
            avatar: updatedProfile.avatar
          };
        }
        return f;
      }));
    }

    speakText("Profile details persisted and propagated", accessibility.readAloud);
  };

  // Faculty Actions: Add Class
  const handleAddClass = (newClass: Omit<ClassSession, 'id'>) => {
    const freshClass: ClassSession = {
      ...newClass,
      id: 'class-' + Date.now(),
    };
    setClasses(prev => [freshClass, ...prev]);

    // Add alert
    const newNotif: AppNotification = {
      id: 'notif-' + Date.now(),
      title: 'Class schedule added',
      message: `Course ${freshClass.code} - ${freshClass.name} added to visual registries.`,
      timestamp: 'Just Now',
      type: 'success',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Faculty Actions: Edit Class
  const handleEditClass = (updatedClass: ClassSession) => {
    setClasses(prev => prev.map(c => c.id === updatedClass.id ? updatedClass : c));
  };

  // Faculty Actions: Delete Class
  const handleDeleteClass = (classId: string) => {
    setClasses(prev => prev.filter(c => c.id !== classId));
  };

  // Faculty Actions: Change Consultation availability Status
  const handleChangeFacultyStatus = (status: 'available' | 'in-class' | 'unavailable') => {
    if (!user) return;
    
    // Update local statuses array (so students see this changed status in real-time!)
    setFacultyStatuses(prev => 
      prev.map(f => f.name === user.name || f.id === 'fac-1' ? { ...f, status } : f)
    );

    // Add dynamic notification info
    const notifTitle = `Status updated to ${status}`;
    const statusMessages = {
      available: `${user.name} is now available in Consultation Office.`,
      'in-class': `${user.name} is currently teaching a section.`,
      unavailable: `${user.name} was marked as unavailable.`
    };

    const newNotif: AppNotification = {
      id: 'notif-' + Date.now(),
      title: notifTitle,
      message: statusMessages[status],
      timestamp: 'Just Now',
      type: 'info',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Clean, high density layout container matching Obsidian ClassPulse vibe
  const getThemeClass = (theme: 'light' | 'dark') => {
    switch (theme) {
      case 'light':
        return 'bg-zinc-50 text-zinc-900 font-sans tracking-tight min-h-screen selection:bg-emerald-500 selection:text-white transition-colors duration-300 relative';
      default:
        return 'bg-[#09090b] text-zinc-100 font-sans min-h-screen selection:bg-emerald-500 selection:text-black transition-colors duration-300 relative';
    }
  };

  return (
    <div 
      id="app-root-level-wrapper"
      className={getThemeClass(accessibility.theme)}
    >
      
      {/* 1. AUTHENTICATOR ENVELOPE */}
      {!user ? (
        <AuthScreens 
          onLoginSuccess={handleLoginSuccess} 
          accessibility={accessibility} 
        />
      ) : (
        /* ================= FULL PAGE SERVICE GRID ================= */
        <div className="flex flex-col md:flex-row h-screen overflow-hidden">
          
          {/* Responsive Sidebar */}
          <Sidebar
            role={user.role}
            activeScreen={activeScreen}
            setScreen={setActiveScreen}
            onLogout={handleLogout}
            userName={user.name}
            userAvatar={user.avatar}
            unreadNotifications={notifications.filter(n => !n.read).length}
            accessibility={accessibility}
          />

          {/* Primary View Workspace */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            
            {/* Top Operational bar */}
            <header className="px-6 py-4 border-b flex items-center justify-between gap-4 shrink-0 bg-white/85 dark:bg-zinc-950/80 border-zinc-200 dark:border-zinc-850/80 backdrop-blur-md text-zinc-900 dark:text-zinc-100">
              
              {/* Left Header Context title display matching image theme roles */}
              <div className="flex items-center gap-3 text-left">
                <span className="text-xs font-black uppercase tracking-widest px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full">
                  {user.role} workspace
                </span>

                {/* Offline state label badge */}
                {isOffline && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-755 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-550/20 animate-pulse">
                    <WifiOff className="w-3 h-3" />
                    Offline mode Active
                  </span>
                )}
              </div>

              {/* Right controllers: Accessibility triggers & Quick Settings */}
              <div className="flex items-center gap-2.5">
                
                {/* Manual offline syncing progress spin */}
                {isSyncing && (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Syncing cloud...</span>
                  </div>
                )}

                {/* Quick Accessibility floating button */}
                <button
                  onClick={() => {
                    setIsAccPanelOpen(!isAccPanelOpen);
                    speakText(isAccPanelOpen ? "Settings closed" : "Settings opened", accessibility.readAloud);
                  }}
                  type="button"
                  className="p-2.5 rounded-xl border flex items-center justify-center cursor-pointer transition-all border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
                  title="System Preferences & Preferences Panels"
                >
                  <Settings className="w-4.5 h-4.5" />
                </button>
              </div>

            </header>

            {/* Offline Sync Banner alerts (floating absolute / top) */}
            {syncDoneBanner && (
              <div className="m-6 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-950 dark:text-emerald-300 flex items-center gap-3.5 shadow-md flex-row justify-between animate-fade-in text-left">
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <div>
                    <h5 className="text-xs font-bold font-sans">Database Synchronized</h5>
                    <p className="text-[11px] opacity-90 mt-0.5">Your registers has been securely committed onto ClassPulse host nodes.</p>
                  </div>
                </div>
                <button onClick={() => setSyncDoneBanner(false)} className="text-xs hover:underline cursor-pointer font-bold shrink-0 text-emerald-500">Dismiss</button>
              </div>
            )}

            {/* Primary content grid layout block */}
            <main className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6 flex-1">
              
              {/* Accessibility options expansion widget */}
              {isAccPanelOpen && (
                <div className="relative animate-scale-up z-20">
                  <div className="absolute right-0 top-0 z-30">
                    <button 
                      onClick={() => setIsAccPanelOpen(false)}
                      type="button"
                      className="p-1 m-2 rounded-lg hover:bg-zinc-150 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <AccessibilitySettings
                    config={accessibility}
                    onChange={setAccessibility}
                    isOffline={isOffline}
                    onToggleOffline={handleToggleOffline}
                  />
                  <div className="h-4" /> {/* spacer below */}
                </div>
              )}

              {/* Dynamic screen layouts injection based on active role */}
              {user.role === 'student' && (
                <DashboardStudent
                  activeScreen={activeScreen}
                  setScreen={setActiveScreen}
                  classes={classes}
                  attendanceRecords={attendanceRecords}
                  notifications={notifications}
                  facultyStatuses={facultyStatuses}
                  userProfile={user}
                  isOffline={isOffline}
                  accessibility={accessibility}
                  enrollments={enrollments}
                  onRecordAttendance={handleRecordAttendance}
                  onUpdateProfile={handleUpdateProfile}
                  announcements={announcements}
                />
              )}

              {user.role === 'faculty' && (
                <DashboardFaculty
                  activeScreen={activeScreen}
                  setScreen={setActiveScreen}
                  classes={classes}
                  onAddClass={handleAddClass}
                  onEditClass={handleEditClass}
                  onDeleteClass={handleDeleteClass}
                  userProfile={user}
                  facultyStatus={facultyStatuses.find(f => f.name === user.name || f.id === 'fac-1')?.status || 'available'}
                  onChangeFacultyStatus={handleChangeFacultyStatus}
                  accessibility={accessibility}
                  enrollments={enrollments}
                  attendanceRecords={attendanceRecords}
                  notifications={notifications}
                  facultyStatuses={facultyStatuses}
                  onUpdateProfile={handleUpdateProfile}
                  announcements={announcements}
                />
              )}

              {user.role === 'admin' && (
                <DashboardAdmin
                  activeScreen={activeScreen}
                  setScreen={setActiveScreen}
                  classes={classes}
                  onAddClass={handleAddClass}
                  onEditClass={handleEditClass}
                  onDeleteClass={handleDeleteClass}
                  enrollments={enrollments}
                  attendanceRecords={attendanceRecords}
                  accessibility={accessibility}
                  announcements={announcements}
                  onUpdateAnnouncements={setAnnouncements}
                  userProfile={user}
                  onUpdateProfile={handleUpdateProfile}
                />
              )}

            </main>

          </div>

        </div>
      )}

    </div>
  );
}
