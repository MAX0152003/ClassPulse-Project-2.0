import React from 'react';
import { Role, AccessibilityConfig } from '../types';
import { 
  Lock, 
  Mail, 
  User, 
  ChevronRight, 
  Sparkles, 
  Shield,
  Eye,
  EyeOff,
  Activity
} from 'lucide-react';
import { speakText } from './AccessibilitySettings';
import { motion } from 'motion/react';

interface AuthScreensProps {
  onLoginSuccess: (role: Role, customName?: string, customEmail?: string) => void;
  accessibility: AccessibilityConfig;
}

export default function AuthScreens({ onLoginSuccess, accessibility }: AuthScreensProps) {
  const [isLoginView, setIsLoginView] = React.useState(true);
  
  // Registration form states
  const [regName, setRegName] = React.useState('');
  const [regEmail, setRegEmail] = React.useState('');
  const [regRole, setRegRole] = React.useState<Role>('student');
  const [regPassword, setRegPassword] = React.useState('');
  
  // Login form states
  const [loginEmail, setLoginEmail] = React.useState('');
  const [loginPassword, setLoginPassword] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(true);
  const [showPassword, setShowPassword] = React.useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) {
      alert("Please enter your email");
      return;
    }

    // Guess role from email prefixes or default to student
    let role: Role = 'student';
    if (loginEmail.toLowerCase().includes('faculty') || loginEmail.toLowerCase().includes('ahmad') || loginEmail.toLowerCase().includes('khan')) {
      role = 'faculty';
    } else if (loginEmail.toLowerCase().includes('admin') || loginEmail.toLowerCase().includes('registrar')) {
      role = 'admin';
    }

    const simpleName = loginEmail.split('@')[0].replace('.', ' ');
    onLoginSuccess(role, simpleName, loginEmail);
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      alert("Please pre-fill all registration coordinates.");
      return;
    }

    // Bypass verification part directly as requested!
    speakText(`Account registered successfully. Bypassing verification steps. Loading ${regRole} portal now.`, accessibility.readAloud);
    
    // Log them in immediately!
    onLoginSuccess(regRole, regName, regEmail);
  };

  // Preset demo accounts login trigger
  const triggerDemoLogin = (role: Role) => {
    let email = '';
    let name = '';
    if (role === 'student') {
      email = 'john.doe@msu.edu.ph';
      name = 'John Doe';
    } else if (role === 'faculty') {
      email = 'ahmad.khan@msu.edu.ph';
      name = 'Dr. Ahmad Khan';
    } else {
      email = 'admin@msu.edu.ph';
      name = 'Admin Strator';
    }
    
    speakText(`Demo account loaded. Switched to ${role} role.`, accessibility.readAloud);
    onLoginSuccess(role, name, email);
  };

  const isDark = accessibility.theme === 'dark';

  return (
    <div className="min-h-screen py-10 px-4 flex flex-col justify-center items-center relative transition-colors duration-305 bg-[#f9f9f9] dark:bg-[#121212] text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden">
      
      {/* Decorative Interactive Blurred Blobs */}
      <div className="absolute top-[15%] left-[20%] w-72 h-72 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.02] rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-[15%] right-[20%] w-72 h-72 bg-indigo-500/[0.04] dark:bg-indigo-500/[0.02] rounded-full blur-3xl pointer-events-none animate-pulse" />
      
      {/* Decorative Grid Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.01]" 
        style={{ backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />
      
      {/* Brand Launcher Logo Header */}
      <div className="mb-7 text-center z-10 space-y-2">
        <div className="relative inline-block group">
          <span className="absolute -inset-1.5 rounded-2.5xl bg-emerald-500/20 group-hover:bg-emerald-500/30 blur-xs transition-all duration-300" />
          <div className="relative w-14 h-14 rounded-2.5xl bg-emerald-500 text-black flex items-center justify-center font-bold text-2xl mx-auto shadow-xl shadow-emerald-500/15 transform rotate-3 hover:rotate-0 transition-transform">
            <Activity className="w-7 h-7 stroke-[2.5]" />
          </div>
        </div>
        <div className="pt-2 mx-auto max-w-sm">
          <h1 className="text-3xl font-black tracking-tight text-zinc-850 dark:text-zinc-100 uppercase">
            Class<span className="text-emerald-500 font-extrabold">Pulse</span>
          </h1>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 font-bold flex items-center justify-center gap-1.5 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Mindanao State University • Attendance Suite
          </p>
        </div>
      </div>

      {/* Main Form Box Container */}
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -30, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        whileHover={{ boxShadow: "0 20px 40px -15px rgba(16, 185, 129, 0.08)" }}
        className="w-full max-w-md p-8 rounded-[2rem] border bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-zinc-200/80 dark:border-zinc-850/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] transition-all duration-300 z-10 text-left relative overflow-hidden group"
      >
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-400 opacity-90" />
        
        {isLoginView ? (
          /* ================= LOGIN SCREEN ================= */
          <div className="space-y-5">
            <div className="text-left space-y-1">
              <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100">Portal Authentication</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">ClassPulse MSU Marawi Campus schedule & secure attendance tracking ledger.</p>
            </div>

            {/* Google Fast Registration Bar */}
            <div className="pt-1">
              <button
                type="button"
                id="google-signin-btn"
                onClick={() => {
                  speakText("Fast Authentication via MSU Google Account approved.", accessibility.readAloud);
                  onLoginSuccess('student', 'Farhan Makil', 'farhanmakil15@gmail.com');
                }}
                className="w-full py-3 px-4 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-200 text-xs font-bold transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer shadow-xs hover:shadow-sm"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" id="google-icon-svg">
                  <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.41 15 0 12 0 7.35 0 3.37 2.67 1.39 6.56l3.86 3C6.18 6.77 8.85 5.04 12 5.04z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.43a5.52 5.52 0 0 1-2.4 3.61l3.71 2.88c2.17-2 3.75-4.94 3.75-8.64z" />
                  <path fill="#FBBC05" d="M5.25 14.56A7.12 7.12 0 0 1 4.8 12c0-.88.15-1.74.45-2.56L1.39 6.56A11.95 11.95 0 0 0 0 12c0 2.12.55 4.12 1.52 5.88l3.73-3.32z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.71-2.88c-1.03.69-2.35 1.1-4.22 1.1-3.15 0-5.82-1.73-6.76-4.52l-3.86 3C3.37 21.33 7.35 24 12 24z" />
                </svg>
                Continue with University Google Account
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-zinc-150 dark:border-zinc-800"></div>
              <span className="flex-shrink mx-4 text-[9px] text-zinc-400 font-mono uppercase tracking-widest">or email login</span>
              <div className="flex-grow border-t border-zinc-150 dark:border-zinc-800"></div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block text-left">Academic Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="student@msu.edu.ph"
                    className="pl-9 pr-4 py-2.5 border rounded-full text-xs w-full focus:outline-none border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block text-left">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter account security key"
                    className="pl-9 pr-10 py-2.5 border rounded-full text-xs w-full focus:outline-none border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 select-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <label className="flex items-center gap-2 cursor-pointer select-none text-zinc-500">
                  <input 
                    type="checkbox" 
                    checked={rememberMe} 
                    onChange={() => setRememberMe(!rememberMe)}
                    className="rounded border-zinc-300 dark:border-zinc-700 text-emerald-550 dark:text-emerald-400 cursor-pointer accent-emerald-500"
                  />
                  Remember credentials
                </label>
                <button 
                  type="button" 
                  onClick={() => alert("Verification code is bypassed. For testing, please login directly or use quick log in profiles below.")}
                  className="text-emerald-500 font-extrabold hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-black shadow-xs hover:shadow-sm cursor-pointer transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                Log In
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>

            <div className="text-center pt-1.5">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Need an academic profile?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginView(false);
                    speakText("Navigating to Account Creation Ledger.", accessibility.readAloud);
                  }}
                  className="text-emerald-550 dark:text-emerald-400 font-extrabold hover:underline cursor-pointer"
                >
                  Create Account
                </button>
              </p>
            </div>

            {/* Quick Demo account switcher panel */}
            <div className="pt-5 border-t border-zinc-200 dark:border-zinc-800 text-left space-y-3">
              <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                Quick Demo Accounts Switcher
              </span>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => triggerDemoLogin('student')}
                  className="p-2 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/20 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-650 dark:text-zinc-300 hover:text-[#10b981] dark:hover:text-emerald-400 hover:bg-[#10b981]/5 text-[10px] font-bold cursor-pointer transition-all uppercase"
                >
                  Student
                </button>
                <button
                  onClick={() => triggerDemoLogin('faculty')}
                  className="p-2 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/20 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-650 dark:text-zinc-300 hover:text-[#10b981] dark:hover:text-emerald-400 hover:bg-[#10b981]/5 text-[10px] font-bold cursor-pointer transition-all uppercase"
                >
                  Faculty
                </button>
                <button
                  onClick={() => triggerDemoLogin('admin')}
                  className="p-2 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/20 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-650 dark:text-zinc-300 hover:text-[#10b981] dark:hover:text-emerald-400 hover:bg-[#10b981]/5 text-[10px] font-bold cursor-pointer transition-all uppercase"
                >
                  Admin
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ================= SIGN UP / REGISTER SCREEN ================= */
          <div className="space-y-6">
            <div className="text-left space-y-1">
              <h2 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Create Account</h2>
              <p className="text-xs text-zinc-455 dark:text-zinc-400">Join academic ClassPulse integrated rosters today.</p>
            </div>

            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block text-left">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Rachel Green"
                    className="pl-9 pr-4 py-2.5 border rounded-xl text-xs w-full focus:outline-none border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block text-left">Academic Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="student@msu.edu.ph"
                    className="pl-9 pr-4 py-2.5 border rounded-xl text-xs w-full focus:outline-none border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 block">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block text-left">Academic Role</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as Role)}
                  className="w-full text-xs p-2.5 rounded-xl border focus:outline-none border-zinc-200 bg-white dark:border-zinc-805 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                >
                  <option value="student">Student Portal</option>
                  <option value="faculty">Faculty Instructor</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block text-left">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-450">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Set custom secure credentials"
                    className="pl-9 pr-4 py-2.5 border rounded-xl text-xs w-full focus:outline-none border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-650 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 text-[11px] text-zinc-500 leading-normal items-start">
                <input 
                  type="checkbox" 
                  defaultChecked 
                  className="rounded border-zinc-300 dark:border-zinc-700 text-emerald-555 dark:text-emerald-400 cursor-pointer accent-emerald-500" 
                  required
                />
                <span className="text-left">
                  I agree to the <span className="font-extrabold text-emerald-555 cursor-pointer">Terms of Service</span> and <span className="font-extrabold text-[#10b981] cursor-pointer">Privacy Policy</span>.
                </span>
              </div>

              {/* Secure notification badge noting the verification bypass constraint */}
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex gap-2 items-start text-emerald-500 text-left">
                <Shield className="w-4.5 h-4.5 shrink-0 text-emerald-500 mt-1" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest">Instant Auto-activation</p>
                  <p className="text-[10px] opacity-80 leading-relaxed mt-0.5">Verification flows are skipped as requested. Account registers instantly to the campus ledger.</p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-black shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                Sign Up & Launch
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>

            <div className="pt-2 text-center">
              <p className="text-xs text-zinc-400">
                Already have an academic account? {' '}
                <button
                  type="button"
                  onClick={() => setIsLoginView(true)}
                  className="text-emerald-500 font-extrabold hover:underline cursor-pointer"
                >
                  Log In directly
                </button>
              </p>
            </div>
          </div>
        )}

      </motion.div>
    </div>
  );
}
