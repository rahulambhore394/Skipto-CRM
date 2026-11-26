import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, Target, Briefcase, TrendingUp,
  Activity, CheckSquare, BarChart2, Settings, LogOut, ChevronLeft, ChevronRight, Menu, X, Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { canAccessPath } from '../../utils/rbac';
import { clsx } from 'clsx';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/contacts', icon: Users, label: 'Contacts' },
  { to: '/companies', icon: Building2, label: 'Companies' },
  { to: '/leads', icon: Target, label: 'Leads' },
  { to: '/deals', icon: Briefcase, label: 'Deals' },
  { to: '/pipeline', icon: TrendingUp, label: 'Sales Pipeline' },
  { to: '/activities', icon: Activity, label: 'Activities' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/reports', icon: BarChart2, label: 'Reports' },
  { to: '/users', icon: Shield, label: 'Users' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className={clsx('flex flex-col h-full bg-gray-900', collapsed ? 'w-16' : 'w-64')}>
      {/* Logo */}
      <div className={clsx('flex items-center px-4 h-16 border-b border-gray-700/50 shrink-0', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
          <TrendingUp size={18} className="text-white" />
        </div>
        {!collapsed && <span className="text-white font-bold text-lg tracking-tight">SkiptoCRM</span>}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 overflow-y-auto px-2">
        {navItems.filter(({ to }) => canAccessPath(user?.role, to)).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onMobileClose}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all duration-150 text-sm font-medium group',
              isActive
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white',
              collapsed && 'justify-center'
            )}
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + collapse */}
      <div className="border-t border-gray-700/50 p-3 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-gray-400 text-xs truncate capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={clsx('flex items-center gap-2 w-full px-3 py-2 text-gray-400 hover:bg-gray-800 hover:text-red-400 rounded-lg text-sm transition-colors mb-1', collapsed && 'justify-center')}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={16} />
          {!collapsed && 'Logout'}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={clsx('hidden lg:flex items-center gap-2 w-full px-3 py-2 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg text-sm transition-colors', collapsed && 'justify-center')}
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={onMobileClose} />
          <aside className="relative flex shrink-0">
            <SidebarContent />
            <button
              onClick={onMobileClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </aside>
        </div>
      )}
    </>
  );
}

