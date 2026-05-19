import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert } from 'lucide-react';
import { SkeletonLoader } from '../../components/ui/Shared';
import { motion } from 'framer-motion';

const AuditLogTab = () => {
  const { isLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: async () => []
  });

  if (isLoading) return <div className="p-6"><SkeletonLoader /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800">
      <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900 rounded-t-2xl">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">System Audit Log</h2>
        <div className="flex gap-2">
           <input type="date" className="border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" />
        </div>
      </div>

      <div className="overflow-x-auto p-0 m-0 flex-1">
        <table className="w-full text-left text-sm text-neutral-700 dark:text-neutral-300">
          <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">
            <tr>
              <th className="p-4 font-semibold uppercase tracking-wider text-xs">Timestamp</th>
              <th className="p-4 font-semibold uppercase tracking-wider text-xs">User</th>
              <th className="p-4 font-semibold uppercase tracking-wider text-xs">Action</th>
              <th className="p-4 font-semibold uppercase tracking-wider text-xs">Details</th>
              <th className="p-4 font-semibold uppercase tracking-wider text-xs text-right">Admin Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
             <tr>
               <td colSpan="5" className="p-12 text-center">
                 <ShieldAlert className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                 <p className="text-neutral-500 dark:text-neutral-400 font-medium">No recent audit events.</p>
               </td>
             </tr>
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default AuditLogTab;
