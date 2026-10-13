import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      await api.checkEmail(email);
      setStep('reset');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword) {
      setError('Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(email, newPassword);
      setStep('done');
      toast.success('Password reset successfully!');
    } catch (e) {
      setError((e as Error).message);
      toast.error('Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-navy-800 via-navy-900 to-navy-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
            <circle cx="80" cy="80" r="60" stroke="white" strokeWidth="1" />
            <circle cx="320" cy="120" r="80" stroke="white" strokeWidth="1" />
            <circle cx="200" cy="300" r="100" stroke="white" strokeWidth="1" />
            <line x1="0" y1="200" x2="400" y2="200" stroke="white" strokeWidth="0.5" />
            <line x1="200" y1="0" x2="200" y2="400" stroke="white" strokeWidth="0.5" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Logo size={40} light />
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Reset Your<br />Password
            </h1>
            <p className="text-navy-200 text-lg max-w-md">
              Enter your account email and choose a new password to regain
              access to your HR analytics dashboard.
            </p>
          </div>
          <p className="text-navy-400 text-xs">
            Academic Data Mining Project — Predictions are estimates, not guarantees.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size={36} />
          </div>

          <div className="card p-8">
            {step === 'done' ? (
              <div className="text-center py-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-green-50 text-green-600 mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="text-2xl font-bold text-navy-900">Password Reset</h2>
                <p className="text-sm text-slate-500 mt-2">
                  Your password has been updated successfully. You can now sign in
                  with your new password.
                </p>
                <Button
                  onClick={() => navigate('/login')}
                  size="lg"
                  className="w-full mt-6"
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-700 transition-colors mb-4"
                >
                  <ArrowLeft size={16} />
                  Back to sign in
                </Link>

                <h2 className="text-2xl font-bold text-navy-900">
                  {step === 'email' ? 'Forgot Password' : 'Set New Password'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {step === 'email'
                    ? 'Enter your account email to reset your password.'
                    : `Choose a new password for ${email}.`}
                </p>

                {error && (
                  <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                    <AlertCircle size={18} className="flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {step === 'email' ? (
                  <form onSubmit={handleEmailSubmit} className="mt-6 space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-navy-700">Email</label>
                      <div className="relative">
                        <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="admin@hrdataminer.com"
                          className="input-base pl-10"
                          autoComplete="email"
                          autoFocus
                        />
                      </div>
                    </div>
                    <Button type="submit" loading={loading} size="lg" className="w-full">
                      Continue
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleResetSubmit} className="mt-6 space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-navy-700">New Password</label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="input-base pl-10 pr-10"
                          autoComplete="new-password"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-navy-700">Confirm Password</label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          className="input-base pl-10 pr-10"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" loading={loading} size="lg" className="w-full">
                      Reset Password
                    </Button>
                  </form>
                )}
              </>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
