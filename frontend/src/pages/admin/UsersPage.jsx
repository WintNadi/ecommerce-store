import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Users, 
  Search, 
  X, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  User,
  Store,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';
import { getAllUsers, updateUserRole, deleteUser, clearUserError } from '../../store/slices/adminSlice';

const UsersPage = () => {
  const dispatch = useDispatch();
  const { users, isLoading, error, pagination } = useSelector((state) => state.admin);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    dispatch(getAllUsers({ page: currentPage, search: searchTerm }));
  }, [dispatch, currentPage, searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleRoleUpdate = async () => {
    if (selectedUser && newRole) {
      await dispatch(updateUserRole({ userId: selectedUser._id, role: newRole })).unwrap();
      setShowRoleModal(false);
      setSelectedUser(null);
      setNewRole('');
    }
  };

  const handleDeleteUser = async () => {
    if (selectedUser) {
      await dispatch(deleteUser(selectedUser._id)).unwrap();
      setShowDeleteModal(false);
      setSelectedUser(null);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-indigo-500" />;
      case 'seller':
        return <Store className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
      case 'seller':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusColor = (isVerified) => {
    return isVerified
      ? 'text-green-500 bg-green-100 dark:bg-green-900/30'
      : 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30';
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="h-6 w-6" />
              User Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage your users and their roles
            </p>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Total: {pagination?.total || 0} users
          </span>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search users by name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </form>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300">
            {error}
            <button
              onClick={() => dispatch(clearUserError())}
              className="ml-2 text-sm font-medium hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">User</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Role</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Joined</th>
                  <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user._id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            {user.profileImage ? (
                              <img
                                src={user.profileImage}
                                alt={user.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {user.phone || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-300">{user.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)} flex items-center gap-1 w-fit`}>
                          {getRoleIcon(user.role)}
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusColor(user.isVerified)}`}>
                            {user.isVerified ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {user.isVerified ? 'Verified' : 'Pending'}
                          </span>
                          {!user.isActive && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                              Inactive
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <Calendar className="h-3 w-3" />
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setNewRole(user.role);
                              setShowRoleModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="Change Role"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-500 dark:text-gray-400">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Change Role Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Change User Role
              </h3>
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Change role for <span className="font-medium text-gray-900 dark:text-white">
                {selectedUser.name}
              </span>
            </p>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white mb-4"
            >
              <option value="user">User</option>
              <option value="seller">Seller</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleUpdate}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete User
              </h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete <span className="font-medium text-gray-900 dark:text-white">
                {selectedUser.name}
              </span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;