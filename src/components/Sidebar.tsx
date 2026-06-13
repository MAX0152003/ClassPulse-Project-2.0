import React from 'react';
import { Role, AccessibilityConfig } from '../types';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Scan, 
  Bell, 
  UserCircle, 
  LogOut, 
  Users, 
  X,
  Menu,
  Activity,
  ChevronLeft,
  MessageSquare,
  Inbox,
  Settings
} from 'lucide-react';
import { speakText } from './AccessibilitySettings';

interface SidebarProps {
  role: Role;
  activeScreen: string;
  setScreen: (screen: string) => void;
  onLogout: () => void;
  userName: string;
  userAvatar: string;
  unreadNotifications: number;
  pendingExcuseCount?: number;
  accessibility: AccessibilityConfig;
}

export default function Sidebar({
  role,
  activeScreen,
  setScreen,
  onLogout,
  userName,
  userAvatar,
  unreadNotifications,
  pendingExcuseCount = 0,
  accessibility
}: SidebarProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    return localStorage.getItem('cp_sidebar_collapsed') === 'true';
  });
  const [isHovered, setIsHovered] = React.useState(false);

  const toggleCollapse = () => {
    const nextVal = !isCollapsed;
    setIsCollapsed(nextVal);
    localStorage.setItem('cp_sidebar_collapsed', String(nextVal));
    speakText(nextVal ? "Sidebar minimized" : "Sidebar expanded", accessibility.readAloud);
  };

  const getNavItems = () => {
    switch (role) {
      case 'student':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'schedule', label: 'My Schedule', icon: CalendarDays },
          { id: 'attendance', label: 'Attendance Scan', icon: Scan },
          { id: 'messages', label: 'Messages', icon: MessageSquare },
          { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifications },
          { id: 'profile', label: 'Profile', icon: UserCircle },
          { id: 'settings', label: 'Settings', icon: Settings },
        ];
      case 'faculty':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'schedule-editor', label: 'My Classes', icon: CalendarDays },
          { id: 'qr-generator', label: 'Attendance QR', icon: Scan },
          { id: 'students-monitoring', label: 'Students Directory', icon: Users },
          { id: 'excuse-inbox', label: 'Excuse Inbox', icon: Inbox, badge: pendingExcuseCount },
          { id: 'messages', label: 'Messages', icon: MessageSquare },
          { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifications },
          { id: 'profile', label: 'Profile', icon: UserCircle },
          { id: 'settings', label: 'Settings', icon: Settings },
        ];
      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'users', label: 'Users Directory', icon: Users },
          { id: 'schedule-editor', label: 'Schedules', icon: CalendarDays },
          { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifications },
          { id: 'profile', label: 'Profile', icon: UserCircle },
          { id: 'settings', label: 'Settings', icon: Settings },
        ];
    }
  };

  const getRoleNavColors = () => {
    switch (role) {
      case 'student':
        return {
          activeClass: 'bg-[#03213D]/10 text-[#03213D] dark:text-[#38bdf8] border-l-4 border-[#03213D] font-extrabold shadow-xs',
          badgeClass: 'bg-[#03213D] text-white',
          roleLabel: 'text-[#03213D] dark:text-[#a5f3fc]'
        };
      case 'faculty':
        return {
          activeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-l-4 border-emerald-500 font-extrabold shadow-xs',
          badgeClass: 'bg-emerald-600 text-white',
          roleLabel: 'text-emerald-600 dark:text-emerald-400'
        };
      case 'admin':
        return {
          activeClass: 'bg-[#CC762A]/10 text-[#CC762A] dark:text-[#fdba74] border-l-4 border-[#CC762A] font-extrabold shadow-xs',
          badgeClass: 'bg-[#CC762A] text-white',
          roleLabel: 'text-[#CC762A] dark:text-[#fdba74]'
        };
    }
  };

  const themeColors = getRoleNavColors();
  const navItems = getNavItems();

  const handleNavClick = (screenId: string, label: string) => {
    setScreen(screenId);
    setIsOpen(false);
    speakText(`Navigation: switched to ${label}`, accessibility.readAloud);
  };

  const isDark = accessibility.theme === 'dark';

  return (
    <>
      {/* Mobile Top Header Banner */}
      <div className="md:hidden flex items-center justify-between px-5 py-4 border-b bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-850 text-zinc-900 dark:text-zinc-100 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-black flex items-center justify-center font-bold shadow-md shadow-emerald-500/10">
            <Activity className="w-4.5 h-4.5" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-zinc-100">ClassPulse</span>
          <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 rounded-full">
            {role === 'student' ? 'Student' : role === 'faculty' ? 'Faculty' : 'Admin'}
          </span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-900 dark:text-zinc-100 cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Container */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`max-md:fixed max-md:inset-y-0 max-md:left-0 z-50 h-screen flex flex-col justify-between transition-all duration-300 transform ${
          isOpen ? 'translate-x-0' : 'max-md:-translate-x-full'
        } ${
          isCollapsed ? 'md:w-20' : 'w-64 md:w-64'
        } bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-850 text-zinc-900 dark:text-zinc-100 md:relative md:translate-x-0 shadow-lg`}
      >
        <div className="relative">
          
          {/* Collapsible Trigger (Minimize button) positioned lower to never block the logo - HIDDEN ON MOBILES */}
          <button
            type="button"
            onClick={toggleCollapse}
            className="hidden md:flex absolute -right-3 top-20 z-55 p-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-550 dark:text-zinc-400 shadow-md hover:bg-zinc-50 dark:hover:bg-zinc-805 transition-all duration-300 transform scale-100 cursor-pointer opacity-100"
            title={isCollapsed ? "Expand Sidebar Menu" : "Collapse Sidebar Menu"}
          >
            <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-300 text-emerald-500 ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>

          {/* Brand Logo & Heartbeat Visual Header */}
          <div className={`p-5 border-b border-zinc-200 dark:border-zinc-850 flex items-center transition-all duration-300 ${
            isCollapsed ? 'justify-center px-0 py-6' : 'justify-between'
          }`}>
            <div className={`flex items-center gap-3 transition-all duration-300 ${
              isCollapsed ? 'justify-center w-10 h-10' : 'w-auto'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-black flex items-center justify-center font-bold shadow-md shadow-emerald-500/15 shrink-0 transition-transform duration-300 hover:scale-[1.05]">
                <Activity className="w-5 h-5 stroke-[2.5]" />
              </div>
              {!isCollapsed && (
                <div className="text-left animate-fade-in flex flex-col justify-center min-w-[120px]">
                  <h1 className="text-base font-black tracking-tight text-zinc-800 dark:text-zinc-100 uppercase">
                    Class<span className="text-emerald-555 font-extrabold text-emerald-500">Pulse</span>
                  </h1>
                  <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold tracking-widest uppercase">{role}</p>
                </div>
              )}
            </div>
            {/* Close btn for mobile drawer */}
            <button
              onClick={() => setIsOpen(false)}
              type="button"
              className="md:hidden p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-650 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Bio Card */}
          <div className={`mx-4 my-6 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-900 flex items-center gap-3 transition-all ${
            isCollapsed ? 'justify-center mx-2 px-2' : ''
          }`}>
            <img
              src={userAvatar}
              alt={userName}
              className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-800 shadow-sm shrink-0"
              referrerPolicy="no-referrer"
            />
            {!isCollapsed && (
              <div className="overflow-hidden text-left animate-fade-in">
                <h2 className="font-bold text-xs truncate text-zinc-900 dark:text-zinc-100">{userName}</h2>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold flex items-center gap-1">
                  Active Session
                </span>
              </div>
            )}
          </div>

          {/* Primary Navigation Menu */}
          <nav className="px-3 space-y-1 text-left">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id, item.label)}
                  type="button"
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all text-xs font-bold cursor-pointer ${
                    isActive 
                      ? themeColors.activeClass 
                      : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 hover:text-zinc-900 dark:hover:text-zinc-200'
                  } ${isCollapsed ? 'justify-center px-1 border-l-0' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4.5 h-4.5 shrink-0 transition-transform duration-300 hover:scale-110" />
                    {!isCollapsed && <span className="animate-fade-in">{item.label}</span>}
                  </div>
                  {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs ${themeColors.badgeClass}`}>
                      {item.badge}
                    </span>
                  )}
                  {isCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <div className="absolute right-3.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white dark:border-zinc-950" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-850">
          <button
            onClick={() => {
              onLogout();
              speakText("Logged out successfully.", accessibility.readAloud);
            }}
            type="button"
            title={isCollapsed ? "Log Out" : undefined}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-zinc-450 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 ${
              isCollapsed ? 'justify-center px-1' : ''
            }`}
          >
            <LogOut className="w-4.5 h-4.5 shrink-0 opacity-80" />
            {!isCollapsed && <span className="animate-fade-in">Log Out</span>}
          </button>
        </div>
      </div>

      {/* Backdrop for mobile drawer */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs z-40 md:hidden"
        />
      )}
    </>
  );
}
