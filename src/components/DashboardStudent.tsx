import React from 'react';
import { 
  ClassSession, 
  AttendanceRecord, 
  AppNotification, 
  UserProfile, 
  AccessibilityConfig,
  FacultyStatus,
  Enrollment,
  Announcement
} from '../types';
import { 
  Scan, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  User, 
  ChevronRight, 
  FileText, 
  Sparkles,
  Camera,
  Play,
  RotateCcw,
  Wifi,
  WifiOff,
  Search,
  BellRing,
  Award,
  UploadCloud,
  X,
  MessageSquare
} from 'lucide-react';
import { speakText } from './AccessibilitySettings';
import AlarmClock, { triggerNativeChime } from './AlarmClock';
import SubjectDetailModal from './SubjectDetailModal';
import Messages from './Messages';

interface DashboardStudentProps {
  activeScreen: string;
  setScreen: (screen: string) => void;
  classes: ClassSession[];
  attendanceRecords: AttendanceRecord[];
  notifications: AppNotification[];
  facultyStatuses: FacultyStatus[];
  userProfile: UserProfile;
  isOffline: boolean;
  accessibility: AccessibilityConfig;
  enrollments: Enrollment[];
  onRecordAttendance: (classId: string, status: 'present' | 'late') => void;
  onUpdateProfile: (updated: UserProfile) => void;
  announcements?: Announcement[];
}

