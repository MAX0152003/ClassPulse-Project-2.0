import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClassSession, 
  AppNotification, 
  UserProfile, 
  AccessibilityConfig,
  Enrollment,
  AttendanceRecord,
  FacultyStatus,
  Announcement
} from '../types';
import { 
  Plus, 
  QrCode, 
  Clock, 
  MapPin, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  CheckCircle, 
  Users, 
  Check, 
  AlertCircle,
  Calendar,
  Layers,
  Sparkles,
  Camera,
  UploadCloud,
  TrendingUp,
  UserCheck,
  MessageSquare,
  Eye,
  EyeOff,
  BellRing,
  Search,
  Inbox,
  Download,
  SlidersHorizontal
} from 'lucide-react';
import { speakText } from './AccessibilitySettings';
import AlarmClock from './AlarmClock';
import SubjectDetailModal from './SubjectDetailModal';
import Messages from './Messages';

interface DashboardFacultyProps {
  activeScreen: string;
  setScreen: (screen: string) => void;
  classes: ClassSession[];
  onAddClass: (newClass: Omit<ClassSession, 'id'>) => void;
  onEditClass: (updatedClass: ClassSession) => void;
  onDeleteClass: (classId: string) => void;
  userProfile: UserProfile;
  facultyStatus: 'available' | 'in-class' | 'unavailable';
  onChangeFacultyStatus: (status: 'available' | 'in-class' | 'unavailable') => void;
  accessibility: AccessibilityConfig;
  enrollments: Enrollment[];
  attendanceRecords: AttendanceRecord[];
  notifications: AppNotification[];
  facultyStatuses: FacultyStatus[];
  onUpdateProfile: (updated: UserProfile) => void;
  onClearAllNotifications?: () => void;
  onMarkAllNotificationsRead?: () => void;
  announcements?: Announcement[];
  excuseLetters?: any[];
  onUpdateExcuseStatus?: (id: string, status: 'pending' | 'valid' | 'invalid' | 'approved' | 'rejected') => void;
  onUpdateAttendanceRecord?: (recordId: string, status: 'present' | 'late' | 'absent') => void;
}

