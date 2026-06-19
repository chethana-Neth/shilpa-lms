import React, { useContext } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { HomeIcon, UserGroupIcon, AcademicCapIcon, ArrowRightStartOnRectangleIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const AdminLayout = () => {
  const { logout, userData } = useContext(AppContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin/dashboard', name: 'Dashboard', icon: HomeIcon },
    { path: '/admin/pending-educators', name: 'Pending Educators', icon: UserGroupIcon },
    { path: '/admin/analytics', name: 'Analytics', icon: ChartBarIcon },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-indigo-800 text-white flex flex-col shadow-lg">
        <div className="p-5 border-b border-indigo-700">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AcademicCapIcon className="w-7 h-7" />
            Admin Panel
          </h1>
          <p className="text-xs text-indigo-200 mt-1">Welcome, {userData?.username}</p>
        </div>
        <nav className="flex-1 mt-6">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-900 text-white border-l-4 border-white'
                    : 'text-indigo-100 hover:bg-indigo-700'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-indigo-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-sm text-indigo-200 hover:text-white w-full px-3 py-2 rounded-md hover:bg-indigo-700 transition"
          >
            <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;