import { Menu, PanelLeftClose, PanelLeft, Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface NavbarProps {
  onMobileMenuToggle: () => void;
  onToggleCollapse: () => void;
  collapsed: boolean;
}

export function Navbar({ onMobileMenuToggle, onToggleCollapse, collapsed }: NavbarProps) {
  const { user } = useAuth();
  const displayName = user?.email?.split('@')[0]?.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'User';
  const initials = displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden text-navy-600 hover:bg-slate-100 p-2 rounded-lg"
        >
          <Menu size={22} />
        </button>
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex text-navy-600 hover:bg-slate-100 p-2 rounded-lg transition-colors"
        >
          {collapsed ? <PanelLeft size={22} /> : <PanelLeftClose size={22} />}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative text-slate-400 hover:text-navy-600 p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full"></span>
        </button>
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-navy-800 text-white text-sm font-semibold">
            {initials}
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-medium text-navy-800">{displayName}</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
