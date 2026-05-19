import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { X, Target } from 'lucide-react';
import { motion } from 'framer-motion';

const CheckInModal = ({ goal, quarterId, existingData, onClose }) => {
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      actual: existingData?.actual || '',
      completionDate: existingData?.completionDate ? new Date(existingData.completionDate).toISOString().split('T')[0] : '',
      progressStatus: existingData?.progressStatus || 'NOT_STARTED'
    }
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        goalId: goal.id,
        quarterId,
        progressStatus: data.progressStatus,
      };
      if (goal.uom === 'TIMELINE') {
        payload.completionDate = data.completionDate || null;
      } else {
        payload.actual = data.actual ? parseFloat(data.actual) : null;
      }
      return api.post('/checkins', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myCheckIns']);
      toast.success('Check-in saved successfully');
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save check-in');
    }
  });

  return (
    <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-[560px] overflow-hidden flex flex-col max-h-[90vh] border border-neutral-200 dark:border-neutral-800"
      >
        <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">Update Progress</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100">{goal.title}</p>
            </div>
            <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">Target: {goal.target} ({goal.uom})</p>
          </div>

          <form id="checkin-form" onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-5">
            {goal.uom === 'TIMELINE' ? (
              <div>
                <label className="block text-[12px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Completion Date</label>
                <input type="date" {...register('completionDate')} className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm" />
              </div>
            ) : (
              <div>
                <label className="block text-[12px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Actual Achievement</label>
                <input type="number" step="0.01" {...register('actual')} className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm" placeholder={`Current value against ${goal.target}`} />
              </div>
            )}

            <div>
              <label className="block text-[12px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Status</label>
              <select {...register('progressStatus')} className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm">
                <option value="NOT_STARTED">Not Started</option>
                <option value="ON_TRACK">On Track</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </form>

          {existingData?.checkIn?.comment && (
            <div className="mt-4 p-5 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <p className="text-[12px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Manager's Review</p>
              <p className="text-sm text-neutral-800 dark:text-neutral-200 italic">"{existingData.checkIn.comment}"</p>
            </div>
          )}
        </div>
        
        <div className="px-6 py-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 flex justify-end gap-3 sticky bottom-0">
          <button onClick={onClose} type="button" className="px-5 py-2.5 text-sm font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-colors">Cancel</button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" form="checkin-form" disabled={isSubmitting || mutation.isLoading} className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm">
            {isSubmitting ? 'Saving...' : 'Submit Update'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default CheckInModal;
