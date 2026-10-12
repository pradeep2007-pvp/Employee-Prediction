import { useState } from 'react';
import { User, Bell, Palette, LogOut, Mail, Shield } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export function Settings() {
  const { user, signOut } = useAuth();
  const displayName = user?.email?.split('@')[0]?.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'User';
  const initials = displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    predictionReminders: false,
    weeklyReports: true,
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const handleSave = () => {
    toast.success('Settings saved successfully.');
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Profile */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-navy-50 text-navy-700">
                <User size={22} />
              </div>
              <h2 className="text-base font-semibold text-navy-900">Profile</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name" defaultValue={displayName} />
              <Input label="Email" defaultValue={user?.email || ''} disabled />
              <Input label="Role" defaultValue="HR Analyst" disabled />
              <Input label="Organization" defaultValue="HR DataMiner" />
            </div>
          </div>

          {/* Account */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-brand-50 text-brand-600">
                <Shield size={22} />
              </div>
              <h2 className="text-base font-semibold text-navy-900">Account</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-navy-800">Email Address</p>
                    <p className="text-xs text-slate-400">{user?.email}</p>
                  </div>
                </div>
                <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-lg">Verified</span>
              </div>
              <Button variant="outline" size="sm">Change Password</Button>
            </div>
          </div>

          {/* Notifications */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-amber-50 text-amber-600">
                <Bell size={22} />
              </div>
              <h2 className="text-base font-semibold text-navy-900">Notification Preferences</h2>
            </div>
            <div className="space-y-4">
              {[
                { key: 'emailAlerts' as const, label: 'Email alerts for high-risk attrition', desc: 'Get notified when an employee is flagged as high risk' },
                { key: 'predictionReminders' as const, label: 'Prediction reminders', desc: 'Remind to run predictions for new employees' },
                { key: 'weeklyReports' as const, label: 'Weekly analytics reports', desc: 'Receive a summary of workforce analytics' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div className="pr-4">
                    <p className="text-sm font-medium text-navy-700">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                  <Toggle
                    checked={notifications[item.key]}
                    onChange={(v) => setNotifications((prev) => ({ ...prev, [item.key]: v }))}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-purple-50 text-purple-600">
                <Palette size={22} />
              </div>
              <h2 className="text-base font-semibold text-navy-900">Theme Preference</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(['light', 'dark'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    theme === t ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`h-12 rounded-lg mb-2 ${t === 'light' ? 'bg-gradient-to-br from-white to-slate-100' : 'bg-gradient-to-br from-navy-800 to-navy-950'}`} />
                  <p className="text-sm font-medium text-navy-700 capitalize">{t} Mode</p>
                  <p className="text-xs text-slate-400">{t === 'light' ? 'Default' : 'Coming soon'}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} variant="primary" size="lg">Save Settings</Button>
          </div>
        </div>

        {/* Sidebar — Logout */}
        <div className="space-y-6">
          <div className="card p-6 text-center">
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-navy-800 text-white text-2xl font-bold mx-auto mb-3">
              {initials}
            </div>
            <p className="text-sm font-semibold text-navy-900">{displayName}</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
            <p className="text-xs text-slate-400 mt-1">HR Analyst</p>
          </div>

          <div className="card p-6">
            <Button variant="danger" onClick={handleSignOut} className="w-full" size="lg">
              <LogOut size={18} />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
