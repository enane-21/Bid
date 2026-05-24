import { useState, useEffect } from 'react';
import BASE_URL from '../services/baseUrl';
import { toast } from 'react-toastify';
import axios from 'axios';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: '',
        department: '',
        phone: '',
        address: ''
    });

    const roles = [
        { value: 'department_head', label: 'Department Head' },
        { value: 'purchasing_team', label: 'Purchasing Team' },
        { value: 'storekeeper', label: 'Storekeeper' },
        { value: 'finance', label: 'Finance' },
        { value: 'administrator', label: 'Administrator' }
    ];

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(BASE_URL + '/api/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const userData = res.data.users || res.data;
            // Filter out any invalid user objects
            const validUsers = Array.isArray(userData)
                ? userData.filter(u => u && u._id && u.name && u.email && u.role)
                : [];
            setUsers(validUsers);
            setLoading(false);
        } catch (error) {
            console.error('Fetch users error:', error);
            toast.error(error.response?.data?.message || 'Failed to fetch users');
            setUsers([]);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');

            if (editingUser) {
                // Update user
                await axios.put(
                    `BASE_URL + '/api/users/${editingUser._id}`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success('User updated successfully');
            } else {
                // Create user
                await axios.post(
                    BASE_URL + '/api/users/create',
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success('User created successfully');
            }

            setShowModal(false);
            resetForm();
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleApprove = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `BASE_URL + '/api/users/${userId}/approve`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Supplier approved successfully');
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to approve supplier');
        }
    };

    const handleVerify = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `BASE_URL + '/api/users/${userId}/verify`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Supplier email verified successfully');
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to verify supplier');
        }
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        const action = currentStatus ? 'deactivate' : 'activate';
        if (!window.confirm(`Are you sure you want to ${action} this supplier?`)) return;

        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `BASE_URL + '/api/users/${userId}/toggle-status`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Supplier ${action}d successfully`);
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to ${action} supplier`);
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            department: user.department || '',
            phone: user.phone || '',
            address: user.address || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`BASE_URL + '/api/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('User deleted successfully');
            fetchUsers();
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            role: '',
            department: '',
            phone: '',
            address: ''
        });
        setEditingUser(null);
    };

    const getRoleBadgeColor = (role) => {
        const colors = {
            administrator: 'bg-purple-100 text-purple-800',
            dean: 'bg-blue-100 text-blue-800',
            purchasing_team: 'bg-green-100 text-green-800',
            department_head: 'bg-yellow-100 text-yellow-800',
            storekeeper: 'bg-orange-100 text-orange-800',
            finance: 'bg-pink-100 text-pink-800',
            supplier: 'bg-gray-100 text-gray-800'
        };
        return colors[role] || 'bg-gray-100 text-gray-800';
    };

    const formatRole = (role) => {
        return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading users...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">User Management</h1>
                            <p className="text-gray-600">Manage internal staff and supplier accounts</p>
                        </div>
                        <button
                            onClick={() => {
                                resetForm();
                                setShowModal(true);
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Staff Account
                        </button>
                    </div>
                </div>

                {/* Internal Staff Section */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-8 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></div>
                        <h2 className="text-2xl font-bold text-gray-900">Internal Staff</h2>
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                            {users.filter(u => u.role !== 'supplier').length} users
                        </span>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">User</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Department</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Phone</th>
                                        <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {users.filter(u => u.role !== 'supplier' && u.name && u.email).map((user, index) => (
                                        <tr key={user._id} className={`hover:bg-indigo-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                        {user.name?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                    <span className="font-semibold text-gray-900">{user.name || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {user.email || 'No email'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                                                    {formatRole(user.role)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {user.department || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {user.phone || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(user)}
                                                        className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors"
                                                        title="Edit user"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user._id)}
                                                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors"
                                                        title="Delete user"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {users.filter(u => u.role !== 'supplier').length === 0 && (
                            <div className="text-center py-12">
                                <svg className="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <p className="text-gray-500 text-lg">No staff accounts found. Create your first staff account.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Suppliers Section */}
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-8 bg-gradient-to-b from-green-600 to-emerald-600 rounded-full"></div>
                        <h2 className="text-2xl font-bold text-gray-900">Suppliers</h2>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                            {users.filter(u => u.role === 'supplier').length} suppliers
                        </span>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Supplier</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Company</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Phone</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">TIN</th>
                                        <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">Email Status</th>
                                        <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">Approval</th>
                                        <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">Active</th>
                                        <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {users.filter(u => u.role === 'supplier' && u.name && u.email).map((user, index) => (
                                        <tr key={user._id} className={`hover:bg-green-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                        {user.name?.charAt(0).toUpperCase() || 'S'}
                                                    </div>
                                                    <span className="font-semibold text-gray-900">{user.name || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {user.email || 'No email'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {user.companyName || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {user.phone || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {user.tinNumber || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {user.isVerified ? (
                                                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                                        ✓ Verified
                                                    </span>
                                                ) : (
                                                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                                                        ⚠ Not Verified
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {user.isApproved ? (
                                                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                                        ✓ Approved
                                                    </span>
                                                ) : (
                                                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                                        ✗ Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {user.isActive !== false ? (
                                                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                                        ✓ Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                                        ✗ Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex gap-2 justify-center flex-wrap">
                                                    {!user.isVerified && (
                                                        <button
                                                            onClick={() => handleVerify(user._id)}
                                                            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors"
                                                            title="Manually verify email"
                                                        >
                                                            Verify Email
                                                        </button>
                                                    )}
                                                    {user.isVerified && !user.isApproved && (
                                                        <button
                                                            onClick={() => handleApprove(user._id)}
                                                            className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-sm font-semibold hover:bg-green-100 transition-colors"
                                                            title="Approve supplier"
                                                        >
                                                            Approve
                                                        </button>
                                                    )}
                                                    {user.isApproved && (
                                                        <button
                                                            onClick={() => handleToggleStatus(user._id, user.isActive !== false)}
                                                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${user.isActive !== false
                                                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                                                                }`}
                                                            title={user.isActive !== false ? 'Deactivate supplier' : 'Activate supplier'}
                                                        >
                                                            {user.isActive !== false ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {users.filter(u => u.role === 'supplier').length === 0 && (
                            <div className="text-center py-12">
                                <svg className="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <p className="text-gray-500 text-lg">No suppliers registered yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {editingUser ? 'Edit User' : 'Create New User'}
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                    placeholder="Enter full name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                    placeholder="user@university.edu"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Password {editingUser ? '(leave blank to keep current)' : <span className="text-red-500">*</span>}
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                    placeholder="Enter password"
                                    required={!editingUser}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Role <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                    required
                                >
                                    <option value="">Select role...</option>
                                    {roles.map((role) => (
                                        <option key={role.value} value={role.value}>
                                            {role.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {formData.role === 'department_head' && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Department <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                        placeholder="e.g., Computer Science"
                                        required
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                    placeholder="+1 (555) 123-4567"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Address
                                </label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                    rows="3"
                                    placeholder="Enter address"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                                >
                                    {editingUser ? 'Update User' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
