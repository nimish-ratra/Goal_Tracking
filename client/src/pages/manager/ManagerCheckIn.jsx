import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, CheckCircle } from 'lucide-react';
import { SkeletonLoader, EmptyState } from '../../components/ui/Shared';
import { motion } from 'framer-motion';

const ManagerCheckIn = () => {
  const { quarterId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [comments, setComments] = useState({});

  const { data: cycleData, isLoading: loadingCycle } = useQuery({
    queryKey: ['activeCycle'],
    queryFn: async () => (await api.get('/cycles/active')).data.data
  });

  const activeQuarterId = quarterId || cycleData?.activeQuarter?.id;

  const { data: teamData, isLoading: loadingTeam } = useQuery({
    queryKey: ['team'],
    queryFn: async () => (await api.get('/users/team')).data.data
  });

  const { data: checkIns, isLoading: loadingCheckins } = useQuery({
    queryKey: ['teamCheckIns', activeQuarterId],
    enabled: !!activeQuarterId,
    queryFn: async () => (await api.get(`/checkins/team/${activeQuarterId}`)).data.data
  });

  const commentMutation = useMutation({
    mutationFn: async ({ qDataId, comment }) => api.post(`/checkins/${qDataId}/manager-comment`, { comment, quarterId: activeQuarterId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['teamCheckIns']);
      toast.success('Comment saved');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save comment')
  });

  if (loadingTeam || loadingCheckins || loadingCycle) return <div className="p-8"><SkeletonLoader /></div>;

  const getEmployeeCheckIns = (empId) => checkIns?.filter(c => c.goal.ownerId === empId) || [];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => navigate('/manager/dashboard')} className="p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-sm">
          <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Quarterly Check-In Review</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1 font-medium">Review your team's progress and provide feedback.</p>
        </div>
      </div>

      {teamData.length === 0 ? (
        <EmptyState title="No direct reports" message="You have no team members to review." />
      ) : (
        <div className="space-y-6">
          {teamData.map(member => {
            const empCheckIns = getEmployeeCheckIns(member.id);
            if (empCheckIns.length === 0) return null;

            return (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={member.id} className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="bg-neutral-50 dark:bg-neutral-800/50 px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{member.name}</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{member.email}</p>
                  </div>
                </div>
                
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {empCheckIns.map((qd, index) => {
                    const isCompleted = !!qd.checkIn?.comment;
                    return (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        transition={{ delay: index * 0.1 }}
                        key={qd.id} 
                        className="p-6 flex flex-col lg:flex-row gap-6 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 transition-colors"
                      >
                        <div className="flex-1 space-y-4">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1 block">{qd.goal.thrustArea}</span>
                            <h4 className="text-sm font-bold text-neutral-900 dark:text-white">{qd.goal.title}</h4>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700">
                              <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Target</p>
                              <p className="font-bold text-neutral-900 dark:text-white">{qd.goal.target} <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">({qd.goal.uom})</span></p>
                            </div>
                            <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700">
                              <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Actual</p>
                              <p className="font-bold text-indigo-600 dark:text-indigo-400">{qd.actual !== null ? qd.actual : (qd.completionDate ? new Date(qd.completionDate).toLocaleDateString() : 'N/A')}</p>
                            </div>
                            <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700">
                              <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Status</p>
                              <p className="font-bold text-neutral-900 dark:text-white">{qd.progressStatus}</p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl border border-green-200 dark:border-green-800/50">
                              <p className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-wider mb-1">Score</p>
                              <p className="font-bold text-green-700 dark:text-green-400 text-lg leading-none">{(qd.score * 100).toFixed(1)}%</p>
                            </div>
                          </div>
                        </div>

                        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-neutral-200 dark:border-neutral-800 pt-6 lg:pt-0 lg:pl-6 flex flex-col">
                           <label className="block text-[12px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Manager Review</label>
                           {isCompleted ? (
                             <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 text-sm text-neutral-700 dark:text-neutral-300 relative shadow-sm">
                               <div className="absolute -top-2 -right-2 bg-green-100 dark:bg-green-900 rounded-full p-1 border border-white dark:border-neutral-900 shadow-sm">
                                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                               </div>
                               <p className="italic">"{qd.checkIn.comment}"</p>
                             </div>
                           ) : (
                             <>
                               <textarea
                                 value={comments[qd.id] || ''}
                                 onChange={(e) => setComments(prev => ({ ...prev, [qd.id]: e.target.value }))}
                                 className="flex-1 w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-3"
                                 placeholder="Add your review feedback..."
                               />
                               <button
                                 onClick={() => commentMutation.mutate({ qDataId: qd.id, comment: comments[qd.id] })}
                                 disabled={!comments[qd.id]?.trim() || commentMutation.isLoading}
                                 className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                               >
                                 <Save className="w-4 h-4" /> Save Review
                               </button>
                             </>
                           )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default ManagerCheckIn;
