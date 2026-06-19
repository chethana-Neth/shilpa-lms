// src/pages/admin/PendingEducators.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PendingEducators = () => {
  const [educators, setEducators] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingEducators();
  }, []);

  const fetchPendingEducators = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8081/api/admin/pending-educators', {
        headers: { 'x-access-token': token }
      });
      if (res.data.Status === "Success") {
        setEducators(res.data.data);
      } else {
        alert('Failed to load pending educators');
      }
    } catch (err) {
      console.error(err);
      alert('Error: ' + (err.response?.data?.message || 'Server error'));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8081/api/admin/approve-educator/${id}`, {}, {
        headers: { 'x-access-token': token }
      });
      alert('Educator approved successfully');
      fetchPendingEducators(); // refresh list
    } catch (err) {
      alert('Approval failed');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this educator?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8081/api/admin/reject-educator/${id}`, {
        headers: { 'x-access-token': token }
      });
      alert('Educator rejected');
      fetchPendingEducators();
    } catch (err) {
      alert('Rejection failed');
    }
  };

  if (loading) return <div className="text-center p-8">Loading pending educators...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Pending Educator Approvals</h1>
      {educators.length === 0 ? (
        <p className="text-gray-500">No pending educators at this time.</p>
      ) : (
        <div className="space-y-4">
          {educators.map(edu => (
            <div key={edu.id} className="border rounded-lg p-4 flex justify-between items-center shadow-sm bg-white">
              <div>
                <p className="font-semibold text-lg">{edu.username}</p>
                <p className="text-sm text-gray-600">{edu.email}</p>
                <p className="text-xs text-gray-400">
                  Registered: {new Date(edu.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => handleApprove(edu.id)}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(edu.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingEducators;