import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Check, X, ArrowLeft, AlertTriangle } from 'lucide-react';
import { SkeletonLoader, EmptyState } from '../../components/ui/Shared';
import { motion, AnimatePresence } from 'framer-motion';

const ApproveGoals = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [returnComment, setReturnComment] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [editedGoals, setEditedGoals] = useState({});

  const { data: cycleData } = useQuery({
    queryKey: ['activeCycle'],
    queryFn: async () => (await api.get('/cycles/active')).data.data
  });

  const { data: allGoalsResponse, isLoading } = useQuery({
    queryKey: ['teamGoals', cycleData?.cycle?.id],
    enabled: !!cycleData?.cycle?.id,
    queryFn: async () => (await api.get(`/goals?cycleId=${cycleData.cycle.id}`)).data.data
  });

  const employeeGoals = allGoalsResponse?.filter(g => g.ownerId === employeeId) || [];
  const employeeName = employeeGoals.length > 0 ? employeeGoals[0].owner.name : 'Employee';
  const submittedGoals = employeeGoals.filter(g => g.status === 'SUBMITTED');
  
  useEffect(() => {
    if (submittedGoals.length > 0 && Object.keys(editedGoals).length === 0) {
      const initial = {};
      submittedGoals.forEach(g => {
        initial[g.id] = { target: g.target, weightage: g.weightage };
      });
      setEditedGoals(initial);
    }
  }, [submittedGoals, editedGoals]);

  const approveMutation = useMutation({
    mutationFn: async () => {
      for (const goal of submittedGoals) {
        const edit = editedGoals[goal.id];
        if (edit && (edit.target !== goal.target || edit.weightage !== goal.weightage)) {
          await api.patch(`/goals/${goal.id}`, { target: parseFloat(edit.target), weightage: parseInt(edit.weightage, 10) });
        }
      }
      return api.post(`/goals/${employeeId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['teamGoals']);
      toast.success('All goals approved');
      navigate('/manager/dashboard');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to approve')
  });

  const returnMutation = useMutation({
    mutationFn: async () => api.post(`/goals/${employeeId}/return`, { comment: returnComment }),
    onSuccess: () => {
      queryClient.invalidateQueries(['teamGoals']);
      toast.success('Goals returned for rework');
      setShowReturnModal(false);
      navigate('/manager/dashboard');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to return')
  });

  if (isLoading) return <div className="p-8"><SkeletonLoader /></div>;

  const handleEditChange = (id, field, value) => {
    setEditedGoals(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const currentTotalWeightage = Object.values(editedGoals).reduce((sum, g) => sum + (parseInt(g.weightage, 10) || 0), 0);
  const isValidWeightage = currentTotalWeightage === 100;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => navigate('/manager/dashboard')} className="p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-sm">
          <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Review Goals: {employeeName}</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1 font-medium">Review, adjust targets if needed, and approve the goal sheet.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900">
          <h3 className="text-lg font-bold text-neutral-800 dark:text-white">Submitted Goal Sheet</h3>
          <div className={`px-4 py-2 rounded-xl border text-sm font-bold flex items-center gap-2 ${isValidWeightage ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50'}`}>
            {!isValidWeightage && <AlertTriangle className="w-4 h-4" />}
            Total Weightage: {currentTotalWeightage}% / 100%
          </div>
        </div>

        {submittedGoals.length === 0 ? (
          <EmptyState title="No submitted goals" message="This employee has no goals pending approval." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-700 dark:text-neutral-300">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="p-4 font-semibold uppercase tracking-wider text-xs">Thrust Area</th>
                  <th className="p-4 font-semibold uppercase tracking-wider text-xs">Title & Description</th>
                  <th className="p-4 font-semibold uppercase tracking-wider text-xs">UoM</th>
                  <th className="p-4 font-semibold uppercase tracking-wider text-xs w-32">Target</th>
                  <th className="p-4 font-semibold uppercase tracking-wider text-xs w-32">Weightage (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {submittedGoals.map((goal) => (
                  <tr key={goal.id} className="hover:bg-indigo-50/30 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="p-4 font-bold text-neutral-900 dark:text-white">{goal.thrustArea}</td>
                    <td className="p-4">
                      <p className="font-bold text-neutral-900 dark:text-white">{goal.title}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 max-w-sm mt-1">{goal.description}</p>
                    </td>
                    <td className="p-4 font-medium">{goal.uom}</td>
                    <td className="p-4">
                      <input 
                        type="number" 
                        step="0.01"
                        value={editedGoals[goal.id]?.target ?? goal.target} 
                        onChange={(e) => handleEditChange(goal.id, 'target', e.target.value)}
                        className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </td>
                    <td className="p-4">
                      <input 
                        type="number" 
                        value={editedGoals[goal.id]?.weightage ?? goal.weightage} 
                        onChange={(e) => handleEditChange(goal.id, 'weightage', e.target.value)}
                        className={`w-full border rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 ${editedGoals[goal.id]?.weightage < 10 ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-400' : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white'}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {submittedGoals.length > 0 && (
          <div className="p-6 bg-neutral-50 dark:bg-neutral-800/30 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-4">
            <button
              onClick={() => setShowReturnModal(true)}
              className="bg-white dark:bg-neutral-900 text-amber-600 dark:text-amber-500 border border-amber-200 dark:border-amber-800/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl px-6 py-2.5 font-bold transition-colors shadow-sm"
            >
              Return for Rework
            </button>
            <button
              onClick={() => approveMutation.mutate()}
              disabled={!isValidWeightage || approveMutation.isLoading}
              className="bg-green-600 text-white hover:bg-green-700 rounded-xl px-6 py-2.5 font-bold disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Check className="w-5 h-5" />
              {approveMutation.isLoading ? 'Approving...' : 'Approve All Goals'}
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showReturnModal && (
          <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-[480px] overflow-hidden border border-neutral-200 dark:border-neutral-800"
            >
              <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Return for Rework</h2>
                <button onClick={() => setShowReturnModal(false)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors rounded-full p-1"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6">
                <label className="block text-[12px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Manager Comment (Required)</label>
                <textarea
                  value={returnComment}
                  onChange={(e) => setReturnComment(e.target.value)}
                  rows={4}
                  placeholder="Explain what needs to be changed..."
                  className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                />
              </div>
              <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 flex justify-end gap-3">
                <button onClick={() => setShowReturnModal(false)} className="px-5 py-2.5 text-sm font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-colors">Cancel</button>
                <button
                  onClick={() => returnMutation.mutate()}
                  disabled={!returnComment.trim() || returnMutation.isLoading}
                  className="px-6 py-2.5 bg-amber-600 text-white text-sm font-bold rounded-xl hover:bg-amber-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  Submit Return
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ApproveGoals;
