import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { Link } from 'react-router-dom';
import { Users, Bell, ClipboardList, CheckCircle, ChevronRight } from 'lucide-react';
import { SkeletonLoader, EmptyState } from '../../components/ui/Shared';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: teamData, isLoading: loadingTeam } = useQuery({
    queryKey: ['team'],
    queryFn: async () => (await api.get('/users/team')).data.data
  });

  const { data: cycleData } = useQuery({
    queryKey: ['activeCycle'],
    queryFn: async () => (await api.get('/cycles/active')).data.data
  });

  const { data: teamGoals, isLoading: loadingGoals } = useQuery({
    queryKey: ['teamGoals', cycleData?.cycle?.id],
    enabled: !!cycleData?.cycle?.id,
    queryFn: async () => (await api.get(`/goals?cycleId=${cycleData.cycle.id}`)).data.data
  });

  if (loadingTeam || loadingGoals) return <div className="p-8"><SkeletonLoader /></div>;

  const team = teamData || [];
  const goals = teamGoals || [];

  const getEmployeeStats = (employeeId) => {
    const empGoals = goals.filter(g => g.ownerId === employeeId);
    const weightage = empGoals.reduce((sum, g) => sum + g.weightage, 0);
    const status = empGoals.length > 0 ? empGoals[0].status : 'NOT_SUBMITTED';
    return { weightage, status, goalCount: empGoals.length };
  };

  const pendingApprovalsCount = team.filter(t => getEmployeeStats(t.id).status === 'SUBMITTED').length;
  const approvedCount = team.filter(t => ['APPROVED', 'LOCKED'].includes(getEmployeeStats(t.id).status)).length;
  const pendingCheckinsCount = 0; // Simplified for this view

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Team Overview</h2>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">{user?.department} Department</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div whileHover={{ y: -2 }} className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Direct Reports</p>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">{team.length}</p>
          </div>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Pending Approvals</p>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-500">{pendingApprovalsCount}</p>
          </div>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Check-ins Pending</p>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">{pendingCheckinsCount}</p>
          </div>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Goals Approved</p>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">{approvedCount}</p>
          </div>
        </motion.div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="flex border-b border-neutral-200 dark:border-neutral-800">
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10' : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'}`}
          >
            All Team Members
          </button>
          <button 
            onClick={() => setActiveTab('pending')} 
            className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'pending' ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10' : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'}`}
          >
            Pending Approvals ({pendingApprovalsCount})
          </button>
        </div>

        <div className="p-6">
          {team.length === 0 ? (
            <EmptyState 
              title="No direct reports" 
              message="Your team hasn't submitted any goals yet." 
              icon={Users} 
            />
          ) : (
            <motion.div layout className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AnimatePresence>
                {team
                  .filter(t => activeTab === 'overview' || getEmployeeStats(t.id).status === 'SUBMITTED')
                  .map(member => {
                    const stats = getEmployeeStats(member.id);
                    const isPending = stats.status === 'SUBMITTED';
                    
                    return (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={member.id} 
                        className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 hover:shadow-md transition-shadow bg-white dark:bg-neutral-900 flex flex-col justify-between"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800/50">
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">{member.name}</h3>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">{member.email}</p>
                            </div>
                          </div>
                          <StatusBadge status={stats.status} />
                        </div>

                        <div className="mb-4">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Goal Weightage</span>
                            <span className="font-bold text-neutral-900 dark:text-white">{stats.weightage}% / 100%</span>
                          </div>
                          <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(stats.weightage, 100)}%` }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                              className={`h-full ${stats.weightage === 100 ? 'bg-green-500' : stats.weightage > 100 ? 'bg-red-500' : 'bg-indigo-500'}`} 
                            />
                          </div>
                        </div>

                        <Link
                          to={`/manager/approve/${member.id}`}
                          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
                            isPending 
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                              : 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-neutral-800'
                          }`}
                        >
                          {isPending ? 'Review Goals' : 'View Goals'} <ChevronRight className="w-4 h-4" />
                        </Link>
                      </motion.div>
                    );
                  })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    'NOT_SUBMITTED': 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
    'DRAFT': 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
    'SUBMITTED': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'APPROVED': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'RETURNED': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'LOCKED': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };
  return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${map[status] || map.DRAFT}`}>{status === 'DRAFT' ? 'NOT SUBMITTED' : status}</span>;
};

export default ManagerDashboard;
