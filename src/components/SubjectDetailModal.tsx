import React from 'react';
import { ClassSession, Enrollment, AttendanceRecord, UserProfile, FacultyStatus } from '../types';
import AttendanceGraph from './AttendanceGraph';
import { X, Calendar, Clock, MapPin, User, Users, ShieldAlert, CheckCircle, Activity } from 'lucide-react';

interface SubjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cls: ClassSession | null;
  enrollments: Enrollment[];
  records: AttendanceRecord[];
  facultyStatuses: FacultyStatus[];
}

export default function SubjectDetailModal({
  isOpen,
  onClose,
  cls,
  enrollments,
  records,
  facultyStatuses
}: SubjectDetailModalProps) {
  if (!isOpen || !cls) return null;

  // Find enrolled students for this class
  const classEnrollments = enrollments.filter(e => e.classId === cls.id);

  // Find faculty status
  const facultyObj = facultyStatuses.find(f => f.id === cls.facultyId || f.name.toLowerCase() === cls.facultyName.toLowerCase());
  const facultyStatus = facultyObj?.status || 'available';

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-500';
      case 'in-class': return 'bg-amber-500';
      default: return 'bg-zinc-400';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto z-10 text-left">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-200 dark:border-zinc-850 mb-5">
          <div className="space-y-1">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/15 text-emerald-500 border border-emerald-500/10">
              {cls.code} • Subject Profile
            </span>
            <h3 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {cls.name}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-650 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic content grid */}
        <div className="space-y-6">
          {/* Class Schedule and Room Metadata Block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-150 dark:border-zinc-850">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Meeting Days</p>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  {cls.days.join(', ')} ({cls.room})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Attendance window</p>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  {cls.startTime} - {cls.endTime}
                </p>
              </div>
            </div>
          </div>

          {/* Assigned Faculty details */}
          <div>
            <h4 className="text-xs font-extrabold uppercase text-zinc-500 tracking-wider mb-2.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-500" />
              Primary Professor & Status
            </h4>
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-150 dark:border-zinc-850 flex items-center gap-4">
              <div className="relative">
                <img 
                  src={facultyObj?.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150"} 
                  alt={cls.facultyName} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/20"
                  referrerPolicy="no-referrer"
                />
                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-950 ${getStatusColor(facultyStatus)}`} />
              </div>
              <div>
                <h5 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{cls.facultyName}</h5>
                <p className="text-[11px] text-zinc-500 capitalize">
                  Consultation Status: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{facultyStatus}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Reusable Attendance Graph component */}
          <div>
            <h4 className="text-xs font-extrabold uppercase text-zinc-500 tracking-wider mb-2.5 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              Attendance Trends & Statistics
            </h4>
            <AttendanceGraph 
              classId={cls.id} 
              classCode={cls.code} 
              className={cls.name} 
              records={records} 
            />
          </div>

          {/* Roster of Enrolled Students */}
          <div>
            <h4 className="text-xs font-extrabold uppercase text-zinc-500 tracking-wider mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-500" />
                Enrolled Academic Roster
              </span>
              <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-200/50 dark:bg-zinc-900 px-2.5 py-0.5 rounded-full">
                {classEnrollments.length} Active Students
              </span>
            </h4>
            
            {classEnrollments.length === 0 ? (
              <div className="p-5 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-850 text-center text-zinc-500 text-xs text-left">
                No students currently registered in this subject roster. Scanning the QR code will automatically join.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                {classEnrollments.map(student => (
                  <div 
                    key={student.id}
                    className="p-3 rounded-xl border border-zinc-150 dark:border-zinc-850 bg-white dark:bg-zinc-900 flex items-center gap-3"
                  >
                    <img 
                      src={student.studentAvatar} 
                      alt={student.studentName} 
                      className="w-8 h-8 rounded-full object-cover shrink-0 border border-zinc-200 dark:border-zinc-800"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-zinc-950 dark:text-zinc-100 truncate">
                        {student.studentName}
                      </p>
                      <p className="text-[9px] font-mono text-zinc-500 truncate">
                        {student.studentId} • {student.studentEmail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-zinc-200 dark:border-zinc-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-white text-xs font-bold uppercase cursor-pointer hover:bg-zinc-850 dark:hover:bg-zinc-700 transition-colors"
          >
            Close Subject Details
          </button>
        </div>

      </div>
    </div>
  );
}
