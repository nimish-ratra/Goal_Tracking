import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

const uomOptions = [
  { value: 'NUMERIC_MIN', label: 'Numeric Min - Higher is Better' },
  { value: 'NUMERIC_MAX', label: 'Numeric Max - Lower is Better' },
  { value: 'TIMELINE', label: 'Timeline - Date Based' },
  { value: 'ZERO', label: 'Zero - Zero = Success' },
];

const thrustAreas = [
  'Revenue Growth', 'Customer Experience', 'Operational Excellence',
  'People & Culture', 'Innovation', 'Safety & Compliance',
  'Cost Optimization', 'Quality'
];

const schema = z.object({
  thrustArea: z.string().min(1, 'Thrust Area is required'),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().optional(),
  uom: z.enum(['NUMERIC_MIN', 'NUMERIC_MAX', 'TIMELINE', 'ZERO']),
  target: z.coerce.number().min(0, 'Target cannot be negative'),
  weightage: z.coerce.number().min(10, 'Minimum 10%').max(90, 'Maximum 90%'),
});

const GoalFormModal = ({ cycleId, existingGoal, onClose }) => {
  const queryClient = useQueryClient();
  const isEdit = !!existingGoal;

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      thrustArea: '',
      title: '',
      description: '',
      uom: 'NUMERIC_MIN',
      target: 0,
      weightage: 10,
    }
  });

  const selectedUoM = watch('uom');

  useEffect(() => {
    if (existingGoal) {
      reset({
        thrustArea: existingGoal.thrustArea,
        title: existingGoal.title,
        description: existingGoal.description || '',
        uom: existingGoal.uom,
        target: existingGoal.target,
        weightage: existingGoal.weightage,
      });
    }
  }, [existingGoal, reset]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) return api.patch(`/goals/${existingGoal.id}`, data);
      return api.post('/goals', { ...data, cycleId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myGoals']);
      toast.success(`Goal ${isEdit ? 'updated' : 'added'} successfully`);
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Something went wrong');
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
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">{isEdit ? 'Edit Goal' : 'Add New Goal'}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <form id="goal-form" onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-5">
            <div>
              <label className="block text-[12px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Thrust Area</label>
              <select {...register('thrustArea')} className="w-full border border-neutral-300 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm">
                <option value="">Select Thrust Area</option>
                {thrustAreas.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.thrustArea && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 font-medium">{errors.thrustArea.message}</p>}
            </div>

            <div>
              <label className="block text-[12px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Goal Title</label>
              <input {...register('title')} className="w-full border border-neutral-300 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm" placeholder="e.g. Launch new mobile app" />
              {errors.title && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 font-medium">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-[12px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Description (Optional)</label>
              <textarea {...register('description')} rows={3} className="w-full border border-neutral-300 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm" placeholder="Provide more details..." />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Unit of Measurement (UoM)</label>
              <select {...register('uom')} className="w-full border border-neutral-300 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm">
                {uomOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {errors.uom && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 font-medium">{errors.uom.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Target</label>
                <input type="number" step="0.01" {...register('target')} className="w-full border border-neutral-300 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm" placeholder="Target value" />
                {errors.target && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 font-medium">{errors.target.message}</p>}
              </div>
              <div>
                <label className="block text-[12px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Weightage %</label>
                <div className="relative">
                  <input type="number" {...register('weightage')} className="w-full border border-neutral-300 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none pr-8 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm" placeholder="10-90" />
                  <span className="absolute right-4 top-3 text-neutral-400 dark:text-neutral-500 text-sm font-bold">%</span>
                </div>
                {errors.weightage && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 font-medium">{errors.weightage.message}</p>}
              </div>
            </div>
          </form>
        </div>
        
        <div className="px-6 py-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 flex justify-end gap-3 sticky bottom-0">
          <button onClick={onClose} type="button" className="px-5 py-2.5 text-sm font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-colors">Cancel</button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" form="goal-form" disabled={isSubmitting || mutation.isLoading} className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm">
            {isSubmitting ? 'Saving...' : 'Save Goal'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default GoalFormModal;
