import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Share2, ChevronDown, ChevronUp, CalendarPlus, X } from 'lucide-react';
import { SkeletonLoader } from '../../components/ui/Shared';
import { motion, AnimatePresence } from 'framer-motion';

const CyclesTab = () => {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(null);
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState(null);

  const { data: cycles, isLoading } = useQuery({
    queryKey: ['adminCycles'],
    queryFn: async () => (await api.get('/cycles')).data.data
  });

  const activateMutation = useMutation({
    mutationFn: async (id) => api.post(`/cycles/${id}/activate`),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminCycles']);
      queryClient.invalidateQueries(['activeCycle']);
      toast.success('Cycle activated');
    }
  });

  if (isLoading) return <div className="p-6"><SkeletonLoader /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">Cycle Management</h2>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm">
          <CalendarPlus className="w-4 h-4" /> New Cycle
        </motion.button>
      </div>

      <div className="space-y-4">
        {cycles?.map(cycle => (
          <motion.div layout key={cycle.id} className={`border rounded-2xl bg-white dark:bg-neutral-900 overflow-hidden transition-all ${cycle.isActive ? 'border-indigo-300 dark:border-indigo-800 shadow-md ring-1 ring-indigo-100 dark:ring-indigo-900/50' : 'border-neutral-200 dark:border-neutral-800'}`}>
            <div className={`px-6 py-5 flex justify-between items-center cursor-pointer transition-colors ${cycle.isActive ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}`} onClick={() => setExpanded(expanded === cycle.id ? null : cycle.id)}>
              <div className="flex items-center gap-4">
                <button className="p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                  {expanded === cycle.id ? <ChevronUp className="w-5 h-5 text-neutral-500 dark:text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />}
                </button>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-3">
                    {cycle.label}
                    {cycle.isActive && <span className="px-2.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-[10px] uppercase tracking-wider border border-green-200 dark:border-green-800/50">Active</span>}
                  </h3>
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-1">Goal Setting: {new Date(cycle.settingOpen).toLocaleDateString()} to {new Date(cycle.settingClose).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                {cycle.isActive && (
                  <button 
                    onClick={() => { setSelectedCycleId(cycle.id); setIsPushModalOpen(true); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Push Shared Goal
                  </button>
                )}
                {!cycle.isActive && (
                  <button 
                    onClick={() => activateMutation.mutate(cycle.id)}
                    className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                  >
                    Set Active
                  </button>
                )}
              </div>
            </div>
            
            <AnimatePresence>
              {expanded === cycle.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-6 py-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20">
                  <h4 className="text-[12px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4">Quarterly Check-In Windows</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {cycle.quarters?.map(q => (
                      <div key={q.id} className="bg-white dark:bg-neutral-900 p-4 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm">
                        <p className="font-bold text-neutral-900 dark:text-white mb-2">{q.label}</p>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400"><span className="text-neutral-400 dark:text-neutral-500">Open:</span> {new Date(q.windowOpen).toLocaleDateString()}</p>
                          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400"><span className="text-neutral-400 dark:text-neutral-500">Close:</span> {new Date(q.windowClose).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isPushModalOpen && <PushGoalModal cycleId={selectedCycleId} onClose={() => setIsPushModalOpen(false)} />}
      </AnimatePresence>
    </motion.div>
  );
};

const PushGoalModal = ({ cycleId, onClose }) => {
  return (
    <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-neutral-900 rounded-3xl p-8 w-full max-w-md text-center shadow-2xl border border-neutral-200 dark:border-neutral-800">
        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Share2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Push Shared Goal</h2>
        <p className="text-neutral-500 dark:text-neutral-400 mb-8 font-medium">Select recipients and define the template. (UI simplified for demo purposes)</p>
        <button onClick={onClose} className="px-6 py-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-neutral-700 dark:text-neutral-300 font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors w-full">Close</button>
      </motion.div>
    </div>
  );
};

export default CyclesTab;
