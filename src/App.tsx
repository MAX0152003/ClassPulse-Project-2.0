import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Role, 
  ClassSession, 
  AppNotification, 
  AttendanceRecord, 
  UserProfile, 
  AccessibilityConfig, 
  FacultyStatus, 
  Enrollment,
  Announcement,
  LeaveRequest
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
import SettingsPage from './components/Settings';
import { 
  Wifi, 
  WifiOff, 
  Type, 
  Settings, 
  X, 
  RefreshCw, 
  CheckCircle,
  HelpCircle,
  Bell,
  LayoutDashboard,
  CalendarDays,
  Scan,
  MessageSquare,
  Users,
  Inbox,
  UserCircle,
  AlertTriangle,
  Info
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
  // Global App-level Toast System
  const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'warning' | 'info' | 'error' } | null>(null);

  React.useEffect(() => {
    (window as any).showToast = (message: string, type: 'success' | 'warning' | 'info' | 'error' = 'success') => {
      setToast({ message, type });
    };
    return () => {
      delete (window as any).showToast;
    };
  }, []);

  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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
    const raw: AppNotification[] = cached ? JSON.parse(cached) : INITIAL_NOTIFICATIONS;
    const seen = new Set<string>();
    return raw.filter(n => {
      if (!n || !n.id || seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    });
  });

  const [facultyStatuses, setFacultyStatuses] = React.useState<FacultyStatus[]>(() => {
    const cached = safeStorage.getItem('cp_faculty_statuses');
    return cached ? JSON.parse(cached) : INITIAL_FACULTY_STATUSES;
  });

  const [excuseLetters, setExcuseLetters] = React.useState<LeaveRequest[]>(() => {
    const cached = safeStorage.getItem('classpulse_student_leaves');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: 'LV-491',
        studentId: '2023-10492',
        studentName: 'Jose Rizal',
        classId: 'class-1',
        className: 'Introduction to Computer Science',
        startDate: '2026-06-12',
        endDate: '2026-06-14',
        reason: 'Severe medical flu condition with doctor confirmation.',
        status: 'pending',
        createdAt: new Date().toISOString(),
        attachmentName: 'medical_certificate.pdf'
      }
    ];
  });

  React.useEffect(() => {
    safeStorage.setItem('classpulse_student_leaves', JSON.stringify(excuseLetters));
  }, [excuseLetters]);

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

  const [compactMode, setCompactMode] = React.useState(() => {
    return safeStorage.getItem('cp_pref_compact_mode') === 'true';
  });

  const [colorAccent, setColorAccent] = React.useState(() => {
    return safeStorage.getItem('cp_pref_color_accent') || 'emerald';
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
          id: 'notif-sync-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
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

  const getBottomNavItems = () => {
    if (!user) return [];
    switch (user.role) {
      case 'student':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'schedule', label: 'Schedule', icon: CalendarDays },
          { id: 'attendance', label: 'QR Scan', icon: Scan },
          { id: 'messages', label: 'Messages', icon: MessageSquare }
        ];
      case 'faculty':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'schedule-editor', label: 'Classes', icon: CalendarDays },
          { id: 'qr-generator', label: 'QR Code', icon: Scan },
          { id: 'excuse-inbox', label: 'Excuses', icon: Inbox }
        ];
      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'schedule-editor', label: 'Schedules', icon: CalendarDays },
          { id: 'profile', label: 'Profile', icon: UserCircle }
        ];
    }
  };

  // Student logs attendance via QR code simulation scan
  const handleRecordAttendance = (classId: string, status: 'present' | 'late') => {
    const matchedClass = classes.find(c => c.id === classId);
    if (!matchedClass) return;

    // A. AUTOMATIC ENROLLMENT SERVICE INTERCEPTOR
    const existingEnrollment = enrollments.find(
      e => e.classId === classId && (e.studentId === user?.studentId || e.studentEmail === user?.email)
    );

    if (existingEnrollment) {
      if (existingEnrollment.deletedByStudent) {
        // Automatically restore!
        setEnrollments(prev => prev.map(e => {
          if (e.id === existingEnrollment.id) {
            return { ...e, deletedByStudent: false };
          }
          return e;
        }));
        
        const restoreNotif: AppNotification = {
          id: 'notif-restore-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
          title: 'Class Enrollment Restored',
          message: `QR Scan success: Restored your active enrollment for ${matchedClass.code} (${matchedClass.name}) and connected your attend record history cleanly!`,
          timestamp: 'Just Now',
          type: 'success',
          read: false
        };
        setNotifications(prev => [restoreNotif, ...prev]);
        speakText(`Resumed class enrollment for ${matchedClass.name}`, accessibility.readAloud);
      }
    } else if (user && user.role === 'student') {
      const newEnrolID = 'enr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
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
        id: 'notif-autoenr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
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
      id: 'rec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
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
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
      title: status === 'late' ? 'Checked in late' : 'Checked In successfully',
      message: msg,
      timestamp: 'Just Now',
      type: alertType,
      read: false
    };

    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleDropSubject = (classId: string) => {
    setEnrollments(prev => prev.map(e => {
      if (e.classId === classId && (e.studentId === user?.studentId || e.studentEmail === user?.email)) {
        return { ...e, deletedByStudent: true };
      }
      return e;
    }));
    
    const dropNotif: AppNotification = {
      id: 'notif-drop-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
      title: 'Subject Removed',
      message: `You dropped your local registration for this class. Note that your official register logs and attendance records with the Faculty remains fully unchanged and secure.`,
      timestamp: 'Just Now',
      type: 'warning',
      read: false
    };
    setNotifications(prev => [dropNotif, ...prev]);
    speakText("Subject removed from student dashboard. Faculty record remains unaffected.", accessibility.readAloud);
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
      id: 'class-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
    };
    setClasses(prev => [freshClass, ...prev]);

    // Add alert
    const newNotif: AppNotification = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
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
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
      title: notifTitle,
      message: statusMessages[status],
      timestamp: 'Just Now',
      type: 'info',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Shared Attendance Correction Action
  const handleUpdateAttendanceRecord = (recordId: string, status: 'present' | 'late' | 'absent') => {
    setAttendanceRecords(prev => prev.map(rec => rec.id === recordId ? { ...rec, status } : rec));
    
    // Find record context for logging
    const target = attendanceRecords.find(r => r.id === recordId);
    if (target) {
      const newNotif: AppNotification = {
        id: 'notif-corr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
        title: 'Attendance Corrected',
        message: `Status corrected: Student ${target.studentName || 'Record'} is now marked as ${status.toUpperCase()} in ${target.classCode}.`,
        timestamp: 'Just Now',
        type: 'info',
        read: false
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  // Shared Excuse Status validation Action
  const handleUpdateExcuseStatus = (id: string, status: 'pending' | 'valid' | 'invalid' | 'approved' | 'rejected') => {
    const finalStatus = status === 'approved' || status === 'valid' ? 'valid' : status === 'rejected' || status === 'invalid' ? 'invalid' : 'pending';
    setExcuseLetters(prev => prev.map(ex => ex.id === id ? { ...ex, status: finalStatus as any } : ex));
    
    const target = excuseLetters.find(e => e.id === id);
    if (target) {
      const newNotif: AppNotification = {
        id: 'notif-exced-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
        title: 'Excuse Decision Logged',
        message: `Excuse Letter ${id} (Student: ${target.studentName}) marked as ${finalStatus.toUpperCase()}.`,
        timestamp: 'Just Now',
        type: 'success',
        read: false
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    speakText("Cleared all notifications", accessibility.readAloud);
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    speakText("Marked all notifications as read", accessibility.readAloud);
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
      className={`${getThemeClass(accessibility.theme)} theme-accent-${colorAccent} ${compactMode ? 'app-compact-mode' : ''}`}
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
            unreadMessages={(() => {
              try {
                const cached = localStorage.getItem('cp_chat_messages_v2');
                if (!cached) return 2; // Default starting unread seeds count
                const msgs = JSON.parse(cached);
                const myId = user.role === 'student' ? (user.studentId || '2023-10492') : (user.facultyId || 'fac-1');
                return msgs.filter((m: any) => m.senderId !== myId && !m.read).length;
              } catch (e) {
                return 0;
              }
            })()}
            pendingExcuseCount={excuseLetters.filter(e => e.status === 'pending').length}
            accessibility={accessibility}
          />

          {/* Primary View Workspace */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            
            {/* Top Operational bar */}
            <header className="px-6 py-4 border-b flex items-center justify-between gap-4 shrink-0 bg-white/85 dark:bg-zinc-950/80 border-zinc-200 dark:border-zinc-850/80 backdrop-blur-md text-zinc-900 dark:text-zinc-100">
              
              {/* Left Header Context title display matching image theme roles */}
              <div className="flex items-center gap-3 text-left">
                <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border shadow-xs ${
                  user.role === 'student' ? 'bg-[#03213D] text-white border-[#03213D]/20' :
                  user.role === 'faculty' ? 'bg-emerald-600 text-white border-emerald-500/20' :
                  'bg-[#CC762A] text-white border-[#CC762A]/20'
                }`}>
                  {user.role === 'student' ? 'Student' : user.role === 'faculty' ? 'Faculty' : 'Admin'}
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

                {/* Notification Bell routing button instead of settings */}
                <button
                  onClick={() => {
                    setActiveScreen('notifications');
                    speakText("Navigating to notification center", accessibility.readAloud);
                  }}
                  type="button"
                  className={`p-2.5 rounded-xl border flex items-center justify-center cursor-pointer transition-all relative border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 ${
                    activeScreen === 'notifications'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 font-extrabold shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                  title="Notification Center & System Logs"
                >
                  <Bell className="w-4.5 h-4.5" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-550 bg-red-600 text-white rounded-full flex items-center justify-center text-[8px] font-black leading-none font-mono">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
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
            <main className="p-6 md:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto space-y-6 flex-1">
              
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
              {activeScreen === 'settings' ? (
                <SettingsPage
                  userProfile={user}
                  accessibility={accessibility}
                  onUpdateProfile={handleUpdateProfile}
                  onUpdateAccessibility={setAccessibility}
                  onUpdateCompactMode={setCompactMode}
                  onUpdateColorAccent={setColorAccent}
                  setScreen={setActiveScreen}
                />
              ) : (
                <>
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
                      onClearAllNotifications={handleClearAllNotifications}
                      onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
                      announcements={announcements}
                      excuseLetters={excuseLetters}
                      onAddExcuseLetter={(newReq: any) => setExcuseLetters(prev => [newReq, ...prev])}
                      onDropSubject={handleDropSubject}
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
                      onClearAllNotifications={handleClearAllNotifications}
                      onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
                      announcements={announcements}
                      excuseLetters={excuseLetters}
                      onUpdateExcuseStatus={handleUpdateExcuseStatus}
                      onUpdateAttendanceRecord={handleUpdateAttendanceRecord}
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
                      onUpdateAttendanceRecord={handleUpdateAttendanceRecord}
                    />
                  )}
                </>
              )}

            </main>

            {/* Mobile Bottom Navigation Bar (Deeply Adaptive, Thumb-Friendly) */}
            <div className="md:hidden fixed bottom-4 left-4 right-4 z-40 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-850 px-3 py-2 flex justify-around items-center h-16 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
              {getBottomNavItems().map(item => {
                const Icon = item.icon;
                const isActive = activeScreen === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveScreen(item.id);
                      speakText(`Switched to ${item.label}`, accessibility.readAloud);
                    }}
                    type="button"
                    className={`flex flex-col items-center justify-center gap-1 transition-all flex-1 py-1 cursor-pointer scale-100 active:scale-95 ${
                      isActive 
                        ? 'text-emerald-500 font-black' 
                        : 'text-zinc-450 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5] text-emerald-500' : 'stroke-2 text-zinc-450 dark:text-zinc-450'}`} />
                    <span className="text-[9px] font-black tracking-wider uppercase">{item.label}</span>
                  </button>
                );
              })}
            </div>

          </div>

        </div>
      )}

      {/* Dynamic Toast Alerts Overlay */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full p-4 rounded-2xl shadow-xl border bg-white dark:bg-zinc-950 backdrop-blur-md flex items-start gap-3 text-left border-zinc-250 dark:border-zinc-805"
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
              {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-500" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-indigo-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                {toast.type === 'success' ? 'System Success' : toast.type === 'warning' ? 'Security Warning' : toast.type === 'error' ? 'Operation Failure' : 'Core Report'}
              </h5>
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5 leading-snug">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-250 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer shrink-0"
              title="Close Toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
