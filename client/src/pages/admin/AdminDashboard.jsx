import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';

const AdminDashboard = () => {
  const { backendUrl } = useContext(AppContext);
  const [pendingCount, setPendingCount] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalEducators, setTotalEducators] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'x-access-token': token };

        const [pendingRes, usersRes] = await Promise.all([
          axios.get(`${backendUrl}/api/admin/pending-educators`, { headers }),
          axios.get(`${backendUrl}/api/admin/users`, { headers })
        ]);

        if (pendingRes.data.Status === 'Success') {
          setPendingCount(pendingRes.data.data?.length || 0);
        }

        if (usersRes.data.Status === 'Success') {
          const users = usersRes.data.data || [];
          setTotalUsers(users.length);
          setTotalStudents(users.filter(u => u.role?.toLowerCase() === 'student').length);
          setTotalEducators(users.filter(u => u.role?.toLowerCase() === 'educator').length);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      }
    };
    fetchDashboardData();
  }, []);

  const cards = [
    { label: 'Pending Educators', value: pendingCount,     sub: 'Awaiting approval',    border: 'border-yellow-500', text: 'text-yellow-600' },
    { label: 'Total Users',       value: totalUsers,       sub: 'Students + Educators', border: 'border-indigo-500', text: 'text-indigo-600' },
    { label: 'Total Students',    value: totalStudents,    sub: 'Registered students',  border: 'border-blue-500',   text: 'text-blue-600'   },
    { label: 'Total Educators',   value: totalEducators,   sub: 'Approved educators',   border: 'border-purple-500', text: 'text-purple-600' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className={`bg-white rounded-2xl shadow-md p-6 border-l-8 ${card.border}`}>
            <h3 className="text-gray-500 text-sm">{card.label}</h3>
            <p className={`text-4xl font-bold mt-1 ${card.text}`}>{card.value}</p>
            <p className="text-xs text-gray-400 mt-2">{card.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
