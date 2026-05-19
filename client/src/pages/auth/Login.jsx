import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { Target, Lock, Mail, Eye, EyeOff, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../../config/msalConfig';

const schema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

const Login = () => {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  if (loading) return null;

  if (user) {
    const roleRoutes = { 'EMPLOYEE': '/employee/dashboard', 'MANAGER': '/manager/dashboard', 'ADMIN': '/admin/dashboard' };
    return <Navigate to={roleRoutes[user.role]} replace />;
  }

  const onSubmit = async (data) => {
    try {
      const loggedUser = await login(data.email, data.password);
      if (loggedUser.role === 'EMPLOYEE') navigate('/employee/dashboard');
      else if (loggedUser.role === 'MANAGER') navigate('/manager/dashboard');
      else navigate('/admin/dashboard');
    } catch (err) {
      toast.error('Login failed. Please check your credentials.');
    }
  };

  const autoFill = (email, pass) => {
    setValue('email', email);
    setValue('password', pass);
  };

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] dark:bg-gray-950 font-sans transition-colors duration-300">
      {/* Left Half - Branding */}
      <div className="hidden lg:flex flex-col justify-center w-1/2 bg-gradient-to-br from-indigo-600 to-indigo-900 p-12 text-white relative overflow-hidden">
        {/* Abstract shapes for premium feel */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-white opacity-5 blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-400 opacity-10 blur-3xl"></div>
        
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="max-w-md mx-auto z-10 relative">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-12 h-12 text-indigo-200" />
            <h1 className="text-5xl font-extrabold tracking-tight">AtomQuest</h1>
          </div>
          <p className="text-3xl font-light text-indigo-100 mb-8 leading-relaxed">
            Goal Setting & Tracking Portal
          </p>
          <div className="border-l-4 border-indigo-400 pl-5 py-2">
            <p className="text-xl text-indigo-100 opacity-90 font-medium italic">
              Align. Track. Achieve.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right Half - Login Form */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 p-8 lg:p-24 bg-[#F9FAFB] dark:bg-gray-950 transition-colors duration-300">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="max-w-md w-full mx-auto">
          <div className="bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-xl shadow-indigo-100/20 dark:shadow-none border border-neutral-200 dark:border-gray-800 transition-colors duration-300">
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2 text-center tracking-tight">Welcome Back</h2>
            <p className="text-sm text-neutral-500 dark:text-gray-400 text-center mb-8">Sign in to manage your performance goals.</p>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-[12px] font-bold text-neutral-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-neutral-400 dark:text-gray-500" />
                  </div>
                  <input
                    {...register('email')}
                    className="pl-11 w-full rounded-xl border border-neutral-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-neutral-900 dark:text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-shadow shadow-sm"
                    placeholder="name@company.com"
                  />
                </div>
                {errors.email && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 font-medium">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-[12px] font-bold text-neutral-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-neutral-400 dark:text-gray-500" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register('password')}
                    className="pl-11 pr-11 w-full rounded-xl border border-neutral-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-neutral-900 dark:text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-shadow shadow-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5 font-medium">{errors.password.message}</p>}
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md shadow-indigo-600/20 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 mt-4"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </motion.button>
            </form>

            <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-gray-800">
              <p className="text-xs font-bold text-neutral-500 dark:text-gray-400 uppercase tracking-wider text-center mb-4">Demo Accounts</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button type="button" onClick={() => autoFill('employee@company.com', 'Employee@123')} className="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-full text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">Employee</button>
                <button type="button" onClick={() => autoFill('manager@company.com', 'Manager@123')} className="px-4 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-full text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">Manager</button>
                <button type="button" onClick={() => autoFill('admin@company.com', 'Admin@123')} className="px-4 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-full text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">Admin</button>
              </div>
            </div>

            {import.meta.env.VITE_AZURE_SSO_ENABLED === 'true' && (
              <div className="mt-6">
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-200 dark:border-gray-800"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-900 text-neutral-500 dark:text-gray-400">Or continue with</span>
                  </div>
                </div>
                
                <SSOButton />
              </div>
            )}
          </div>
          
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-neutral-500 dark:text-gray-400">
            <Info className="w-4 h-4" />
            <p>Need an account? Contact your HR Admin to get access.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const SSOButton = () => {
  const { instance } = useMsal();
  const { azureLogin } = useAuth();
  const navigate = useNavigate();

  const handleMicrosoftLogin = async () => {
    try {
      const result = await instance.loginPopup(loginRequest);
      const loggedUser = await azureLogin(result.accessToken, result.account);
      if (loggedUser.role === 'EMPLOYEE') navigate('/employee/dashboard');
      else if (loggedUser.role === 'MANAGER') navigate('/manager/dashboard');
      else navigate('/admin/dashboard');
    } catch (error) {
      toast.error('Microsoft sign-in failed. Try again.');
      console.error(error);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.01, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
      whileTap={{ scale: 0.99 }}
      onClick={handleMicrosoftLogin}
      className="w-full flex justify-center items-center gap-3 py-2.5 px-4 bg-white border border-[#E0E0E0] rounded-xl text-sm font-medium text-[#3C3C3C] hover:bg-neutral-50 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 h-[44px]"
    >
      <svg viewBox="0 0 23 23" width="20" height="20">
        <path fill="#f35325" d="M1 1h10v10H1z" />
        <path fill="#81bc06" d="M12 1h10v10H12z" />
        <path fill="#05a6f0" d="M1 12h10v10H1z" />
        <path fill="#ffba08" d="M12 12h10v10H12z" />
      </svg>
      Sign in with Microsoft
    </motion.button>
  );
};

export default Login;
