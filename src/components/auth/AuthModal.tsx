import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/authContext';
import { isIITDHEmail, normalizeEmail } from '../../lib/supabase';
import { UserRole } from '../../types';
import { X, Lock, Mail, User, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  onSuccessNavigate?: (targetRoute: string, role?: UserRole) => void;
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showSignupHint, setShowSignupHint] = useState(false);
  const [showLoginHint, setShowLoginHint] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, signup, resetPassword } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setPassword('');
      setConfirmPassword('');
      setErrorMessage('');
      setShowSignupHint(false);
      setShowLoginHint(false);
      setSuccessMessage('');
      setIsSubmitting(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const trimmedEmail = normalizeEmail(email);
  const hasTypedEmail = trimmedEmail.length > 0;
  const emailValid = isIITDHEmail(trimmedEmail);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setShowSignupHint(false);
    setShowLoginHint(false);
    setSuccessMessage('');
    setIsSubmitting(true);

    const cleanEmail = normalizeEmail(email);

    // Strict institutional @iitdh.ac.in email validation
    if (!isIITDHEmail(cleanEmail)) {
      setErrorMessage(
        'Access Denied: Only official IIT Dharwad institutional emails (e.g. rollno@iitdh.ac.in) are permitted.'
      );
      setIsSubmitting(false);
      return;
    }

    if (mode === 'forgot') {
      if (!password || password.length < 6) {
        setErrorMessage('New password must be at least 6 characters long.');
        setIsSubmitting(false);
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please re-enter your new password.');
        setIsSubmitting(false);
        return;
      }
      const res = await resetPassword(cleanEmail, password);
      setIsSubmitting(false);
      if (res.success) {
        setSuccessMessage('Password updated for your @iitdh.ac.in account. You can now sign in.');
        setConfirmPassword('');
        setMode('login');
      } else {
        setErrorMessage(res.error || 'Failed to update password.');
      }
      return;
    }

    if (mode === 'signup') {
      if (!fullName || fullName.trim().length < 2) {
        setErrorMessage('Please enter your full name (at least 2 characters).');
        setIsSubmitting(false);
        return;
      }
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
          onSuccessNavigate('/dashboard', res.role);
        }
      } else {
        setErrorMessage(res.error || 'Failed to complete registration.');
        if (res.code === 'ACCOUNT_EXISTS') {
          setShowLoginHint(true);
        }
      }
    } else {
      const res = await login(cleanEmail, password);
      setIsSubmitting(false);
      if (res.success) {
        onClose();
        if (onSuccessNavigate) {
          onSuccessNavigate('/dashboard', res.role);
        }
      } else {
        setErrorMessage(res.error || 'Invalid credentials or institutional account.');
        if (res.code === 'ACCOUNT_NOT_REGISTERED') {
          setShowSignupHint(true);
        }
      }
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
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
              {mode === 'signup' && 'Institute Account Registration'}
              {mode === 'forgot' && 'Set / Reset Institute Password'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Strictly restricted to @iitdh.ac.in institutional emails
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close authentication modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        {mode !== 'forgot' && (
          <div className="flex border-b border-slate-800 bg-slate-950/50">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage('');
                setShowSignupHint(false);
                setShowLoginHint(false);
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
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage('');
                setShowSignupHint(false);
                setShowLoginHint(false);
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
            <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-lg text-rose-200 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
              {showSignupHint && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMessage('');
                    setShowSignupHint(false);
                  }}
                  className="ml-6 text-indigo-300 hover:text-indigo-200 font-semibold underline block text-left"
                >
                  Register {trimmedEmail || 'this @iitdh.ac.in account'} →
                </button>
              )}
              {showLoginHint && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage('');
                    setShowLoginHint(false);
                  }}
                  className="ml-6 text-indigo-300 hover:text-indigo-200 font-semibold underline block text-left"
                >
                  Switch to Sign In →
                </button>
              )}
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
                onChange={(e) => setEmail(e.target.value.replace(/\s+/g, ''))}
                onBlur={() => setEmail((prev) => normalizeEmail(prev))}
                placeholder="rollno@iitdh.ac.in"
                autoComplete="email"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <p className="text-[11px] mt-1 flex items-center gap-1.5">
              {!hasTypedEmail ? (
                <span className="text-slate-400">
                  Must end with <code className="text-indigo-300">@iitdh.ac.in</code>
                </span>
              ) : emailValid ? (
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Valid @iitdh.ac.in institutional email</span>
                </span>
              ) : (
                <span className="text-amber-400">
                  Use your official @iitdh.ac.in email (e.g. rollno@iitdh.ac.in)
                </span>
              )}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                {mode === 'forgot' ? 'New Password (min 6 chars)' : 'Password'}
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setErrorMessage('');
                    setSuccessMessage('');
                    setPassword('');
                    setConfirmPassword('');
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot / Reset password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {mode === 'forgot' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
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
                  {mode === 'signup' && 'Create Account & Enter'}
                  {mode === 'forgot' && 'Update Password'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {mode === 'forgot' && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage('');
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                ← Return to Sign In
              </button>
            </div>
          )}

          {/* Authentication policy */}
          <div className="pt-3 border-t border-slate-800">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              All users (Students, Club Admins, and Super Admins) must sign in with their <code className="text-indigo-300">@iitdh.ac.in</code> email and password on each visit. New to the portal? Select <strong className="text-slate-200">New Registration</strong> above.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
