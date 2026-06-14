import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, ChatMessage, ClassSession, Enrollment } from '../types';
import { 
  Send, 
  MessageSquare, 
  Sparkles, 
  Paperclip, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  FileText, 
  Download, 
  X, 
  Smile, 
  User, 
  ExternalLink,
  Bot
} from 'lucide-react';
import { speakText } from './AccessibilitySettings';
import { motion, AnimatePresence } from 'motion/react';

interface MessagesProps {
  userProfile: UserProfile;
  classes: ClassSession[];
  enrollments: Enrollment[];
  accessibility: { theme: 'light' | 'dark'; readAloud: boolean };
  onBack?: () => void;
}

interface EnrichedChatMessage extends ChatMessage {
  attachmentImg?: string;
  attachmentLink?: { url: string; title: string; desc: string };
  attachmentFile?: { name: string; size: string };
}

const ALL_CAMPUS_PEOPLE = [
  { id: '2023-10492', name: 'John Doe', role: 'student', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150', dept: 'ComSci' },
  { id: '2023-88211', name: 'Alice Vance', role: 'student', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150', dept: 'Engineering' },
  { id: '2023-99124', name: 'Bob Smith', role: 'student', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150', dept: 'Information Tech' },
  { id: '2023-77215', name: 'Charlie Dean', role: 'student', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150', dept: 'ComSci' },
  { id: '2023-33491', name: 'Diana Ross', role: 'student', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150', dept: 'Nursing' },
  { id: 'fac-1', name: 'Dr. Ahmad Khan', role: 'faculty', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150', dept: 'Information Technology' },
  { id: 'fac-2', name: 'Prof. Maria Santos', role: 'faculty', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150', dept: 'Computer Science' },
  { id: 'fac-3', name: 'Dr. Ali Hassan', role: 'faculty', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=85&w=150', dept: 'Engineering Physics' }
];

export default function Messages({ userProfile, classes, enrollments, accessibility, onBack }: MessagesProps) {
  const [messages, setMessages] = useState<EnrichedChatMessage[]>(() => {
    const cached = localStorage.getItem('cp_chat_messages_v2');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // Fallback
      }
    }
    
    // Seed default rich live chat histories
    return [
      {
        id: 'msg-seed-1',
        senderId: 'fac-1',
        senderName: 'Dr. Ahmad Khan',
        senderRole: 'faculty',
        receiverId: '2023-10492',
        receiverName: 'John Doe',
        message: 'Hello class, welcome to MSU Academic Portal! Here are the slides for session #1.',
        timestamp: '10:00 AM',
        read: false
      },
      {
        id: 'msg-seed-2',
        senderId: '2023-10492',
        senderName: 'John Doe',
        senderRole: 'student',
        receiverId: 'CS-101', // Group room
        receiverName: 'Introduction to Computer Science',
        message: 'Has anyone finished compiling the web component blueprint?',
        timestamp: '10:05 AM',
        read: true
      },
      {
        id: 'msg-seed-3',
        senderId: 'sys-pulse',
        senderName: 'System Pulse Bot',
        senderRole: 'admin',
        receiverId: 'CS-101',
        receiverName: 'Introduction to Computer Science',
        message: 'Welcome everyone to the channel! Here is our syllabus for this term. Please review.',
        timestamp: '10:06 AM',
        attachmentFile: { name: 'CS101_Syllabus_Revised.pdf', size: '1.4 MB' },
        read: true
      },
      {
        id: 'msg-seed-4',
        senderId: 'fac-2',
        senderName: 'Prof. Maria Santos',
        senderRole: 'faculty',
        receiverId: '2023-10492',
        receiverName: 'John Doe',
        message: 'Please review the exam guidelines before Friday morning.',
        timestamp: '10:14 AM',
        read: false
      }
    ];
  });

  const [activeContactId, setActiveContactId] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [userSearchText, setUserSearchText] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const [extraConversationIds, setExtraConversationIds] = useState<string[]>(() => {
    const cached = localStorage.getItem('classpulse_extra_chats');
    return cached ? JSON.parse(cached) : [];
  });

  useEffect(() => {
    localStorage.setItem('classpulse_extra_chats', JSON.stringify(extraConversationIds));
  }, [extraConversationIds]);
  
  // Custom attachments states
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [pendingImg, setPendingImg] = useState<string | null>(null);
  const [pendingLink, setPendingLink] = useState<{ url: string; title: string; desc: string } | null>(null);
  const [pendingFile, setPendingFile] = useState<{ name: string; size: string } | null>(null);

  // Typing indicators
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [typingPeerName, setTypingPeerName] = useState('');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Sync messages
  useEffect(() => {
    localStorage.setItem('cp_chat_messages_v2', JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Contacts generation based on student / faculty / admin role
  const getContacts = () => {
    let list: any[] = [];
    if (userProfile.role === 'student' || userProfile.role === 'admin') {
      const teachers = classes.map(c => ({
        id: c.facultyId || 'fac-1',
        name: c.facultyName,
        role: 'faculty',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
        courseCode: c.code
      }));
      list = [...teachers];
    } else {
      // Faculty see students
      const facultyId = userProfile.facultyId || 'fac-1';
      const myClasses = classes.filter(c => c.facultyId === facultyId || c.facultyName === userProfile.name);
      const myClassIds = myClasses.map(c => c.id);
      
      const students = enrollments
        .filter(e => myClassIds.includes(e.classId))
        .map(e => ({
          id: e.studentId,
          name: e.studentName,
          role: 'student',
          avatar: e.studentAvatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150',
          courseCode: myClasses.find(c => c.id === e.classId)?.code || 'CS-101'
        }));
      list = [...students];
    }

    // Blend extra conversation contacts
    extraConversationIds.forEach(id => {
      const match = ALL_CAMPUS_PEOPLE.find(p => p.id === id);
      if (match && !list.some(item => item.id === id)) {
        list.push({
          id: match.id,
          name: match.name,
          role: match.role,
          avatar: match.avatar,
          courseCode: match.dept
        });
      }
    });

    // Deduplicate
    const seen = new Set();
    return list.filter(el => {
      if (!el || !el.id) return false;
      const duplicate = seen.has(el.id);
      seen.add(el.id);
      return !duplicate;
    });
  };

  const getChannels = () => {
    if (userProfile.role === 'student') {
      const studentId = userProfile.studentId || '2023-10492';
      const myClassIds = enrollments.filter(e => e.studentId === studentId).map(e => e.classId);
      return classes.filter(c => myClassIds.includes(c.id));
    } else if (userProfile.role === 'faculty') {
      const facultyId = userProfile.facultyId || 'fac-1';
      return classes.filter(c => c.facultyId === facultyId || c.facultyName === userProfile.name);
    } else {
      return classes; // Admin sees all
    }
  };

  const contacts = getContacts();
  const channels = getChannels();

  // Set initial contact or channel
  useEffect(() => {
    if (!activeContactId) {
      if (channels.length > 0) {
        setActiveContactId(channels[0].id);
      } else if (contacts.length > 0) {
        setActiveContactId(contacts[0].id);
      }
    }
  }, [contacts, channels]);

  const myId = userProfile.role === 'student' ? (userProfile.studentId || '2023-10492') : (userProfile.facultyId || 'fac-1');

  // Helper to count unread messages for a specific room or contact
  const getUnreadCount = (id: string) => {
    return messages.filter(m => {
      if (m.senderId === myId) return false;
      const isForThisRoom = m.receiverId === id;
      const isDirectForMe = m.senderId === id && m.receiverId === myId;
      return (isForThisRoom || isDirectForMe) && !m.read;
    }).length;
  };

  // Mark all messages as read for active contact / channel
  useEffect(() => {
    if (!activeContactId) return;
    
    setMessages(prev => {
      let changed = false;
      const updated = prev.map(m => {
        const isFromActiveOther = m.senderId === activeContactId && m.receiverId === myId;
        const isForActiveChannel = m.receiverId === activeContactId && m.senderId !== myId;
        if ((isFromActiveOther || isForActiveChannel) && !m.read) {
          changed = true;
          return { ...m, read: true };
        }
        return m;
      });
      return changed ? updated : prev;
    });
  }, [activeContactId, myId]);

  // ACTIVE RECURRENT LIVE CHAT SIMULATION - Completely disabled to prevent automated interruptions
  useEffect(() => {
    // Disabled as requested: "don't automate response make it like message app wait if the receiver/user response."
    return () => {};
  }, [activeContactId, channels, userProfile.name]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !pendingImg && !pendingLink && !pendingFile) || !activeContactId) return;

    const myId = userProfile.role === 'student' ? (userProfile.studentId || '2023-10492') : (userProfile.facultyId || 'fac-1');
    const isActiveChannel = channels.some(ch => ch.id === activeContactId);
    const destObj = !isActiveChannel 
      ? contacts.find(c => c.id === activeContactId) 
      : channels.find(c => c.id === activeContactId);

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: EnrichedChatMessage = {
      id: 'msg-' + Date.now(),
      senderId: myId,
      senderName: userProfile.name,
      senderRole: userProfile.role,
      receiverId: activeContactId,
      receiverName: destObj?.name || 'Academic Group',
      message: inputText.trim() || (pendingImg ? "Shared an image" : pendingFile ? "Shared a file" : "Shared a link"),
      timestamp: nowStr,
      attachmentImg: pendingImg || undefined,
      attachmentLink: pendingLink || undefined,
      attachmentFile: pendingFile || undefined
    };

    setMessages(prev => [...prev, newMsg]);

    // Reset inputs & attachments
    setInputText('');
    setPendingImg(null);
    setPendingLink(null);
    setPendingFile(null);
    setShowAttachmentMenu(false);

    speakText("Message transmitted.", accessibility.readAloud);
  };

  // Preset loaders for mockup attachments
  const attachPresetImage = (type: 'lab' | 'library' | 'campus') => {
    const urls = {
      lab: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=400',
      library: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=400',
      campus: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=400'
    };
    setPendingImg(urls[type]);
    setPendingLink(null);
    setPendingFile(null);
    setShowAttachmentMenu(false);
    speakText("Preset college image prepared for attachment.", accessibility.readAloud);
  };

  const attachPresetLink = () => {
    setPendingLink({
      url: 'https://github.com/varsity-hub/react-vite-blueprint',
      title: 'Vite React Tailwind Starter Framework',
      desc: 'Optimized full-stack architecture for university dashboards and real-time calendars.'
    });
    setPendingImg(null);
    setPendingFile(null);
    setShowAttachmentMenu(false);
    speakText("Resource web bookmark attached.", accessibility.readAloud);
  };

  const attachPresetFile = (fileName: string, fileSize: string) => {
    setPendingFile({ name: fileName, size: fileSize });
    setPendingImg(null);
    setPendingLink(null);
    setShowAttachmentMenu(false);
    speakText("Syllabus resource file attached.", accessibility.readAloud);
  };

  // Filter messages for current discussion
  
  const isActiveChannel = channels.some(ch => ch.id === activeContactId);
  
  const currentMessages = messages.filter(m => {
    if (!isActiveChannel) {
      return (m.senderId === myId && m.receiverId === activeContactId) ||
             (m.senderId === activeContactId && m.receiverId === myId);
    } else {
      return m.receiverId === activeContactId;
    }
  });

  const getActiveMetadata = () => {
    const ch = channels.find(c => c.id === activeContactId);
    if (ch) {
      return { 
        id: ch.id, 
        name: ch.name, 
        isChannel: true, 
        code: ch.code, 
        courseCode: ch.code 
      };
    }
    const co = contacts.find(c => c.id === activeContactId);
    if (co) {
      return { 
        id: co.id, 
        name: co.name, 
        isChannel: false, 
        avatar: co.avatar, 
        role: co.role, 
        courseCode: co.courseCode 
      };
    }
    return null;
  };

  const activeMeta = getActiveMetadata();

  // Filter channels & contacts with userSearchText
  const filteredChannels = channels.filter(ch => 
    ch.name.toLowerCase().includes(userSearchText.toLowerCase()) || 
    ch.code.toLowerCase().includes(userSearchText.toLowerCase())
  );

  const filteredContacts = contacts.filter(co => 
    co.name.toLowerCase().includes(userSearchText.toLowerCase()) || 
    (co.courseCode && co.courseCode.toLowerCase().includes(userSearchText.toLowerCase()))
  );

  const searchResultsGlobal = userSearchText.trim() ? ALL_CAMPUS_PEOPLE.filter(person => {
    const isMatch = person.name.toLowerCase().includes(userSearchText.toLowerCase()) || 
                    person.dept.toLowerCase().includes(userSearchText.toLowerCase());
    const alreadyConnected = contacts.some(co => co.id === person.id) || channels.some(ch => ch.id === person.id);
    const isSelf = person.id === myId || person.name === userProfile.name;
    return isMatch && !alreadyConnected && !isSelf;
  }) : [];

  const renderSidebar = () => {
    return (
      <div 
        id="messenger-sidebar"
        className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-zinc-200/60 dark:border-zinc-850/60 flex flex-col h-full shrink-0 bg-zinc-50/40 dark:bg-zinc-950/20"
      >
        <div className="p-4 border-b border-zinc-150 dark:border-zinc-900 space-y-3">
          {onBack && (
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onBack}
                className="px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-855 flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 hover:text-emerald-500 hover:bg-zinc-50 dark:hover:bg-zinc-850 cursor-pointer transition-all active:scale-95 text-xs font-black uppercase tracking-wider"
                title="Back to dashboard"
              >
                ← Back
              </button>
              <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">ClassPulse Chat</span>
            </div>
          )}

          {/* Facebook Messenger search bar */}
          <div className="relative">
            <input
              type="text"
              value={userSearchText}
              onChange={(e) => {
                setUserSearchText(e.target.value);
              }}
              placeholder="Search people, subjects..."
              className="w-full text-xs pl-8 pr-8 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-emerald-500/30 outline-none text-zinc-900 dark:text-zinc-100 font-bold"
            />
            <span className="absolute left-2.5 top-3 text-[11px] text-zinc-400">🔍</span>
            {userSearchText && (
              <button
                type="button"
                onClick={() => setUserSearchText('')}
                className="absolute right-2.5 top-2.5 p-1 text-[9px] font-black text-white bg-zinc-400 dark:bg-zinc-800 rounded-full hover:bg-red-500 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Channels/Contacts Unified Iterator list */}
        <div className="flex-1 overflow-y-auto space-y-4 p-3 text-left">
          
          {/* Active Channels / Subject Groups */}
          <div>
            <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest px-2.5 block pb-2">Subject Class Rooms</span>
            {filteredChannels.map(ch => {
              const unreadCount = getUnreadCount(ch.id);
              return (
                <button
                  key={ch.id}
                  onClick={() => {
                    setActiveContactId(ch.id);
                    setMobileShowChat(true);
                  }}
                  className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-xl text-left border cursor-pointer transition-all mb-1 ${
                    activeContactId === ch.id
                      ? 'bg-emerald-600 text-white border-emerald-600 font-extrabold shadow-sm'
                      : 'bg-transparent border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                      activeContactId === ch.id ? 'bg-zinc-950/20 text-white' : 'bg-emerald-500/10 text-emerald-500'
                    }`}>
                      #
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className={`text-xs font-extrabold truncate ${activeContactId === ch.id ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'}`}>{ch.name}</h4>
                      <p className={`text-[9px] truncate uppercase mt-0.5 font-bold ${activeContactId === ch.id ? 'text-emerald-100' : 'text-zinc-500 dark:text-zinc-400'}`}>{ch.code} Room</p>
                    </div>
                  </div>
                  {unreadCount > 0 && (
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full select-none shrink-0 ${
                      activeContactId === ch.id ? 'bg-white text-emerald-600' : 'bg-emerald-500 text-black'
                    }`}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
            {filteredChannels.length === 0 && (
              <p className="text-[10px] text-zinc-405 italic px-2.5 py-1">No matching subject rooms</p>
            )}
          </div>

          {/* Active Conversations */}
          <div>
            <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest px-2.5 block pb-2">Direct Chats</span>
            {filteredContacts.map(c => {
              const unreadCount = getUnreadCount(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveContactId(c.id);
                    setMobileShowChat(true);
                  }}
                  className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-xl text-left border cursor-pointer transition-all mb-1 ${
                    activeContactId === c.id
                      ? 'bg-emerald-600 text-white border-emerald-600 font-extrabold shadow-sm'
                      : 'bg-transparent border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <img src={c.avatar} alt={c.name} className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-855" referrerPolicy="no-referrer" />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-950" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className={`text-xs font-extrabold truncate ${activeContactId === c.id ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'}`}>{c.name}</h4>
                      <p className={`text-[9px] truncate uppercase font-extrabold mt-0.5 ${activeContactId === c.id ? 'text-emerald-100' : 'text-zinc-500 dark:text-zinc-400'}`}>{c.role} • {c.courseCode}</p>
                    </div>
                  </div>
                  {unreadCount > 0 && (
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full select-none shrink-0 ${
                      activeContactId === c.id ? 'bg-white text-emerald-600' : 'bg-emerald-500 text-black'
                    }`}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
            {filteredContacts.length === 0 && (
              <p className="text-[10px] text-zinc-405 italic px-2.5 py-1">No active direct chats matching</p>
            )}
          </div>

          {/* Global Campus Directory Search Matches */}
          {searchResultsGlobal.length > 0 && (
            <div className="pt-2 border-t border-zinc-150 dark:border-zinc-900 animate-fade-in">
              <span className="text-[9px] font-black uppercase text-emerald-500 tracking-widest px-2.5 block pb-2">Global Directory Matches</span>
              {searchResultsGlobal.map(person => (
                <button
                  key={person.id}
                  onClick={() => {
                    if (!extraConversationIds.includes(person.id)) {
                      setExtraConversationIds(prev => [...prev, person.id]);
                    }
                    setActiveContactId(person.id);
                    setMobileShowChat(true);
                    setUserSearchText('');
                    speakText(`Starting new conversation with ${person.name}`, accessibility.readAloud);
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-emerald-500/10 text-zinc-900 dark:text-zinc-100 cursor-pointer transition-all mb-1 border border-dashed border-emerald-500/20 bg-emerald-500/5"
                >
                  <img src={person.avatar} alt={person.name} className="w-9 h-9 rounded-full object-cover border border-emerald-500/30" referrerPolicy="no-referrer" />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 truncate">{person.name}</h4>
                    <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">{person.role} • {person.dept}</p>
                  </div>
                  <span className="text-[10px] text-emerald-500 font-bold font-mono">Chat+</span>
                </button>
              ))}
            </div>
          )}

        </div>
      </div>
    );
  };

  const renderChatArea = () => {
    return (
      <div className="flex-1 flex flex-col h-full min-w-0 p-4 bg-white dark:bg-zinc-950">
        
        {activeMeta ? (
          <>
            {/* Header user identification details */}
            <div className="pb-3 border-b border-zinc-200/60 dark:border-zinc-850/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {(isMobile || mobileShowChat) && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileShowChat(false);
                      speakText("Back to chat list", accessibility.readAloud);
                    }}
                    className="lg:hidden flex items-center justify-center gap-1.5 h-[34px] px-3.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-750 dark:text-zinc-300 hover:text-emerald-500 hover:bg-zinc-50 dark:hover:bg-zinc-850 cursor-pointer transition-all active:scale-90 mr-1.5 text-xs font-black uppercase tracking-wider"
                    title="Go back to list"
                  >
                    <span className="text-emerald-555">←</span>
                    <span className="font-extrabold">Chats</span>
                  </button>
                )}
                {!(activeMeta as any).isChannel ? (
                  <div className="relative">
                    <img 
                      src={(activeMeta as any).avatar} 
                      alt={activeMeta.name} 
                      className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500/20"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white dark:border-zinc-950" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black">
                    #
                  </div>
                )}
                <div className="text-left min-w-0">
                  <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 truncate">
                    {activeMeta.name}
                    {(activeMeta as any).isChannel && (
                      <span className="px-1.5 py-0.5 rounded-full text-[8px] bg-emerald-500/10 text-emerald-500 font-bold uppercase tracking-wider animate-pulse">Lobby Live</span>
                    )}
                  </h3>
                  <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-bold tracking-wide mt-0.5 truncate">
                    {!(activeMeta as any).isChannel ? `Direct Secure Sync Feed` : `Instant classroom collaborative workspace • ${currentMessages.length + 8} active participants`}
                  </p>
                </div>
              </div>

              {/* Header Action Panel status indicator */}
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 font-mono text-[9px] uppercase font-bold bg-zinc-100 dark:bg-zinc-910 px-2.5 py-1 rounded-xl">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </div>
              </div>
            </div>

            {/* Chat message bubbles scroll container */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {currentMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-zinc-400 dark:text-zinc-650 space-y-2">
                  <MessageSquare className="w-10 h-10 text-emerald-500/30" />
                  <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Open Classroom Collaboration Chain</p>
                  <p className="text-[10px] max-w-xs text-zinc-405 leading-relaxed">No messages in local ledger. Send a quick inquiry or attach files for instant peer coordination.</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {currentMessages.map(m => {
                    const isMe = m.senderId === myId;
                    return (
                      <motion.div 
                        key={m.id} 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                      >
                        {/* Name and timestamp header */}
                        <div className="flex items-center gap-1.5 px-1 bg-transparent">
                          <span className="text-[10px] font-black text-zinc-800 dark:text-zinc-200">{m.senderName}</span>
                          <span className="text-[8px] font-mono text-zinc-500/80 dark:text-zinc-400">{m.timestamp}</span>
                        </div>

                        {/* Interactive Message Bubble */}
                        <div className={`p-3.5 rounded-2xl text-[12px] max-w-[85%] text-left space-y-2.5 transition-all outline-none ${
                          isMe
                            ? 'bg-[#03213D] dark:bg-zinc-900 border border-[#03213D]/40 dark:border-zinc-800 text-white rounded-tr-none'
                            : 'bg-emerald-600 border border-emerald-500 text-white rounded-tl-none font-bold shadow-xs'
                        }`}>
                          
                          {/* Inner standard text if available */}
                          {m.message && (
                            <p className="leading-relaxed whitespace-pre-wrap text-white font-medium">{m.message}</p>
                          )}

                          {/* Image Attachment wrapper */}
                          {m.attachmentImg && (
                            <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 max-w-xs bg-zinc-100 dark:bg-zinc-900 group">
                              <img 
                                src={m.attachmentImg} 
                                alt="Attachment" 
                                className="object-cover w-full max-h-48 transition-transform duration-300 hover:scale-105"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}

                          {/* Link Rich Bookmark block */}
                          {m.attachmentLink && (
                            <div className="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-850/80 bg-zinc-50/80 dark:bg-zinc-950/40 space-y-1.5 max-w-xs">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-[10px] font-bold text-emerald-555 flex items-center gap-1 uppercase tracking-wider">
                                  <LinkIcon className="w-3 h-3 text-emerald-500" /> Web Resource
                                </span>
                                <a href={m.attachmentLink.url} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-emerald-500">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                              <h5 className="font-bold text-xs truncate text-zinc-900 dark:text-zinc-100">{m.attachmentLink.title}</h5>
                              <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">{m.attachmentLink.desc}</p>
                              <p className="text-[9px] text-zinc-500 dark:text-zinc-650 truncate font-mono">{m.attachmentLink.url}</p>
                            </div>
                          )}

                          {/* PDF/File Attachment download box */}
                          {m.attachmentFile && (
                            <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-850/80 bg-zinc-50 dark:bg-zinc-950/40 flex items-center justify-between gap-4 max-w-xs transition-colors hover:bg-zinc-100/50">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-xs truncate text-zinc-805 dark:text-zinc-200">{m.attachmentFile.name}</p>
                                  <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">Size: {m.attachmentFile.size}</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => {
                                  if (typeof window !== 'undefined' && (window as any).showToast) {
                                    (window as any).showToast(`Downloading class resource: ${m.attachmentFile?.name}`, "success");
                                  } else {
                                    alert(`Mock downloading resource file: ${m.attachmentFile?.name}`);
                                  }
                                  speakText(`Beginning secure download for class resource ${m.attachmentFile?.name}`, accessibility.readAloud);
                                }}
                                className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-emerald-500/10 hover:text-emerald-500 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5 text-zinc-500" />
                              </button>
                            </div>
                          )}

                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}

              {/* Typing indicator simulator */}
              {isPeerTyping && (
                <div className="flex items-center gap-2 text-zinc-400 px-1 py-1">
                  <div className="flex space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{typingPeerName} is drafting...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Selected pending attachment card summary */}
            {(pendingImg || pendingLink || pendingFile) && (
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl mb-2 flex items-center justify-between border border-zinc-200 dark:border-zinc-805">
                <div className="flex items-center gap-2.5 min-w-0">
                  {pendingImg && (
                    <>
                      <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                      <p className="text-xs font-bold truncate text-zinc-800 dark:text-zinc-200">Attached image preview coordinate loaded</p>
                    </>
                  )}
                  {pendingLink && (
                    <>
                      <LinkIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                      <p className="text-xs font-bold truncate text-zinc-800 dark:text-zinc-200">Attached Link: {pendingLink.title}</p>
                    </>
                  )}
                  {pendingFile && (
                    <>
                      <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                      <p className="text-xs font-bold truncate text-zinc-800 dark:text-zinc-200">Attached File: {pendingFile.name}</p>
                    </>
                  )}
                </div>
                <button 
                  onClick={() => {
                    setPendingImg(null);
                    setPendingLink(null);
                    setPendingFile(null);
                  }}
                  className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer text-zinc-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Chat inputs and Attachment menu */}
            <div className="relative shrink-0">
              {showAttachmentMenu && (
                <div className="absolute bottom-full left-0 mb-2 p-4 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-855 shadow-xl z-50 w-72 space-y-3.5 text-left animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-900">
                    <span className="text-[10px] uppercase font-black text-zinc-400 tracking-wider">Academic Attachments Cabinet</span>
                    <button onClick={() => setShowAttachmentMenu(false)} className="p-1 rounded-lg text-zinc-400"><X className="w-3.5 h-3.5" /></button>
                  </div>
                  
                  {/* Option lists */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-widest block"></p>
                    <button 
                      type="button" 
                      onClick={() => attachPresetImage('lab')}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer text-xs font-bold text-zinc-700 dark:text-zinc-350"
                    >
                      <ImageIcon className="w-4 h-4 text-pink-500" />
                      <span>Photos</span>
                    </button>
                    
                    <button 
                      type="button" 
                      onClick={attachPresetLink}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer text-xs font-bold text-zinc-700 dark:text-zinc-350"
                    >
                      <LinkIcon className="w-4 h-4 text-indigo-500" />
                      <span>Link</span>
                    </button>

                    <button 
                      type="button" 
                      onClick={() => attachPresetFile('Document_Resource.pdf', '2.1 MB')}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer text-xs font-bold text-zinc-700 dark:text-zinc-350"
                    >
                      <FileText className="w-4 h-4 text-amber-500" />
                      <span>File</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Input Action Panel Form */}
              <form onSubmit={handleSendMessage} className="pt-2 border-t border-zinc-200/60 dark:border-zinc-850/60 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                  className={`h-10 w-10 shrink-0 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-center transition-all cursor-pointer ${
                    showAttachmentMenu ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder={`Send a live academic notification message to ${activeMeta.name}...`}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-205 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans shadow-inner font-bold"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() && !pendingImg && !pendingLink && !pendingFile}
                  className="h-10 w-10 shrink-0 font-bold text-black bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-neutral-400 dark:text-zinc-650">
            <MessageSquare className="w-12 h-12 stroke-[1.5] mb-3 opacity-50 text-emerald-500 animate-bounce" />
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-200">No Target Lobby Selected</h4>
            <p className="text-xs opacity-75 max-w-xs mt-1">Select one of your direct class contacts or group rooms in the sidebar index panel to inspect discussions.</p>
          </div>
        )}

      </div>
    );
  };

  return (
    <div 
      id="messages-messenger-container"
      className="p-0 rounded-[2rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col lg:flex-row h-[calc(100vh-140px)] min-h-[600px] max-h-[820px] overflow-hidden text-left relative z-10 w-full animate-fade-in"
    >
      {isMobile ? (
        <AnimatePresence mode="wait">
          {!mobileShowChat ? (
            <motion.div
              key="sidebar-pane"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="w-full h-full flex flex-col"
            >
              {renderSidebar()}
            </motion.div>
          ) : (
            <motion.div
              key="chat-pane"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.15 }}
              className="w-full h-full flex flex-col"
            >
              {renderChatArea()}
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <>
          {renderSidebar()}
          {renderChatArea()}
        </>
      )}
    </div>
  );
}
