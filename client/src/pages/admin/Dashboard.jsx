import React, { useState } from 'react';
import { Users, Calendar, BarChart, Shield, Home } from 'lucide-react';
import UsersTab from './UsersTab';
import CyclesTab from './CyclesTab';
import ReportsTab from './ReportsTab';
import AuditLogTab from './AuditLogTab';
import OverviewTab from './OverviewTab';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home, component: OverviewTab },
    { id: 'users', label: 'Users', icon: Users, component: UsersTab },
    { id: 'cycles', label: 'Cycles', icon: Calendar, component: CyclesTab },
    { id: 'reports', label: 'Reports', icon: BarChart, component: ReportsTab },
    { id: 'audit', label: 'Audit Log', icon: Shield, component: AuditLogTab },
  ];

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || OverviewTab;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm flex overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden min-h-[500px]">
        <ActiveComponent />
      </div>
    </div>
  );
};

export default AdminDashboard;
