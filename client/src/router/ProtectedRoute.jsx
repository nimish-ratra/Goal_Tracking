import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-8 flex justify-center items-center h-screen"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their respective dashboard
    const roleRoutes = {
      'EMPLOYEE': '/employee',
      'MANAGER': '/manager',
      'ADMIN': '/admin'
    };
    return <Navigate to={roleRoutes[user.role]} replace />;
  }

  return <Outlet />;
};
