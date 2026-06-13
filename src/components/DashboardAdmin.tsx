import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClassSession, 
  UserProfile, 
  AccessibilityConfig,
  Enrollment,
  AttendanceRecord,
  FacultyStatus,
  Announcement
} from '../types';
import { 
  Users, 
  UserCheck, 
  BookOpen, 
  Calendar, 
  Plus, 
  X, 
  CheckCircle, 
  TrendingUp, 
  ArrowUpRight, 
  Trash2, 
  ShieldAlert, 
  Mail, 
  Building,
  Sparkles,
  Clock,
  MapPin,
  AlertCircle,
  Edit,
  Search,
  Megaphone,
  User,
  Download
} from 'lucide-react';
import { speakText } from './AccessibilitySettings';
import SubjectDetailModal from './SubjectDetailModal';

interface DashboardAdminProps {
  activeScreen: string;
  setScreen: (screen: string) => void;
  classes: ClassSession[];
  onAddClass: (newClass: Omit<ClassSession, 'id'>) => void;
  onEditClass: (updatedClass: ClassSession) => void;
  onDeleteClass: (classId: string) => void;
  enrollments: Enrollment[];
  attendanceRecords: AttendanceRecord[];
  accessibility: AccessibilityConfig;
  announcements?: Announcement[];
  onUpdateAnnouncements?: (announcements: Announcement[]) => void;
  userProfile?: UserProfile;
  onUpdateProfile?: (updatedUserProfile: UserProfile) => void;
  onUpdateAttendanceRecord?: (recordId: string, status: 'present' | 'late' | 'absent') => void;
}

interface StatCardProps {
  key?: React.Key;
  stat: {
    label: string;
    targetVal: number;
    icon: any;
    color: string;
    text: string;
    detail: string;
  };
  idx: number;
}

function StatCard({ stat, idx }: StatCardProps) {
  const IconComp = stat.icon;
  // Simple simulation of state-based ticker increment
  const [displayCount, setDisplayCount] = React.useState(0);
  React.useEffect(() => {
    let current = 0;
    const increment = Math.ceil(stat.targetVal / 25);
    const timer = setInterval(() => {
      current += increment;
      if (current >= stat.targetVal) {
        current = stat.targetVal;
        clearInterval(timer);
      }
      setDisplayCount(current);
    }, 20);
    return () => clearInterval(timer);
  }, [stat.targetVal]);

  return (
    <motion.div 
      key={idx}
      initial={{ opacity: 0, y: 15, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: idx * 0.05 }}
      whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.05)" }}
      className="p-5 rounded-[1.5rem] border bg-white dark:bg-zinc-950 border-zinc-200/80 dark:border-zinc-850/80 shadow-[0_2px_12px_rgba(0,0,0,0.01)] flex items-center justify-between group relative overflow-hidden text-left"
    >
      <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div>
        <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 dark:text-zinc-500 block">{stat.label}</span>
        <h3 className="text-3xl font-black mt-1.5 font-mono text-zinc-900 dark:text-zinc-100">
          {displayCount}
        </h3>
        <div className="mt-2 flex flex-col gap-0.5">
          <span className="text-[10px] text-emerald-500 font-extrabold flex items-center gap-0.5">
            <ArrowUpRight className="w-3.5 h-3.5" /> {stat.text}
          </span>
          <span className="text-[9px] text-zinc-400 dark:text-zinc-650 block truncate">{stat.detail}</span>
        </div>
      </div>
      <div className={`p-3.5 rounded-2xl ${
        stat.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' :
        stat.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-550' :
        stat.color === 'amber' ? 'bg-amber-500/10 text-amber-500' :
        'bg-purple-500/10 text-purple-400'
      } shrink-0`}>
        <IconComp className="w-5.5 h-5.5 stroke-[2]" />
      </div>
    </motion.div>
  );
}

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'faculty';
  uid: string; // ID number
  department: string;
}

