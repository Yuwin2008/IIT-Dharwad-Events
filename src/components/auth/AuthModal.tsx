import React, { useState } from 'react';
import { useAuth } from '../../lib/authContext';
import { SUPER_ADMIN_EMAIL } from '../../lib/supabase';
import { X, Lock, Mail, User, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  onSuccessNavigate?: (targetRoute: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccessNavigate,
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, signup } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    const cleanEmail = email.trim().toLowerCase();

    // Institutional email validation
    if (!cleanEmail.endsWith('@iitdh.ac.in')) {
      setErrorMessage('Access Denied: Only official IIT Dharwad institutional accounts (@iitdh.ac.in) are permitted.');
      setIsSubmitting(false);
      return;
    }

    if (mode === 'forgot') {
      setTimeout(() => {
        setSuccessMessage('Password recovery instructions sent to your institutional email.');
        setIsSubmitting(false);
      }, 700);
      return;
    }

    if (mode === 'signup') {
      if (!password || password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        setIsSubmitting(false);
        return;
      }
      const res = await signup(cleanEmail, password, fullName);
      setIsSubmitting(false);
      if (res.success) {
        onClose();
        if (onSuccessNavigate) {
          onSuccessNavigate('/dashboard');
        }
      } else {
        setErrorMessage(res.error || 'Failed to complete registration.');
      }
    } else {
      const res = await login(cleanEmail, password);
      setIsSubmitting(false);
      if (res.success) {
        onClose();
        if (onSuccessNavigate) {
          onSuccessNavigate('/dashboard');
        }
      } else {
        setErrorMessage(res.error || 'Invalid credentials or institutional account.');
      }
    }
  };

  const fillQuickSuperAdmin = () => {
    setEmail(SUPER_ADMIN_EMAIL);
    setPassword('SuperAdmin@2026');
  };

  const fillQuickStudent = () => {
    setEmail('student26@iitdh.ac.in');
    setPassword('Student@2026');
    setFullName('Arjun Sharma');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-800/80 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                IIT Dharwad Portal
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {mode === 'login' && 'Institute Single Sign-On'}
              {mode === 'signup' && 'Student Account Registration'}
              {mode === 'forgot' && 'Reset Institute Password'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Strictly restricted to @iitdh.ac.in credentials
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        {mode !== 'forgot' && (
          <div className="flex border-b border-slate-800 bg-slate-950/50">
            <button
              onClick={() => {
                setMode('login');
                setErrorMessage('');
              }}
              className={`flex-1 py-3 text-xs font-semibold tracking-wide transition-colors ${
                mode === 'login'
                  ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-900/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setErrorMessage('');
              }}
              className={`flex-1 py-3 text-xs font-semibold tracking-wide transition-colors ${
                mode === 'signup'
                  ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-900/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              New Registration
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-lg text-rose-200 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-lg text-emerald-200 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Arjun Sharma"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              IIT Dharwad Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rollno@iitdh.ac.in"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Must end with <code className="text-indigo-300">@iitdh.ac.in</code>
            </p>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMessage('');
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Authenticate & Enter'}
                  {mode === 'signup' && 'Create Student Account'}
                  {mode === 'forgot' && 'Send Recovery Email'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {mode === 'forgot' && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                ← Return to Login
              </button>
            </div>
          )}

          {/* Quick preset credentials for testing */}
          <div className="pt-3 border-t border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-2 font-medium">
              Demo Credentials Quick-Fill:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={fillQuickSuperAdmin}
                className="text-[11px] bg-slate-800/80 hover:bg-slate-800 text-slate-300 py-1.5 px-2 rounded border border-slate-700 text-left transition-colors"
              >
                <strong className="block text-purple-300">Super Admin</strong>
                <span className="truncate block opacity-80">{SUPER_ADMIN_EMAIL}</span>
              </button>
              <button
                type="button"
                onClick={fillQuickStudent}
                className="text-[11px] bg-slate-800/80 hover:bg-slate-800 text-slate-300 py-1.5 px-2 rounded border border-slate-700 text-left transition-colors"
              >
                <strong className="block text-emerald-300">Student Account</strong>
                <span className="truncate block opacity-80">student26@iitdh.ac.in</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
