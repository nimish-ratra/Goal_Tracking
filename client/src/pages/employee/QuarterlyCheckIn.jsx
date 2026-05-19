import React from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Target, Calendar, CheckCircle } from 'lucide-react';

const QuarterlyCheckIn = () => {
  const { id, quarterId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: goalData, isLoading: loadingGoal } = useQuery({
    queryKey: ['goal', id],
    queryFn: async () => {
      const res = await api.get(`/goals/${id}`);
      return res.data.data;
    }
  });

  const { data: qDataResponse, isLoading: loadingQData } = useQuery({
    queryKey: ['myCheckIn', quarterId],
    queryFn: async () => {
      const res = await api.get(`/checkins/my/${quarterId}`);
      return res.data.data;
    }
  });

  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  const mutation = useMutation({
    mutationFn: async (data) => {
      return api.post('/checkins', { ...data, goalId: id, quarterId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myCheckIn', quarterId]);
      toast.success('Check-in saved successfully');
      navigate('/employee');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save check-in');
    }
  });

  const onSubmit = (data) => {
    mutation.mutate({
      actual: data.actual ? parseFloat(data.actual) : null,
      completionDate: data.completionDate || null,
      progressStatus: data.progressStatus
    });
  };

  if (loadingGoal || loadingQData) return <div className="p-8">Loading...</div>;

  const goal = goalData;
  const existingData = qDataResponse?.find(q => q.goalId === id);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Quarterly Check-In</h1>
        <p className="text-gray-500 mt-1">Log your actual achievement against the locked target.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
            <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" /> Goal Details
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-indigo-400 font-medium text-xs uppercase tracking-wider mb-1">Title</p>
                <p className="text-indigo-900 font-medium">{goal.title}</p>
              </div>
              <div>
                <p className="text-indigo-400 font-medium text-xs uppercase tracking-wider mb-1">Target</p>
                <p className="text-indigo-900 font-bold text-lg">{goal.target} <span className="text-sm font-normal text-indigo-600">({goal.uom})</span></p>
              </div>
              <div>
                <p className="text-indigo-400 font-medium text-xs uppercase tracking-wider mb-1">Weightage</p>
                <p className="text-indigo-900 font-medium">{goal.weightage}%</p>
              </div>
            </div>
          </div>
          
          {existingData?.score !== undefined && existingData.score !== null && (
            <div className="bg-green-50 rounded-xl p-6 border border-green-100">
              <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" /> Current Score
              </h3>
              <p className="text-3xl font-bold text-green-700">{(existingData.score * 100).toFixed(2)}%</p>
              <p className="text-xs text-green-600 mt-1">Computed by system</p>
            </div>
          )}
        </div>

        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {goal.uom !== 'TIMELINE' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actual Achievement</label>
                <input 
                  type="number" 
                  step="0.01" 
                  defaultValue={existingData?.actual}
                  {...register('actual')} 
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                />
              </div>
            )}

            {goal.uom === 'TIMELINE' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" /> Completion Date
                </label>
                <input 
                  type="date" 
                  defaultValue={existingData?.completionDate ? new Date(existingData.completionDate).toISOString().split('T')[0] : ''}
                  {...register('completionDate')} 
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Progress Status</label>
              <select 
                defaultValue={existingData?.progressStatus || 'NOT_STARTED'}
                {...register('progressStatus')} 
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="NOT_STARTED">Not Started</option>
                <option value="ON_TRACK">On Track</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end gap-3">
              <button type="button" onClick={() => navigate('/employee')} className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="submit" disabled={isSubmitting || mutation.isLoading} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {isSubmitting ? 'Saving...' : 'Save Check-in'}
              </button>
            </div>
          </form>

          {existingData?.checkIn?.comment && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Manager's Comment</p>
              <p className="text-gray-800 text-sm">{existingData.checkIn.comment}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuarterlyCheckIn;
