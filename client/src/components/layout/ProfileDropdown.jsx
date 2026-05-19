import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Shield, Moon, Sun, Monitor, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProfileDropdown = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    window.location.href = '/login';
  };

  const roleColors = {
    'EMPLOYEE': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'MANAGER': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'ADMIN': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 focus:outline-none"
      >
        <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors">
          {user?.name?.charAt(0)}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
              <p className="font-bold text-neutral-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5 mb-2">{user?.email}</p>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${roleColors[user?.role]}`}>
                {user?.role}
              </span>
            </div>
            
            <div className="p-2">
              <button 
                onClick={() => { setIsOpen(false); setShowProfileModal(true); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <User className="w-4 h-4" /> My Profile
              </button>
              
              {import.meta.env.DEV && (
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                  <Shield className="w-4 h-4" /> Switch Role View
                </button>
              )}
            </div>

            <div className="p-2 border-t border-neutral-100 dark:border-neutral-800">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-neutral-200 dark:border-neutral-800"
            >
              <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">My Profile</h2>
                <button onClick={() => setShowProfileModal(false)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 p-1 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[12px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Name</label>
                  <p className="font-medium text-neutral-900 dark:text-white">{user?.name}</p>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Email</label>
                  <p className="font-medium text-neutral-900 dark:text-white">{user?.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Department</label>
                    <p className="font-medium text-neutral-900 dark:text-white">{user?.department || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Manager</label>
                    <p className="font-medium text-neutral-900 dark:text-white">{user?.manager?.name || 'N/A'}</p>
                  </div>
                </div>

                <hr className="border-neutral-200 dark:border-neutral-800 my-4" />
                <h3 className="font-bold text-neutral-900 dark:text-white mb-3">Update Password</h3>
                <div className="space-y-3">
                  <input type="password" placeholder="Current Password" className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-neutral-900 dark:text-white" />
                  <input type="password" placeholder="New Password" className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-neutral-900 dark:text-white" />
                  <input type="password" placeholder="Confirm Password" className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-neutral-900 dark:text-white" />
                  <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-colors">Update Password</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileDropdown;
