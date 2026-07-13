import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';

const AdminUsers = () => {
  const { backendUrl } = useContext(AppContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  // Detail panel
  const [selectedUser, setSelectedUser] = useState(null);
  const [payments, setPayments] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [educatorCourses, setEducatorCourses] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState('info');

  // Edit modal
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', email: '' });
  const [editLoading, setEditLoading] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { 'x-access-token': token };

  // ── Fetch all users ──────────────────────────────────────────────
  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/users`, { headers });
      if (data.Status === 'Success') setUsers(data.data);
    } catch (error) {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch detail panel data ──────────────────────────────────────
  const fetchUserDetail = async (user) => {
    setDetailLoading(true);
    setPayments([]);
    setEnrollments([]);
    setEducatorCourses([]);
    setDetailTab('info');

    try {
      if (user.role?.toLowerCase() === 'student') {
        const [paymentsRes, enrollmentsRes] = await Promise.all([
          axios.get(`${backendUrl}/api/enrollments/payment-history/${user.id}`, { headers }),
          axios.get(`${backendUrl}/api/admin/users/${user.id}/enrollments`, { headers })
        ]);
        if (paymentsRes.data.success) setPayments(paymentsRes.data.payments);
        if (enrollmentsRes.data.Status === 'Success') setEnrollments(enrollmentsRes.data.data);
      } else if (user.role?.toLowerCase() === 'educator') {
        const coursesRes = await axios.get(
          `${backendUrl}/api/admin/users/${user.id}/courses`, { headers }
        );
        if (coursesRes.data.Status === 'Success') setEducatorCourses(coursesRes.data.data);
      }
    } catch (error) {
      console.error('Failed to load user detail', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    fetchUserDetail(user);
  };

  // ── Toggle active/inactive ───────────────────────────────────────
  const handleToggleStatus = async (userId, username, currentStatus) => {
    const action = currentStatus === 'inactive' ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${action} ${username}?`)) return;

    setActionLoading(userId + '_status');
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/admin/users/${userId}/toggle-status`, {}, { headers }
      );
      if (data.Status === 'Success') {
        setUsers(prev => prev.map(u =>
          u.id === userId ? { ...u, status: data.newStatus } : u
        ));
        if (selectedUser?.id === userId) {
          setSelectedUser(prev => ({ ...prev, status: data.newStatus }));
        }
        toast.success(`User ${action}d successfully.`);
      }
    } catch (error) {
      toast.error(`Failed to ${action} user.`);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────
  const handleDelete = async (userId, username) => {
    if (!window.confirm(`Permanently delete ${username}? This cannot be undone.`)) return;

    setActionLoading(userId + '_delete');
    try {
      const { data } = await axios.delete(
        `${backendUrl}/api/admin/users/${userId}`, { headers }
      );
      if (data.Status === 'Success') {
        setUsers(prev => prev.filter(u => u.id !== userId));
        if (selectedUser?.id === userId) setSelectedUser(null);
        toast.success('User deleted successfully.');
      }
    } catch (error) {
      toast.error('Failed to delete user.');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Open edit modal ──────────────────────────────────────────────
  const openEdit = (user, e) => {
    e.stopPropagation();
    setEditForm({ username: user.username, email: user.email });
    setEditModal(user);
  };

  // ── Save edit ────────────────────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!editForm.username.trim() || !editForm.email.trim()) {
      return toast.error('Username and email are required.');
    }
    setEditLoading(true);
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/admin/users/${editModal.id}`,
        { username: editForm.username, email: editForm.email },
        { headers }
      );
      if (data.Status === 'Success') {
        setUsers(prev => prev.map(u =>
          u.id === editModal.id
            ? { ...u, username: editForm.username, email: editForm.email }
            : u
        ));
        if (selectedUser?.id === editModal.id) {
          setSelectedUser(prev => ({
            ...prev,
            username: editForm.username,
            email: editForm.email
          }));
        }
        toast.success('User updated successfully.');
        setEditModal(false);
      }
    } catch (error) {
      toast.error('Failed to update user.');
    } finally {
      setEditLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // ── Filter — case-insensitive role comparison ────────────────────
  const filtered = users.filter(u => {
    const matchesSearch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole =
      roleFilter === 'all' || u.role?.toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const statusBadge = (status) => {
    const map = {
      active:   'bg-green-100 text-green-700',
      inactive: 'bg-red-100 text-red-700',
      approved: 'bg-green-100 text-green-700',
      pending:  'bg-yellow-100 text-yellow-700',
      rejected: 'bg-gray-100 text-gray-500',
      expired:  'bg-red-100 text-red-600',
      grace:    'bg-orange-100 text-orange-600',
      never:    'bg-gray-100 text-gray-400',
    };
    return map[status] || 'bg-gray-100 text-gray-500';
  };

  if (loading) return <p className="text-gray-500">Loading users...</p>;

  return (
    <div className="flex gap-6">

      {/* ── Left panel — user list ── */}
      <div className={`${selectedUser ? 'w-1/2' : 'w-full'} transition-all duration-300 min-w-0`}>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">User Management</h1>

        {/* Summary cards — case-insensitive role filter */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Users',  value: users.length,                                                           color: 'border-indigo-500' },
            { label: 'Students',     value: users.filter(u => u.role?.toLowerCase() === 'student').length,          color: 'border-blue-500'   },
            { label: 'Educators',    value: users.filter(u => u.role?.toLowerCase() === 'educator').length,         color: 'border-purple-500' },
            { label: 'Inactive',     value: users.filter(u => u.status === 'inactive').length,                      color: 'border-red-500'    },
          ].map((card, i) => (
            <div key={i} className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${card.color}`}>
              <p className="text-gray-500 text-xs">{card.label}</p>
              <p className="text-3xl font-bold text-gray-800">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="educator">Educators</option>
          </select>
        </div>

        {/* Users table */}
        <div className="bg-white rounded-2xl shadow-md overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-gray-500 font-medium">User</th>
                <th className="px-4 py-3 text-gray-500 font-medium">Role</th>
                <th className="px-4 py-3 text-gray-500 font-medium">Status</th>
                <th className="px-4 py-3 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-400">No users found.</td>
                </tr>
              ) : (
                filtered.map(user => (
                  <tr
                    key={user.id}
                    onClick={() => handleViewUser(user)}
                    className={`border-b border-gray-100 cursor-pointer transition ${
                      selectedUser?.id === user.id ? 'bg-indigo-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {user.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{user.username}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        user.role?.toLowerCase() === 'educator'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={(e) => openEdit(user, e)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id, user.username, user.status)}
                          disabled={actionLoading === user.id + '_status'}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                            user.status === 'inactive'
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          } disabled:opacity-50`}
                        >
                          {actionLoading === user.id + '_status'
                            ? '...'
                            : user.status === 'inactive' ? 'Activate' : 'Deactivate'}
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.username)}
                          disabled={actionLoading === user.id + '_delete'}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-100 text-red-700 hover:bg-red-200 transition disabled:opacity-50"
                        >
                          {actionLoading === user.id + '_delete' ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Right panel — user detail ── */}
      {selectedUser && (
        <div className="w-1/2 bg-white rounded-2xl shadow-md flex flex-col overflow-hidden max-h-screen">

          {/* Header */}
          <div className="flex justify-between items-start p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                {selectedUser.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">{selectedUser.username}</h2>
                <p className="text-xs text-gray-500">{selectedUser.email}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedUser(null)}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none"
            >✕</button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 px-5">
            {['info',
              selectedUser.role?.toLowerCase() === 'student' ? 'enrollments' : 'courses',
              selectedUser.role?.toLowerCase() === 'student' ? 'payments' : null
            ].filter(Boolean).map(tab => (
              <button
                key={tab}
                onClick={() => setDetailTab(tab)}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition capitalize ${
                  detailTab === tab
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'enrollments' ? 'Enrolled Courses'
                  : tab === 'courses' ? 'Their Courses'
                  : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-5">
            {detailLoading ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : (
              <>
                {/* INFO TAB */}
                {detailTab === 'info' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400">Role</p>
                      <p className="font-semibold text-gray-700 capitalize">{selectedUser.role}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400">Account Status</p>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge(selectedUser.status)}`}>
                        {selectedUser.status}
                      </span>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400">Joined</p>
                      <p className="font-semibold text-gray-700">
                        {new Date(selectedUser.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Student-specific info */}
                    {selectedUser.role?.toLowerCase() === 'student' && (
                      <>
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-400">Total Enrollments</p>
                          <p className="font-semibold text-gray-700">{selectedUser.enrollment_count}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-400">Total Paid</p>
                          <p className="font-semibold text-gray-700">
                            LKR {Number(selectedUser.total_paid).toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-400">Enrollment Status</p>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge(selectedUser.enrollment_status)}`}>
                            {selectedUser.enrollment_status}
                          </span>
                        </div>
                        {selectedUser.latest_expiry && (
                          <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                            <p className="text-xs text-gray-400">Latest Enrollment Expires</p>
                            <p className="font-semibold text-gray-700">
                              {new Date(selectedUser.latest_expiry).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Educator-specific info */}
                    {selectedUser.role?.toLowerCase() === 'educator' && (
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-400">Courses Created</p>
                        <p className="font-semibold text-gray-700">{educatorCourses.length}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ENROLLED COURSES TAB (students) */}
                {detailTab === 'enrollments' && (
                  <div>
                    <p className="text-xs text-gray-400 mb-3">
                      {enrollments.length} course{enrollments.length !== 1 ? 's' : ''} enrolled
                    </p>
                    {enrollments.length === 0 ? (
                      <p className="text-sm text-gray-400">No enrollments found.</p>
                    ) : (
                      <div className="space-y-3">
                        {enrollments.map((en, i) => (
                          <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                            <img
                              src={`${backendUrl}/uploads/${en.courseThumbnail}`}
                              alt=""
                              className="w-14 h-10 object-cover rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 text-sm truncate">{en.courseTitle}</p>
                              <p className="text-xs text-gray-400">
                                Enrolled: {new Date(en.enrolled_at).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-400">
                                Expires: {new Date(en.expires_at).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${statusBadge(en.enrollment_status)}`}>
                              {en.enrollment_status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* THEIR COURSES TAB (educators) */}
                {detailTab === 'courses' && (
                  <div>
                    <p className="text-xs text-gray-400 mb-3">
                      {educatorCourses.length} course{educatorCourses.length !== 1 ? 's' : ''} created
                    </p>
                    {educatorCourses.length === 0 ? (
                      <p className="text-sm text-gray-400">No courses created yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {educatorCourses.map((course, i) => (
                          <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                            <img
                              src={`${backendUrl}/uploads/${course.courseThumbnail}`}
                              alt=""
                              className="w-14 h-10 object-cover rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 text-sm truncate">{course.courseTitle}</p>
                              <p className="text-xs text-gray-400">
                                Created: {new Date(course.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs font-semibold text-gray-700">{course.student_count} students</p>
                              <p className="text-xs text-green-700 font-semibold">
                                LKR {Number(course.earnings).toFixed(0)}
                              </p>
                            </div>
                          </div>
                        ))}

                        {/* Educator totals */}
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <div className="bg-indigo-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-400">Total Students</p>
                            <p className="font-bold text-indigo-700 text-lg">
                              {educatorCourses.reduce((s, c) => s + c.student_count, 0)}
                            </p>
                          </div>
                          <div className="bg-green-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-400">Total Earnings</p>
                            <p className="font-bold text-green-700 text-lg">
                              LKR {educatorCourses.reduce((s, c) => s + Number(c.earnings), 0).toFixed(0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PAYMENTS TAB (students) */}
                {detailTab === 'payments' && (
                  <div>
                    <p className="text-xs text-gray-400 mb-3">
                      {payments.length} payment{payments.length !== 1 ? 's' : ''}
                    </p>
                    {payments.length === 0 ? (
                      <p className="text-sm text-gray-400">No payments found.</p>
                    ) : (
                      <div className="space-y-2">
                        {payments.map((p, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-800 text-sm truncate max-w-[180px]">{p.courseTitle}</p>
                              <p className="text-xs text-gray-400">
                                {new Date(p.paid_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-700 text-sm">LKR {Number(p.amount).toFixed(2)}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                p.status === 'success'
                                  ? 'bg-green-100 text-green-700'
                                  : p.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-600'
                              }`}>
                                {p.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm relative">
            <button
              onClick={() => setEditModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
            >✕</button>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Edit User</h3>
            <p className="text-xs text-gray-400 mb-5">Update username or email address</p>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm text-gray-600 font-medium mb-1 block">Username</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={e => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 font-medium mb-1 block">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditModal(false)}
                  className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={editLoading}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
