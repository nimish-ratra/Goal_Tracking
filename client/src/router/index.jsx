import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import Layout from '../components/layout/Layout';

import Login from '../pages/auth/Login';

// Employee
import EmployeeDashboard from '../pages/employee/Dashboard';

// Manager
import ManagerDashboard from '../pages/manager/Dashboard';
import ApproveGoals from '../pages/manager/ApproveGoals';
import ManagerCheckIn from '../pages/manager/ManagerCheckIn';

// Admin
import OverviewTab from '../pages/admin/OverviewTab';
import UsersTab from '../pages/admin/UsersTab';
import CyclesTab from '../pages/admin/CyclesTab';
import ReportsTab from '../pages/admin/ReportsTab';
import AuditLogTab from '../pages/admin/AuditLogTab';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    element: <Layout />,
    children: [
      {
        element: <ProtectedRoute allowedRoles={['EMPLOYEE']} />,
        children: [
          { path: '/employee', element: <Navigate to="/employee/dashboard" replace /> },
          { path: '/employee/dashboard', element: <EmployeeDashboard /> },
          { path: '/employee/goals', element: <EmployeeDashboard /> }, // Handled on same page
          { path: '/employee/checkins', element: <EmployeeDashboard /> }, // Handled on same page
        ]
      },
      {
        element: <ProtectedRoute allowedRoles={['MANAGER']} />,
        children: [
          { path: '/manager', element: <Navigate to="/manager/dashboard" replace /> },
          { path: '/manager/dashboard', element: <ManagerDashboard /> },
          { path: '/manager/approvals', element: <ManagerDashboard /> }, // Reuses dashboard which has tabs
          { path: '/manager/team', element: <ManagerDashboard /> }, // Reuses dashboard
          { path: '/manager/approve/:employeeId', element: <ApproveGoals /> },
          { path: '/manager/checkins', element: <ManagerCheckIn /> }, // We need to handle this
          { path: '/manager/checkin/:quarterId', element: <ManagerCheckIn /> }
        ]
      },
      {
        element: <ProtectedRoute allowedRoles={['ADMIN']} />,
        children: [
          { path: '/admin', element: <Navigate to="/admin/dashboard" replace /> },
          { path: '/admin/dashboard', element: <OverviewTab /> },
          { path: '/admin/users', element: <UsersTab /> },
          { path: '/admin/cycles', element: <CyclesTab /> },
          { path: '/admin/reports', element: <ReportsTab /> },
          { path: '/admin/audit', element: <AuditLogTab /> }
        ]
      }
    ]
  }
]);

export default router;
