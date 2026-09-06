import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User as UserIcon, AlertCircle, ArrowRight, Eye, EyeOff, Clock, ShieldCheck, Building2, Mail, Phone, CheckCircle2, ChevronLeft, Crown, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { rateLimitService, RateLimitStatus } from '../../services/rateLimitService';
import { authService } from '../../services/authService';
import { campusService } from '../../services/campusService';
import { Campus } from '../../types';
import { Branding } from '../../components/Branding';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus | null>(null);
  const [lockoutCountdown, setLockoutCountdown] = useState<number | null>(null);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [campusesLoading, setCampusesLoading] = useState(true);
  const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null);
  const [adminMode, setAdminMode] = useState(false);

  useEffect(() => {
    campusService.getPublicList().then((res) => {
      if (res.success && res.data) setCampuses(res.data);
      setCampusesLoading(false);
    }).catch(() => setCampusesLoading(false));
  }, []);

  useEffect(() => {
    if (username.trim()) {
      const status = rateLimitService.checkRateLimit(username.trim());
      setRateLimitStatus(status);
    }
  }, [username]);

  useEffect(() => {
    if (rateLimitStatus?.lockoutRemainingSeconds !== undefined && rateLimitStatus.lockoutRemainingSeconds > 0) {
      setLockoutCountdown(rateLimitStatus.lockoutRemainingSeconds);
      const timer = setInterval(() => {
        setLockoutCountdown((prev) => {
          if (prev && prev > 1) {
            return prev - 1;
          }
          clearInterval(timer);
          return null;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
    setLockoutCountdown(null);
  }, [rateLimitStatus?.lockoutRemainingSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter your username or email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    const status = rateLimitService.checkRateLimit(username.trim());
    if (!status.canLogin) {
      const lockoutMessage = `Too many unsuccessful login attempts. Your account has been temporarily locked. Please try again in ${status.lockoutRemainingSeconds} second${status.lockoutRemainingSeconds !== 1 ? 's' : ''}.`;
      setError(lockoutMessage);
      showToast(lockoutMessage, 'error');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login({ username: username.trim(), password, campus: adminMode ? undefined : selectedCampus?.name });
      rateLimitService.clearRateLimit(username.trim());
      showToast('Welcome to IAA Inventory Management System', 'success');
      navigate('/', { replace: true });
    } catch (err: any) {
      const newStatus = rateLimitService.recordFailedAttempt(username.trim());
      setRateLimitStatus(newStatus);

      if (err.errors) {
        const errorMessages = Object.values(err.errors).flat().join(', ');
        setError(errorMessages);
        showToast(errorMessages, 'error');
        return;
      }

      if (!newStatus.canLogin) {
        const lockoutMessage = `Too many unsuccessful login attempts. Your account has been temporarily locked. Please try again later or contact the system administrator.`;
        setError(lockoutMessage);
        showToast(lockoutMessage, 'error');
      } else {
        const attemptsLeft = newStatus.remainingAttempts;
        const message = attemptsLeft > 0 ? `${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining` : 'Invalid credentials';
        setError(err.message || `Authentication failed. ${message}`);
        showToast('Invalid credentials', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotPhone.trim()) {
      setForgotMessage('Please enter both your email and phone number.');
      setError('Please enter both your email and phone number.');
      return;
    }

    setForgotLoading(true);
    setForgotMessage('');
    setError('');

    const result = await authService.forgotPassword({ email: forgotEmail.trim(), phone: forgotPhone.trim() });
    if (result.success) {
      setForgotMessage('A password reset email has been sent to your registered email address.');
      showToast('Password reset instructions sent', 'success');
      setForgotEmail('');
      setForgotPhone('');
      setForgotLoading(false);
      setForgotMode(false);
      return;
    }

    setForgotMessage(result.message || 'Unable to send a password reset link.');
    showToast(result.message || 'Unable to send a password reset link.', 'error');
    setForgotLoading(false);
  };

  const handleSelectCampus = (campus: Campus) => {
    setSelectedCampus(campus);
    setAdminMode(false);
    setError('');
  };

  const handleSelectAdmin = () => {
    setAdminMode(true);
    setSelectedCampus(null);
    setError('');
  };

  const handleBackToPicker = () => {
    setSelectedCampus(null);
    setAdminMode(false);
    setUsername('');
    setPassword('');
    setError('');
  };

  const showCampusPicker = !forgotMode && !adminMode && !selectedCampus;

  return (
    <div className="min-h-screen bg-[#edf2f7] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-[#dfe7ef] bg-white shadow-[0_24px_80px_rgba(10,22,38,0.12)]">
        <div className="grid md:grid-cols-2">
          <div className="bg-gradient-to-br from-[#0A1626] via-[#1B3A5C] to-[#244f7a] px-8 py-10 sm:px-10 sm:py-12 text-white">
            <div className="mb-8 flex items-center gap-3">
              <Branding variant="large" showText={false} className="[&_img]:drop-shadow-[0_0_10px_rgba(197,168,78,0.5)]" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#d8c98a]">IAA</p>
                <p className="text-lg font-black tracking-tight">Inventory Management</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-black tracking-tight">INVENTORY MANAGEMENT</h1>
                <h2 className="mt-2 text-xl font-semibold text-[#dfeaf8]">SYSTEM</h2>
              </div>

              <div className="space-y-4 text-sm text-[#dfeaf8]">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-[#C5A84E]" />
                  <span>Institutional asset lifecycle control across all campuses.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="mt-0.5 h-5 w-5 text-[#C5A84E]" />
                  <span>Operational oversight across every IAA campus, scoped to each user's role and campus.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-8 sm:px-8 sm:py-10">
            <div className="mb-7">
              {(selectedCampus || adminMode) && !forgotMode ? (
                <button type="button" onClick={handleBackToPicker} className="mb-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#1B3A5C] hover:text-[#12294A]">
                  <ChevronLeft className="h-3.5 w-3.5" />Change campus
                </button>
              ) : null}
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6B7280]">{showCampusPicker ? 'Welcome' : 'Welcome back'}</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1B3A5C]">{showCampusPicker ? 'Select your campus' : 'Sign in'}</h1>
              <p className="mt-2 text-sm text-[#6B7280]">
                {forgotMode
                  ? 'Reset your password using your registered email and phone number.'
                  : showCampusPicker
                    ? 'Choose your campus to continue, or sign in as Overall Administrator.'
                    : adminMode
                      ? 'Signing in as Overall Administrator.'
                      : <>Signing in to <span className="font-bold text-[#1B3A5C]">{selectedCampus?.name}</span> campus.</>}
              </p>
            </div>

            {showCampusPicker && (
              <div className="mb-6 space-y-4">
                {campusesLoading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {campuses.map((campus) => (
                      <button
                        key={campus.id}
                        type="button"
                        onClick={() => handleSelectCampus(campus)}
                        className="group relative flex flex-col items-start gap-2 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#C5A84E] hover:bg-white hover:shadow-[0_10px_30px_rgba(27,58,92,0.15)] focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]"
                      >
                        <span className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-[#1B3A5C] to-[#C5A84E] transition-transform duration-300 group-hover:scale-x-100" />
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1B3A5C]/10 text-[#1B3A5C] transition-colors group-hover:bg-[#1B3A5C] group-hover:text-white">
                          <Building2 className="h-4.5 w-4.5" />
                        </span>
                        <span className="text-sm font-black text-[#1B3A5C]">{campus.name}</span>
                        {campus.location && (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-[#6B7280]"><MapPin className="h-3 w-3" />{campus.location}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSelectAdmin}
                  className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-dashed border-[#C5A84E]/60 bg-[#fdf9ee] p-4 text-left transition-all hover:border-[#C5A84E] hover:bg-[#fbf2d9]"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C5A84E]/15 text-[#8a6d1f] transition-colors group-hover:bg-[#C5A84E] group-hover:text-white">
                      <Crown className="h-4.5 w-4.5" />
                    </span>
                    <span>
                      <span className="block text-sm font-black text-[#1B3A5C]">Overall Administrator</span>
                      <span className="block text-[11px] font-medium text-[#6B7280]">Sign in without selecting a campus</span>
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#8a6d1f] transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            )}

            {error && !showCampusPicker && (
              <div id="login-error-alert" className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {rateLimitStatus && !rateLimitStatus.canLogin && !showCampusPicker && (
              <div className="mb-5 flex items-start gap-2 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-xs font-semibold text-yellow-700">
                <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p>Too many unsuccessful login attempts.</p>
                  <p className="mt-1">Your account has been temporarily locked. Please try again in {lockoutCountdown} second{lockoutCountdown !== 1 ? 's' : ''}.</p>
                </div>
              </div>
            )}

            {rateLimitStatus && rateLimitStatus.canLogin && rateLimitStatus.attempts > 0 && !showCampusPicker && (
              <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs font-medium text-yellow-700">
                ⚠ {rateLimitStatus.remainingAttempts} attempt{rateLimitStatus.remainingAttempts !== 1 ? 's' : ''} remaining before account lockout
              </div>
            )}

            {!showCampusPicker && (forgotMode ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#1B3A5C]">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="forgot-email"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Enter your registered email"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1B3A5C] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="forgot-phone" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#1B3A5C]">Phone number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="forgot-phone"
                      type="text"
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value)}
                      placeholder="Enter phone number used during registration"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1B3A5C] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {forgotMessage && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
                    {forgotMessage}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode(false);
                      setForgotMessage('');
                    }}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#1B3A5C]"
                  >
                    Back to Login
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 rounded-xl bg-[#1B3A5C] px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#12294A] disabled:opacity-60"
                  >
                    {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" disabled={rateLimitStatus?.canLogin === false}>
                <div>
                  <label htmlFor="login-username" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#1B3A5C]">Username / Email</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="login-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username or email"
                      autoComplete="username"
                      required
                      disabled={rateLimitStatus?.canLogin === false}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1B3A5C] focus:bg-white focus:outline-none disabled:opacity-50 disabled:bg-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#1B3A5C]">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                      disabled={rateLimitStatus?.canLogin === false}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1B3A5C] focus:bg-white focus:outline-none disabled:opacity-50 disabled:bg-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1B3A5C]"
                      disabled={rateLimitStatus?.canLogin === false}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1 text-xs text-[#6B7280]">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-[#1B3A5C]" />
                    Remember me
                  </label>
                  <button type="button" onClick={() => setForgotMode(true)} className="font-semibold text-[#1B3A5C] hover:text-[#12294A]">Forgot password?</button>
                </div>

                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={loading || rateLimitStatus?.canLogin === false}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B3A5C] px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#12294A] disabled:opacity-60"
                >
                  {loading ? <span>Signing in...</span> : <><span>Login</span><ArrowRight className="h-4 w-4" /></>}
                </button>
              </form>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
