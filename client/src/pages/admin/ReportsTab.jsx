import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { Download } from 'lucide-react';
import { SkeletonLoader } from '../../components/ui/Shared';
import { motion } from 'framer-motion';

const ReportsTab = () => {
  const { data: users, isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => (await api.get('/users')).data.data
  });

  if (isLoading) return <div className="p-6"><SkeletonLoader /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 h-full flex flex-col bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">Achievement Reports</h2>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors shadow-sm">
          <Download className="w-4 h-4" /> Export to Excel
        </motion.button>
      </div>

      <div className="flex gap-4 mb-6">
        <select className="border border-neutral-300 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-sm font-bold bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm">
          <option>FY 2025-26</option>
        </select>
        <select className="border border-neutral-300 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-sm font-bold bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm">
          <option>All Quarters</option>
          <option>Q1</option>
          <option>Q2</option>
        </select>
        <select className="border border-neutral-300 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-sm font-bold bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm">
          <option>All Departments</option>
          <option>Engineering</option>
        </select>
      </div>

      <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 flex-1">
        <div className="overflow-x-auto h-full">
          <table className="w-full text-left text-sm text-neutral-700 dark:text-neutral-300">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Employee</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Goal Title</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Target</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Actual</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Score</th>
                <th className="p-4 font-semibold uppercase tracking-wider text-xs">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              <tr><td colSpan="6" className="p-12 text-center text-neutral-500 dark:text-neutral-400 font-medium">No report data generated yet. Employees need to complete check-ins.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default ReportsTab;