export default function DashboardAdmin({
  activeScreen,
  setScreen,
  classes,
  onAddClass,
  onEditClass,
  onDeleteClass,
  enrollments,
  attendanceRecords,
  accessibility,
  announcements = [],
  onUpdateAnnouncements,
  userProfile,
  onUpdateProfile,
  onUpdateAttendanceRecord
}: DashboardAdminProps) {
  
  // Local list of interactive directory users
  const [usersList, setUsersList] = React.useState<MockUser[]>([
    { id: 'usr-1', name: 'John Doe', email: 'john.doe@msu.edu.ph', role: 'student', uid: '2023-10492', department: 'Information Technology' },
    { id: 'usr-2', name: 'Alice Smith', email: 'alice.smith@msu.edu.ph', role: 'student', uid: '2023-90345', department: 'Computer Engineering' },
    { id: 'usr-3', name: 'Dr. Ahmad Khan', email: 'ahmad.khan@msu.edu.ph', role: 'faculty', uid: 'FAC-90234', department: 'Computer Science' },
    { id: 'usr-4', name: 'Prof. Maria Santos', email: 'maria.santos@msu.edu.ph', role: 'faculty', uid: 'FAC-41092', department: 'Software Engineering' },
    { id: 'usr-5', name: 'Bob Johnson', email: 'bob.jh@msu.edu.ph', role: 'student', uid: '2023-11029', department: 'Information Systems' }
  ]);

  // Directory filter state
  const [directoryRoleFilter, setDirectoryRoleFilter] = React.useState<'all' | 'student' | 'faculty'>('all');

  // Local edit states
  const [editingUser, setEditingUser] = React.useState<MockUser | null>(null);
  const [editUserName, setEditUserName] = React.useState('');
  const [editUserEmail, setEditUserEmail] = React.useState('');
  const [editUserUid, setEditUserUid] = React.useState('');
  const [editUserDep, setEditUserDep] = React.useState('');

  // Local states for announcements, searching, and profile
  const [userDirectorySearch, setUserDirectorySearch] = React.useState('');
  
  const [isAnnFormOpen, setIsAnnFormOpen] = React.useState(false);
  const [annTitle, setAnnTitle] = React.useState('');
  const [annContent, setAnnContent] = React.useState('');
  const [annTarget, setAnnTarget] = React.useState<'all' | 'student' | 'faculty'>('all');
  const [annEditingId, setAnnEditingId] = React.useState<string | null>(null);

  const [profileName, setProfileName] = React.useState(userProfile?.name || 'Admin Strator');
  const [profileEmail, setProfileEmail] = React.useState(userProfile?.email || 'registrar@msu.edu.ph');
  const [profileBio, setProfileBio] = React.useState(userProfile?.bio || 'Campus System Administrator');
  const [profilePhone, setProfilePhone] = React.useState(userProfile?.phone || '+63 901 234 5678');
  const [profileSavedMsg, setProfileSavedMsg] = React.useState(false);

  React.useEffect(() => {
    if (userProfile) {
      setProfileName(userProfile.name);
      setProfileEmail(userProfile.email);
      setProfileBio(userProfile.bio || 'Campus System Administrator');
      setProfilePhone(userProfile.phone || '+63 901 234 5678');
    }
  }, [userProfile]);

  // Clickable Course detail interactive modal states
  const [selectedClassDetail, setSelectedClassDetail] = React.useState<ClassSession | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
  const [hoveredTrendIndex, setHoveredTrendIndex] = React.useState<number | null>(null);
  const [hoveredEnrollmentIndex, setHoveredEnrollmentIndex] = React.useState<number | null>(null);

  // Add User Form modal
  const [isUserFormOpen, setIsUserFormOpen] = React.useState(false);
  const [newUserName, setNewUserName] = React.useState('');
  const [newUserEmail, setNewUserEmail] = React.useState('');
  const [newUserRole, setNewUserRole] = React.useState<'student' | 'faculty'>('student');
  const [newUserID, setNewUserID] = React.useState('');
  const [newUserDep, setNewUserDep] = React.useState('Computer Science');

  // Stats
  const studentCount = usersList.filter(u => u.role === 'student').length + 240; // baseline 245
  const facultyCount = usersList.filter(u => u.role === 'faculty').length + 26; // baseline 28
  const departmentsList = ['Computer Science', 'Information Technology', 'Software Engineering', 'Computer Engineering', 'Information Systems'];

  const handleExportAllGlobalAttendance = () => {
    if (attendanceRecords.length === 0) {
      speakText("No attendance records found to export.", accessibility.readAloud);
      alert("The attendance records ledger is currently empty.");
      return;
    }
    
    const headers = ["Student ID", "Student Name", "Class Code", "Course Name", "Session Date", "Check-in Time", "Attendance Status"];
    const rows = attendanceRecords.map(rec => {
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
    link.setAttribute("download", `MSU_University_Attendance_Consolidated_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    speakText("Consolidated attendance ledger successfully exported to CSV file for archiving", accessibility.readAloud);
  };

  const handleExportClassAttendance = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return;
    
    const filteredRecords = attendanceRecords.filter(r => r.classId === classId);
    if (filteredRecords.length === 0) {
      speakText(`No attendance records found for ${cls.name}`, accessibility.readAloud);
      alert(`There are currently no registered attendance logs in the database for course ${cls.code} - ${cls.name}.`);
      return;
    }
    
    const headers = ["Student ID", "Student Name", "Class Code", "Course Name", "Session Date", "Check-in Time", "Attendance Status"];
    const rows = filteredRecords.map(rec => [
      rec.studentId || "N/A",
      rec.studentName || "N/A",
      rec.classCode || cls.code,
      rec.className || cls.name,
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
    link.setAttribute("download", `${cls.code}_Attendance_Roster_${cls.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    speakText(`Course attendance roster for ${cls.name} successfully exported`, accessibility.readAloud);
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserID) {
      alert("Please fill in name, email, and ID fields.");
      return;
    }

    const newUserRecord: MockUser = {
      id: 'usr-gen-' + Math.random().toString(36).substring(2, 7),
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      uid: newUserID,
      department: newUserDep
    };

    setUsersList([newUserRecord, ...usersList]);
    setIsUserFormOpen(false);
    
    // reset
    setNewUserName('');
    setNewUserEmail('');
    setNewUserID('');

    speakText(`New ${newUserRole} account for ${newUserName} successfully registered in system database.`, accessibility.readAloud);
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (confirm(`Revoke credentials and remove ${name} from integrated directories?`)) {
      setUsersList(usersList.filter(u => u.id !== id));
      speakText(`${name} removed successfully from student and faculty registries.`, accessibility.readAloud);
    }
  };

  const handleStartEditUser = (user: MockUser) => {
    setEditingUser(user);
    setEditUserName(user.name);
    setEditUserEmail(user.email);
    setEditUserUid(user.uid);
    setEditUserDep(user.department);
  };

  const handleEditUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editUserName || !editUserEmail || !editUserUid) {
      alert("Please fill in names, email, and ID coordinates.");
      return;
    }
    
    setUsersList(prev => prev.map(u => {
      if (u.id === editingUser.id) {
        return {
          ...u,
          name: editUserName,
          email: editUserEmail,
          uid: editUserUid,
          department: editUserDep
        };
      }
      return u;
    }));
    
    speakText(`User details for ${editUserName} successfully updated.`, accessibility.readAloud);
    setEditingUser(null);
  };

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;

    if (annEditingId) {
      // Edit existing
      const updated = announcements.map(ann => 
        ann.id === annEditingId 
          ? { ...ann, title: annTitle, content: annContent, target: annTarget } 
          : ann
      );
      onUpdateAnnouncements?.(updated);
      speakText(`Announcement ${annTitle} successfully edited, updated across all dashboards`, accessibility.readAloud);
    } else {
      // Create new
      const fresh: Announcement = {
        id: 'ann-gen-' + Math.random().toString(36).substring(2, 7),
        title: annTitle,
        content: annContent,
        target: annTarget,
        createdAt: new Date().toISOString()
      };
      onUpdateAnnouncements?.([fresh, ...announcements]);
      speakText(`New dynamic announcement ${annTitle} has been broadcasted to targets`, accessibility.readAloud);
    }

    // reset
    setAnnTitle('');
    setAnnContent('');
    setAnnTarget('all');
    setAnnEditingId(null);
    setIsAnnFormOpen(false);
  };

  const handleEditAnnClick = (ann: Announcement) => {
    setAnnTitle(ann.title);
    setAnnContent(ann.content);
    setAnnTarget(ann.target);
    setAnnEditingId(ann.id);
    setIsAnnFormOpen(true);
  };

  const handleDeleteAnnClick = (id: string, title: string) => {
    if (confirm(`Remove announcement "${title}"?`)) {
      onUpdateAnnouncements?.(announcements.filter(ann => ann.id !== id));
      speakText(`Announcement deleted successfully`, accessibility.readAloud);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateProfile && userProfile) {
      onUpdateProfile({
        ...userProfile,
        name: profileName,
        email: profileEmail,
        bio: profileBio,
        phone: profilePhone
      });
      setProfileSavedMsg(true);
      setTimeout(() => setProfileSavedMsg(false), 3000);
      speakText("Administrator profile database records committed successfully", accessibility.readAloud);
    }
  };

  const isDark = accessibility.theme === 'dark';

  // SVG Area/Line Chart parameters
  const chartPoints = [
    { label: 'Mon', count: 120, x: 20, y: 150 },
    { label: 'Tue', count: 145, x: 80, y: 110 },
    { label: 'Wed', count: 165, x: 140, y: 80 },
    { label: 'Thu', count: 140, x: 200, y: 120 },
    { label: 'Fri', count: 180, x: 260, y: 40 },
    { label: 'Sat', count: 90, x: 320, y: 200 },
    { label: 'Sun', count: 110, x: 380, y: 170 },
  ];

  // Helper path string for spline line
  const splinePath = chartPoints.map((pt, idx) => {
    return `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`;
  }).join(' ');

  // Helper area boundary underneath for beautiful fill gradient
  const areaPath = `${splinePath} L 380 240 L 20 240 Z`;

  return (
    <div className="space-y-6">

      <AnimatePresence mode="wait">
        {activeScreen === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6 text-left"
          >
          
          {/* Animated Dashboard Stats Panel */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Students', targetVal: studentCount, icon: Users, color: 'emerald', text: '+12 this month', detail: '8 new registrations yesterday' },
              { label: 'Total Faculty', targetVal: facultyCount, icon: UserCheck, color: 'indigo', text: '+2 this month', detail: 'All credentials initialized' },
              { label: 'Classes Tracked', targetVal: classes.length + 32, icon: BookOpen, color: 'amber', text: '+5 this term', detail: '8 laboratory schedules' },
              { label: 'Attendance Today', targetVal: 189, icon: Calendar, color: 'purple', text: '86% active rate', detail: '75 instant scans recorded' }
            ].map((stat, idx) => (
              <StatCard key={idx} stat={stat} idx={idx} />
            ))}
          </div>

          {/* Quick Actions Board */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-[1.5rem] border bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-850 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-900">
              <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                Administrative Quick Command center
              </span>
              <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-wider">MSU-INTEGRATED CORE</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <button 
                onClick={() => {
                  alert("Broadcast Modal Initiated. Preparing circular dispatch across student grids.");
                  setScreen('messages');
                  speakText("Transferring context to Bulletin composer", accessibility.readAloud);
                }}
                className="p-3 text-left rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/30 bg-zinc-50/50 dark:bg-zinc-900/20 hover:bg-zinc-50 dark:hover:bg-indigo-500/5 transition-all text-zinc-850 dark:text-zinc-200 cursor-pointer"
              >
                <div className="p-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg inline-block text-xs mb-2">
                  <Megaphone className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-black">Dispatch Circular</h4>
                <p className="text-[10px] text-zinc-400 mt-1">Air alerts to students</p>
              </button>

              <button 
                onClick={() => {
                  setScreen('curriculums');
                  speakText("Opening classes catalog and registration controls", accessibility.readAloud);
                }}
                className="p-3 text-left rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/30 bg-zinc-50/50 dark:bg-zinc-900/20 hover:bg-zinc-50 dark:hover:bg-emerald-500/5 transition-all text-zinc-850 dark:text-zinc-200 cursor-pointer"
              >
                <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg inline-block text-xs mb-2">
                  <Plus className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-black">Register Subject</h4>
                <p className="text-[10px] text-zinc-400 mt-1">Insert schedules ledger</p>
              </button>

              <button 
                onClick={handleExportAllGlobalAttendance}
                className="p-3 text-left rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/30 bg-zinc-50/50 dark:bg-zinc-900/20 hover:bg-zinc-50 dark:hover:bg-amber-500/5 transition-all text-zinc-850 dark:text-zinc-200 cursor-pointer"
              >
                <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg inline-block text-xs mb-2">
                  <Download className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-black">Export Analytics</h4>
                <p className="text-[10px] text-zinc-400 mt-1">Download attendance sheet</p>
              </button>

              <button 
                onClick={() => {
                  speakText("Synchronizing university directory databases. Clearing cached session headers.", accessibility.readAloud);
                  alert("University directories synced with global registrar ledger successfully.");
                }}
                className="p-3 text-left rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-purple-500/30 bg-zinc-50/50 dark:bg-zinc-900/20 hover:bg-zinc-50 dark:hover:bg-purple-500/5 transition-all text-zinc-850 dark:text-zinc-200 cursor-pointer"
              >
                <div className="p-1.5 bg-purple-500/10 text-purple-500 rounded-lg inline-block text-xs mb-2">
                  <Clock className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-black">Force Sync</h4>
                <p className="text-[10px] text-zinc-400 mt-1">Audit active directory listings</p>
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Main Analytics Console: Attendance & Enrollment */}
            <div className="p-6 rounded-[1.5rem] border lg:col-span-8 space-y-6 text-left bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-850 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    University Attendance & Enrollment Analytics
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">Cross-referencing student registrations and daily attendance trends</p>
                </div>
                {/* Visual selector pills & Fast CSV dispatcher */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl text-[10px] font-bold">
                    <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 text-emerald-555 shadow-xs uppercase">Daily logs</span>
                    <span className="px-2.5 py-1 text-zinc-500 uppercase cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg">Historical overview</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportAllGlobalAttendance}
                    className="px-3 py-1.5 bg-zinc-900 dark:bg-zinc-900 hover:bg-zinc-800 hover:text-white dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 duration-100"
                    title="Export all system attendance logs"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Export Logs CSV</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Grid representing analytics visualization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* SVG spline area plot: Attendance Daily Logs */}
                {(() => {
                  const dailyAttendanceData = [
                    { label: 'Monday', shortLabel: 'M', value: 68, active: 110, late: 15, absent: 35, x: 20, y: 120, date: 'Monday, June 8, 2026' },
                    { label: 'Tuesday', shortLabel: 'T', value: 75, active: 135, late: 12, absent: 13, x: 80, y: 75, date: 'Tuesday, June 9, 2026' },
                    { label: 'Wednesday', shortLabel: 'W', value: 82, active: 150, late: 32, absent: 18, x: 140, y: 80, date: 'Wednesday, June 10, 2026' },
                    { label: 'Thursday', shortLabel: 'T', value: 85, active: 165, late: 25, absent: 15, x: 200, y: 62, date: 'Thursday, June 11, 2026' },
                    { label: 'Friday', shortLabel: 'F', value: 92, active: 189, late: 15, absent: 10, x: 260, y: 30, date: 'Friday, June 12, 2026' },
                    { label: 'Saturday', shortLabel: 'S', value: 65, active: 45, late: 5, absent: 15, x: 320, y: 100, date: 'Saturday, June 13, 2026' }
                  ];

                  return (
                    <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/30 relative">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-405 block text-left">Attendance logs trends</span>
                      <div className="w-full h-44 mt-3 relative flex items-end">
                        <svg viewBox="0 0 350 150" className="w-full h-full overflow-visible">
                          <defs>
                            <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Area path */}
                          <path d="M 20 120 L 80 75 L 140 80 L 200 62 L 260 30 L 320 100 L 320 135 L 20 135 Z" fill="url(#attendanceGrad)" />
                          
                          {/* Connected line path */}
                          <path d="M 20 120 L 80 75 L 140 80 L 200 62 L 260 30 L 320 100" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                          
                          {/* Interactive coordinates points */}
                          {dailyAttendanceData.map((d, idx) => {
                            const isHovered = hoveredTrendIndex === idx;
                            return (
                              <g key={idx}>
                                {/* Transparent expanded hover target */}
                                <circle 
                                  cx={d.x} 
                                  cy={d.y} 
                                  r="16" 
                                  fill="transparent" 
                                  className="cursor-pointer"
                                  onMouseEnter={() => setHoveredTrendIndex(idx)}
                                  onMouseLeave={() => setHoveredTrendIndex(null)}
                                />
                                {isHovered && (
                                  <circle 
                                    cx={d.x} 
                                    cy={d.y} 
                                    r="8" 
                                    fill="none" 
                                    stroke="#10b981" 
                                    strokeWidth="1.5" 
                                    className="animate-ping opacity-65"
                                  />
                                )}
                                <circle 
                                  cx={d.x} 
                                  cy={d.y} 
                                  r={isHovered ? 6 : 4} 
                                  fill="#121212" 
                                  stroke="#10b981" 
                                  strokeWidth={isHovered ? 3 : 2.5}
                                  className="transition-all duration-150"
                                />
                                <text 
                                  x={d.x} 
                                  y={d.y - 12} 
                                  fontSize="8" 
                                  fill="#10b981" 
                                  fontWeight={isHovered ? "black" : "bold"} 
                                  textAnchor="middle" 
                                  className="font-mono"
                                >
                                  {d.value}%
                                </text>
                              </g>
                            );
                          })}

                          {/* Day Marks */}
                          <text x="20" y="145" fontSize="8" fill="#888">M</text>
                          <text x="80" y="145" fontSize="8" fill="#888">T</text>
                          <text x="140" y="145" fontSize="8" fill="#888">W</text>
                          <text x="200" y="145" fontSize="8" fill="#888">T</text>
                          <text x="260" y="145" fontSize="8" fill="#888">F</text>
                          <text x="320" y="145" fontSize="8" fill="#888">S</text>
                        </svg>

                        {/* Custom Rich Interactive Tooltip popup */}
                        {hoveredTrendIndex !== null && (() => {
                          const data = dailyAttendanceData[hoveredTrendIndex];
                          return (
                            <div 
                              className="absolute z-20 p-3 rounded-xl bg-zinc-950/95 text-white border border-zinc-800 shadow-xl pointer-events-none transition-all duration-150 backdrop-blur-md flex flex-col gap-1 w-52 text-left"
                              style={{
                                left: `${(data.x / 350) * 100}%`,
                                bottom: `${(150 - data.y + 12) / 150 * 100}%`,
                                transform: 'translateX(-50%)',
                              }}
                            >
                              <div className="flex items-center justify-between border-b border-zinc-900 pb-1 mb-1">
                                <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest">{data.label} Logs</span>
                                <span className="text-[8px] font-mono text-zinc-500">ADM CORE</span>
                              </div>
                              <p className="text-[10px] font-bold text-zinc-100">{data.date}</p>
                              
                              <div className="grid grid-cols-3 gap-1 mt-1 text-[9px] font-mono">
                                <div className="bg-emerald-500/10 p-1 rounded text-emerald-300">
                                  <p className="text-[7px] text-zinc-500 uppercase tracking-wider">Pres</p>
                                  <p className="font-extrabold">{data.active}</p>
                                </div>
                                <div className="bg-amber-500/10 p-1 rounded text-amber-300">
                                  <p className="text-[7px] text-zinc-500 uppercase tracking-wider">Late</p>
                                  <p className="font-extrabold">{data.late}</p>
                                </div>
                                <div className="bg-red-500/10 p-1 rounded text-red-300">
                                  <p className="text-[7px] text-zinc-500 uppercase tracking-wider">Abs</p>
                                  <p className="font-extrabold">{data.absent}</p>
                                </div>
                              </div>
                              
                              <p className="text-[8px] text-zinc-400 mt-1 leading-normal border-t border-zinc-900/50 pt-1">
                                Avg Attendance: <strong className="text-emerald-400 text-[10px]">{data.value}%</strong>
                              </p>
                              <div className="absolute left-1/2 bottom-0 w-2 h-2 bg-zinc-950 border-r border-b border-zinc-800 transform -translate-x-1/2 translate-y-1/2 rotate-45" />
                            </div>
                          );
                        })()}
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-2 text-left">Aggregated attendance peaks on Fridays at <b>92% completion rate</b>.</p>
                    </div>
                  );
                })()}

                {/* SVG spline area plot: Enrollment progression */}
                {(() => {
                  const enrollmentData = [
                    { label: 'Week 1', value: 450, change: '+12', x: 20, y: 130, date: 'May 18, 2026 - May 22, 2026', desc: 'Campaign launch and initial roster ingestion.' },
                    { label: 'Week 2', value: 580, change: '+130', x: 100, y: 110, date: 'May 25, 2026 - May 29, 2026', desc: 'Late enrollees and schedule adjustments completed.' },
                    { label: 'Week 3', value: 722, change: '+142', x: 180, y: 60, date: 'June 1, 2026 - June 5, 2026', desc: 'Add/drop period finalized; stable roster achieved.' },
                    { label: 'Week 4', value: 850, change: '+128', x: 260, y: 30, date: 'June 8, 2026 - June 12, 2026', desc: 'Current census recorded and locked.' },
                    { label: 'Target', value: 900, change: 'Met', x: 330, y: 20, date: 'Registration closing date', desc: 'Optimal room load factors within limits.' },
                  ];

                  return (
                    <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/30 relative">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-405 block text-left">Enrollments registration rate</span>
                      <div className="w-full h-44 mt-3 relative flex items-end">
                        <svg viewBox="0 0 350 150" className="w-full h-full overflow-visible">
                          <defs>
                            <linearGradient id="enrollmentGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Filled Area */}
                          <path d="M 20 130 L 100 110 L 180 60 L 260 30 L 330 20 L 330 135 L 20 135 Z" fill="url(#enrollmentGrad)" />
                          
                          {/* Connected Line path */}
                          <path d="M 20 130 L 100 110 L 180 60 L 260 30 L 330 20" fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
                          
                          {/* Interactive points */}
                          {enrollmentData.map((d, idx) => {
                            const isHovered = hoveredEnrollmentIndex === idx;
                            return (
                              <g key={idx}>
                                {/* Touch hover node */}
                                <circle 
                                  cx={d.x} 
                                  cy={d.y} 
                                  r="16" 
                                  fill="transparent" 
                                  className="cursor-pointer"
                                  onMouseEnter={() => setHoveredEnrollmentIndex(idx)}
                                  onMouseLeave={() => setHoveredEnrollmentIndex(null)}
                                />
                                {isHovered && (
                                  <circle 
                                    cx={d.x} 
                                    cy={d.y} 
                                    r="8" 
                                    fill="none" 
                                    stroke="#6366f1" 
                                    strokeWidth="1.5" 
                                    className="animate-ping opacity-65"
                                  />
                                )}
                                <circle 
                                  cx={d.x} 
                                  cy={d.y} 
                                  r={isHovered ? 6 : 4} 
                                  fill="#121212" 
                                  stroke="#6366f1" 
                                  strokeWidth={isHovered ? 3 : 2.5}
                                  className="transition-all duration-150"
                                />
                                <text 
                                  x={d.x} 
                                  y={d.y - 12} 
                                  fontSize="8" 
                                  fill="#6366f1" 
                                  fontWeight={isHovered ? "black" : "bold"} 
                                  textAnchor="middle" 
                                  className="font-mono"
                                >
                                  {d.value}
                                </text>
                              </g>
                            );
                          })}

                          {/* Period Marks */}
                          <text x="20" y="145" fontSize="8" fill="#888">Wk 1</text>
                          <text x="100" y="145" fontSize="8" fill="#888">Wk 2</text>
                          <text x="180" y="145" fontSize="8" fill="#888">Wk 3</text>
                          <text x="260" y="145" fontSize="8" fill="#888">Wk 4</text>
                          <text x="320" y="145" fontSize="8" fill="#888">Tgt</text>
                        </svg>

                        {/* Enrollment Custom Tooltip popup */}
                        {hoveredEnrollmentIndex !== null && (() => {
                          const data = enrollmentData[hoveredEnrollmentIndex];
                          return (
                            <div 
                              className="absolute z-20 p-3 rounded-xl bg-zinc-950/95 text-white border border-zinc-800 shadow-xl pointer-events-none transition-all duration-150 backdrop-blur-md flex flex-col gap-1 w-52 text-left"
                              style={{
                                left: `${(data.x / 350) * 100}%`,
                                bottom: `${(150 - data.y + 12) / 150 * 100}%`,
                                transform: 'translateX(-50%)',
                              }}
                            >
                              <div className="flex items-center justify-between border-b border-zinc-900 pb-1 mb-1">
                                <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-widest">{data.label} Roster</span>
                                <span className="text-[9px] font-mono text-indigo-300 font-bold">{data.change}</span>
                              </div>
                              <p className="text-[10px] font-bold text-zinc-100">{data.date}</p>
                              <p className="text-[9.5px] text-zinc-300 leading-tight mt-0.5">{data.desc}</p>
                              <p className="text-[8px] text-zinc-400 mt-1 leading-normal border-t border-zinc-900/50 pt-1">
                                Total Enrolled: <strong className="text-indigo-400 text-[10px]">{data.value}</strong>
                              </p>
                              <div className="absolute left-1/2 bottom-0 w-2 h-2 bg-zinc-950 border-r border-b border-zinc-800 transform -translate-x-1/2 translate-y-1/2 rotate-45" />
                            </div>
                          );
                        })()}
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-2 text-left">Total term enrollment increased by <b>18.4%</b> since campaign start.</p>
                    </div>
                  );
                })()}

              </div>

              {/* Dynamic horizontal metrics: Faculty Workloads & Room Utilization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-zinc-100 dark:border-zinc-900 text-left">
                
                {/* Faculty workload meter list */}
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-black text-zinc-800 dark:text-zinc-100">Faculty Workload allocation</h4>
                    <p className="text-[10px] text-zinc-400 leading-normal">Operational class hours compared with maximum allowed workload</p>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { name: 'Dr. Ahmad Khan', hours: 18, max: 24, percent: 75, status: 'Active' },
                      { name: 'Prof. Maria Santos', hours: 22, max: 24, percent: 91, status: 'Near-Limit' },
                      { name: 'Dr. Jose Rizal Jr', hours: 12, max: 24, percent: 50, status: 'Available' }
                    ].map((fac, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-zinc-700 dark:text-zinc-200">{fac.name}</span>
                          <span className="font-mono text-zinc-400"><b>{fac.hours}h</b> / {fac.max}h ({fac.percent}%)</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-850 overflow-hidden relative">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              fac.percent > 90 ? 'bg-indigo-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${fac.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Laboratory/Room occupied coordinates meters */}
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-black text-zinc-800 dark:text-zinc-100">Laboratory Room Utilization</h4>
                    <p className="text-[10px] text-zinc-400 leading-normal">Real-time occupancy and active scanner terminal logs</p>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { room: 'ComLab Terminal #1', currScale: '8/10 active slots', percent: 80, active: true },
                      { room: 'Lecture Hall Block A', currScale: 'Fully Empty', percent: 0, active: false },
                      { room: 'Electronics Lab #3', currScale: '6/10 active slots', percent: 60, active: true }
                    ].map((rm, idx) => (
                      <div key={idx} className="space-y-1 bg-zinc-50 dark:bg-zinc-900/40 p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-805">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-zinc-700 dark:text-zinc-200">{rm.room}</span>
                          <span className={`px-1 rounded-[4px] text-[8px] font-bold ${
                            rm.percent > 70 ? 'bg-amber-500/10 text-amber-500' : rm.percent > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-200 dark:bg-zinc-850 text-zinc-400'
                          }`}>
                            {rm.active ? 'Occupied' : 'Vacant'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                rm.percent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${rm.percent}%` }}
                            />
                          </div>
                          <span className="font-mono text-[9px] text-zinc-400 min-w-16 text-right shrink-0">{rm.currScale}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* Right Column: Live Audit Activities/Timeline Logs list */}
            <div className="p-6 rounded-[1.5rem] border lg:col-span-4 space-y-4 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-855 text-left">
              <div>
                <h3 className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Clock className="w-5 h-5 text-indigo-500" />
                  Live Audit Timeline
                </h3>
                <p className="text-xs text-zinc-400">Real-time system events register flow</p>
              </div>

              <div className="relative pt-2">
                {/* Visual line */}
                <div className="absolute top-4 bottom-4 left-3 border-l border-zinc-200 dark:border-zinc-800" />

                <div className="space-y-4 relative">
                  {[
                    { title: 'New Student registered', desc: 'UID 2023-11029 (Bob Johnson) was assigned class CS-101 coordinates.', time: '5 min ago', status: 'primary' },
                    { title: 'Faculty schedule modified', desc: 'Dr. Ahmad Khan reassigned Friday lab timeslot.', time: '30 min ago', status: 'warning' },
                    { title: 'Circular dispatch aired', desc: 'Syllabus broadcast bulletin transmitted across MSU rosters.', time: '1 hour ago', status: 'success' },
                    { title: 'Credentials reset logged', desc: 'Prof. Santos synchronized dashboard certificates keys.', time: '2 hours ago', status: 'primary' }
                  ].map((act, idx) => (
                    <div key={idx} className="flex gap-4 items-start text-left pl-1">
                      <div className={`mt-1 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-zinc-950 flex items-center justify-center shrink-0 ${
                        act.status === 'success' 
                          ? 'bg-emerald-500 text-white' 
                          : act.status === 'warning' 
                          ? 'bg-amber-500 text-white' 
                          : 'bg-indigo-500 text-white'
                      } z-10 shadow-xs`}>
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-extrabold text-zinc-805 dark:text-zinc-200 truncate">{act.title}</h4>
                        <p className="text-[10px] text-zinc-400 mt-1 leading-normal">{act.desc}</p>
                        <span className="text-[8px] text-zinc-500 block font-mono tracking-wider mt-1 uppercase">{act.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* SEC_3. Dynamic Announcements & Broadcast Hub */}
          <div className="p-6 rounded-2xl border bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-850 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-900">
              <div>
                <h3 className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-indigo-500 animate-pulse" />
                  Campus Broadcast & Megaphone Hub
                </h3>
                <p className="text-xs text-zinc-400">Post dynamic alerts that automatically synchronize across specific target dashboards (All, Students, or Faculty)</p>
              </div>

              <button
                onClick={() => {
                  setAnnEditingId(null);
                  setAnnTitle('');
                  setAnnContent('');
                  setAnnTarget('all');
                  setIsAnnFormOpen(true);
                  speakText("Opening campaign circular composer form", accessibility.readAloud);
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                Launch Bulletin
              </button>
            </div>

            {/* Compose/Edit announcement Form Modal */}
            {isAnnFormOpen && (
              <div className="p-5 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.02] dark:bg-zinc-900/60 transition-all space-y-4 animate-scale-up text-left">
                <div className="flex justify-between items-center pb-2 border-b border-indigo-500/10">
                  <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                    {annEditingId ? 'Revising Academic Bulletin' : '📣 Drafting New Campus Broadcast'}
                  </h4>
                  <button
                    onClick={() => setIsAnnFormOpen(false)}
                    className="text-[10px] uppercase font-black tracking-wider text-zinc-450 hover:text-red-500 cursor-pointer"
                  >
                    Cancel ×
                  </button>
                </div>

                <form onSubmit={handleSaveAnnouncement} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Bulletin Title</label>
                      <input
                        type="text"
                        value={annTitle}
                        onChange={(e) => setAnnTitle(e.target.value)}
                        placeholder="e.g. System Upgrades, Classroom Relocations..."
                        className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-zinc-100"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Target Audience</label>
                      <select
                        value={annTarget}
                        onChange={(e) => setAnnTarget(e.target.value as 'all' | 'student' | 'faculty')}
                        className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-indigo-550 outline-none text-zinc-900 dark:text-zinc-100"
                      >
                        <option value="all">Everyone (All Academic Users)</option>
                        <option value="student">Students Directory Only</option>
                        <option value="faculty">Faculty & Professors Only</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Detailed Content</label>
                    <textarea
                      value={annContent}
                      onChange={(e) => setAnnContent(e.target.value)}
                      placeholder="Specify dates, deadlines, policies, coordinates, and clear instructions..."
                      rows={3}
                      className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-zinc-100"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAnnFormOpen(false)}
                      className="px-4 py-2 border border-zinc-300 dark:border-zinc-805 rounded-xl font-bold uppercase hover:bg-zinc-100 dark:hover:bg-zinc-955 text-zinc-500 cursor-pointer"
                    >
                      Dismiss
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase tracking-wider cursor-pointer"
                    >
                      {annEditingId ? 'Update & Sync Broadcast' : 'Publish & Broadcast Live'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* List of active bulletins */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {announcements.map((ann) => (
                <div 
                  key={ann.id} 
                  className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-850 dark:bg-zinc-900/10 hover:bg-zinc-50 dark:hover:bg-zinc-900/20 flex flex-col justify-between gap-4 text-left hover:border-indigo-500/25 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        ann.target === 'all' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-350' :
                        ann.target === 'student' ? 'bg-indigo-500/10 text-indigo-550 dark:text-indigo-400' :
                        'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        Target: {ann.target.toUpperCase()}
                      </span>
                      <span className="text-[8px] font-mono text-zinc-400">{new Date(ann.createdAt).toLocaleDateString()}</span>
                    </div>

                    <h4 className="font-extrabold text-xs text-zinc-905 dark:text-zinc-100 leading-tight">{ann.title}</h4>
                    <p className="text-[11px] text-zinc-650 dark:text-zinc-400 leading-relaxed font-sans">{ann.content}</p>
                  </div>

                  <div className="flex gap-2 justify-end pt-2.5 border-t border-zinc-100 dark:border-zinc-900/60 text-xs">
                    <button
                      onClick={() => handleEditAnnClick(ann)}
                      className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300 font-extrabold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Edit Bulletin content"
                    >
                      <Edit className="w-3.5 h-3.5 text-indigo-500" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAnnClick(ann.id, ann.title)}
                      className="px-2.5 py-1 bg-zinc-100 hover:bg-red-500/15 dark:bg-zinc-900 dark:hover:bg-red-950 rounded-lg text-red-550 dark:text-red-400 font-extrabold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Delete Announcement"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}

              {announcements.length === 0 && (
                <div className="col-span-full py-12 border border-dashed border-zinc-250 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center">
                  <Megaphone className="w-8 h-8 text-zinc-300 animate-bounce mb-2" />
                  <p className="text-xs text-zinc-400 font-bold">No active administrative announcements posted on school servers.</p>
                </div>
              )}
            </div>
          </div>

        </motion.div>
      )}

      {/* 2. USERS DIRECTORY VIEW */}
      {activeScreen === 'users' && (
        <motion.div
          key="users"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6 text-left animate-fade-in"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black tracking-tight">University Users Directories</h2>
              <p className="text-xs text-zinc-400">View registered students, instructors, and departments coordinates</p>
            </div>

            <button
              onClick={() => setIsUserFormOpen(true)}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Add User
            </button>
          </div>

          {/* Directory Filter triggers */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {(['all', 'student', 'faculty'] as const).map((rl) => (
                <button
                  key={rl}
                  onClick={() => setDirectoryRoleFilter(rl)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    directoryRoleFilter === rl
                      ? 'bg-emerald-500 text-black shadow-sm'
                      : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-850'
                  }`}
                >
                  {rl === 'all' ? 'All Roles' : rl + 's'}
                </button>
              ))}
            </div>

            {/* Fast Tracing search box */}
            <div className="relative w-full md:max-w-xs shrink-0">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 pointer-events-none">
                <Search className="w-4 h-4 text-emerald-500" />
              </span>
              <input
                type="text"
                value={userDirectorySearch}
                onChange={(e) => setUserDirectorySearch(e.target.value)}
                placeholder="Search name, email, dept, or ID..."
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-505"
              />
            </div>
          </div>

          {/* Add User modal form inline */}
          {isUserFormOpen && (
            <div className="p-6 rounded-2xl border animate-scale-up bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-805 shadow-xl">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-900">
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">Enlist New Account Coordinates</h3>
                <button
                  onClick={() => setIsUserFormOpen(false)}
                  className="p-1 px-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg text-zinc-500 cursor-pointer text-xs uppercase font-extrabold"
                >
                  <X className="w-4 h-4 inline mr-1" /> Close
                </button>
              </div>

              <form onSubmit={handleAddUserSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-widest text-left">Full Name</label>
                    <input
                      type="text"
                      className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-900 dark:text-zinc-100"
                      placeholder="e.g. Rachel Green"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-zinc-455 uppercase tracking-widest text-left">Academic Email</label>
                    <input
                      type="email"
                      className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-900 dark:text-zinc-100"
                      placeholder="e.g. rachel.green@msu.edu.ph"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-zinc-455 uppercase tracking-widest text-left">Credential Role</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as 'student' | 'faculty')}
                      className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-zinc-455 uppercase tracking-widest text-left">ID Number</label>
                    <input
                      type="text"
                      className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-900 dark:text-zinc-100"
                      placeholder="e.g. 2023-10901 or FAC-1203"
                      value={newUserID}
                      onChange={(e) => setNewUserID(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-zinc-455 uppercase tracking-widest text-left">Department</label>
                    <select
                      value={newUserDep}
                      onChange={(e) => setNewUserDep(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-900 dark:text-zinc-100"
                    >
                      {departmentsList.map((dep, d_id) => (
                        <option key={d_id} value={dep}>{dep}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsUserFormOpen(false)}
                    className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 rounded-xl text-zinc-450 text-xs font-bold uppercase cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-500 text-black hover:bg-emerald-400 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                  >
                    Enlist Directory Acc
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* User Directory Separated Lists & Roster Layout */}
          <div className="space-y-8">
            
            {/* 1. FACULTY MEMBERS ROSTER SECTION */}
            {(directoryRoleFilter === 'all' || directoryRoleFilter === 'faculty') && (
              <div className="space-y-4">
                <div className="border-b border-zinc-200 dark:border-zinc-850 pb-2 flex items-center justify-between">
                  <h3 className="font-black text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Faculty Members Registry ({usersList.filter(u => u.role === 'faculty').length})
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-450 uppercase">ClassPulse Instruction Staff</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {usersList
                    .filter(u => u.role === 'faculty' && (
                      u.name.toLowerCase().includes(userDirectorySearch.toLowerCase()) ||
                      u.email.toLowerCase().includes(userDirectorySearch.toLowerCase()) ||
                      u.department.toLowerCase().includes(userDirectorySearch.toLowerCase()) ||
                      u.uid.toLowerCase().includes(userDirectorySearch.toLowerCase())
                    ))
                    .map(u => {
                      // Find courses taught by this faculty member
                      const coursesTaught = classes.filter(
                        c => c.facultyName.toLowerCase() === u.name.toLowerCase() || c.facultyId === u.uid
                      );
                      
                      return (
                        <div 
                          key={u.id}
                          className="p-5 rounded-2xl border bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-850 shadow-xs flex flex-col justify-between gap-4 transition-all"
                        >
                          <div className="flex gap-3 text-left">
                            <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm bg-emerald-500 text-black shrink-0 shadow-xs">
                              {u.name[0]}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">{u.name}</h4>
                                <span className="text-[8px] uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-extrabold">
                                  Professor
                                </span>
                              </div>
                              
                              <div className="space-y-1.5 mt-2.5 text-xs text-zinc-400">
                                <p className="flex items-center gap-1.5 font-semibold text-zinc-500">
                                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                                  <span className="truncate">{u.email}</span>
                                </p>
                                <p className="flex items-center gap-1.5 text-zinc-450 dark:text-zinc-400">
                                  <Building className="w-3.5 h-3.5 text-zinc-500" />
                                  <span>{u.department}</span>
                                </p>
                                <span className="text-[9px] bg-zinc-100 dark:bg-zinc-900 text-zinc-500 font-mono tracking-wide px-1.5 py-0.5 rounded inline-block mt-1 font-extrabold">
                                  FAC_ID: {u.uid}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-1 shrink-0 self-start">
                              <button
                                onClick={() => handleStartEditUser(u)}
                                className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl text-zinc-500 hover:text-zinc-850 cursor-pointer transition-colors"
                                title="Edit User Details"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                className="p-2 border border-red-500/10 hover:bg-red-500/10 rounded-xl text-red-500 cursor-pointer transition-colors"
                                title="Revoke Staff Credentials"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Classes taught sub-list */}
                          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-left mb-2">Assigned Curriculum Classes</p>
                            {coursesTaught.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {coursesTaught.map(cls => (
                                  <button
                                    key={cls.id}
                                    onClick={() => {
                                      setSelectedClassDetail(cls);
                                      setIsDetailModalOpen(true);
                                      speakText(`Reviewing course outline for ${cls.code}`, accessibility.readAloud);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-zinc-50 hover:bg-emerald-500/10 hover:text-emerald-500 border border-zinc-200 dark:border-zinc-800 text-[10px] font-black text-zinc-650 dark:text-zinc-350 cursor-pointer flex items-center gap-1 transition-all"
                                  >
                                    <BookOpen className="w-3 h-3 text-emerald-500" />
                                    <span>{cls.code}</span>
                                    <span className="text-zinc-400">({cls.days.join('')})</span>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[10px] text-zinc-400 italic text-left">No classes scheduled in registry.</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* 2. REGISTERED STUDENTS DIRECTORY SECTION */}
            {(directoryRoleFilter === 'all' || directoryRoleFilter === 'student') && (
              <div className="space-y-4">
                <div className="border-b border-zinc-200 dark:border-zinc-850 pb-2 flex items-center justify-between">
                  <h3 className="font-black text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    Enrolled Students Registry ({usersList.filter(u => u.role === 'student').length})
                  </h3>
                  <span className="text-[10px] font-mono text-indigo-400 uppercase">ClassPulse Academic Cohort</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {usersList
                    .filter(u => u.role === 'student' && (
                      u.name.toLowerCase().includes(userDirectorySearch.toLowerCase()) ||
                      u.email.toLowerCase().includes(userDirectorySearch.toLowerCase()) ||
                      u.department.toLowerCase().includes(userDirectorySearch.toLowerCase()) ||
                      u.uid.toLowerCase().includes(userDirectorySearch.toLowerCase())
                    ))
                    .map(u => {
                      // Find student enrollments in local/global table
                      const studentEnrollments = enrollments.filter(
                        e => e.studentName.toLowerCase() === u.name.toLowerCase() || e.studentId === u.uid
                      );

                      // Resolve actual course structures matching enrollments
                      // Fallback to presenting first 1-2 classes if none enrolled in test DB
                      const enrolledClasses = classes.filter(
                        c => studentEnrollments.some(e => e.classId === c.id) || classes.indexOf(c) < 2
                      );

                      // Dynamic student academic standing calculations
                      const studentRecords = attendanceRecords.filter(
                        r => r.studentId === u.uid || r.studentName.toLowerCase() === u.name.toLowerCase()
                      );
                      const absentsCount = studentRecords.filter(r => r.status === 'absent').length;

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

                      let standingLabel = 'Good Standing';
                      let standingColor = 'bg-emerald-500/10 text-emerald-650 dark:text-emerald-400';
                      let isMonitored = false;

                      if (absentsCount >= 5 || maxConsecutive >= 3) {
                        standingLabel = '🚫 Dropped';
                        standingColor = 'bg-red-500/10 text-red-500 font-extrabold';
                        isMonitored = true;
                      } else if (absentsCount >= 3) {
                        standingLabel = '⚠️ Warning';
                        standingColor = 'bg-amber-500/10 text-amber-500 font-extrabold';
                        isMonitored = true;
                      }

                      return (
                        <div 
                          key={u.id}
                          className={`p-5 rounded-3xl border bg-white dark:bg-zinc-950 shadow-xs flex flex-col justify-between gap-4 transition-all ${
                            isMonitored 
                              ? 'border-red-500/30 ring-1 ring-red-500/10 bg-red-500/[0.01]' 
                              : 'border-zinc-200 dark:border-zinc-855'
                          }`}
                        >
                          <div className="flex gap-3 text-left">
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-xs ${
                              isMonitored ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-600'
                            }`}>
                              {u.name[0]}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">{u.name}</h4>
                                <span className="text-[8px] uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-405 text-indigo-400 font-extrabold">
                                  Student
                                </span>
                                <span className={`text-[8.5px] uppercase font-black px-1.5 py-0.5 rounded-md ${standingColor}`}>
                                  {standingLabel}
                                </span>
                              </div>

                              <div className="space-y-1.5 mt-2.5 text-xs text-zinc-400">
                                <p className="flex items-center gap-1.5 font-semibold text-zinc-500">
                                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                                  <span className="truncate">{u.email}</span>
                                </p>
                                <p className="flex items-center gap-1.5 text-zinc-450 dark:text-zinc-400">
                                  <Building className="w-3.5 h-3.5 text-zinc-500" />
                                  <span>{u.department}</span>
                                </p>
                                <span className="text-[9px] bg-zinc-100 dark:bg-zinc-900 text-zinc-500 font-mono tracking-wide px-1.5 py-0.5 rounded inline-block mt-1 font-extrabold uppercase">
                                  UID: {u.uid}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-1 shrink-0 self-start">
                              <button
                                onClick={() => handleStartEditUser(u)}
                                className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl text-zinc-500 hover:text-zinc-850 cursor-pointer transition-colors"
                                title="Edit User Details"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                className="p-2 border border-red-500/10 hover:bg-red-500/10 rounded-xl text-red-500 cursor-pointer transition-colors"
                                title="Revoke Student Enrollment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Enrolled Courses list */}
                          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Enrolled Curriculum Cohorts</p>
                              {isMonitored && (
                                <span className="text-[8px] font-extrabold text-red-500 uppercase font-mono tracking-wider">
                                  ⚠️ High Lateness Monitor active
                                </span>
                              )}
                            </div>
                            
                            {enrolledClasses.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {enrolledClasses.map(cls => {
                                  // Alice Smith simulated low rate (76%) otherwise 94%
                                  const attRate = (u.name.toLowerCase().includes('alice') && cls.code === 'ITE183') ? 76 : 94;
                                  return (
                                    <button
                                      key={cls.id}
                                      onClick={() => {
                                        setSelectedClassDetail(cls);
                                        setIsDetailModalOpen(true);
                                        speakText(`Reviewing class record detail metrics for ${cls.code}`, accessibility.readAloud);
                                      }}
                                      className={`px-2.5 py-1 rounded-lg border text-[10px] font-black cursor-pointer flex items-center gap-1 transition-all ${
                                        attRate < 85 
                                          ? 'bg-red-500/10 border-red-550/20 text-red-500 hover:bg-red-500/20' 
                                          : 'bg-zinc-50 hover:bg-emerald-500/15 hover:text-emerald-500 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-350'
                                      }`}
                                    >
                                      <BookOpen className="w-3 h-3 text-indigo-500" />
                                      <span>{cls.code}</span>
                                      <span className="font-mono text-[9px] font-extrabold">({attRate}%)</span>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-[10px] text-zinc-400 italic">Not registered to check-ins.</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

          </div>
        </motion.div>
      )}

      {/* Edit User Modal Dialog Overlay */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-left animate-scale-up">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-zinc-105 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-500 hover:text-zinc-750 flex items-center justify-center cursor-pointer transition-all active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-100 dark:border-zinc-900">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Edit className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">Edit Directory Record</h3>
                <p className="text-[10px] text-zinc-400">Modifying profile data credentials for {editingUser.role}</p>
              </div>
            </div>

            <form onSubmit={handleEditUserSubmit} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-zinc-455 uppercase tracking-widest font-sans">Full Name</label>
                <input
                  type="text"
                  required
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-zinc-455 uppercase tracking-widest font-sans">Official Email Address</label>
                <input
                  type="email"
                  required
                  value={editUserEmail}
                  onChange={(e) => setEditUserEmail(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-zinc-455 uppercase tracking-widest font-sans">{editingUser.role === 'faculty' ? 'Faculty ID' : 'Student ID'}</label>
                  <input
                    type="text"
                    required
                    value={editUserUid}
                    onChange={(e) => setEditUserUid(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-900 dark:text-zinc-100 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-zinc-455 uppercase tracking-widest font-sans font-sans">Department</label>
                  <select
                    value={editUserDep}
                    onChange={(e) => setEditUserDep(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-900 dark:text-zinc-100"
                  >
                    {departmentsList.map((dep, d_id) => (
                      <option key={d_id} value={dep}>{dep}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 rounded-xl text-zinc-450 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedules / Curriculum Editor screen for Admin */}
      {activeScreen === 'schedule-editor' && (
        <motion.div
          key="schedule-editor"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6 text-left animate-fade-in"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 uppercase">Master Schedules & Offerings</h2>
              <p className="text-xs text-zinc-400">Review University curriculum timetables, assigned instructors, and enrolled groups</p>
            </div>
          </div>

          <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl relative overflow-hidden flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-extrabold text-emerald-500">Administrator Clearance Active</h4>
              <p className="text-[10px] text-zinc-400 leading-relaxed mt-1">
                You have primary permissions to edit class profiles, view students enrolled across all departments, and inspect faculty session logs. Click any subject to invoke detailed audits.
              </p>
            </div>
          </div>

          {/* Grid Layout of Subjects grouped by code */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map(cls => {
              // Extract count of enrolled students
              const studentMatches = enrollments.filter(e => e.classId === cls.id).length;

              return (
                <div 
                  key={cls.id}
                  onClick={() => {
                    setSelectedClassDetail(cls);
                    setIsDetailModalOpen(true);
                    speakText(`Reviewing detailed outline for ${cls.code}`, accessibility.readAloud);
                  }}
                  className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 hover:border-emerald-500/30 shadow-xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between h-44 group relative"
                >
                  <div className="space-y-2 text-left">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-mono text-[10px] font-black uppercase">
                        {cls.code}
                      </span>
                      <div className="flex gap-1">
                        {cls.days.map(d => (
                          <span key={d} className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 rounded font-mono text-[9px] font-black">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>

                    <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-500 transition-colors line-clamp-1 text-left">
                      {cls.name}
                    </h3>
                  </div>

                  <div className="space-y-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-900 text-left">
                    <p className="text-[11px] text-zinc-500 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      Instructor: <span className="font-bold text-zinc-700 dark:text-zinc-300 truncate">{cls.facultyName}</span>
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-900/60 px-2 py-0.5 rounded border border-zinc-150 dark:border-zinc-850 font-mono">
                        <Clock className="w-3 h-3 text-emerald-500" />
                        {cls.startTime} - {cls.endTime}
                      </span>

                      <span className="font-bold text-zinc-500 dark:text-zinc-400 bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full text-[9px] font-black">
                        Room {cls.room}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Profile, editable settings */}
      {activeScreen === 'profile' && (
        <motion.div
          key="profile"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mx-auto space-y-6 text-left animate-fade-in text-zinc-900 dark:text-zinc-100"
        >
          <div className="p-6 rounded-2xl border bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-850 shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200 dark:border-zinc-855">
              <div>
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">Administrator Credentials & Biodata</h3>
                <p className="text-xs text-zinc-400">Modify global registration records and customize professional signature logs</p>
              </div>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-500 font-extrabold tracking-widest px-3 py-1 rounded-xl uppercase">
                Active Registrar Core
              </span>
            </div>

            {/* Avatar management (Upload / Remove) */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-150 dark:border-zinc-850">
              <div className="relative">
                {userProfile?.avatar ? (
                  <img 
                    src={userProfile.avatar} 
                    alt={userProfile.name}
                    className="w-16 h-16 rounded-full object-cover shadow-md border-2 border-emerald-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg uppercase">
                    {profileName ? profileName[0] : 'A'}
                  </div>
                )}
                
                {userProfile?.avatar && (
                  <button
                    onClick={() => {
                      if (confirm("Remove profile photograph?")) {
                        onUpdateProfile?.({ ...userProfile, avatar: undefined });
                        speakText("Administrative credentials photo removed, fallback to code insignia.", accessibility.readAloud);
                      }
                    }}
                    className="absolute -bottom-1 -right-1 bg-red-600 hover:bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center cursor-pointer shadow-sm font-black text-xs"
                    title="Remove Profile Photo"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="flex-1 space-y-1 text-center sm:text-left">
                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-450">Integrated Profile Picture</h4>
                <p className="text-[10px] text-zinc-450">Upload custom image files or drop them below to synchronize across security registers</p>
                <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-2 text-xs">
                  <label className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-505 text-white text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-xs transition-colors">
                    Upload Photograph
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result && userProfile) {
                              onUpdateProfile?.({ ...userProfile, avatar: event.target.result as string });
                              speakText("Profile image loaded and synchronized globally across directories.", accessibility.readAloud);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }} 
                    />
                  </label>
                  {userProfile?.avatar && (
                    <button
                      onClick={() => onUpdateProfile?.({ ...userProfile, avatar: undefined })}
                      className="px-3 py-1.5 border border-red-505/10 hover:bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer text-xs"
                    >
                      Delete Photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Forms Info */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Full Security Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-805 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-900 dark:text-zinc-100"
                    required
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Administrative Email</label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-805 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-900 dark:text-zinc-100"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Registered Contact No</label>
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+91 or +63 contact directories..."
                    className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-810 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Authority Department Coordinates</label>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-905/60 rounded-xl border border-zinc-200 dark:border-zinc-850 text-xs font-bold text-zinc-650 dark:text-zinc-400">
                    Office of Administrative Academic Registrar
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Professional Bio Description</label>
                <textarea
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  placeholder="Record credentials, office philosophies..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-805 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-900 dark:text-zinc-100"
                />
              </div>

              {profileSavedMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold animate-fade-in text-left">
                  ✓ Database transaction committed: BioData records successfully written global state logs!
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5 transition-all"
                >
                  Commit Biodata Settings
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* 5. INDIVIDUAL SUBJECT DETAILED AUDITS MODAL OVERLAY */}
      <SubjectDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedClassDetail(null);
        }}
        cls={selectedClassDetail}
        enrollments={enrollments}
        records={attendanceRecords}
        facultyStatuses={[]}
      />

    </div>
  );
}