export default function DashboardStudent({
  activeScreen,
  setScreen,
  classes,
  attendanceRecords,
  notifications,
  facultyStatuses,
  userProfile,
  isOffline,
  accessibility,
  enrollments,
  onRecordAttendance,
  onUpdateProfile,
  announcements = []
}: DashboardStudentProps) {
  
  // State for search query inside My Schedule
  const [scheduleSearch, setScheduleSearch] = React.useState('');
  
  // Scanner stimulation state engines
  const [selectedScanClass, setSelectedScanClass] = React.useState<string>(classes[0]?.id || '');
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanningProgress, setScanningProgress] = React.useState(0);
  const [scanResult, setScanResult] = React.useState<{ success: boolean; message: string } | null>(null);

  // Modal display states
  const [selectedClassDetail, setSelectedClassDetail] = React.useState<ClassSession | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState<boolean>(false);

  // Reactive faculty class updates
  const [activeAlertClass, setActiveAlertClass] = React.useState<ClassSession | null>(null);
  const [alertDismissedIds, setAlertDismissedIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    const studentEnrolledIds = enrollments
      .filter(e => e.studentId === userProfile.studentId || e.studentEmail === userProfile.email)
      .map(e => e.classId);

    const updatedCls = classes.find(c => 
      studentEnrolledIds.includes(c.id) && 
      c.facultyStatusUpdate && 
      c.facultyStatusUpdate !== 'none' && 
      c.lastUpdateTimestamp &&
      !alertDismissedIds.includes(`${c.id}-${c.lastUpdateTimestamp}`)
    );

    if (updatedCls) {
      setActiveAlertClass(updatedCls);
      triggerNativeChime();
      const textToSpeak = `Attention! Instructor has posted an update for your course ${updatedCls.code}. Status declared is: ${updatedCls.facultyStatusUpdate.toUpperCase() === 'LATENEW' ? 'LATE ARRIVAL' : updatedCls.facultyStatusUpdate.toUpperCase()}. Please check details.`;
      speakText(textToSpeak, accessibility.readAloud);
    }
  }, [classes, enrollments, userProfile, alertDismissedIds, accessibility.readAloud]);
  
  // Profiles editable states
  const [profileName, setProfileName] = React.useState(userProfile.name);
  const [profileEmail, setProfileEmail] = React.useState(userProfile.email);
  const [profileAvatar, setProfileAvatar] = React.useState(userProfile.avatar);
  const [profileBio, setProfileBio] = React.useState(userProfile.bio || '');
  const [profilePhone, setProfilePhone] = React.useState(userProfile.phone || '');
  const [profileSavedMsg, setProfileSavedMsg] = React.useState(false);

  // Leave requests local persistence engine
  const [leaveRequests, setLeaveRequests] = React.useState<any[]>(() => {
    const cached = localStorage.getItem('classpulse_student_leaves');
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
        studentId: userProfile.studentId || 'STU-102',
        studentName: userProfile.name,
        classId: classes[0]?.id || 'CS-101',
        className: classes[0]?.name || 'Introduction to Computer Science',
        startDate: '2026-06-12',
        endDate: '2026-06-14',
        reason: 'Attending regional research conference presentation.',
        status: 'approved',
        createdAt: new Date().toISOString()
      }
    ];
  });

  React.useEffect(() => {
    localStorage.setItem('classpulse_student_leaves', JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  // Submit form states
  const [isLeaveFormOpen, setIsLeaveFormOpen] = React.useState(false);
  const [leaveClassId, setLeaveClassId] = React.useState(classes[0]?.id || '');
  const [leaveStartDate, setLeaveStartDate] = React.useState('');
  const [leaveEndDate, setLeaveEndDate] = React.useState('');
  const [leaveReason, setLeaveReason] = React.useState('');
  const [leaveAttachment, setLeaveAttachment] = React.useState<string | null>(null);
  const [leaveAttachmentName, setLeaveAttachmentName] = React.useState<string>('');

  // Keep internal states synced with props changes
  React.useEffect(() => {
    setProfileName(userProfile.name);
    setProfileEmail(userProfile.email);
    setProfileAvatar(userProfile.avatar);
    setProfileBio(userProfile.bio || '');
    setProfilePhone(userProfile.phone || '');
  }, [userProfile]);

  // Trigger simulated scan sequence
  const startSimulationScan = () => {
    setIsScanning(true);
    setScanningProgress(0);
    setScanResult(null);
    speakText("Starting high-accuracy QR code attendance scan, hold camera steady", accessibility.readAloud);

    const interval = setInterval(() => {
      setScanningProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          handleScanSuccess();
          return 100;
        }
        return prev + 20;
      });
    }, 200);
  };

  const handleScanSuccess = () => {
    const matchedClass = classes.find(c => c.id === selectedScanClass);
    if (!matchedClass) {
      setIsScanning(false);
      setScanResult({ success: false, message: "Invalid Class Code Scanned." });
      speakText("Scan failed. Class not recognized.", accessibility.readAloud);
      return;
    }

    // Determine present or late state
    const status = Math.random() > 0.8 ? 'late' : 'present';
    onRecordAttendance(matchedClass.id, status);

    setIsScanning(false);
    setScanResult({
      success: true,
      message: `Verified! Attendance checked into ${matchedClass.code} (${matchedClass.name}) successfully as ${status.toUpperCase()}!`
    });
    
    speakText(`Attendance recorded successfully. Checked as ${status}`, accessibility.readAloud);
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
        speakText("New avatar graphic uploaded cleanly. Click save details to publish.", accessibility.readAloud);
      };
      reader.readAsDataURL(file);
    }
  };

  // Compute stats metrics dynamically
  const totalChecked = attendanceRecords.filter(r => r.studentId === userProfile.studentId || r.studentName === userProfile.name).length;
  const presentsCount = attendanceRecords.filter(r => r.status === 'present' && (r.studentId === userProfile.studentId || r.studentName === userProfile.name)).length;
  const latesCount = attendanceRecords.filter(r => r.status === 'late' && (r.studentId === userProfile.studentId || r.studentName === userProfile.name)).length;
  const absentsCount = attendanceRecords.filter(r => r.status === 'absent' && (r.studentId === userProfile.studentId || r.studentName === userProfile.name)).length;
  
  const attendanceRate = totalChecked > 0 ? Math.round(((presentsCount + latesCount * 0.7) / totalChecked) * 100) : 100;

  return (
    <div className="space-y-6">
      
      {/* 1. STUDENT DASHBOARD CONTAINER */}
      {activeScreen === 'dashboard' && (
        <div className="space-y-6 animate-fade-in text-left">
          {/* Welcome Banner */}
          <div className="p-6 md:p-8 rounded-3xl relative overflow-hidden transition-all duration-300 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-850 text-white shadow-xl shadow-emerald-500/5">
            <div className="relative z-10 space-y-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/15 text-white/90">
                <Sparkles className="w-3.5 h-3.5" />
                Active Attendance Session
              </span>
              <h2 className="text-2xl md:text-3.5xl font-black tracking-tight">
                Welcome Back, {userProfile.name}!
              </h2>
              <p className="text-white/85 text-xs max-w-xl leading-relaxed">
                Stay updated with the heartbeat of your classes. Review schedules, scan QR codes instantly below to enroll, and track your attendance rates live on the dashboard.
              </p>
            </div>
            
            {/* Background Graphic */}
            <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-6 translate-x-6">
              <Scan className="w-64 h-64 text-white" />
            </div>
          </div>

          {/* Targeted Administrative Announcements */}
          {announcements.filter(ann => ann.target === 'all' || ann.target === 'student').length > 0 && (
            <div className="p-5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/[0.02] border border-amber-500/15 text-amber-950 dark:text-amber-300 space-y-3 text-left">
              <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-550 bg-amber-500 animate-pulse" />
                University Bulletins ({announcements.filter(ann => ann.target === 'all' || ann.target === 'student').length})
              </h4>
              <div className="space-y-3 divide-y divide-amber-500/10">
                {announcements
                  .filter(ann => ann.target === 'all' || ann.target === 'student')
                  .map((ann) => (
                    <div key={ann.id} className="pt-3 first:pt-0">
                      <h5 className="text-xs font-extrabold text-amber-600 dark:text-amber-400">{ann.title}</h5>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed font-sans">{ann.content}</p>
                      <span className="text-[8px] text-zinc-400 dark:text-zinc-500 font-mono tracking-wider block mt-1 uppercase">Issued {new Date(ann.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Student Quick Action & Leave Request Desk */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-sm space-y-4 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-900">
              <div>
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-500" />
                  Student Quick Actions & Leave Portal
                </h3>
                <p className="text-xs text-zinc-400">File official medical certifications, fast-access the QR scanner, or message professors directly.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsLeaveFormOpen(true);
                  speakText("Opening Leave request application launcher.", accessibility.readAloud);
                }}
                className="p-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-left transition-all hover:scale-[1.01] cursor-pointer flex flex-col justify-between h-24"
              >
                <div className="p-1.5 rounded-lg bg-emerald-500 text-black w-fit">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">File Leave Request</h4>
                  <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">Submit official excuses & certs</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  // Scroll smoothly to attendance scanner section at bottom of container
                  const scannerEl = document.getElementById('attendance-scanner-card');
                  if (scannerEl) {
                    scannerEl.scrollIntoView({ behavior: 'smooth' });
                    speakText("Navigating downwards to QR attendance scanner.", accessibility.readAloud);
                  }
                }}
                className="p-4 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 text-left transition-all hover:scale-[1.01] cursor-pointer flex flex-col justify-between h-24"
              >
                <div className="p-1.5 rounded-lg bg-indigo-550 bg-indigo-500 text-white w-fit">
                  <Scan className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Scan Attendance QR</h4>
                  <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">Check-in dynamically</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setScreen('messages');
                  speakText("Opening professor direct message interface.", accessibility.readAloud);
                }}
                className="p-4 rounded-xl bg-orange-500/10 hover:bg-orange-500/15 border border-orange-500/20 text-left transition-all hover:scale-[1.01] cursor-pointer flex flex-col justify-between h-24"
              >
                <div className="p-1.5 rounded-lg bg-orange-500 text-white w-fit">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Message Professor</h4>
                  <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">Reach out to lecturers live</p>
                </div>
              </button>
            </div>

            {/* Leave Requests Drawer Modal */}
            {isLeaveFormOpen && (
              <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-xl p-6 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-2xl relative animate-scale-up space-y-5 text-left max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-150 dark:border-zinc-900">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-500" />
                      <h3 className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-zinc-100 uppercase">Apply for Leave of Absence</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsLeaveFormOpen(false)}
                      className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-650 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!leaveStartDate || !leaveEndDate || !leaveReason) {
                        speakText("Please complete all required fields.", accessibility.readAloud);
                        return;
                      }
                      const activeCls = classes.find(c => c.id === leaveClassId) || classes[0];
                      const newRequest = {
                        id: `LV-${Math.floor(100 + Math.random() * 900)}`,
                        studentId: userProfile.studentId || 'STU-102',
                        studentName: userProfile.name,
                        classId: activeCls.id,
                        className: activeCls.name,
                        startDate: leaveStartDate,
                        endDate: leaveEndDate,
                        reason: leaveReason,
                        status: 'pending',
                        createdAt: new Date().toISOString(),
                        attachmentName: leaveAttachmentName || undefined
                      };
                      setLeaveRequests(prev => [newRequest, ...prev]);
                      setIsLeaveFormOpen(false);
                      // Reset fields
                      setLeaveStartDate('');
                      setLeaveEndDate('');
                      setLeaveReason('');
                      setLeaveAttachment(null);
                      setLeaveAttachmentName('');
                      speakText(`Success! Leave request submitted to Professor ${activeCls.facultyName} for approval.`, accessibility.readAloud);
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block font-bold">Select Target Subject Class</label>
                      <select
                        value={leaveClassId}
                        onChange={(e) => setLeaveClassId(e.target.value)}
                        className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none font-bold"
                      >
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block font-bold">Start Date</label>
                        <input
                          type="date"
                          required
                          value={leaveStartDate}
                          onChange={(e) => setLeaveStartDate(e.target.value)}
                          className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block font-bold">End Date</label>
                        <input
                          type="date"
                          required
                          value={leaveEndDate}
                          onChange={(e) => setLeaveEndDate(e.target.value)}
                          className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block font-bold">Formal Justification Reason</label>
                      <textarea
                        required
                        value={leaveReason}
                        onChange={(e) => setLeaveReason(e.target.value)}
                        placeholder="Please elaborate detailed reason for your absence (e.g., medical leave request with certificates)..."
                        className="w-full text-xs p-3 h-20 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none"
                      />
                    </div>

                    {/* Drag and Drop File Upload Mock for Medical Certificates */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block font-bold">Upload Medical Excuse or Supporting Slip</label>
                      <div
                        onClick={() => {
                          const fakeCerts = ['doctor_slip_certified.pdf', 'excuse_letter_final.pdf', 'dentist_referral_scanned.png'];
                          const name = fakeCerts[Math.floor(Math.random() * fakeCerts.length)];
                          setLeaveAttachmentName(name);
                          setLeaveAttachment('data:application/pdf;base64,mockContent');
                          speakText(`Successfully simulated certificate attachment upload: ${name}`, accessibility.readAloud);
                        }}
                        className="border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl p-4 text-center hover:bg-zinc-50 dark:hover:bg-zinc-900/40 cursor-pointer transition-colors space-y-1"
                      >
                        <UploadCloud className="w-7 h-7 mx-auto text-zinc-400 shrink-0" />
                        <h5 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          {leaveAttachmentName ? `File Attached: ${leaveAttachmentName}` : 'Click to Upload supporting Cert / Slip'}
                        </h5>
                        <p className="text-[9px] text-zinc-400">PDF, PNG, JPG (maximum size 5MB supported)</p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-505 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-sm transition-all"
                    >
                      Submit Official Request
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Render student applied leaves inline */}
            {leaveRequests.length > 0 && (
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 text-left">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Leave Applications ({leaveRequests.length})</span>
                <div className="space-y-2 mt-2 max-h-36 overflow-y-auto scrollbar-thin">
                  {leaveRequests.map(req => (
                    <div key={req.id} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-150 dark:border-zinc-850 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="font-extrabold text-xs text-zinc-800 dark:text-zinc-200">{req.className}</span>
                          <span className="text-[9px] font-mono font-black text-zinc-400">({req.id})</span>
                        </div>
                        <p className="text-[10px] text-zinc-450 leading-normal mt-0.5">Duration: {req.startDate} to {req.endDate} • {req.reason}</p>
                        {req.attachmentName && (
                          <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded mt-1 inline-block">📎 {req.attachmentName}</span>
                        )}
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        req.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                        req.status === 'rejected' ? 'bg-red-100 dark:bg-red-500/15 text-red-500' :
                        'bg-zinc-200 dark:bg-zinc-850 text-zinc-550'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Student High-Fidelity Analytics & Tracking Suite */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* 1. Attendance Progress Circular Ring & Academic standing tracker */}
            <div className="md:col-span-4 p-5 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[9px] font-mono font-black uppercase text-zinc-400 tracking-widest block">Attendance Summary</span>
                <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 mt-1">Class Attendance Ring</h4>
              </div>

              <div className="flex items-center gap-4">
                {/* SVG Progress Ring */}
                <div className="relative w-18 h-18 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle 
                      cx="36" 
                      cy="36" 
                      r="30" 
                      className="stroke-zinc-100 dark:stroke-zinc-900" 
                      strokeWidth="5" 
                      fill="transparent" 
                    />
                    <circle 
                      cx="36" 
                      cy="36" 
                      r="30" 
                      className="stroke-emerald-500" 
                      strokeWidth="5" 
                      fill="transparent" 
                      strokeDasharray={188.4}
                      strokeDashoffset={188.4 - (188.4 * Math.min(attendanceRate, 100)) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute font-mono font-black text-sm text-zinc-800 dark:text-zinc-100">
                    {attendanceRate}%
                  </span>
                </div>

                <div className="space-y-1 text-left min-w-0">
                  <span className={`inline-block px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-wide ${
                    attendanceRate >= 80 ? 'bg-emerald-500/10 text-emerald-500' :
                    attendanceRate >= 70 ? 'bg-amber-500/10 text-amber-500' :
                    'bg-red-500/10 text-red-500'
                  }`}>
                    {attendanceRate >= 80 ? 'Good standing' : 'Needs attention'}
                  </span>
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    Minimum standard is 80%. Keep scanning key codes regular.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 grid grid-cols-2 gap-2 text-left">
                <div>
                  <span className="text-[8px] uppercase tracking-wider text-zinc-400 block font-bold">Presents count</span>
                  <span className="font-mono font-bold text-xs text-zinc-805 dark:text-zinc-200">{presentsCount} checkins</span>
                </div>
                <div>
                  <span className="text-[8px] uppercase tracking-wider text-zinc-400 block font-bold">Lates count</span>
                  <span className="font-mono font-bold text-xs text-zinc-805 dark:text-zinc-200">{latesCount} scans</span>
                </div>
              </div>
            </div>

            {/* 2. Faculty availability coordinates status updates */}
            <div className="md:col-span-4 p-5 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-sm flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[9px] font-mono font-black uppercase text-zinc-400 tracking-widest block">Lecturers tracker</span>
                <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 mt-1">Faculty Availability Coordinate</h4>
              </div>

              <div className="space-y-2 max-h-36 overflow-y-auto pr-0.5">
                {[
                  { name: 'Dr. Ahmad Khan', status: 'available', dept: 'CS coordinator' },
                  { name: 'Prof. Maria Santos', status: 'in-class', dept: 'Math instructor' },
                  { name: 'Dr. Jose Rizal Jr', status: 'unavailable', dept: 'Lab instructor' }
                ].map((fac, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-150 dark:border-zinc-850">
                    <div className="text-left min-w-0">
                      <h5 className="text-[10px] font-black text-zinc-800 dark:text-zinc-200 truncate">{fac.name}</h5>
                      <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest block">{fac.dept}</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide ${
                      fac.status === 'available' ? 'bg-emerald-500/10 text-emerald-500' :
                      fac.status === 'in-class' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-zinc-200 dark:bg-zinc-850 text-zinc-400'
                    }`}>
                      {fac.status}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-[9px] text-zinc-400 text-left leading-normal">
                Coordinate standings update instantly as professors configure their physical campuses status.
              </p>
            </div>

            {/* 3. Upcoming physical lectures timetable */}
            <div className="md:col-span-4 p-5 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[9px] font-mono font-black uppercase text-zinc-400 tracking-widest block">Term calendar</span>
                <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 mt-1">Upcoming Lectures today</h4>
              </div>

              <div className="space-y-2 text-left">
                {classes.slice(0, 2).map((cls, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start">
                    <div className="p-1 px-1.5 rounded-lg bg-emerald-500/10 text-emerald-505 font-mono text-[9px] font-black uppercase shrink-0 mt-0.5">
                      {cls.startTime.split(' ')[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="text-[10.5px] font-black text-zinc-800 dark:text-zinc-200 truncate leading-tight">{cls.name}</h5>
                      <span className="text-[9px] text-zinc-400 block mt-0.5 truncate">{cls.room} • {cls.code}</span>
                    </div>
                  </div>
                ))}
                {classes.length === 0 && (
                  <div className="text-[10px] text-zinc-400 text-center py-4">No remaining classes today in sched.</div>
                )}
              </div>

              <button 
                onClick={() => setScreen('classes')}
                className="w-full py-1.5 bg-zinc-50 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-emerald-500 transition-colors text-[9.5px] font-bold uppercase tracking-wider rounded-lg border border-zinc-200/50 dark:border-zinc-850/50 text-zinc-650 dark:text-zinc-350 cursor-pointer text-center block"
              >
                Inspect All Schedules Catalog
              </button>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT ROW: Faculty list & Today's classes */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Active Classes Card Lists */}
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-900">
                  <div>
                    <h3 className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-zinc-100">Your Registered Courses</h3>
                    <p className="text-xs text-zinc-400">Click on any subject row to inspect rosters and attendance trend graphs</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {classes.map(cls => {
                    const isEnrolled = enrollments.some(
                      e => e.classId === cls.id && (e.studentId === userProfile.studentId || e.studentEmail === userProfile.email)
                    );

                    // Compute active standing indicators
                    const studentRecordsForClass = attendanceRecords.filter(
                      r => r.classId === cls.id && (r.studentId === userProfile.studentId || r.studentName === userProfile.name)
                    );
                    const absentsForClass = studentRecordsForClass.filter(r => r.status === 'absent');
                    const countAbsentsForClass = absentsForClass.length;

                    let maxConsecutive = 0;
                    let currConsecutive = 0;
                    const sortedRecs = [...studentRecordsForClass].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    for (const r of sortedRecs) {
                      if (r.status === 'absent') {
                        currConsecutive++;
                        if (currConsecutive > maxConsecutive) maxConsecutive = currConsecutive;
                      } else {
                        currConsecutive = 0;
                      }
                    }

                    let standingLabel = 'Good Standing';
                    let standingColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450';
                    if (countAbsentsForClass >= 5 || maxConsecutive >= 3) {
                      standingLabel = '🚫 Dropped';
                      standingColor = 'bg-red-500/10 text-red-600 dark:text-red-400';
                    } else if (countAbsentsForClass >= 3) {
                      standingLabel = '⚠️ Warning';
                      standingColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-505';
                    }

                    return (
                      <div 
                        key={cls.id}
                        onClick={() => handleOpenSubjectDetails(cls)}
                        className={`p-4 rounded-xl border text-left transition-all duration-200 hover:scale-[1.01] cursor-pointer ${
                          isEnrolled 
                            ? 'bg-zinc-50/50 hover:bg-zinc-100/60 dark:bg-zinc-900/30 dark:border-zinc-840 dark:hover:bg-zinc-900/65' 
                            : 'bg-zinc-100/20 border-dashed border-zinc-200 dark:border-zinc-900 hover:border-emerald-500/40'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[9px] font-black tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 uppercase">
                              {cls.code}
                            </span>
                            <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 mt-2 tracking-tight truncate max-w-[170px]">{cls.name}</h4>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              isEnrolled 
                                ? 'bg-blue-600 text-white font-extrabold shadow-sm' 
                                : 'bg-zinc-200 dark:bg-zinc-850 text-zinc-500'
                            }`}>
                              {isEnrolled ? 'Joined' : 'Guest'}
                            </span>
                            {isEnrolled && (
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${standingColor}`}>
                                {standingLabel}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3.5 text-[10px] text-zinc-400 mt-4">
                          <span className="flex items-center gap-1 font-semibold text-zinc-700 dark:text-zinc-300">
                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                            {cls.startTime}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-zinc-700 dark:text-zinc-300">
                            <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                            {cls.room}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Faculty Availability List */}
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-900">
                  <div>
                    <h3 className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-zinc-100">Live Instructors Directory</h3>
                    <p className="text-xs text-zinc-400">Campus consultation hours and coordinates</p>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-505 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">Synced</span>
                </div>

                <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                  {facultyStatuses.map(fac => (
                    <div key={fac.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0 text-left">
                      <div className="flex items-center gap-3">
                        <img 
                          src={fac.avatar} 
                          alt={fac.name} 
                          className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-800 shrink-0" 
                        />
                        <div>
                          <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{fac.name}</h4>
                          <p className="text-[11px] text-zinc-500">{fac.room || 'Consulting Room 303'}</p>
                        </div>
                      </div>
                      <div>
                        {fac.status === 'available' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> available
                          </span>
                        ) : fac.status === 'in-class' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 uppercase tracking-widest flex items-center gap-1">
                            <Clock className="w-3 h-3 animate-[spin_2s_linear_infinite]" /> in class
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 uppercase tracking-widest flex items-center gap-1">
                            <X className="w-3 h-3" /> unavailable
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* RIGHT SIDEBAR: Live Clock & Quick Checklist reminder widgets */}
            <div className="lg:col-span-4 space-y-6">
              {/* Precision Heartrate Clock */}
              <AlarmClock readAloudEnabled={accessibility.readAloud} />

              {/* Roster Auto-join instruction banner */}
              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 text-emerald-500">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-1">Instant Guest Enrollment</h4>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">
                  Scanning any QR attendance passcode for a class you are not currently joined in will automatically enroll you in that academic record ledger. Try it now!
                </p>
                <button
                  onClick={() => setScreen('attendance')}
                  type="button"
                  className="w-full text-center py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white rounded-xl text-[10px] font-extrabold uppercase tracking-widest border border-zinc-200/60 dark:border-zinc-700 transition-colors cursor-pointer"
                >
                  Configure Camera Scan
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. MY SCHEDULE CALENDAR VIEW */}
      {activeScreen === 'schedule' && (
        <div className="space-y-6 animate-fade-in text-left">
          <div className="flex gap-2">
            <button 
              onClick={() => setScreen('dashboard')} 
              className="flex items-center gap-1.5 text-xs text-emerald-500 hover:underline border border-emerald-500/10 px-2.5 py-1 rounded bg-emerald-500/5 cursor-pointer font-bold"
            >
              ← Back to Dashboard
            </button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                <Calendar className="w-5.5 h-5.5 text-emerald-500" />
                Roster Classes Directory
              </h2>
              <p className="text-xs text-zinc-400">Search and click any card to inspect Class members or trend graph insights.</p>
            </div>

            {/* Search inputs */}
            <div className="relative w-full sm:max-w-xs">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={scheduleSearch}
                onChange={(e) => setScheduleSearch(e.target.value)}
                placeholder="Search catalog code or title..."
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Schedule Lists Render */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes
              .filter(cls => 
                cls.name.toLowerCase().includes(scheduleSearch.toLowerCase()) || 
                cls.code.toLowerCase().includes(scheduleSearch.toLowerCase())
              )
              .map(cls => {
                const isEnrolled = enrollments.some(
                  e => e.classId === cls.id && (e.studentId === userProfile.studentId || e.studentEmail === userProfile.email)
                );

                // Compute student class standings inside active rosters
                const studentRecordsForClass = attendanceRecords.filter(
                  r => r.classId === cls.id && (r.studentId === userProfile.studentId || r.studentName === userProfile.name)
                );
                const absentsForClass = studentRecordsForClass.filter(r => r.status === 'absent');
                const countAbsentsForClass = absentsForClass.length;

                let maxConsecutive = 0;
                let currConsecutive = 0;
                const sortedRecs = [...studentRecordsForClass].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                for (const r of sortedRecs) {
                  if (r.status === 'absent') {
                    currConsecutive++;
                    if (currConsecutive > maxConsecutive) maxConsecutive = currConsecutive;
                  } else {
                    currConsecutive = 0;
                  }
                }

                let standingLabel = 'Good Standing';
                let standingColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450';
                if (countAbsentsForClass >= 5 || maxConsecutive >= 3) {
                  standingLabel = '🚫 Dropped';
                  standingColor = 'bg-red-500/10 text-red-600 dark:text-red-400';
                } else if (countAbsentsForClass >= 3) {
                  standingLabel = '⚠️ Warning';
                  standingColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-505';
                }

                return (
                  <div 
                    key={cls.id}
                    onClick={() => handleOpenSubjectDetails(cls)}
                    className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-855 shadow-xs hover:border-emerald-500/20 transition-all text-left cursor-pointer hover:shadow-md"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-500/10">
                          {cls.code}
                        </span>
                        <h3 className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-zinc-100 mt-2.5">{cls.name}</h3>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase ${
                          isEnrolled 
                            ? 'bg-blue-600 text-white font-extrabold' 
                            : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400'
                        }`}>
                          {isEnrolled ? 'Enrolled' : 'Not Joined'}
                        </span>
                        {isEnrolled && (
                          <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-md ${standingColor}`}>
                            {standingLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">TIMING</p>
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 mt-1">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          {cls.startTime} - {cls.endTime}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">TIMETABLE DAYS</p>
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 mt-1">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          {cls.days.join(', ')} ({cls.room})
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 3. QR CODES ATTENDANCE SCANNER SIMULATOR VIEW */}
      {activeScreen === 'attendance' && (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in text-left">
          <div className="flex gap-2">
            <button 
              onClick={() => setScreen('dashboard')} 
              className="flex items-center gap-1.5 text-xs text-emerald-500 hover:underline border border-emerald-500/10 px-2.5 py-1 rounded bg-emerald-500/5 cursor-pointer font-bold"
            >
              ← Back to Dashboard
            </button>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-100/50 border border-zinc-200 dark:border-zinc-850/50 p-6 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm border border-zinc-250 dark:border-zinc-850">
            <div>
              <h2 className="text-lg font-black text-zinc-100 tracking-tight flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                <Scan className="w-5 h-5 text-emerald-500" />
                Live Attendance Scantool
              </h2>
              <p className="text-xs text-zinc-400">Position your camera viewpoint to read the live generated class pass codes.</p>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-4 mt-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Select broadcasting class session</label>
                <select
                  value={selectedScanClass}
                  onChange={(e) => setSelectedScanClass(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-900 dark:text-zinc-100"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name} ({c.room})
                    </option>
                  ))}
                </select>
              </div>

              {/* Simulated Webcam Viewport screen */}
              <div className="relative rounded-2xl bg-zinc-950 h-50 overflow-hidden border border-zinc-900 flex flex-col items-center justify-center text-white">
                {isScanning ? (
                  <div className="space-y-3 z-10 text-center">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-mono font-semibold tracking-widest text-emerald-450 uppercase animate-pulse">{scanningProgress}% scanned</p>
                  </div>
                ) : (
                  <div className="text-center space-y-3 p-4 z-10">
                    <Scan className="w-10 h-10 text-emerald-500 mx-auto animate-bounce" />
                    <div>
                      <p className="text-xs font-bold text-zinc-200 uppercase tracking-widest">Feed Standby</p>
                      <p className="text-[10px] text-zinc-500 font-medium">Ready to focus Class QR matrices</p>
                    </div>
                  </div>
                )}

                {/* Laser scanline animation */}
                {isScanning && (
                  <div className="absolute inset-x-0 h-0.5 bg-emerald-550 shadow-md shadow-emerald-500 bg-emerald-500 animate-[bounce_2s_infinite]" />
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={startSimulationScan}
                  disabled={isScanning}
                  className="flex-1 py-3 rounded-xl bg-emerald-505 bg-emerald-500 text-black text-xs font-black uppercase tracking-wider hover:bg-emerald-400 cursor-pointer text-center disabled:opacity-50"
                >
                  Simulate QR camera Scan
                </button>
              </div>
            </form>

            {/* Scan results info overlay */}
            {scanResult && (
              <div className={`mt-5 p-4 rounded-xl border flex gap-3 text-left ${
                scanResult.success 
                  ? 'bg-emerald-500/10 border-emerald-555 text-emerald-400' 
                  : 'bg-red-500/10 border-red-505 text-red-500'
              }`}>
                {scanResult.success ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">{scanResult.success ? 'Capture Success' : 'Scan Refused'}</h4>
                  <p className="text-xs opacity-90 leading-relaxed mt-0.5">{scanResult.message}</p>
                </div>
              </div>
            )}
          </div>

          {/* Historical Check-ins card lists */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-sm space-y-4">
            <div>
              <h3 className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-zinc-100">Live Campus check-ins activity logs</h3>
              <p className="text-xs text-zinc-400">Timetable logs verified by professor nodes</p>
            </div>
            
            <div className="space-y-2.5">
              {attendanceRecords
                .filter(rec => rec.studentId === userProfile.studentId || rec.studentName === userProfile.name)
                .slice().reverse()
                .map(rec => (
                  <div 
                    key={rec.id}
                    className="p-3.5 rounded-xl border border-zinc-150 dark:border-zinc-900 bg-zinc-50/20 dark:bg-zinc-950/40 flex items-center justify-between text-left"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">{rec.classCode}</span>
                        <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100">{rec.className}</h4>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-1">{rec.date} standard timestamp {rec.time}</p>
                    </div>
                    <div>
                      {rec.status === 'present' ? (
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase text-emerald-600 bg-emerald-500/15 border border-emerald-555 rounded-full">present</span>
                      ) : (
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase text-amber-500 bg-amber-500/15 border border-amber-555 rounded-full">late</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages tab routing */}
      {activeScreen === 'messages' && (
        <div className="space-y-6 animate-fade-in text-left">
          <div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
              <MessageSquare className="w-5.5 h-5.5 text-blue-600" />
              Active Chat Hub
            </h2>
            <p className="text-xs text-zinc-400">Message your instructors and join classroom group discussions instantly.</p>
          </div>
          <Messages 
            userProfile={userProfile} 
            classes={classes} 
            enrollments={enrollments} 
            accessibility={accessibility} 
          />
        </div>
      )}

      {/* 4. NOTIFICATIONS TAB */}
      {activeScreen === 'notifications' && (
        <div className="max-w-xl mx-auto space-y-4 animate-fade-in text-left">
          <div>
            <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
              <BellRing className="w-5 h-5 text-emerald-500" />
              Notifications
            </h2>
            <p className="text-xs text-zinc-400">Administrative updates and system logs</p>
          </div>

          <div className="space-y-3">
            {notifications.map((notif) => (
              <div 
                key={notif.id}
                className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 flex items-start gap-3 text-left"
              >
                <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                  notif.type === 'alert' ? 'bg-red-500/10 text-red-500' :
                  notif.type === 'warning' ? 'bg-amber-500/10 text-amber-550' :
                  notif.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                  'bg-zinc-100 dark:bg-zinc-850 text-zinc-500'
                }`}>
                  <BellRing className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2.5">
                    <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 truncate">{notif.title}</h4>
                    <span className="text-[9px] font-mono text-zinc-400 tracking-wider font-semibold uppercase">{notif.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-zinc-450 dark:text-zinc-400 mt-1 leading-normal">
                    {notif.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. USER PROFILE SETTINGS */}
      {activeScreen === 'profile' && (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in text-left">
          <div className="flex gap-2">
            <button 
              onClick={() => setScreen('dashboard')} 
              className="flex items-center gap-1.5 text-xs text-emerald-500 hover:underline border border-emerald-500/10 px-2.5 py-1 rounded bg-emerald-500/5 cursor-pointer font-bold"
            >
              ← Back to Dashboard
            </button>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-855 shadow-sm">
            <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100 mb-5">Personal Information Profile</h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-zinc-100 dark:border-zinc-900 mb-5">
              <div className="relative group shrink-0">
                <img 
                  src={profileAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"} 
                  alt={profileName} 
                  className="w-20 h-20 rounded-full object-cover border-4 border-emerald-500/15 shadow-md hover:scale-[1.01] transition-transform"
                  referrerPolicy="no-referrer"
                />
                
                {/* Image Upload Label */}
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

              <div className="text-center sm:text-left min-w-0 flex-1">
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100 truncate">{profileName}</h3>
                <p className="text-xs text-zinc-400 truncate">{profileEmail}</p>
                <div className="flex flex-wrap gap-2.5 mt-2 justify-center sm:justify-start">
                  <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-855 text-zinc-500 rounded border border-zinc-200 dark:border-zinc-800">
                    Role: {userProfile.role}
                  </span>
                  <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-0.5 bg-zinc-100 dark:bg-zinc-855 text-zinc-500 rounded border border-zinc-200 dark:border-zinc-800">
                    STUDENT ID: {userProfile.studentId || "2023-10492"}
                  </span>
                  {profileAvatar && (
                    <button 
                      type="button"
                      onClick={() => {
                        setProfileAvatar("");
                        speakText("Avatar image deleted.", accessibility.readAloud);
                      }}
                      className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-0.5 bg-red-500/10 hover:bg-red-500/20 text-red-505 rounded border border-red-500/10 cursor-pointer transition-colors"
                    >
                      Delete Photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              onUpdateProfile({
                ...userProfile,
                name: profileName,
                email: profileEmail,
                avatar: profileAvatar,
                bio: profileBio,
                phone: profilePhone
              });
              setProfileSavedMsg(true);
              speakText("Profile details fully updated in database", accessibility.readAloud);
              setTimeout(() => setProfileSavedMsg(false), 3000);
            }} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-450 dark:text-zinc-400 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                    className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-450 dark:text-zinc-400 uppercase tracking-wider">Academic Email</label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    required
                    className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Editable Bios and Phone Numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-455 dark:text-zinc-400 uppercase tracking-wider">Mobile Number</label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+6 Philippines number"
                    className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-455 dark:text-zinc-400 uppercase tracking-wider">Personal Biography</label>
                  <input
                    type="text"
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    placeholder="Enter short hobby or bio description"
                    className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-emerald-500 outline-none text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Upload image helper drag-n-drop simulated box */}
              <div className="p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-center">
                <UploadCloud className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                <p className="text-[11px] font-bold text-zinc-650 dark:text-zinc-300">Drag picture files here or click camera button</p>
                <p className="text-[9px] text-zinc-400 mt-0.5">Supports PNG, JPG, WebP up to 3MB files which encode instantly to local profiles.</p>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-black text-xs font-black uppercase tracking-wider hover:bg-emerald-400 cursor-pointer transition-all"
                >
                  Save Profile Details
                </button>

                {profileSavedMsg && (
                  <span className="text-xs text-emerald-500 font-extrabold flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <CheckCircle className="w-4 h-4 animate-bounce" />
                    Details cached globally!
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Roster detail modal */}
      <SubjectDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        cls={selectedClassDetail}
        enrollments={enrollments}
        records={attendanceRecords}
        facultyStatuses={facultyStatuses}
      />

      {/* Active student notification pop-up alarm */}
      {activeAlertClass && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3.5xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-2xl relative animate-scale-up space-y-5 text-left border-2 border-emerald-500/35">
            <div className="w-14 h-14 bg-emerald-500/15 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center font-bold mx-auto animate-bounce text-lg font-mono">
              ⏰
            </div>

            <div className="text-center space-y-2 pb-1 border-b border-zinc-150 dark:border-zinc-900">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 animate-pulse">
                FACULTY CLASS BROADCAST
              </span>
              <h3 className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-zinc-100 uppercase">Class Status Alarm!</h3>
              <p className="text-xs text-zinc-455 mt-1">Professor {activeAlertClass.facultyName} has declared a schedule update.</p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/65 border border-zinc-200 dark:border-zinc-800 space-y-3 font-sans">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase font-bold">SUBJECT INFO</p>
                <p className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">{activeAlertClass.code} : {activeAlertClass.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase font-bold">DECLARED UPDATE</p>
                  <p className={`text-xs font-black uppercase ${
                    activeAlertClass.facultyStatusUpdate === 'cancel' 
                      ? 'text-red-500' 
                      : activeAlertClass.facultyStatusUpdate === 'late' 
                      ? 'text-amber-500' 
                      : 'text-emerald-500'
                  }`}>
                    {activeAlertClass.facultyStatusUpdate === 'cancel' 
                      ? '🚫 CANCEL CLASS' 
                      : activeAlertClass.facultyStatusUpdate === 'late' 
                      ? '🕒 LATE ARRIVAL' 
                      : '✅ WILL ATTEND'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase font-bold">LECTURE ROOM</p>
                  <p className="text-xs font-extrabold text-zinc-950 dark:text-zinc-100 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    {activeAlertClass.room}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (activeAlertClass.lastUpdateTimestamp) {
                  setAlertDismissedIds(prev => [...prev, `${activeAlertClass.id}-${activeAlertClass.lastUpdateTimestamp}`]);
                }
                setActiveAlertClass(null);
                speakText("Alert acknowledged", accessibility.readAloud);
              }}
              type="button"
              className="w-full text-center py-2.5 bg-emerald-500 text-black text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer hover:bg-emerald-400 transition-colors"
            >
              Acknowledge & Confirm Timing
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