export default function DashboardFaculty({
  activeScreen,
  setScreen,
  classes,
  onAddClass,
  onEditClass,
  onDeleteClass,
  userProfile,
  facultyStatus,
  onChangeFacultyStatus,
  accessibility,
  enrollments,
  attendanceRecords,
  notifications,
  facultyStatuses,
  onUpdateProfile,
  onClearAllNotifications,
  onMarkAllNotificationsRead,
  announcements = [],
  excuseLetters = [],
  onUpdateExcuseStatus,
  onUpdateAttendanceRecord
}: DashboardFacultyProps) {
  
  // Bulletins Visibility toggle
  const [isBulletinsHidden, setIsBulletinsHidden] = React.useState<boolean>(() => {
    return localStorage.getItem('classpulse_faculty_bulletins_hidden') === 'true';
  });

  // Notifications filters & search
  const [notifSearch, setNotifSearch] = React.useState('');
  const [notifFilter, setNotifFilter] = React.useState<'all' | 'alerts' | 'updates'>('all');

  // Fast Class Search & Student Search states
  const [classSearchQuery, setClassSearchQuery] = React.useState('');
  const [studentSearchQuery, setStudentSearchQuery] = React.useState('');

  React.useEffect(() => {
    localStorage.setItem('classpulse_faculty_bulletins_hidden', String(isBulletinsHidden));
  }, [isBulletinsHidden]);

  // Timer for QR code attendance simulation
  const [timeLeft, setTimeLeft] = React.useState(300); // 5 minutes standard
  const [activeQRClass, setActiveQRClass] = React.useState<string>(classes[0]?.id || '');
  const [qrToken, setQrToken] = React.useState('QR_KEY_' + Math.random().toString(36).substring(4, 10).toUpperCase());
  const [qrIntervalId, setQrIntervalId] = React.useState<any>(null);

  // Subject Monitoring active ID state
  const [selectedMonitoringClassId, setSelectedMonitoringClassId] = React.useState<string>(classes[0]?.id || '');
  const [expandedStudentId, setExpandedStudentId] = React.useState<string | null>(null);

  // Faculty Alarm Simulation popup trigger states
  const [isFacultyAlarmOpen, setIsFacultyAlarmOpen] = React.useState(false);
  const [selectedAlarmClassId, setSelectedAlarmClassId] = React.useState<string>(classes[0]?.id || '');
  const [facultyAlarmRoom, setFacultyAlarmRoom] = React.useState('Room 201');

  // Sync state validities
  React.useEffect(() => {
    if (classes.length > 0) {
      if (!classes.some(c => c.id === selectedMonitoringClassId)) {
        setSelectedMonitoringClassId(classes[0].id);
      }
      if (!classes.some(c => c.id === selectedAlarmClassId)) {
        setSelectedAlarmClassId(classes[0].id);
      }
    }
  }, [classes, selectedMonitoringClassId, selectedAlarmClassId]);

  const activeMonClass = classes.find(c => c.id === selectedMonitoringClassId);
  const monEnrollments = enrollments.filter(e => e.classId === selectedMonitoringClassId);

  // Compute analytics data for active monitoring class
  const monClassRecords = attendanceRecords.filter(r => r.classId === selectedMonitoringClassId);

  const handleExportSelectedClassAttendance = () => {
    if (!activeMonClass) {
      speakText("No class is currently selected for export.", accessibility.readAloud);
      return;
    }
    
    const headers = ["Student ID", "Student Name", "Class Code", "Class Name", "Date", "Time", "Status"];
    const rows = monClassRecords.map(rec => [
      rec.studentId || "N/A",
      rec.studentName || "N/A",
      rec.classCode || activeMonClass.code,
      rec.className || activeMonClass.name,
      rec.date,
      rec.time,
      rec.status.toUpperCase()
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => {
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      }).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${activeMonClass.code}_Attendance_${activeMonClass.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    speakText(`Successfully exported attendance ledger for ${activeMonClass.name} to CSV`, accessibility.readAloud);
  };

  const handleExportAllFacultyAttendance = () => {
    const facultyClassIds = classes.map(c => c.id);
    const filteredRecords = attendanceRecords.filter(r => facultyClassIds.includes(r.classId));
    
    const headers = ["Student ID", "Student Name", "Class Code", "Class Name", "Date", "Time", "Status"];
    const rows = filteredRecords.map(rec => {
      const cls = classes.find(c => c.id === rec.classId);
      return [
        rec.studentId || "N/A",
        rec.studentName || "N/A",
        rec.classCode || (cls ? cls.code : "N/A"),
        rec.className || (cls ? cls.name : "N/A"),
        rec.date,
        rec.time,
        rec.status.toUpperCase()
      ];
    });
    
    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => {
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      }).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Faculty_Consolidated_Attendance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    speakText(`Successfully exported all assigned classes attendance records to CSV`, accessibility.readAloud);
  };

  const monClassPresents = monClassRecords.filter(r => r.status === 'present').length;
  const monClassLates = monClassRecords.filter(r => r.status === 'late').length;
  const monClassAbsents = monClassRecords.filter(r => r.status === 'absent').length;
  
  // Roster at risk (under 85% attendance rate)
  const monClassAtRisk = monEnrollments.filter(student => {
    const studentRecords = attendanceRecords.filter(
      r => r.classId === selectedMonitoringClassId && 
      (r.studentId === student.studentId || r.studentName === student.studentName)
    );
    const presentCount = studentRecords.filter(r => r.status === 'present').length;
    const lateCount = studentRecords.filter(r => r.status === 'late').length;
    const rate = studentRecords.length > 0 ? Math.round(((presentCount + lateCount) / studentRecords.length) * 100) : 100;
    return rate < 85;
  }).length;

  const totalMonRecords = monClassRecords.length;
  const monClassPresentsRate = totalMonRecords > 0 ? (monClassPresents / totalMonRecords) * 100 : 0;
  const monClassLatesRate = totalMonRecords > 0 ? (monClassLates / totalMonRecords) * 100 : 0;
  const monClassAbsentsRate = totalMonRecords > 0 ? (monClassAbsents / totalMonRecords) * 100 : 0;
  const monClassAtRiskRate = monEnrollments.length > 0 ? (monClassAtRisk / monEnrollments.length) * 100 : 0;

  const handleCommitFacultyAlarmUpdate = (status: 'attend' | 'cancel' | 'late') => {
    const matchedClass = classes.find(c => c.id === selectedAlarmClassId);
    if (!matchedClass) return;

    onEditClass({
      ...matchedClass,
      facultyStatusUpdate: status,
      room: facultyAlarmRoom,
      lastUpdateTimestamp: Date.now()
    });

    setIsFacultyAlarmOpen(false);
    speakText(`Class update status committed. Declared: ${status.toUpperCase()} in ${facultyAlarmRoom}`, accessibility.readAloud);
  };

  // Modal triggers
  const [selectedClassDetail, setSelectedClassDetail] = React.useState<ClassSession | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState<boolean>(false);
  const [hoveredFacultyTrendIndex, setHoveredFacultyTrendIndex] = React.useState<number | null>(null);

  // Form states for class adding/editing
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingClass, setEditingClass] = React.useState<ClassSession | null>(null);

  const [formCode, setFormCode] = React.useState('');
  const [formName, setFormName] = React.useState('');
  const [formStart, setFormStart] = React.useState('09:00 AM');
  const [formEnd, setFormEnd] = React.useState('10:30 AM');
  const [formRoom, setFormRoom] = React.useState('Room 201');
  const [formDays, setFormDays] = React.useState<string[]>(['MW']);

  // Profiles edit states
  const [profileName, setProfileName] = React.useState(userProfile.name);
  const [profileEmail, setProfileEmail] = React.useState(userProfile.email);
  const [profileAvatar, setProfileAvatar] = React.useState(userProfile.avatar);
  const [profileSavedMsg, setProfileSavedMsg] = React.useState(false);

  React.useEffect(() => {
    setProfileName(userProfile.name);
    setProfileEmail(userProfile.email);
    setProfileAvatar(userProfile.avatar);
  }, [userProfile]);

  // Interval timer for the broadcasted QR expiration count and automatic 15-sec rotation (Real-Time QR Codes!)
  React.useEffect(() => {
    let interval: any = null;
    let rotationInterval: any = null;

    if (activeScreen === 'qr-generator' && timeLeft > 0 && qrToken && qrToken !== 'STANDBY' && qrToken !== 'EXPIRED') {
      // 1. Expiration Countdown (ticks every 1 second)
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setQrToken('EXPIRED');
            speakText("Broadcast session expired.", accessibility.readAloud);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // 2. Dynamic Real-time Token Rotation (rotates every 15 seconds to ensure robust, secure scanning)
      rotationInterval = setInterval(() => {
        const now = new Date();
        const daysMap = ['A', 'MW', 'TTh', 'MW', 'TTh', 'FS', 'FS'];
        const todayGroup = daysMap[now.getDay()];
        const activeMatch = classes.find(c => c.days.includes(todayGroup) || c.days.includes('A')) || classes.find(c => c.id === activeQRClass) || classes[0];
        
        if (activeMatch) {
          const generatedKey = 'CODE_' + activeMatch.code.toUpperCase() + '_' + Math.random().toString(36).substring(4, 9).toUpperCase();
          
          // Propagate fresh security key rotation to parent class state
          onEditClass({
            ...activeMatch,
            qrToken: generatedKey,
            qrGeneratedAt: Date.now()
          });
          setQrToken(generatedKey);
        }
      }, 15000);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (rotationInterval) clearInterval(rotationInterval);
    };
  }, [activeScreen, timeLeft, qrToken, activeQRClass]);

  const handleCreateNewQrToken = () => {
    setQrToken('QR_KEY_' + Math.random().toString(36).substring(4, 10).toUpperCase());
    setTimeLeft(300); // Reset countdown timer
    speakText("New attendance QR key generated", accessibility.readAloud);
  };

  const handleOpenEditForm = (cls: ClassSession) => {
    setEditingClass(cls);
    setFormCode(cls.code);
    setFormName(cls.name);
    setFormStart(cls.startTime);
    setFormEnd(cls.endTime);
    setFormRoom(cls.room);
    setFormDays(cls.days);
    setIsFormOpen(true);
    speakText(`Editing class form for ${cls.name}`, accessibility.readAloud);
  };

  const handleOpenAddForm = () => {
    setEditingClass(null);
    setFormCode('');
    setFormName('');
    setFormStart('09:00 AM');
    setFormEnd('10:30 AM');
    setFormRoom('Room 201');
    setFormDays(['MW']);
    setIsFormOpen(true);
    speakText("Opening add class schedule form", accessibility.readAloud);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode || !formName) return;

    if (editingClass) {
      onEditClass({
        ...editingClass,
        code: formCode,
        name: formName,
        startTime: formStart,
        endTime: formEnd,
        room: formRoom,
        days: formDays
      });
      speakText("Class details updated successfully", accessibility.readAloud);
    } else {
      onAddClass({
        code: formCode,
        name: formName,
        startTime: formStart,
        endTime: formEnd,
        room: formRoom,
        days: formDays,
        facultyName: userProfile.name,
        facultyId: userProfile.facultyId || 'fac-1'
      });
      speakText("New class registry added", accessibility.readAloud);
    }

    setIsFormOpen(false);
  };

  const handleDeleteClick = (classId: string, code: string) => {
    if (window.confirm(`Are you absolutely sure you want to drop course ${code}?`)) {
      onDeleteClass(classId);
      speakText(`Class dropped successfully`, accessibility.readAloud);
    }
  };

  const handleDayToggle = (day: string) => {
    if (formDays.includes(day)) {
      setFormDays(prev => prev.filter(d => d !== day));
    } else {
      setFormDays(prev => [...prev, day]);
    }
  };

  const handleOpenSubjectDetails = (cls: ClassSession) => {
    setSelectedClassDetail(cls);
    setIsDetailModalOpen(true);
    speakText(`Opening course detail modal for ${cls.name}`, accessibility.readAloud);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileAvatar(reader.result as string);
        speakText("New profile photograph loaded. Submit form to commit.", accessibility.readAloud);
      };
      reader.readAsDataURL(file);
    }
  };

  // Stats Counters
  const totalClasses = classes.length;
  const currentStudentsCount = enrollments.length;

  return (
    <div className="space-y-6">

      <AnimatePresence mode="wait">
        {/* 1. FACULTY INSIGHTS DASHBOARD */}
        {activeScreen === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6 text-left"
          >
            {/* Welcome Header */}
          <div className="p-6 md:p-8 rounded-3xl relative overflow-hidden transition-all duration-300 bg-gradient-to-br from-indigo-900 via-zinc-900 to-emerald-950 text-white shadow-xl shadow-emerald-500/5">
            <div className="relative z-10 space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
                Faculty Command Hub
              </span>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                Welcome Back, Professor {userProfile.name}!
              </h2>
              <p className="text-white/80 text-xs max-w-xl leading-relaxed">
                Manage your academic curriculum, broadcast time-bound QR keys to enrolled students, and keep track of live campus consultation availability coordinates.
              </p>
            </div>
          </div>

          {/* Targeted Administrative Announcements */}
          {announcements.filter(ann => ann.target === 'all' || ann.target === 'faculty').length > 0 && (
            isBulletinsHidden ? (
              <div className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/[0.02] border border-amber-500/10 flex items-center justify-between text-left animate-fade-in">
                <div className="flex items-center gap-2.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>Administrative Bulletins minimized ({announcements.filter(ann => ann.target === 'all' || ann.target === 'faculty').length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsBulletinsHidden(false);
                    speakText("University Bulletins expanded.", accessibility.readAloud);
                  }}
                  className="inline-flex items-center gap-1.5 py-1 px-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition-all cursor-pointer select-none active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Unhide Bulletins
                </button>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/[0.02] border border-amber-500/15 text-amber-950 dark:text-amber-300 space-y-3 text-left animate-fade-in relative">
                <div className="flex items-center justify-between gap-4">
                  <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-550 bg-amber-500 animate-pulse" />
                    University Bulletins ({announcements.filter(ann => ann.target === 'all' || ann.target === 'faculty').length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setIsBulletinsHidden(true);
                      speakText("Administrative Bulletins hidden/minimized.", accessibility.readAloud);
                    }}
                    className="inline-flex items-center gap-1.5 py-1 px-2 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer select-none active:scale-95"
                    title="Hide and minimize bulletins card"
                  >
                    <EyeOff className="w-3 h-3" />
                    Hide
                  </button>
                </div>
                <div className="space-y-3 divide-y divide-amber-500/10">
                  {announcements
                    .filter(ann => ann.target === 'all' || ann.target === 'faculty')
                    .map((ann) => (
                      <div key={ann.id} className="pt-3 first:pt-0">
                        <h5 className="text-xs font-extrabold text-amber-600 dark:text-amber-400">{ann.title}</h5>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed font-sans">{ann.content}</p>
                        <span className="text-[8px] text-zinc-400 dark:text-zinc-500 font-mono tracking-wider block mt-1 uppercase">Issued {new Date(ann.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                </div>
              </div>
            )
          )}

          {/* High Fidelity Faculty Status & Statistics Suite */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Faculty status indicator card */}
            <div className="lg:col-span-4 p-5 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-850/80 shadow-[0_2px_12px_rgba(0,0,0,0.01)] flex flex-col justify-between space-y-4">
              <div className="flex items-center gap-3">
                <img 
                  src={userProfile.avatar} 
                  alt={userProfile.name} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/20"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100">{userProfile.name}</h4>
                  <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-zinc-400">LECTURER COORDINATOR</span>
                </div>
              </div>

              {/* Status Indicator Panel */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-150 dark:border-zinc-850 space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Active Campus Status</span>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                    facultyStatus === 'available' ? 'bg-emerald-500/10 text-emerald-555' :
                    facultyStatus === 'in-class' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-red-500/10 text-red-555'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    {facultyStatus}
                  </span>
                </div>

                <div className="flex gap-1.5 mt-2">
                  {[
                    { id: 'available', label: 'Available', color: 'emerald' },
                    { id: 'in-class', label: 'In Class', color: 'amber' },
                    { id: 'unavailable', label: 'Away', color: 'red' }
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => {
                        onChangeFacultyStatus(st.id as any);
                        speakText(`Status updated to ${st.label}`, accessibility.readAloud);
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-[9px] font-extrabold uppercase transition-all border cursor-pointer text-center ${
                        facultyStatus === st.id
                          ? st.color === 'emerald' ? 'bg-emerald-500 text-black border-emerald-500 font-extrabold' :
                            st.color === 'amber' ? 'bg-amber-500 text-black border-amber-500 font-extrabold' :
                            'bg-red-500 text-white border-red-500 font-extrabold'
                          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-650 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-zinc-400 leading-normal">
                Updating your status alerts students in your active rosters through schedule broadcasts.
              </p>
            </div>

            {/* Right: Quick Stats Meters */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="p-5 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-850/80 flex flex-col justify-between shadow-[0_2px_12px_rgba(0,0,0,0.01)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-500/[0.02] rounded-full blur-2xl group-hover:scale-110 transition-transform" />
                <div className="space-y-1 text-left relative z-10">
                  <span className="text-[9px] font-mono font-black uppercase tracking-widest text-zinc-400">Class Statistics</span>
                  <h4 className="text-3xl font-black font-mono text-zinc-900 dark:text-zinc-100 mt-2">{totalClasses} Sections</h4>
                  <p className="text-xs text-zinc-500">Allocated across {classes.reduce((acc, c) => acc + c.days.length, 0)} schedule intervals week-round.</p>
                </div>
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-[10px] text-zinc-400 mt-4 relative z-10">
                  <span>Room Allocation List</span>
                  <span className="font-bold underline text-emerald-550 dark:text-emerald-450 cursor-pointer" onClick={() => setScreen('schedules')}>Inspect Rooms</span>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-850/80 flex flex-col justify-between shadow-[0_2px_12px_rgba(0,0,0,0.01)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/[0.02] rounded-full blur-2xl group-hover:scale-110 transition-transform" />
                <div className="space-y-1 text-left relative z-10">
                  <span className="text-[9px] font-mono font-black uppercase tracking-widest text-zinc-400">Total Rosters Count</span>
                  <h4 className="text-3xl font-black font-mono text-zinc-900 dark:text-zinc-100 mt-2">{currentStudentsCount} Students</h4>
                  <p className="text-xs text-zinc-500">Regularly attending classes. Average active scan tracking speed is <b>1.8s / student</b>.</p>
                </div>
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-[10px] text-zinc-400 mt-4 relative z-10">
                  <span className="text-emerald-500 font-extrabold flex items-center gap-0.5">• Term average: 88.5%</span>
                  <span className="text-emerald-555 font-bold cursor-pointer" onClick={() => setScreen('students-monitoring')}>View Risk Analysis</span>
                </div>
              </div>

            </div>

          </div>

          {/* Full-Width Performance Analytics and Custom Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Attendance Trends (Spline plot spline path) */}
            <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-850/80 shadow-[0_2px_12px_rgba(0,0,0,0.01)] space-y-4">
              <div>
                <span className="text-[10px] font-mono font-black uppercase text-zinc-400 tracking-widest">Attendance trends frequency</span>
                <h3 className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">Syllabus Completion & Scanning activity</h3>
                <p className="text-xs text-zinc-400 leading-normal mt-0.5">Time-based analysis of attendance scans registered over daily classes.</p>
              </div>

              {/* Attendance trends spline plot */}
              {(() => {
                const facultyAttendanceTrends = [
                  { label: 'Monday', shortLabel: 'M', value: 60, scans: 142, averageTime: '08:42 AM', x: 20, y: 120, date: 'Monday, June 8, 2026', syllabus: 'Intro & Course Overview' },
                  { label: 'Tuesday', shortLabel: 'T', value: 75, scans: 168, averageTime: '08:48 AM', x: 100, y: 80, date: 'Tuesday, June 9, 2026', syllabus: 'Lecture 1: Database Schemas' },
                  { label: 'Wednesday', shortLabel: 'W', value: 85, scans: 175, averageTime: '08:45 AM', x: 180, y: 55, date: 'Wednesday, June 10, 2026', syllabus: 'Lab session: Basic CRUD Queries' },
                  { label: 'Thursday', shortLabel: 'T', value: 89, scans: 191, averageTime: '08:41 AM', x: 260, y: 50, date: 'Thursday, June 11, 2026', syllabus: 'Lecture 2: Indexing & Performance' },
                  { label: 'Friday', shortLabel: 'F', value: 94, scans: 198, averageTime: '08:38 AM', x: 340, y: 20, date: 'Friday, June 12, 2026', syllabus: 'Topic Quiz & Weekly Review' }
                ];

                return (
                  <div className="w-full h-44 rounded-2xl border border-zinc-150 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/30 p-3 relative flex items-end">
                    <svg viewBox="0 0 400 150" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="facAttendGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid lines */}
                      <line x1="10" y1="30" x2="390" y2="30" stroke="rgba(120,120,120,0.1)" strokeWidth="0.8" />
                      <line x1="10" y1="70" x2="390" y2="70" stroke="rgba(120,120,120,0.1)" strokeWidth="0.8" />
                      <line x1="10" y1="110" x2="390" y2="110" stroke="rgba(120,120,120,0.1)" strokeWidth="0.8" strokeDasharray="2 2" />

                      {/* Filled Area */}
                      <path d="M 20 120 L 100 80 L 180 55 L 260 50 L 340 20 L 340 135 L 20 135 Z" fill="url(#facAttendGrad)" />
                      
                      {/* Connected Line */}
                      <path d="M 20 120 L 100 80 L 180 55 L 260 50 L 340 20" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                      
                      {/* Interactive nodes */}
                      {facultyAttendanceTrends.map((d, idx) => {
                        const isHovered = hoveredFacultyTrendIndex === idx;
                        return (
                          <g key={idx}>
                            {/* Invisible touch area */}
                            <circle 
                              cx={d.x} 
                              cy={d.y} 
                              r="16" 
                              fill="transparent" 
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredFacultyTrendIndex(idx)}
                              onMouseLeave={() => setHoveredFacultyTrendIndex(null)}
                            />
                            {/* Inner hovered pulse ring */}
                            {isHovered && (
                              <circle 
                                cx={d.x} 
                                cy={d.y} 
                                r="8" 
                                fill="none" 
                                stroke="#10b981" 
                                strokeWidth="1.5" 
                                className="animate-ping opacity-60"
                              />
                            )}
                            {/* Center point circle */}
                            <circle 
                              cx={d.x} 
                              cy={d.y} 
                              r={isHovered ? 6 : 4} 
                              fill="#121212" 
                              stroke="#10b981" 
                              strokeWidth={isHovered ? 3 : 2} 
                            />
                            {/* Hover highlight text label */}
                            <text 
                              x={d.x} 
                              y={d.y - 12} 
                              fontSize="8" 
                              fontWeight="black" 
                              fill="#10b981" 
                              textAnchor="middle" 
                              className="font-mono"
                            >
                              {d.value}%
                            </text>
                          </g>
                        );
                      })}

                      {/* Day labels */}
                      <text x="20" y="142" fontSize="8" fill="#888">Monday</text>
                      <text x="100" y="142" fontSize="8" fill="#888">Tuesday</text>
                      <text x="180" y="142" fontSize="8" fill="#888">Wednesday</text>
                      <text x="260" y="142" fontSize="8" fill="#888">Thursday</text>
                      <text x="340" y="142" fontSize="8" fill="#888">Friday</text>
                    </svg>

                    {/* Highly Polished Interactive Precise Tooltip */}
                    {hoveredFacultyTrendIndex !== null && (() => {
                      const data = facultyAttendanceTrends[hoveredFacultyTrendIndex];
                      return (
                        <div 
                          className="absolute z-50 p-3 rounded-xl bg-white dark:bg-zinc-950/95 text-zinc-800 dark:text-white border border-zinc-200 dark:border-zinc-800 shadow-xl pointer-events-none transition-all duration-150 backdrop-blur-md flex flex-col gap-1 w-56 text-left"
                          style={{
                            left: `${(data.x / 400) * 100}%`,
                            bottom: `${(150 - data.y + 12) / 150 * 100}%`,
                            transform: 'translateX(-50%)',
                          }}
                        >
                          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-1 mb-1">
                            <span className="text-[9px] font-mono font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest">{data.label} (Week 4)</span>
                            <span className="text-[8px] font-mono text-zinc-400 dark:text-zinc-550">FACULTY CORE</span>
                          </div>
                          <p className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100">{data.date}</p>
                          <p className="text-[9.5px] italic text-zinc-600 dark:text-zinc-300">"{data.syllabus}"</p>
                          <div className="grid grid-cols-2 gap-2.5 mt-1 border-t border-zinc-100 dark:border-zinc-900 pt-1.5 font-mono text-[9px]">
                            <div>
                              <p className="text-[7px] text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">Scans Today</p>
                              <p className="font-extrabold text-zinc-800 dark:text-zinc-200">{data.scans} students</p>
                            </div>
                            <div>
                              <p className="text-[7px] text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">Avg Check-in</p>
                              <p className="font-extrabold text-amber-600 dark:text-amber-400">{data.averageTime}</p>
                            </div>
                          </div>
                          <p className="text-[8px] text-zinc-500 dark:text-zinc-450 mt-1 leading-normal border-t border-zinc-100 dark:border-zinc-900/50 pt-1">
                            Attendance Rate: <strong className="text-emerald-500 dark:text-emerald-400 text-[10px]">{data.value}%</strong>
                          </p>
                          <div className="absolute left-1/2 bottom-0 w-2 h-2 bg-white dark:bg-zinc-950 border-r border-b border-zinc-200 dark:border-zinc-805 transform -translate-x-1/2 translate-y-1/2 rotate-45" />
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}
            </div>            {/* Student Performance Analytics */}
            <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-850/80 shadow-[0_2px_12px_rgba(0,0,0,0.01)] space-y-4">
              <div>
                <span className="text-[10px] font-mono font-black uppercase text-zinc-400 tracking-widest">Performance Analysis</span>
                <h3 className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">Student Performance rosters</h3>
                <p className="text-xs text-zinc-400 leading-normal mt-0.5">Visual representation of general roster standings in term evaluations.</p>
              </div>

              {(() => {
                const totalStudentsInClass = monEnrollments.length;
                
                const passingCount = monEnrollments.filter(st => {
                  const recs = attendanceRecords.filter(r => r.classId === selectedMonitoringClassId && (r.studentId === st.studentId || r.studentName === st.studentName));
                  const pres = recs.filter(r => r.status === 'present').length;
                  const late = recs.filter(r => r.status === 'late').length;
                  const rate = recs.length > 0 ? Math.round(((pres + late) / recs.length) * 100) : 100;
                  return rate >= 85;
                }).length;

                const borderlineCount = monEnrollments.filter(st => {
                  const recs = attendanceRecords.filter(r => r.classId === selectedMonitoringClassId && (r.studentId === st.studentId || r.studentName === st.studentName));
                  const pres = recs.filter(r => r.status === 'present').length;
                  const late = recs.filter(r => r.status === 'late').length;
                  const rate = recs.length > 0 ? Math.round(((pres + late) / recs.length) * 100) : 100;
                  return rate >= 75 && rate < 85;
                }).length;

                const warningCount = (totalStudentsInClass - passingCount - borderlineCount) >= 0 
                  ? Math.max(0, totalStudentsInClass - passingCount - borderlineCount) 
                  : 0;

                const passPercent = totalStudentsInClass > 0 ? Math.round((passingCount / totalStudentsInClass) * 100) : 84;
                const borderPercent = totalStudentsInClass > 0 ? Math.round((borderlineCount / totalStudentsInClass) * 100) : 11;
                const warnPercent = totalStudentsInClass > 0 ? Math.max(0, 100 - passPercent - borderPercent) : 5;

                const stats = [
                  { name: 'Passing (85% - 100% attendance)', count: totalStudentsInClass > 0 ? passingCount : 4, percent: passPercent, color: 'emerald' },
                  { name: 'Borderline Range (75% - 85% attendance)', count: totalStudentsInClass > 0 ? borderlineCount : 2, percent: borderPercent, color: 'amber' },
                  { name: 'Warning/At-Risk (<75% attendance)', count: totalStudentsInClass > 0 ? warningCount : 1, percent: warnPercent, color: 'red' }
                ];

                return (
                  <div className="space-y-3.5 pt-1">
                    {stats.map((stat, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-zinc-700 dark:text-zinc-200">{stat.name}</span>
                          <span className="font-mono text-zinc-400">{stat.count} students ({stat.percent}%)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden relative">
                          <div 
                            className={`h-full rounded-full ${
                              stat.color === 'emerald' ? 'bg-emerald-500' :
                              stat.color === 'amber' ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${stat.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Class Cards list */}
            <div className="lg:col-span-8 space-y-4">
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-900">
                  <div>
                    <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">Assigned Curriculums</h3>
                    <p className="text-xs text-zinc-400">Click any card to inspect active student registries and attendance trends</p>
                  </div>
                  <div className="relative w-full md:max-w-xs shrink-0 select-none">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 pointer-events-none">
                      <Search className="w-3.5 h-3.5 text-emerald-500" />
                    </span>
                    <input
                      type="text"
                      className="w-full pl-8 pr-8 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-205 dark:border-zinc-800 focus:border-emerald-500 outline-none text-zinc-800 dark:text-zinc-200 font-bold"
                      placeholder="Fast search classes..."
                      value={classSearchQuery}
                      onChange={(e) => setClassSearchQuery(e.target.value)}
                    />
                    {classSearchQuery && (
                      <button 
                        onClick={() => setClassSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-650"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                {(() => {
                  const filtered = classes.filter(cls => 
                    cls.name.toLowerCase().includes(classSearchQuery.toLowerCase()) ||
                    cls.code.toLowerCase().includes(classSearchQuery.toLowerCase())
                  );

                  if (filtered.length === 0) {
                    return (
                      <div className="py-12 text-center text-zinc-400 dark:text-zinc-500 text-xs font-medium">
                        No courses match "{classSearchQuery}"
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      {filtered.map(cls => {
                        const enrolledCount = enrollments.filter(e => e.classId === cls.id).length;
                        return (
                          <div
                            key={cls.id}
                            onClick={() => handleOpenSubjectDetails(cls)}
                            className="p-5 pl-7 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs hover:shadow-md transition-all cursor-pointer text-left relative overflow-hidden group hover:border-emerald-500/30"
                          >
                            {/* High elegance left-border ribbon accentuating the status */}
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 transition-transform duration-300 group-hover:scale-y-110" />
                            
                            <span className="text-[9px] font-black tracking-widest px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold uppercase">
                              {cls.code}
                            </span>
                            
                            <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight mt-3 truncate">{cls.name}</h4>
                            
                            <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-850">
                              <span className="flex items-center gap-1 font-semibold text-zinc-650 dark:text-zinc-350">
                                <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                {cls.startTime}
                              </span>
                              <span className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg text-emerald-700 dark:text-emerald-400 font-extrabold border border-emerald-500/10">
                                <Users className="w-3.5 h-3.5 text-emerald-500" /> {enrolledCount} Students
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Merged Pre-Class Clock & Status Broadcast card */}
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-sm text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-150 dark:border-zinc-900">
                  <div>
                    <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-emerald-500 animate-pulse" />
                      Pre-Class Clock & Status Broadcast
                    </h3>
                    <p className="text-xs text-zinc-400">Merged Pre-Class Alert system. Automatically prompts status update options 5 minutes before scheduled classes.</p>
                  </div>
                </div>

                {!isFacultyAlarmOpen ? (
                  <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 flex items-center justify-center text-lg">
                      ⏰
                    </div>
                    <div className="max-w-md space-y-1">
                      <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-205">Broadcast Standby</h4>
                      <p className="text-xs text-zinc-500">Currently no active pre-class countdown is running. Status option prompts and room modification inputs appear 5 minutes before scheduled class times.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const firstClass = classes[0];
                        if (firstClass) {
                          setSelectedAlarmClassId(firstClass.id);
                          setFacultyAlarmRoom(firstClass.room);
                        }
                        setIsFacultyAlarmOpen(true);
                        speakText("Simulating 5 minute countdown alarm clock before class starts.", accessibility.readAloud);
                      }}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all active:scale-95 flex items-center gap-2 shadow-sm"
                    >
                      <Sparkles className="w-4 h-4" />
                      Simulate 5m Before Class
                    </button>
                  </div>
                ) : (
                  <div className="pt-4 space-y-5">
                    {/* Active Countdown Header */}
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-extrabold animate-pulse">
                        <Clock className="w-4 h-4 animate-spin" />
                        <span>CLASS COMMENCEMENT COUNTDOWN</span>
                      </div>
                      <span className="font-mono text-zinc-900 dark:text-zinc-100 font-black px-2 py-0.5 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-850">
                        05:00 MINS LEFT
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Commencing Subject Dropdown */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-450 dark:text-zinc-400 uppercase tracking-wider">Commencing Curriculum Class</label>
                        <select
                          value={selectedAlarmClassId}
                          onChange={(e) => {
                            setSelectedAlarmClassId(e.target.value);
                            const found = classes.find(c => c.id === e.target.value);
                            if (found) setFacultyAlarmRoom(found.room);
                          }}
                          className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-55 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-105 outline-none font-bold"
                        >
                          {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.code}: {c.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Room Change field */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-450 dark:text-zinc-400 uppercase tracking-wider">Room Modification Option</label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            value={facultyAlarmRoom}
                            onChange={(e) => setFacultyAlarmRoom(e.target.value)}
                            placeholder="e.g. Room 303-C"
                            className="w-full text-xs pl-9 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-55 dark:bg-zinc-900 outline-none text-zinc-900 dark:text-zinc-105 font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick Fast Actions Row */}
                    <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Declare Attendance & Update Status</span>
                      <div className="grid grid-cols-3 gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleCommitFacultyAlarmUpdate('attend')}
                          className="p-3 bg-emerald-500 hover:bg-emerald-400 cursor-pointer rounded-xl text-black font-black uppercase text-[10px] tracking-wider text-center transition-transform active:scale-95"
                        >
                          Attend
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCommitFacultyAlarmUpdate('cancel')}
                          className="p-3 bg-red-500 hover:bg-red-400 cursor-pointer rounded-xl text-white font-black uppercase text-[10px] tracking-wider text-center transition-transform active:scale-95"
                        >
                          Cancel Class
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCommitFacultyAlarmUpdate('late')}
                          className="p-3 bg-amber-500 hover:bg-amber-400 cursor-pointer rounded-xl text-black font-black uppercase text-[10px] tracking-wider text-center transition-transform active:scale-95"
                        >
                          Late Arrival
                        </button>
                      </div>
                    </div>

                    <div className="text-[10.5px] text-zinc-400 flex items-center justify-between">
                      <span>Standards Protocol Sync active (auto-posts)</span>
                      <button
                        type="button"
                        onClick={() => setIsFacultyAlarmOpen(false)}
                        className="text-red-500 underline font-semibold cursor-pointer"
                      >
                        Bypass Prompt
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Sidebar Clock */}
            <div className="lg:col-span-4 space-y-4">
              <AlarmClock readAloudEnabled={accessibility.readAloud} />
              
              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 text-left">
                <h4 className="text-xs font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-550 dark:text-emerald-400" />
                  Direct QR Code Broadcasts
                </h4>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-normal mb-3">
                  Open the QR generation pane to cast a secure attendance token. Students can scans dynamically to enroll.
                </p>
                <button
                  onClick={() => setScreen('qr-generator')}
                  type="button"
                  className="w-full text-center py-2.5 bg-emerald-550 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black uppercase tracking-widest rounded-xl cursor-pointer transition-all active:scale-95"
                >
                  Open QR Generator
                </button>
              </div>
            </div>

          </div>
        </motion.div>
      )}

      {/* 2. SUBJECTS & SCHEDULE EDITOR SCREEN */}
      {activeScreen === 'schedule-editor' && (
        <motion.div
          key="schedule-editor"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6 text-left"
        >
          <div className="pb-1">
            <button 
              onClick={() => setScreen('dashboard')} 
              type="button"
              className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-zinc-50/80 dark:hover:bg-zinc-850 cursor-pointer transition-all active:scale-95 shadow-sm font-bold text-lg"
              title="Back"
            >
              ←
            </button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                <Calendar className="w-5.5 h-5.5 text-emerald-500" />
                Manage Course Curriculums
              </h2>
              <p className="text-xs text-zinc-400">Add, edit, or configure classroom configurations and schedules.</p>
            </div>

            <button
              onClick={handleOpenAddForm}
              type="button"
              className="px-4 py-2.5 bg-emerald-505 bg-emerald-500 text-black text-xs font-black uppercase tracking-wider rounded-xl hover:bg-emerald-400 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 shrink-0 stroke-[2.5]" />
              Add Class Term
            </button>
          </div>

          {/* Schedule Input Editor Form details */}
          {isFormOpen && (
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-md">
              <div className="flex justify-between items-center pb-3 border-b border-zinc-100 dark:border-zinc-900 mb-4">
                <h3 className="font-black text-sm uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  {editingClass ? 'Edit Class specifications' : 'Formulate a New Course class'}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  type="button"
                  className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-455 cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-450 dark:text-zinc-400 uppercase tracking-widest">Course Code</label>
                    <input
                      type="text"
                      placeholder="e.g. CS254"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      required
                      className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-450 dark:text-zinc-400 uppercase tracking-widest">Topic Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Distributed Computing"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                      className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-805 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-455 dark:text-zinc-400 uppercase tracking-widest">Start Hours</label>
                    <input
                      type="text"
                      placeholder="e.g. 09:30 AM"
                      value={formStart}
                      onChange={(e) => setFormStart(e.target.value)}
                      required
                      className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-455 dark:text-zinc-400 uppercase tracking-widest">End Hours</label>
                    <input
                      type="text"
                      placeholder="e.g. 11:00 AM"
                      value={formEnd}
                      onChange={(e) => setFormEnd(e.target.value)}
                      required
                      className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-455 dark:text-zinc-400 uppercase tracking-widest">Lecture Room / Gym</label>
                    <input
                      type="text"
                      placeholder="e.g. Room 303-C"
                      value={formRoom}
                      onChange={(e) => setFormRoom(e.target.value)}
                      required
                      className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-zinc-450 dark:text-zinc-400 uppercase tracking-widest">Scheduled Recurrence Days</label>
                  <div className="flex flex-wrap gap-2">
                    {['MW', 'TTh', 'FS', 'A'].map(day => {
                      const selected = formDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDayToggle(day)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                            selected 
                              ? 'bg-emerald-500 text-black' 
                              : 'bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 border border-zinc-200 dark:border-zinc-805 text-zinc-650 dark:text-zinc-300'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-500 text-black rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer hover:bg-emerald-400"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of active schedules */}
          {(() => {
            const todayIndex = new Date().getDay();
            const dayMap: Record<number, string> = {
              1: 'Mon',
              2: 'Tue',
              3: 'Wed',
              4: 'Thu',
              5: 'Fri',
              6: 'Sat',
              0: 'Sun'
            };
            const todayLabel = dayMap[todayIndex] || 'Mon';

            const todayClasses = classes.filter(cls => cls.days.includes(todayLabel));
            const otherClasses = classes.filter(cls => !cls.days.includes(todayLabel));

            const renderClassItem = (cls: typeof classes[0]) => {
              const studentRegisteredCount = enrollments.filter(e => e.classId === cls.id).length;
              return (
                <div 
                  key={cls.id}
                  className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-emerald-500/10 cursor-pointer"
                  onClick={() => handleOpenSubjectDetails(cls)}
                >
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-350 px-2.5 py-0.5 rounded">
                        {cls.code}
                      </span>
                      <h3 className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-zinc-100 hover:underline">{cls.name}</h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 mt-2.5">
                      <span className="flex items-center gap-1.5 font-medium text-zinc-600 dark:text-zinc-300">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        {cls.startTime} - {cls.endTime}
                      </span>
                      <span className="flex items-center gap-1.5 font-medium text-zinc-600 dark:text-zinc-300">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                        {cls.room}
                      </span>
                      <span className="text-[10px] bg-zinc-150 dark:bg-zinc-900 px-2.5 py-0.5 rounded font-black uppercase text-zinc-650 dark:text-zinc-400">
                        {cls.days.join(', ')}
                      </span>
                      <span className="text-[10px] bg-indigo-100/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded font-black uppercase">
                        {studentRegisteredCount} enrolled
                      </span>
                    </div>
                  </div>

                  {/* Operational actions - stopPropagation so click detail modal doesn't fire when deleting */}
                  <div className="flex items-center gap-2 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenEditForm(cls)}
                      type="button"
                      className="p-2.5 border border-zinc-200 dark:border-zinc-850 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 cursor-pointer"
                      title="Edit Class details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(cls.id, cls.code)}
                      type="button"
                      className="p-2.5 border border-red-200 dark:border-red-950/40 rounded-xl hover:bg-red-500/10 text-red-500 cursor-pointer"
                      title="Delete Class Schedule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            };

            return (
              <div className="space-y-6">
                {/* Today's Schedule */}
                {todayClasses.length > 0 && (
                  <div className="space-y-3 flex flex-col text-left">
                    <h4 className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Current Classes ({todayLabel})
                    </h4>
                    <div className="space-y-4">
                      {todayClasses.map(cls => renderClassItem(cls))}
                    </div>
                  </div>
                )}

                {/* Future/Other Schedules */}
                <div className="space-y-3 text-left">
                  {otherClasses.length > 0 && (
                    <h4 className="text-xs font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest pt-2">
                      Future Schedule
                    </h4>
                  )}
                  {otherClasses.length > 0 ? (
                    <div className="space-y-4">
                      {otherClasses.map(cls => renderClassItem(cls))}
                    </div>
                  ) : (
                    todayClasses.length === 0 && (
                      <p className="text-xs text-zinc-500 italic text-center">No classes scheduled.</p>
                    )
                  )}
                </div>
              </div>
            );
          })()}
        </motion.div>
      )}

      {/* 3. QR CODES ATTENDANCE PASSCODE GENERATOR VIEW */}
      {activeScreen === 'qr-generator' && (
        <motion.div
          key="qr-generator"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mx-auto space-y-6 text-left"
        >
          <div className="pb-1">
            <button 
              onClick={() => setScreen('dashboard')} 
              type="button"
              className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-zinc-50/80 dark:hover:bg-zinc-850 cursor-pointer transition-all active:scale-95 shadow-sm font-bold text-lg"
              title="Back"
            >
              ←
            </button>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-sm text-left">
            <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2 mb-4">
              <QrCode className="w-5.5 h-5.5 text-blue-600" />
              Dynamic Single-Use Attendance QR Generator
            </h2>
            
            {/* Auto Schedule detector card */}
            {(() => {
              const now = new Date();
              const daysMap = ['A', 'MW', 'TTh', 'MW', 'TTh', 'FS', 'FS'];
              const todayGroup = daysMap[now.getDay()];
              const matchedActive = classes.find(c => c.days.includes(todayGroup) || c.days.includes('A')) || classes[0];
              
              if (matchedActive) {
                return (
                  <div className="mb-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2.5 text-left">
                    <span className="text-lg mt-0.5 animate-bounce">🗓️</span>
                    <div>
                      <p className="font-extrabold text-blue-800 dark:text-blue-300">Active Scheduled Class Detected</p>
                      <p className="mt-0.5 leading-relaxed font-semibold text-zinc-700 dark:text-zinc-300">
                        Based on the current campus clock and days, we have automatically selected <strong className="font-black text-black dark:text-white bg-blue-500/10 px-1.5 py-0.5 rounded">{matchedActive.code}: {matchedActive.name}</strong> ({matchedActive.startTime}, room: {matchedActive.room}) as the target registrar subject.
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <div className="space-y-4">
              {/* Dropdown ONLY shown if no active class is currently timing-matched */}
              {(() => {
                const now = new Date();
                const daysMap = ['A', 'MW', 'TTh', 'MW', 'TTh', 'FS', 'FS'];
                const todayGroup = daysMap[now.getDay()];
                const hasMatch = classes.some(c => c.days.includes(todayGroup) || c.days.includes('A'));
                
                if (!hasMatch) {
                  return (
                    <div className="space-y-1.5 text-left">
                      <label className="block text-xs font-bold text-zinc-450 dark:text-zinc-400 uppercase tracking-widest">Select Target Curriculum Subject</label>
                      <select
                        value={activeQRClass}
                        onChange={(e) => {
                          setActiveQRClass(e.target.value);
                          speakText("Class target shifted, generate new code to initiate", accessibility.readAloud);
                        }}
                        className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-555 outline-none text-zinc-900 dark:text-zinc-100"
                      >
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.code} - {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }
                return null;
              })()}

              {/* QR Code matrix box representation */}
              <div className="p-4 border border-zinc-200 dark:border-zinc-850 rounded-2xl flex flex-col items-center justify-center space-y-4 relative bg-zinc-50 dark:bg-zinc-950/30">
                <div className="p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg shadow-xs border border-zinc-200 dark:border-zinc-800">
                  {qrToken && qrToken !== 'STANDBY' && qrToken !== 'EXPIRED' ? (
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=2&data=${encodeURIComponent(JSON.stringify({ classId: activeQRClass, qrToken: qrToken }))}`}
                      alt="ClassPulse Active Session QR Code"
                      className="w-40 h-40 rounded object-contain filter brightness-[0.92] contrast-125 dark:brightness-[0.78] dark:contrast-[1.10]"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-40 h-40 bg-zinc-150 dark:bg-zinc-900 flex flex-wrap p-2 rounded relative border border-zinc-200 dark:border-zinc-850 items-center justify-center">
                      <div className="absolute inset-0 border border-emerald-500/20 rounded animate-pulse" />
                      {/* Fake microcode block matrix grids */}
                      <div className="w-10 h-10 border-4 border-zinc-800 dark:border-zinc-200 bg-transparent absolute top-2 left-2" />
                      <div className="w-10 h-10 border-4 border-zinc-800 dark:border-zinc-200 bg-transparent absolute top-2 right-2" />
                      <div className="w-10 h-10 border-4 border-zinc-800 dark:border-zinc-200 bg-transparent absolute bottom-2 left-2" />
                      <div className="absolute inset-8 border border-zinc-400 dark:border-zinc-650 flex items-center justify-center text-zinc-500 font-mono text-[9px] font-black uppercase text-center">
                        STANDBY GENERATOR
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-center space-y-1">
                  <span className="text-xs font-mono font-black tracking-widest px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-lg">
                    {qrToken === 'STANDBY' ? 'READY - CLICK GENERATE' : qrToken}
                  </span>
                  
                  {qrToken !== 'STANDBY' && qrToken !== 'EXPIRED' && (
                    <div className="space-y-2">
                      <div className="text-[11px] text-zinc-450 dark:text-zinc-400 font-semibold mt-3 flex items-center justify-center gap-1 bg-zinc-100 dark:bg-zinc-900 px-3 py-1 rounded-full border border-zinc-250 dark:border-zinc-850">
                        <Clock className="w-3.5 h-3.5 text-blue-500 animate-[spin_4s_linear_infinite]" />
                        Class Session Expires in: <span className="font-mono text-blue-500 dark:text-blue-400 font-black ml-1 text-xs">{timeLeft}s (30m countdown)</span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const canvas = document.createElement('canvas');
                          canvas.width = 350;
                          canvas.height = 350;
                          const ctx = canvas.getContext('2d');
                          if (!ctx) return;
                          
                          ctx.fillStyle = '#0a0a0a';
                          ctx.fillRect(0, 0, 350, 350);
                          
                          ctx.strokeStyle = '#10b981';
                          ctx.lineWidth = 12;
                          ctx.strokeRect(20, 20, 310, 310);
                          
                          ctx.fillStyle = '#ffffff';
                          ctx.font = 'bold 16px "Inter", sans-serif';
                          ctx.textAlign = 'center';
                          ctx.fillText('CLASSPULSE OFFLINE PASS', 175, 55);
                          
                          ctx.fillStyle = '#10b981';
                          ctx.font = '12px "JetBrains Mono", monospace';
                          ctx.fillText(qrToken, 175, 305);
                          
                          const drawFinder = (cx: number, cy: number) => {
                            ctx.fillStyle = '#10b981';
                            ctx.fillRect(cx, cy, 32, 32);
                            ctx.fillStyle = '#0a0a0a';
                            ctx.fillRect(cx + 4, cy + 4, 24, 24);
                            ctx.fillStyle = '#10b981';
                            ctx.fillRect(cx + 8, cy + 8, 16, 16);
                          };
                          
                          drawFinder(85, 85);
                          drawFinder(85 + 180 - 32, 85);
                          drawFinder(85, 85 + 180 - 32);
                          
                          ctx.fillStyle = '#ffffff';
                          let seed = 0;
                          for (let i = 0; i < qrToken.length; i++) {
                            seed += qrToken.charCodeAt(i);
                          }
                          const cols = 21;
                          const dot = 180 / cols;
                          for (let r = 0; r < cols; r++) {
                            for (let c = 0; c < cols; c++) {
                              if ((r < 6 && c < 6) || (r < 6 && c > cols - 7) || (r > cols - 7 && c < 6)) {
                                continue;
                              }
                              const val = Math.sin(r * 45.3 + c * 89.1 + seed);
                              if (val > -0.15) {
                                ctx.fillRect(85 + c * dot, 85 + r * dot, dot - 1, dot - 1);
                              }
                            }
                          }
                          
                          const link = document.createElement('a');
                          link.download = `ClassPulse_${qrToken}_offline.png`;
                          link.href = canvas.toDataURL('image/png');
                          link.click();
                          speakText("Class token QR code exported as offline image file successfully.", accessibility.readAloud);
                        }}
                        className="py-1 px-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:text-emerald-500 rounded-lg text-[10px] font-extrabold uppercase tracking-widest border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer w-full"
                      >
                        📥 Export / Download Offline QR Code
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Rules and Limits warning card */}
              <div className="p-3.5 rounded-xl bg-orange-500/5 border border-orange-500/10 text-[10px] text-zinc-500 leading-relaxed font-semibold text-left">
                ⚠️ <strong>Single-Use Security Enforcement:</strong> This system applies strict rules. Each subject can only generate ONE QR session code per day. Students scanning within the first 10 minutes are recorded as <strong>Present</strong>. Scans from 10 to 30 minutes are marked as <strong>Late</strong>. Beyond 30 minutes, the session key expires automatically.
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    const now = new Date();
                    const daysMap = ['A', 'MW', 'TTh', 'MW', 'TTh', 'FS', 'FS'];
                    const todayGroup = daysMap[now.getDay()];
                    const activeMatch = classes.find(c => c.days.includes(todayGroup) || c.days.includes('A')) || classes.find(c => c.id === activeQRClass) || classes[0];
                    
                    if (!activeMatch) return;

                    // Enforce "it can only generate one time in every subject today"
                    if (activeMatch.qrGeneratedAt) {
                      const lastGenDate = new Date(activeMatch.qrGeneratedAt).toDateString();
                      const todayDate = new Date().toDateString();
                      if (lastGenDate === todayDate) {
                        if (typeof window !== 'undefined' && (window as any).showToast) {
                          (window as any).showToast(`QR session already generated once for ${activeMatch?.code} today! Policy restricts to single generation daily.`, "error");
                        } else {
                          alert(`🚫 QR session has already been generated once for ${activeMatch?.code} today! In compliance with class policy rules, you can only generate a QR session code one time.`);
                        }
                        speakText(`Registration is already occupied for today`, accessibility.readAloud);
                        return;
                      }
                    }

                    const generatedKey = 'CODE_' + activeMatch.code.toUpperCase() + '_' + Math.random().toString(36).substring(4, 9).toUpperCase();
                    
                    // Propagate to App parent state
                    onEditClass({
                      ...activeMatch,
                      qrToken: generatedKey,
                      qrGeneratedAt: Date.now()
                    });

                    setQrToken(generatedKey);
                    setTimeLeft(1800); // 30 minutes countdown (1800 seconds!)
                    speakText(`Successfully initialized 30 minute QR session code for ${activeMatch.name}`, accessibility.readAloud);
                  }}
                  type="button"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-95 shadow-md shadow-blue-500/10 text-center"
                >
                  Generate 30-Min Session Code
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 4. NOTIFICATIONS VIEW */}
      {activeScreen === 'notifications' && (
        <motion.div
          key="notifications"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl mx-auto space-y-4 text-left"
        >
          <div className="pb-1">
            <button 
              onClick={() => setScreen('dashboard')} 
              type="button"
              className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-zinc-50/80 dark:hover:bg-zinc-850 cursor-pointer transition-all active:scale-95 shadow-sm font-bold text-lg"
              title="Back"
            >
              ←
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-900 pb-3">
            <div>
              <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                <BellRing className="w-5 h-5 text-emerald-500" />
                Notification logs
              </h2>
              <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mt-0.5 font-mono">Administrative records & system alerts</p>
            </div>
            {notifications.length > 0 && (
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={onMarkAllNotificationsRead}
                  className="px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-650 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all cursor-pointer"
                >
                  Mark all as read
                </button>
                <button
                  type="button"
                  onClick={onClearAllNotifications}
                  className="px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wider bg-red-600/10 hover:bg-red-600 hover:text-white dark:bg-red-950/20 border border-red-500/10 rounded-xl text-red-600 dark:text-red-400 transition-all cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Search and Classification Filters Block */}
          <div className="flex gap-2 bg-zinc-50/50 dark:bg-zinc-950/40 p-3.5 rounded-2xl border border-zinc-150 dark:border-zinc-900">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-405 dark:text-zinc-500" />
              <input
                type="text"
                value={notifSearch}
                onChange={(e) => setNotifSearch(e.target.value)}
                placeholder="Search notification logs..."
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs font-medium placeholder-zinc-400 text-zinc-850 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {notifSearch && (
                <button
                  type="button"
                  onClick={() => setNotifSearch('')}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Compact Dropdown Filter with Icon */}
            <div className="relative shrink-0 flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <select
                value={notifFilter}
                onChange={(e) => {
                  const val = e.target.value as 'all' | 'alerts' | 'updates';
                  setNotifFilter(val);
                  speakText(`Filter set to ${val}`, accessibility.readAloud);
                }}
                className="bg-transparent text-xs font-black uppercase text-zinc-700 dark:text-zinc-300 outline-none border-none pr-6 cursor-pointer"
              >
                <option value="all" className="dark:bg-zinc-950">ALL ({notifications.length})</option>
                <option value="alerts" className="dark:bg-zinc-950">ALERTS ({notifications.filter(n => n.type === 'alert' || n.type === 'warning').length})</option>
                <option value="updates" className="dark:bg-zinc-950">UPDATES ({notifications.filter(n => n.type === 'info' || n.type === 'success').length})</option>
              </select>
            </div>
          </div>

          {/* List Section */}
          <div className="space-y-2.5">
            {(() => {
              // Apply active classification search & type filter logic
              const filtered = notifications.filter(notif => {
                const matchesSearch = notif.title.toLowerCase().includes(notifSearch.toLowerCase()) || 
                                     notif.message.toLowerCase().includes(notifSearch.toLowerCase());
                
                if (!matchesSearch) return false;

                if (notifFilter === 'alerts') {
                  return notif.type === 'alert' || notif.type === 'warning';
                }
                if (notifFilter === 'updates') {
                  return notif.type === 'info' || notif.type === 'success';
                }
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="p-8 text-center rounded-2xl bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 space-y-2">
                    <p className="text-xs text-zinc-400 font-bold">No notifications match your active search filter.</p>
                    <button
                      type="button"
                      onClick={() => { setNotifSearch(''); setNotifFilter('all'); }}
                      className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:underline cursor-pointer"
                    >
                      Reset filters
                    </button>
                  </div>
                );
              }

              return filtered.map((notif) => (
                <div 
                  key={notif.id}
                  className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 flex items-start gap-3.5 text-left shadow-xs transition-transform hover:translate-x-0.5"
                >
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    notif.type === 'alert' ? 'bg-red-500/10 text-red-500' :
                    notif.type === 'warning' ? 'bg-amber-500/10 text-amber-550' :
                    notif.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    <BellRing className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2.5">
                      <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-1.5">
                        {notif.title}
                        {!notif.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        )}
                      </h4>
                      <span className="text-[9px] font-mono text-zinc-400 tracking-wider font-semibold uppercase">{notif.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-zinc-450 dark:text-zinc-400 mt-1 leading-normal">
                      {notif.message}
                    </p>
                  </div>
                </div>
              ));
            })()}
          </div>
        </motion.div>
      )}

      {/* 5. PROFILE TAB */}
      {activeScreen === 'profile' && (
        <motion.div
          key="profile"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mx-auto space-y-6 text-left"
        >
          <div className="pb-1">
            <button 
              onClick={() => setScreen('dashboard')} 
              type="button"
              className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-zinc-50/80 dark:hover:bg-zinc-850 cursor-pointer transition-all active:scale-95 shadow-sm font-bold text-lg"
              title="Back"
            >
              ←
            </button>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-sm">
            <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100 mb-5 animate-fade-in">Profile Information</h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-zinc-100 dark:border-zinc-900 mb-5">
              <div className="relative group shrink-0">
                <img 
                  src={profileAvatar} 
                  alt="Faculty Avatar" 
                  className="w-20 h-20 rounded-full object-cover border-4 border-emerald-500/20 shadow-md" 
                />
                <label className="absolute bottom-0 right-0 p-1.5 rounded-full bg-emerald-500 text-black hover:bg-emerald-400 cursor-pointer shadow-md flex items-center justify-center transition-transform active:scale-90">
                  <Camera className="w-3.5 h-3.5" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageFileChange}
                    className="hidden" 
                  />
                </label>
              </div>

              <div className="text-center sm:text-left min-w-0">
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100 truncate">Professor {profileName}</h3>
                <p className="text-xs text-zinc-400 truncate">{profileEmail}</p>
                <div className="flex flex-wrap gap-2 mt-2.5 justify-center sm:justify-start">
                  <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-850 text-zinc-500 rounded border border-zinc-200 dark:border-zinc-800">
                    FAC_ID: {userProfile.facultyId || "FAC-19034"}
                  </span>
                  <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-300 rounded border border-zinc-200 dark:border-zinc-800">
                    Dept: {userProfile.department || "Information systems"}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              onUpdateProfile({
                ...userProfile,
                name: profileName,
                email: profileEmail,
                avatar: profileAvatar
              });
              setProfileSavedMsg(true);
              speakText("Profile details fully updated in database", accessibility.readAloud);
              setTimeout(() => setProfileSavedMsg(false), 3000);
            }} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-455 dark:text-zinc-400 uppercase tracking-widest">Professor Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                    className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-455 dark:text-zinc-400 uppercase tracking-widest">Academic Email</label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    required
                    className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Upload image helper drag-n-drop simulated box */}
              <div className="p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-center">
                <UploadCloud className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                <p className="text-[11px] font-bold text-zinc-650 dark:text-zinc-300 font-sans">Drag profile files here or press camera badge</p>
                <p className="text-[9px] text-zinc-400 mt-0.5">Supports PNG, JPG, WebP up to 3MB files which encode instantly to local profiles.</p>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-black text-xs font-black uppercase tracking-wider hover:bg-emerald-400 cursor-pointer transition-all"
                >
                  Save Profile Details
                </button>

                {profileSavedMsg && (
                  <span className="text-xs text-emerald-500 font-extrabold flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 animate-pulse">
                    <CheckCircle className="w-4 h-4" />
                    Profile synced globally!
                  </span>
                )}
              </div>
            </form>
          </div>
        </motion.div>
      )}

      {/* Roster detail modal */}
      <SubjectDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        cls={selectedClassDetail}
        enrollments={enrollments}
        records={attendanceRecords}
        facultyStatuses={facultyStatuses}
        isDark={accessibility.theme === 'dark'}
      />

      {/* Messages tab screen */}
      {activeScreen === 'messages' && (
        <motion.div
          key="messages"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6 text-left"
        >
          <div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
              <MessageSquare className="w-5.5 h-5.5 text-blue-600 animate-pulse" />
              Direct Student Messaging Hub
            </h2>
            <p className="text-xs text-zinc-400">Instantly converse with warning/dropped students or broadcast general class announcements.</p>
          </div>
          <Messages 
            userProfile={userProfile} 
            classes={classes} 
            enrollments={enrollments} 
            accessibility={accessibility} 
            onBack={() => setScreen('dashboard')}
          />
        </motion.div>
      )}

      {/* 5B. EXCUSE LETTERS INBOX VIEW */}
      {activeScreen === 'excuse-inbox' && (
        <motion.div
          key="excuse-inbox"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6 text-left"
        >
          <div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
              <Inbox className="w-5.5 h-5.5 text-emerald-500 animate-pulse" />
              Excuse letters Inbox
            </h2>
            <p className="text-xs text-zinc-400">Review filed excuse applications and declare decisions of validity on students' records.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">Pending Review</span>
              <p className="text-2xl font-black text-amber-500 mt-1">{excuseLetters.filter(l => l.status === 'pending').length}</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">Declared Valid</span>
              <p className="text-2xl font-black text-emerald-500 mt-1">{excuseLetters.filter(l => l.status === 'valid' || l.status === 'approved').length}</p>
            </div>
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">Declared Invalid</span>
              <p className="text-2xl font-black text-red-500 mt-1">{excuseLetters.filter(l => l.status === 'invalid' || l.status === 'rejected').length}</p>
            </div>
          </div>

          <div className="space-y-4">
            {excuseLetters.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white dark:bg-zinc-950 border border-dashed border-zinc-200 dark:border-zinc-850 text-zinc-500 text-xs">
                No excuse letters have been filed by students yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {excuseLetters.map(letter => (
                  <div key={letter.id} className="p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-sm space-y-4 transition-all w-full">
                    
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">{letter.studentName}</span>
                          <span className="text-[9px] font-mono text-zinc-400 py-0.5 px-2 bg-zinc-100 dark:bg-zinc-900 rounded-full">{letter.studentId || 'STU-OFFICIAL'}</span>
                          <span className="text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 px-2 py-0.5 rounded-full">{letter.className}</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1">Duration: <span className="font-semibold text-zinc-850 dark:text-zinc-200">{letter.startDate}</span> to <span className="font-semibold text-zinc-850 dark:text-zinc-200">{letter.endDate}</span></p>
                      </div>

                      <div className="flex items-center gap-1.5 self-start">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase">Decision Status:</span>
                        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${
                          letter.status === 'approved' || letter.status === 'valid' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                          letter.status === 'rejected' || letter.status === 'invalid' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                          'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                          {letter.status === 'approved' || letter.status === 'valid' ? 'valid' : letter.status === 'rejected' || letter.status === 'invalid' ? 'invalid' : letter.status}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-150 dark:border-zinc-850">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Filed Reason & Explanations</p>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 italic mt-1.5 font-sans leading-relaxed">"{letter.reason}"</p>
                      {letter.attachmentName && (
                        <div className="flex items-center gap-2 mt-3 p-2 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 rounded-xl w-fit cursor-pointer">
                          <span className="text-[10px] text-emerald-500 font-mono">📎 {letter.attachmentName}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-1">
                      {onUpdateExcuseStatus && (
                        <>
                          <button
                            onClick={() => onUpdateExcuseStatus(letter.id, 'valid')}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase cursor-pointer flex items-center gap-1.5 transition-all ${
                              letter.status === 'valid' || letter.status === 'approved'
                                ? 'bg-emerald-500 text-black shadow-sm scale-95'
                                : 'bg-transparent border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                            }`}
                          >
                            ✓ Valid
                          </button>
                          <button
                            onClick={() => onUpdateExcuseStatus(letter.id, 'invalid')}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase cursor-pointer flex items-center gap-1.5 transition-all ${
                              letter.status === 'invalid' || letter.status === 'rejected'
                                ? 'bg-red-500 text-white shadow-sm scale-95'
                                : 'bg-transparent border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                            }`}
                          >
                            ✗ Invalid
                          </button>
                        </>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* 6. STUDENTS MONITORING VIEW */}
      {activeScreen === 'students-monitoring' && (
        <motion.div
          key="students-monitoring"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6 text-left"
        >
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="pb-1">
                <button 
                  onClick={() => setScreen('dashboard')} 
                  type="button"
                  className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-zinc-50/80 dark:hover:bg-zinc-850 cursor-pointer transition-all active:scale-95 shadow-sm font-bold text-lg"
                  title="Back"
                >
                  ←
                </button>
              </div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2 mt-3">
                <Users className="w-5.5 h-5.5 text-emerald-500" />
                Active Student Rosters & At-Risk Monitoring
              </h2>
              <p className="text-xs text-zinc-400">Roster lists and interactive health metrics for your assigned class rosters.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
              <button
                type="button"
                onClick={handleExportSelectedClassAttendance}
                className="px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-805 dark:text-zinc-200 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xs cursor-pointer transition-all active:scale-95"
              >
                <Download className="w-4 h-4 text-emerald-500" />
                <span>Export Class CSV</span>
              </button>
              <button
                type="button"
                onClick={handleExportAllFacultyAttendance}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xs cursor-pointer transition-all active:scale-95"
              >
                <Download className="w-4 h-4 text-black" />
                <span>Export All CSV</span>
              </button>
            </div>
          </div>

          {/* Subject Filter tab pills */}
          <div className="flex flex-wrap gap-2 pb-2">
            {classes.map((cls) => {
              const count = enrollments.filter(e => e.classId === cls.id).length;
              const isSelected = selectedMonitoringClassId === cls.id;
              return (
                <button
                  key={cls.id}
                  onClick={() => setSelectedMonitoringClassId(cls.id)}
                  type="button"
                  className={`px-4 py-2 text-xs font-black rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-emerald-500 text-black border-emerald-500 font-extrabold'
                      : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-650 dark:text-zinc-300 font-bold'
                  }`}
                >
                  <span>{cls.code}: {cls.name}</span>
                  <span className={`text-[10px] font-mono px-1.5 h-4.5 min-w-4.5 rounded-full flex items-center justify-center font-black ${
                    isSelected ? 'bg-black text-white' : 'bg-zinc-100 dark:bg-zinc-900'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Roster detail area */}
          {activeMonClass ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* List of enrolled students in matched class */}
              <div className="lg:col-span-8 space-y-4">
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 mb-4 border-b border-zinc-150 dark:border-zinc-900">
                    <div>
                      <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight">
                        Class Enrolled Roster ({monEnrollments.length})
                      </h3>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Interactive roster & attendance control panel</p>
                    </div>
                    
                    {/* Student directory inner search */}
                    <div className="relative w-full md:max-w-xs shrink-0 select-none">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 pointer-events-none">
                        <Search className="w-3.5 h-3.5 text-emerald-500" />
                      </span>
                      <input
                        type="text"
                        className="w-full pl-8 pr-8 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900/65 rounded-xl border border-zinc-202 dark:border-zinc-800 focus:border-emerald-500 outline-none text-zinc-805 dark:text-zinc-200 font-bold"
                        placeholder="Search student name or ID..."
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                      />
                      {studentSearchQuery && (
                        <button 
                          onClick={() => setStudentSearchQuery('')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-650 cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>

                  {(() => {
                    const filteredStudents = monEnrollments.filter(student => 
                      student.studentName.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                      (student.studentId && student.studentId.toLowerCase().includes(studentSearchQuery.toLowerCase()))
                    );

                    if (monEnrollments.length === 0) {
                      return (
                        <div className="py-12 text-center text-zinc-400 dark:text-zinc-500 text-xs font-medium">
                          No student registration records found in academic ledger table for this class.
                        </div>
                      );
                    }

                    if (filteredStudents.length === 0) {
                      return (
                        <div className="py-12 text-center text-zinc-400 dark:text-zinc-500 text-xs font-medium animate-fade-in">
                          No students match "{studentSearchQuery}"
                        </div>
                      );
                    }

                    return (
                      <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                        {filteredStudents.map(student => {
                          const studentRecords = attendanceRecords.filter(
                            r => r.classId === activeMonClass.id && 
                            (r.studentId === student.studentId || r.studentName === student.studentName)
                          );
                          
                          const pres = studentRecords.filter(r => r.status === 'present').length;
                          const late = studentRecords.filter(r => r.status === 'late').length;
                          const abs = studentRecords.filter(r => r.status === 'absent').length;

                          const total = studentRecords.length;
                          const rate = total > 0 ? Math.round(((pres + late) / total) * 100) : 100;
                          const rateClamped = rate > 100 ? 100 : rate;
                          const isUnderMonitoring = rateClamped < 85;

                          return (
                            <div key={student.id} className="py-4 flex flex-col text-left">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={student.studentAvatar} 
                                    alt={student.studentName} 
                                    className="w-11 h-11 rounded-full object-cover border border-zinc-200 dark:border-zinc-800 shrink-0"
                                  />
                                  <div>
                                    <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex flex-wrap items-center gap-2">
                                      <span>{student.studentName}</span>
                                      {(() => {
                                        // Calculate precise warning check
                                        const countAbsentsForClass = abs;

                                        let maxConsecutive = 0;
                                        let currConsecutive = 0;
                                        const sortedRecs = [...studentRecords].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                                        for (const r of sortedRecs) {
                                          if (r.status === 'absent') {
                                            currConsecutive++;
                                            if (currConsecutive > maxConsecutive) maxConsecutive = currConsecutive;
                                          } else {
                                            currConsecutive = 0;
                                          }
                                        }

                                        if (countAbsentsForClass >= 5 || maxConsecutive >= 3) {
                                          return (
                                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide text-red-500 bg-red-500/10 border border-red-500/15">
                                              🚫 Dropped
                                            </span>
                                          );
                                        } else if (countAbsentsForClass >= 3) {
                                          return (
                                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide text-amber-555 bg-amber-500/10 border border-amber-500/15">
                                              ⚠️ Warning
                                            </span>
                                          );
                                        }
                                        return (
                                          <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide text-emerald-500 bg-emerald-500/10 border border-emerald-505">
                                            Good Stand
                                          </span>
                                        );
                                      })()}
                                    </h4>
                                    <p className="text-[10px] text-zinc-455 mt-0.5 font-mono">{student.studentId} • Enrolled {student.enrolledAt}</p>
                                  </div>
                                </div>

                                {/* Attendance figures logs & edit trigger */}
                                <div className="flex items-center gap-6 self-end sm:self-auto shrink-0">
                                  <div className="flex gap-4 text-center font-mono">
                                    <div>
                                      <p className="text-[8px] font-bold text-zinc-400">PRESENT(S)</p>
                                      <p className="text-xs font-black text-emerald-500">{pres + late}</p>
                                    </div>
                                    <div>
                                      <p className="text-[8px] font-bold text-zinc-400">ABSENT(S)</p>
                                      <p className="text-xs font-black text-ref-500 text-red-505">{abs}</p>
                                    </div>
                                    <div className="p-0 border-r border-zinc-200 dark:border-zinc-800 h-6 self-center" />
                                    <div>
                                      <p className="text-[8px] font-bold text-zinc-400">PERCENT RATE</p>
                                      <p className={`text-xs font-black ${isUnderMonitoring ? 'text-red-500 font-extrabold' : 'text-zinc-800 dark:text-zinc-250'}`}>{rateClamped}%</p>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => setExpandedStudentId(expandedStudentId === student.id ? null : student.id)}
                                    className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-[10px] font-black uppercase text-zinc-650 dark:text-zinc-300 transition-all cursor-pointer"
                                  >
                                    {expandedStudentId === student.id ? 'Close' : 'Edit Logs'}
                                  </button>
                                </div>
                              </div>

                              {/* Collapsible logs correction panel */}
                              {expandedStudentId === student.id && (
                                <div className="mt-4 pl-14 pt-4 border-t border-zinc-100/60 dark:border-zinc-900/60 grid grid-cols-1 gap-2.5 animate-scale-up">
                                  <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest font-mono">Attendance Correction Ledger</p>
                                  {studentRecords.length === 0 ? (
                                    <p className="text-[10px] text-zinc-400 italic">No attendance timestamps recorded yet.</p>
                                  ) : (
                                    <div className="grid grid-cols-1 gap-1.5">
                                      {studentRecords.map(rec => (
                                        <div key={rec.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-150 dark:border-zinc-850 w-full hover:border-emerald-500/10 transition-all">
                                          <div className="text-left font-mono">
                                            <span className="text-[10px] font-extrabold text-zinc-800 dark:text-zinc-205">{rec.date}</span>
                                            <span className="text-[9px] text-zinc-400 ml-2">({rec.time})</span>
                                          </div>
                                          <div className="flex items-center gap-1 shrink-0">
                                            {(['present', 'late', 'absent'] as const).map(statusOpt => (
                                              <button
                                                key={statusOpt}
                                                type="button"
                                                onClick={() => onUpdateAttendanceRecord && onUpdateAttendanceRecord(rec.id, statusOpt)}
                                                className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase cursor-pointer transition-all ${
                                                  rec.status === statusOpt
                                                    ? statusOpt === 'present' ? 'bg-emerald-500 text-black font-extrabold scale-95' :
                                                      statusOpt === 'late' ? 'bg-amber-500 text-black font-extrabold scale-95' : 'bg-red-500 text-white font-extrabold scale-95'
                                                    : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-90 w-fit dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                                                }`}
                                              >
                                                {statusOpt}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Roster summary analysis widget with interactive SVG metrics */}
              <div className="lg:col-span-4 space-y-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-sm text-left space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-300">
                    Subject Metrics
                  </h4>

                  <div className="border border-zinc-200 dark:border-zinc-900 rounded-xl p-4 bg-zinc-50/50 dark:bg-zinc-950/60 text-center">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Class Session Rate Counts</p>
                    
                    {/* Visual metrics bar charts */}
                    <div className="space-y-3.5 text-left">
                      <div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 mb-1">
                          <span>PRESENT TOTALS</span>
                          <span className="font-mono text-emerald-500 font-extrabold">{monClassPresents} Logs</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, monClassPresentsRate)}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 mb-1">
                          <span>LATE CHECK-INS</span>
                          <span className="font-mono text-amber-500 font-extrabold">{monClassLates} Logs</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, monClassLatesRate)}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 mb-1">
                          <span>ABSENT TOTALS</span>
                          <span className="font-mono text-red-500 font-extrabold">{monClassAbsents} Logs</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, monClassAbsentsRate)}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 mb-1">
                          <span>STUDENTS AT RISK</span>
                          <span className="font-mono text-red-400 font-extrabold">{monClassAtRisk} Students</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min(100, monClassAtRiskRate)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl relative overflow-hidden">
                    <div className="flex gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-extrabold text-red-500">Critical Lateness Target</h5>
                        <p className="text-[10px] text-zinc-400 leading-normal mt-1">
                          Students with less than 85% computed status attendance rate are highlighted in the student dashboard and reported instantly to administration records.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-8 border border-dashed rounded-3xl bg-white dark:bg-zinc-950 text-center text-zinc-400 text-xs">
              No subjects listed. Create class registers in My Classes first.
            </div>
          )}

        </motion.div>
      )}
      </AnimatePresence>

      {/* Faculty Commencement Alarm Clock popup modal */}
      {isFacultyAlarmOpen && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3.5xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-2xl relative animate-scale-up space-y-5 text-left border-2 border-emerald-500/25">
            <button
              onClick={() => setIsFacultyAlarmOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-650 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-500 text-black rounded-full flex items-center justify-center font-bold mx-auto animate-bounce text-lg">
                ⏰
              </div>
              <h3 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">Class Commencement Alarm</h3>
              <p className="text-xs text-zinc-400 leading-normal">
                Your assigned scheduled curriculum class is commencing in 5 minutes! Declare your session status instantly to broadcast to student registers.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-450 dark:text-zinc-400 uppercase tracking-wider">COMMENCING SUBJECT</label>
                <select
                  value={selectedAlarmClassId}
                  onChange={(e) => {
                    setSelectedAlarmClassId(e.target.value);
                    const found = classes.find(c => c.id === e.target.value);
                    if (found) setFacultyAlarmRoom(found.room);
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-905 outline-none text-zinc-900 dark:text-zinc-150 font-black"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.code}: {c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-455 dark:text-zinc-400 uppercase tracking-wider font-bold">ROOM CHANGE OPTION</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={facultyAlarmRoom}
                    onChange={(e) => setFacultyAlarmRoom(e.target.value)}
                    placeholder="e.g. Room 303-C"
                    className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900 outline-none text-zinc-900 dark:text-zinc-100 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-bold">SELECT ATTEND CODE UPDATE</p>
                
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    onClick={() => {
                      handleCommitFacultyAlarmUpdate('attend');
                    }}
                    className="p-3 bg-emerald-500 hover:bg-emerald-400 cursor-pointer rounded-xl text-black font-black uppercase text-[10px] tracking-wider text-center transition-transform active:scale-95"
                  >
                    Attend
                  </button>
                  <button
                    onClick={() => {
                      handleCommitFacultyAlarmUpdate('cancel');
                    }}
                    className="p-3 bg-red-500 hover:bg-red-400 cursor-pointer rounded-xl text-white font-black uppercase text-[10px] tracking-wider text-center transition-transform active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleCommitFacultyAlarmUpdate('late');
                    }}
                    className="p-3 bg-amber-500 hover:bg-amber-400 cursor-pointer rounded-xl text-black font-black uppercase text-[10px] tracking-wider text-center transition-transform active:scale-95"
                  >
                    Late Arrival
                  </button>
                </div>
              </div>
            </div>
            
            <div className="text-[10px] text-zinc-400 text-center font-mono">
              ClassPulse Standard Broadcast Protocol (Instant sync)
            </div>
          </div>
        </div>
      )}

      {/* Floating Admin Customer Support Service Icon Bubble */}
      {activeScreen !== 'messages' && (
        <button
          type="button"
          onClick={() => {
            setScreen('messages');
            speakText("Opening Support Chat with administrators.", accessibility.readAloud);
          }}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-emerald-600 hover:bg-emerald-555 text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(16,185,129,0.3)] hover:scale-110 active:scale-95 transition-all group cursor-pointer border border-emerald-500/25"
          title="Message Admin for Support"
        >
          <div className="absolute -top-12 right-0 bg-zinc-900 text-white text-[10px] py-1 px-2.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none font-bold uppercase tracking-wider shadow-md">
            Message Admin 💬
          </div>
          <svg className="w-6 h-6 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </button>
      )}

    </div>
  );
}
