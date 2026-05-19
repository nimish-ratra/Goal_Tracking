import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Edit2, Trash2, UserPlus, X } from 'lucide-react';
import { SkeletonLoader, EmptyState } from '../../components/ui/Shared';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';

const UsersTab = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => (await api.get('/users')).data.data
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminUsers']);
      toast.success('User removed');
    }
  });

  const syncMutation = useMutation({
    mutationFn: async () => api.post('/admin/sync-azure-org'),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['adminUsers']);
      toast.success(`Synced ${res.data.synced} users. Created ${res.data.created}, Updated ${res.data.updated}`);
    },
    onError: () => toast.error('Azure sync failed')
  });

  if (isLoading) return <div className="p-6"><SkeletonLoader /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800">
      <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900 rounded-t-2xl">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">User Management</h2>
        <div className="flex gap-3">
          {import.meta.env.VITE_AZURE_SSO_ENABLED === 'true' && (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isLoading}
              className="flex items-center gap-2 bg-white text-indigo-600 border border-indigo-200 dark:bg-neutral-900 dark:border-indigo-800 dark:text-indigo-400 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-50 dark:hover:bg-neutral-800 transition-colors shadow-sm disabled:opacity-50"
            >
              {syncMutation.isLoading ? 'Syncing...' : 'Sync from Azure AD'}
            </motion.button>
          )}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" /> Add User
          </motion.button>
        </div>
      </div>

      <div className="overflow-x-auto p-0 m-0">
        <table className="w-full text-left text-sm text-neutral-700 dark:text-neutral-300">
          <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">
            <tr>
              <th className="p-4 font-semibold uppercase tracking-wider text-xs">Name</th>
              <th className="p-4 font-semibold uppercase tracking-wider text-xs">Email</th>
              <th className="p-4 font-semibold uppercase tracking-wider text-xs">Role</th>
              <th className="p-4 font-semibold uppercase tracking-wider text-xs">Department</th>
              <th className="p-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {users?.map(u => (
              <tr key={u.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                <td className="p-4 font-bold text-neutral-900 dark:text-white">{u.name}</td>
                <td className="p-4">{u.email}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${
                    u.role === 'ADMIN' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                    u.role === 'MANAGER' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-4 font-medium">{u.department || '-'}</td>
                <td className="p-4 text-right">
                  <button onClick={() => deleteMutation.mutate(u.id)} className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isModalOpen && <UserModal onClose={() => setIsModalOpen(false)} managers={users?.filter(u => u.role === 'MANAGER')} />}
      </AnimatePresence>
    </motion.div>
  );
};

const UserModal = ({ onClose, managers }) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { role: 'EMPLOYEE' }
  });
  
  const role = watch('role');

  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = { ...data };
      if (payload.role !== 'EMPLOYEE' || !payload.managerId) {
        payload.managerId = null;
      }
      return api.post('/users', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminUsers']);
      toast.success('User created successfully');
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Error creating user')
  });

  return (
    <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-[480px] overflow-hidden border border-neutral-200 dark:border-neutral-800"
      >
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Add New User</h2>
          <button onClick={onClose} className="text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full p-1 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="p-6 space-y-4">
          <div>
            <label className="block text-[12px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Full Name</label>
            <input {...register('name', { required: true })} className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Email</label>
            <input type="email" {...register('email', { required: true })} className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="john@company.com" />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Password</label>
            <input type="password" {...register('password', { required: true })} className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Leave blank to use Password@123" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Role</label>
              <select {...register('role')} className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Department</label>
              <input {...register('department')} className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Engineering" />
            </div>
          </div>
          {role === 'EMPLOYEE' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <label className="block text-[12px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Manager</label>
              <select {...register('managerId')} className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">Select Manager...</option>
                {managers?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </motion.div>
          )}
          <div className="pt-6 flex justify-end gap-3 border-t border-neutral-200 dark:border-neutral-800 mt-6">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm">
              {isSubmitting ? 'Saving...' : 'Save User'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default UsersTab;
