import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { Users, Calendar, Target, Clock } from 'lucide-react';
import { SkeletonLoader } from '../../components/ui/Shared';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const OverviewTab = () => {
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => (await api.get('/users')).data.data
  });

  const { data: cycleData, isLoading: loadingCycle } = useQuery({
    queryKey: ['activeCycle'],
    queryFn: async () => (await api.get('/cycles/active')).data.data
  });

  const activeCycleId = cycleData?.cycle?.id;

  const { data: dashboardData, isLoading: loadingDashboard } = useQuery({
    queryKey: ['adminDashboard', activeCycleId],
    queryFn: async () => (await api.get(`/reports/dashboard${activeCycleId ? `?cycleId=${activeCycleId}` : ''}`)).data.data,
    enabled: !!activeCycleId
  });

  if (loadingUsers || loadingCycle || (activeCycleId && loadingDashboard)) return <div className="p-6"><SkeletonLoader /></div>;

  const users = usersData || [];
  const statusDist = dashboardData?.statusDistribution || [];
  const deptDist = dashboardData?.departmentDistribution || [];
  const thrustDist = dashboardData?.thrustAreaDistribution || [];

  const submittedPercentage = statusDist.length > 0 
    ? Math.round((statusDist.filter(s => s.name !== 'DRAFT').reduce((acc, curr) => acc + curr.value, 0) / statusDist.reduce((acc, curr) => acc + curr.value, 0)) * 100)
    : 0; 
    
  const pendingApprovals = statusDist.find(s => s.name === 'SUBMITTED')?.value || 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800">
      <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6 tracking-tight">System Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div whileHover={{ y: -2 }} className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col gap-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Total Users</p>
            <p className="text-3xl font-extrabold text-neutral-900 dark:text-white mt-1">{users.length}</p>
          </div>
        </motion.div>
        
        <motion.div whileHover={{ y: -2 }} className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col gap-4">
          <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Active Cycle</p>
            <p className="text-xl font-extrabold text-neutral-900 dark:text-white mt-1 line-clamp-1">{cycleData?.cycle?.label || 'None'}</p>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col gap-4">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Goals Submitted</p>
            <p className="text-3xl font-extrabold text-neutral-900 dark:text-white mt-1">{submittedPercentage}%</p>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -2 }} className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col gap-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Pending Approvals</p>
            <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-500 mt-1">{pendingApprovals}</p>
          </div>
        </motion.div>
      </div>

      {activeCycleId && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-6">Goals by Status</h3>
            <div className="h-80 w-full">
              {statusDist.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusDist} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                      {statusDist.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-neutral-500">No data available</div>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-6">Goals by Department</h3>
            <div className="h-80 w-full">
              {deptDist.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptDist} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <Tooltip cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {deptDist.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-neutral-500">No data available</div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default OverviewTab;
