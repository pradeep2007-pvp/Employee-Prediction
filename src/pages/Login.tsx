import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Brain, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/Logo';
import toast from 'react-hot-toast';

export function Login() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const fn = mode === 'login' ? signIn : signUp;
    const { error } = await fn(email, password);
    setLoading(false);

    if (error) {
      setError(error);
      toast.error(error);
    } else {
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created successfully!');
      navigate('/dashboard');
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
              Workforce Intelligence<br />& Prediction
            </h1>
            <p className="text-navy-200 text-lg max-w-md">
              Analyze employee data, predict attrition risk, and estimate salary using
              machine learning — all from one professional HR analytics platform.
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <Brain className="text-brand-300 mb-2" size={24} />
                <p className="text-white text-sm font-medium">Attrition Prediction</p>
                <p className="text-navy-300 text-xs mt-1">Logistic Regression model</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <svg className="text-brand-300 mb-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <p className="text-white text-sm font-medium">Salary Estimation</p>
                <p className="text-navy-300 text-xs mt-1">Linear Regression model</p>
              </div>
            </div>
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
            <h2 className="text-2xl font-bold text-navy-900">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {mode === 'login'
                ? 'Sign in to access your HR analytics dashboard.'
                : 'Create an account to start analyzing workforce data.'}
            </p>

            {error && (
              <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                <AlertCircle size={18} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                  />
                </div>
              </div>

              <Input
                label="Password"
                isPassword
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />

              {mode === 'login' && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-navy-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    Remember me
                  </label>
                  <button type="button" onClick={() => navigate('/forgot-password')} className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                    Forgot password?
                  </button>
                </div>
              )}

              <Button type="submit" loading={loading} size="lg" className="w-full">
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setError('');
                }}
                className="text-brand-600 hover:text-brand-700 font-medium"
              >
                {mode === 'login' ? 'Create one' : 'Sign in'}
              </button>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
