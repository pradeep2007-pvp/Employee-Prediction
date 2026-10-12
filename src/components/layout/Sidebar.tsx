import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Brain,
  Users,
  History,
  BarChart3,
  Cpu,
  Info,
  Settings,
  LogOut,
  X,
  Database,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/predict', label: 'Prediction', icon: Brain },
  { to: '/dataset', label: 'Dataset', icon: Database },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/history', label: 'History', icon: History },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/model', label: 'Model Performance', icon: Cpu },
  { to: '/about', label: 'About Project', icon: Info },
  { to: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ collapsed, mobileOpen, onClose }: SidebarProps) {
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const sidebarContent = (
    <>
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'px-4'} h-16 border-b border-navy-800/50`}>
        {collapsed ? <Logo size={32} showText={false} light /> : <Logo size={32} light />}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-navy-200 hover:bg-navy-800 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={20} className="flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <div className="px-2 py-3 border-t border-navy-800/50">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-navy-300 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-navy-200 hover:bg-red-900/40 hover:text-red-300 transition-all w-full"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-navy-900 text-white transition-all duration-300 fixed inset-y-0 left-0 z-30 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm" onClick={onClose} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-navy-900 text-white flex flex-col animate-slide-in">
            <button
              onClick={onClose}
              className="absolute top-4 right-3 text-navy-300 hover:text-white"
            >
              <X size={20} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
