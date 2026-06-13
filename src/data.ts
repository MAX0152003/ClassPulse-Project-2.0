import { ClassSession, AppNotification, FacultyStatus, AttendanceRecord, UserProfile } from './types';

export const INITIAL_CLASSES: ClassSession[] = [
  {
    id: 'class-1',
    code: 'ITE183',
    name: 'Web Systems',
    startTime: '09:00 AM',
    endTime: '10:30 AM',
    room: 'Room 201',
    days: ['Mon', 'Wed'],
    facultyName: 'Dr. Ahmad Khan',
    facultyId: 'fac-1'
  },
  {
    id: 'class-2',
    code: 'ITE184',
    name: 'Database Systems',
    startTime: '01:00 PM',
    endTime: '02:30 PM',
    room: 'Room 203',
    days: ['Tue', 'Thu'],
    facultyName: 'Prof. Maria Santos',
    facultyId: 'fac-2'
  },
  {
    id: 'class-3',
    code: 'ITE185',
    name: 'Software Engineering',
    startTime: '03:00 PM',
    endTime: '04:30 PM',
    room: 'Room 204',
    days: ['Mon', 'Wed'],
    facultyName: 'Prof. Ali Hassan',
    facultyId: 'fac-3'
  },
  {
    id: 'class-4',
    code: 'ITE186',
    name: 'Networking',
    startTime: '09:00 AM',
    endTime: '10:30 AM',
    room: 'Room 205',
    days: ['Thu', 'Fri'],
    facultyName: 'Dr. Abdul Rahim',
    facultyId: 'fac-4'
  }
];

export const INITIAL_FACULTY_STATUSES: FacultyStatus[] = [
  {
    id: 'fac-1',
    name: 'Dr. Ahmad Khan',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    status: 'available',
    room: 'Room 201'
  },
  {
    id: 'fac-2',
    name: 'Prof. Maria Santos',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    status: 'in-class',
    room: 'Room 203'
  },
  {
    id: 'fac-3',
    name: 'Prof. Ali Hassan',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    status: 'unavailable'
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Room changed to Room 202',
    message: 'ITE183 Web Systems session will convene in Room 202 today.',
    timestamp: '10:30 AM',
    type: 'warning',
    read: false
  },
  {
    id: 'notif-2',
    title: 'Class ITE184 is cancelled today',
    message: 'Prof. Maria Santos is attending a seminar; modern Web Systems assignment is posted on LMS.',
    timestamp: 'Yesterday',
    type: 'alert',
    read: false
  },
  {
    id: 'notif-3',
    title: 'Faculty Prof. Maria Santos is now unavailable',
    message: 'Status updated from Available to Unavailable due to university research defense.',
    timestamp: 'Yesterday',
    type: 'info',
    read: true
  },
  {
    id: 'notif-4',
    title: 'Attendance recorded successfully',
    message: 'Your attendance for Software Engineering on May 10 was recorded as Present.',
    timestamp: 'May 10',
    type: 'success',
    read: true
  },
  {
    id: 'notif-5',
    title: 'New class schedule added',
    message: 'A new section for ITE186 Networking has been integrated into your calendar.',
    timestamp: 'May 9',
    type: 'success',
    read: true
  }
];

export const INITIAL_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  {
    id: 'rec-1',
    classId: 'class-1',
    className: 'Web Systems',
    classCode: 'ITE183',
    date: '2026-05-12',
    time: '09:02 AM',
    status: 'present',
    role: 'student',
    studentName: 'John Doe',
    studentId: 'STUD-001'
  },
  {
    id: 'rec-2',
    classId: 'class-2',
    className: 'Database Systems',
    classCode: 'ITE184',
    date: '2026-05-13',
    time: '01:18 PM',
    status: 'late',
    role: 'student',
    studentName: 'John Doe',
    studentId: 'STUD-001'
  },
  {
    id: 'rec-3',
    classId: 'class-3',
    className: 'Software Engineering',
    classCode: 'ITE185',
    date: '2026-05-14',
    time: '03:00 PM',
    status: 'present',
    role: 'student',
    studentName: 'John Doe',
    studentId: 'STUD-001'
  }
];

export const DEFAULT_STUDENT_PROFILE: UserProfile = {
  id: 'stud-01',
  name: 'John Doe',
  email: 'john.doe@msu.edu.ph',
  role: 'student',
  avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150',
  studentId: '2023-10492',
  department: 'Information Technology'
};

export const DEFAULT_FACULTY_PROFILE: UserProfile = {
  id: 'fac-01',
  name: 'Dr. Ahmad Khan',
  email: 'ahmad.khan@msu.edu.ph',
  role: 'faculty',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
  facultyId: 'FAC-90234',
  department: 'Computer Science'
};

export const DEFAULT_ADMIN_PROFILE: UserProfile = {
  id: 'admin-01',
  name: 'Master Admin One',
  email: 'admin@msu.edu.ph',
  role: 'admin',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
  department: 'Academic Registrar Board'
};

export const SECOND_ADMIN_PROFILE: UserProfile = {
  id: 'admin-02',
  name: 'Master Admin Two',
  email: 'admin2@msu.edu.ph',
  role: 'admin',
  avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150',
  department: 'Academic Control Center'
};
