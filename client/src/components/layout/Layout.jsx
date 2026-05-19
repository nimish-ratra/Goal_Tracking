import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, Target, Calendar, Bell, Users, Clipboard, BarChart, Shield, LogOut } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import ProfileDropdown from './ProfileDropdown';
import ThemeToggle from './ThemeToggle';
import { motion } from 'framer-motion';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: cycleData } = useQuery({
    queryKey: ['activeCycle'],
    queryFn: async () => {
      const res = await api.get('/cycles/active');
      return res.data.data;
    }
  });

  const getNavItems = () => {
    const baseNav = [];

    if (user?.role === 'EMPLOYEE') {
      baseNav.push({ name: 'Dashboard', path: '/employee/dashboard', icon: Home });
      baseNav.push({ name: 'My Goals', path: '/employee/goals', icon: Target });
      if (cycleData?.phase === 'CHECKIN' && cycleData?.activeQuarter) {
        baseNav.push({ name: `${cycleData.activeQuarter.label} Check-in`, path: '/employee/checkins', icon: Calendar });
      }
    } else if (user?.role === 'MANAGER') {
      baseNav.push({ name: 'Dashboard', path: '/manager/dashboard', icon: Home });
      baseNav.push({ name: 'Pending Approvals', path: '/manager/approvals', icon: Bell });
      baseNav.push({ name: 'My Team', path: '/manager/team', icon: Users });
      if (cycleData?.phase === 'CHECKIN') {
        baseNav.push({ name: 'Check-ins', path: '/manager/checkins', icon: Clipboard });
      }
    } else if (user?.role === 'ADMIN') {
      baseNav.push({ name: 'Dashboard', path: '/admin/dashboard', icon: Home });
      baseNav.push({ name: 'Users', path: '/admin/users', icon: Users });
      baseNav.push({ name: 'Cycles', path: '/admin/cycles', icon: Calendar });
      baseNav.push({ name: 'Reports', path: '/admin/reports', icon: BarChart });
      baseNav.push({ name: 'Audit Log', path: '/admin/audit', icon: Shield });
    }

    return baseNav;
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-gray-950 flex font-sans transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-[240px] bg-white dark:bg-gray-900 border-r border-neutral-200 dark:border-gray-800 flex flex-col fixed inset-y-0 z-20 transition-colors duration-300 shadow-sm">
        <div className="h-16 flex items-center px-6 border-b border-neutral-200 dark:border-gray-800">
          <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">AtomQuest</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
             <NavLink
               key={item.path}
               to={item.path}
               className={({ isActive }) =>
                 `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                   isActive || (location.pathname === `/${user?.role.toLowerCase()}` && item.name === 'Dashboard')
                     ? 'bg-indigo-600 text-white shadow-sm'
                     : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-gray-800 hover:text-neutral-900 dark:hover:text-white'
                 }`
               }
             >
               {({ isActive }) => (
                 <>
                   <item.icon className="w-5 h-5 shrink-0" />
                   <span className="z-10">{item.name}</span>
                 </>
               )}
             </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-200 dark:border-gray-800">
          <div className="px-3 py-2">
            <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">{user?.role}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-[240px] flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-neutral-200 dark:border-gray-800 flex items-center justify-between px-8 sticky top-0 z-10 transition-colors duration-300 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
          <h1 className="text-lg font-bold text-neutral-800 dark:text-white">
            {cycleData?.cycle?.label || 'Goal Tracking Portal'}
          </h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="h-6 w-px bg-neutral-200 dark:bg-gray-700"></div>
            <ProfileDropdown />
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          <div className="max-w-[1200px] mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
