import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { PlusCircle, Target, CheckCircle, Clock, Trash2, Edit2, Info, ArrowRight, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { SkeletonLoader, EmptyState } from '../../components/ui/Shared';
import GoalFormModal from './GoalFormModal';
import CheckInModal from './CheckInModal';
import { motion, AnimatePresence } from 'framer-motion';

const EmployeeDashboard = () => {
  const queryClient = useQueryClient();
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [checkInGoal, setCheckInGoal] = useState(null);
  const [localWeightages, setLocalWeightages] = useState({});

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: async () => (await api.get('/auth/me')).data.user });

  const { data: cycleData, isLoading: loadingCycle } = useQuery({
    queryKey: ['activeCycle'],
    queryFn: async () => (await api.get('/cycles/active')).data.data
  });

  const { data: goalsResponse, isLoading: loadingGoals } = useQuery({
    queryKey: ['myGoals', cycleData?.cycle?.id],
    enabled: !!cycleData?.cycle?.id,
    queryFn: async () => (await api.get(`/goals?cycleId=${cycleData.cycle.id}`)).data
  });

  const { data: myCheckIns } = useQuery({
    queryKey: ['myCheckIns', cycleData?.activeQuarter?.id],
    enabled: !!cycleData?.activeQuarter?.id,
    queryFn: async () => (await api.get(`/checkins/my/${cycleData.activeQuarter.id}`)).data.data
  });

  const goals = goalsResponse?.data || [];

  useEffect(() => {
    if (goals.length > 0) {
      const w = {};
      goals.forEach(g => w[g.id] = g.weightage);
      setLocalWeightages(w);
    } else {
      setLocalWeightages({});
    }
  }, [goals]);

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/goals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['myGoals']);
      toast.success('Goal deleted');
    }
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      // Patch all modified weightages first
      for (const goal of goals) {
        const localW = parseFloat(localWeightages[goal.id]);
        if (localW !== goal.weightage) {
          await api.patch(`/goals/${goal.id}`, { weightage: localW });
        }
      }
      return api.post(`/goals/1/submit`, { cycleId: cycleData.cycle.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myGoals']);
      toast.success('Goal sheet submitted! Your manager will review it shortly.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Submit failed')
  });

  const handleWeightageChange = (id, value) => {
    setLocalWeightages(prev => ({ ...prev, [id]: value }));
  };

  if (loadingCycle || loadingGoals || !me) {
    return <div className="p-8"><SkeletonLoader /></div>;
  }

  const cycle = cycleData?.cycle;
  const activeQuarter = cycleData?.activeQuarter;
  const phase = cycleData?.phase;

  const totalWeightage = Object.values(localWeightages).reduce((sum, w) => sum + (parseFloat(w) || 0), 0);
  const isWeightageValid = totalWeightage === 100;
  const allStatus = goals.length > 0 ? goals[0].status : 'N/A';
  
  const isEditable = allStatus === 'DRAFT' || allStatus === 'RETURNED' || goals.length === 0;
  const isApproved = allStatus === 'APPROVED' || allStatus === 'LOCKED';
  const isSubmitted = allStatus === 'SUBMITTED';

  const returnComment = goals.find(g => g.returnComment)?.returnComment;

  const getStatusBadge = (status) => {
    const map = {
      'DRAFT': 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
      'SUBMITTED': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'APPROVED': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'RETURNED': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      'LOCKED': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    };
    return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${map[status] || map.DRAFT}`}>{status}</span>;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl p-6 flex justify-between items-center shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 tracking-tight">Welcome, {me.name}</h2>
          <p className="text-indigo-700 dark:text-indigo-300 mt-1 font-medium">{me.department} • Goal Cycle: {cycle?.label || 'None Active'}</p>
        </div>
      </div>

      {/* Return Comment Banner */}
      <AnimatePresence>
        {allStatus === 'RETURNED' && returnComment && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-5 flex gap-3 shadow-sm">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-100">Goals Returned for Rework</h4>
              <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">Manager's feedback: {returnComment}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Approved Banner */}
      {isApproved && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-2xl p-5 flex gap-3 shadow-sm">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-green-900 dark:text-green-100">Goals Approved & Locked</h4>
            <p className="text-sm text-green-800 dark:text-green-300 mt-1">Your goals for this cycle are officially set. Good luck!</p>
          </div>
        </motion.div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: Target, title: 'My Goals', value: `${goals.length} / 8`, color: 'indigo' },
          { icon: BarChartIcon, title: 'Weightage', value: `${totalWeightage}%`, color: isWeightageValid ? 'green' : 'amber' },
          { icon: CheckCircle, title: 'Submitted', value: isSubmitted || isApproved ? 'Yes' : 'No', color: 'blue' },
          { icon: ShieldIcon, title: 'Status', value: allStatus, color: 'purple' },
        ].map((stat, i) => (
          <motion.div key={i} whileHover={{ y: -2 }} className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4 transition-all">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-${stat.color}-50 dark:bg-${stat.color}-900/20 text-${stat.color}-600 dark:text-${stat.color}-400`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-0.5">{stat.title}</p>
              <p className={`text-xl font-extrabold ${stat.color === 'amber' ? 'text-amber-600 dark:text-amber-500' : stat.color === 'green' ? 'text-green-600 dark:text-green-500' : 'text-neutral-900 dark:text-white'}`}>{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Goal Sheet */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h3 className="text-lg font-bold text-neutral-800 dark:text-white">My Goal Sheet</h3>
          <div className="flex items-center">
            {totalWeightage !== 100 ? (
              <div className="px-4 py-2 rounded-xl border bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50 flex items-center gap-2 font-medium text-sm">
                <AlertTriangle className="w-4 h-4" />
                Total weightage is {totalWeightage}%. Please adjust your goals so the total equals exactly 100%. ({totalWeightage > 100 ? `Over by ${totalWeightage - 100}%` : `Short by ${100 - totalWeightage}%`})
              </div>
            ) : (
              <div className="px-4 py-2 rounded-xl border bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50 flex items-center gap-2 font-medium text-sm">
                <CheckCircle className="w-4 h-4" /> Total Weightage: 100%
              </div>
            )}
          </div>
        </div>

        {goals.length === 0 ? (
          <EmptyState 
            title="No goals yet" 
            message={`Click 'Add Goal' to start building your goal sheet for ${cycle?.label}.`}
            icon={Target}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-700 dark:text-neutral-300">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="p-4 font-semibold uppercase tracking-wider text-xs">Thrust Area</th>
                  <th className="p-4 font-semibold uppercase tracking-wider text-xs">Goal Title</th>
                  <th className="p-4 font-semibold uppercase tracking-wider text-xs">UoM</th>
                  <th className="p-4 font-semibold uppercase tracking-wider text-xs">Target</th>
                  <th className="p-4 font-semibold uppercase tracking-wider text-xs w-32">Weightage</th>
                  <th className="p-4 font-semibold uppercase tracking-wider text-xs">Status</th>
                  {isEditable && <th className="p-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {goals.map((g) => (
                  <tr key={g.id} className="hover:bg-indigo-50/30 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 font-medium">{g.thrustArea}</td>
                    <td className="p-4">
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">{g.title}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">{g.description}</p>
                    </td>
                    <td className="p-4">{g.uom}</td>
                    <td className="p-4 font-bold text-neutral-900 dark:text-neutral-100">{g.target}</td>
                    <td className="p-4">
                      {isEditable ? (
                        <div className="relative">
                          <input 
                            type="number" 
                            value={localWeightages[g.id] ?? g.weightage}
                            onChange={(e) => handleWeightageChange(g.id, e.target.value)}
                            className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg px-2 py-1.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 focus:ring-2 focus:ring-indigo-500 outline-none pr-6"
                          />
                          <span className="absolute right-2 top-1.5 text-neutral-400 text-sm">%</span>
                        </div>
                      ) : (
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{g.weightage}%</span>
                      )}
                    </td>
                    <td className="p-4">{getStatusBadge(g.status)}</td>
                    {isEditable && (
                      <td className="p-4 text-right space-x-2 whitespace-nowrap">
                        <button onClick={() => { setEditingGoal(g); setIsGoalModalOpen(true); }} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => deleteMutation.mutate(g.id)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1.5 bg-red-50 dark:bg-red-900/30 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Action Bar */}
        {isEditable && (
          <div className="p-5 bg-neutral-50 dark:bg-neutral-800/30 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
             <button
               onClick={() => { setEditingGoal(null); setIsGoalModalOpen(true); }}
               disabled={goals.length >= 8 || phase !== 'GOAL_SETTING'}
               className="bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-neutral-800 rounded-xl px-5 py-2.5 font-semibold text-sm disabled:opacity-50 transition-colors shadow-sm"
             >
               + Add Goal
             </button>
             <button
               onClick={() => submitMutation.mutate()}
               disabled={!isWeightageValid || goals.length === 0 || submitMutation.isLoading}
               className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl px-6 py-2.5 font-semibold text-sm disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
             >
               {submitMutation.isLoading ? 'Submitting...' : 'Submit for Approval'} <ArrowRight className="w-4 h-4" />
             </button>
          </div>
        )}
      </div>

      {/* Check-In Section */}
      {isApproved && activeQuarter && phase === 'CHECKIN' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden mt-8">
           <div className="bg-indigo-50 dark:bg-indigo-900/20 px-6 py-5 border-b border-indigo-100 dark:border-indigo-800/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100">{activeQuarter.label} Check-in Due</h3>
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-800/50 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold uppercase tracking-wider">Due {new Date(activeQuarter.windowClose).toLocaleDateString()}</span>
           </div>
           <div className="p-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {goals.map(g => {
                 const checkIn = myCheckIns?.find(c => c.goalId === g.id);
                 return (
                   <motion.div whileHover={{ y: -2 }} key={g.id} className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 flex flex-col justify-between items-start gap-4 transition-all">
                     <div className="w-full">
                       <p className="text-sm font-bold text-neutral-900 dark:text-white mb-1">{g.title}</p>
                       <p className="text-xs text-neutral-500 dark:text-neutral-400">Target: {g.target} ({g.uom})</p>
                       {checkIn?.score !== undefined && checkIn?.score !== null && (
                         <div className="mt-3 inline-block px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-xs font-bold border border-green-200 dark:border-green-800/50">
                           Score: {(checkIn.score * 100).toFixed(1)}%
                         </div>
                       )}
                     </div>
                     <button
                       onClick={() => setCheckInGoal(g)}
                       className="w-full bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl px-4 py-2 font-semibold text-sm transition-colors shadow-sm"
                     >
                       Update Progress
                     </button>
                   </motion.div>
                 );
               })}
             </div>
           </div>
        </motion.div>
      )}

      {isGoalModalOpen && <GoalFormModal cycleId={cycle.id} existingGoal={editingGoal} onClose={() => setIsGoalModalOpen(false)} />}
      {checkInGoal && <CheckInModal goal={checkInGoal} quarterId={activeQuarter.id} existingData={myCheckIns?.find(c => c.goalId === checkInGoal.id)} onClose={() => setCheckInGoal(null)} />}
    </motion.div>
  );
};

const BarChartIcon = (props) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const ShieldIcon = (props) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;

export default EmployeeDashboard;
