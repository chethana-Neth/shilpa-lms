import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8081/api/admin/pending-educators', {
          headers: { 'x-access-token': token }
        });
        setPendingCount(res.data.data?.length || 0);
      } catch (err) {
        console.error('Failed to fetch pending educators', err);
      }
    };
    fetchPendingCount();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-md p-6 border-l-8 border-yellow-500">
          <h3 className="text-gray-500 text-sm">Pending Educators</h3>
          <p className="text-4xl font-bold text-gray-800">{pendingCount}</p>
          <p className="text-xs text-gray-400 mt-2">Awaiting approval</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;