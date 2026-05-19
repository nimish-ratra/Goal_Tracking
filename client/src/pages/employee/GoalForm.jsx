import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const uomOptions = [
  { value: 'NUMERIC_MIN', label: 'Numeric (Higher is better)' },
  { value: 'NUMERIC_MAX', label: 'Numeric (Lower is better)' },
  { value: 'TIMELINE', label: 'Timeline (Date driven)' },
  { value: 'ZERO', label: 'Zero Tolerance (e.g. 0 bugs)' },
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
  weightage: z.coerce.number().min(10, 'Minimum weightage is 10').max(100, 'Maximum weightage is 100'),
});

const GoalForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: cycleData } = useQuery({
    queryKey: ['activeCycle'],
    queryFn: async () => {
      const res = await api.get('/cycles/active');
      return res.data.data;
    }
  });

  const { data: goalData } = useQuery({
    queryKey: ['goal', id],
    enabled: isEdit,
    queryFn: async () => {
      const res = await api.get(`/goals/${id}`);
      return res.data.data;
    }
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
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

  useEffect(() => {
    if (goalData && isEdit) {
      reset({
        thrustArea: goalData.thrustArea,
        title: goalData.title,
        description: goalData.description || '',
        uom: goalData.uom,
        target: goalData.target,
        weightage: goalData.weightage,
      });
    }
  }, [goalData, isEdit, reset]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) {
        return api.patch(`/goals/${id}`, data);
      } else {
        return api.post('/goals', { ...data, cycleId: cycleData?.cycle?.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myGoals']);
      toast.success(`Goal ${isEdit ? 'updated' : 'created'} successfully`);
      navigate('/employee');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{isEdit ? 'Edit Goal' : 'Create New Goal'}</h1>
        <p className="text-gray-500 mt-1">Define your objective and how it will be measured.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thrust Area</label>
              <select {...register('thrustArea')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="">Select an area...</option>
                {thrustAreas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              {errors.thrustArea && <p className="text-red-500 text-sm mt-1">{errors.thrustArea.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measurement (UoM)</label>
              <select {...register('uom')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                {uomOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {errors.uom && <p className="text-red-500 text-sm mt-1">{errors.uom.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Goal Title</label>
            <input {...register('title')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. Reduce API Latency" />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea {...register('description')} rows={3} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Provide more details about this goal..." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Value</label>
              <input type="number" step="0.01" {...register('target')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              {errors.target && <p className="text-red-500 text-sm mt-1">{errors.target.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weightage (%)</label>
              <input type="number" {...register('weightage')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              {errors.weightage && <p className="text-red-500 text-sm mt-1">{errors.weightage.message}</p>}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button type="button" onClick={() => navigate('/employee')} className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting || mutation.isLoading} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {isSubmitting ? 'Saving...' : 'Save Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalForm;
