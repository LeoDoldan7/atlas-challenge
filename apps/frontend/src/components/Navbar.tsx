import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, FileText, Plus } from 'lucide-react';

const Navbar: React.FC = () => {
  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: BarChart3,
    },
    {
      to: '/subscriptions',
      label: 'Subscriptions',
      icon: FileText,
    },
    {
      to: '/subscriptions/new',
      label: 'New Subscription',
      icon: Plus,
    },
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-50 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-slate-900">Atlas Healthcare</h1>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-100 text-blue-700 shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Mobile menu */}
          <div className="md:hidden">
            <div className="flex items-center space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;