import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { requisitionAPI, bidAPI } from '../services/api';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [requisitions, setRequisitions] = useState([]);
    const [bids, setBids] = useState([]);
    const [storekeepData, setStorekeeperData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            if (user.role === 'user' || user.role === 'administrator' || user.role === 'department_head' || user.role === 'purchasing_team') {
                const reqRes = await requisitionAPI.getAll();
                setRequisitions(reqRes.data.requisitions || []);
            }

            if (user.role === 'supplier') {
                const bidRes = await bidAPI.getSupplierBids();
                setBids(bidRes.data.bids || []);
            }

            if (user.role === 'storekeeper') {
                const [invRes, checksRes, receiptsRes, statsRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/storekeeper/inventory', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('http://localhost:5000/api/storekeeper/pending-checks', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('http://localhost:5000/api/storekeeper/pending-receipts', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('http://localhost:5000/api/storekeeper/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
                ]);
                const inventory = invRes.data.inventory || [];
                // Flatten all history entries across all items, sort newest first
                const activities = inventory
                    .flatMap(item => (item.history || []).map(h => ({ ...h, itemName: item.itemName })))
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 20);
                setStorekeeperData({
                    inventory,
                    pendingChecks: checksRes.data.requisitions || [],
                    pendingReceipts: receiptsRes.data.requisitions || [],
                    activities,
                    stats: statsRes.data.stats || {},
                });
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const STATUS_LABELS = {
        pending: 'Pending',
        approved_by_director: 'Approved by Department Head',
        rejected: 'Rejected',
        checked_by_storekeeper: 'Checked by Storekeeper',
        budget_verified: 'Budget Verified',
        arranged: 'Arranged',
        items_ordered: 'Items Ordered',
        items_received: 'Items Received',
        completed: 'Completed',
        submitted: 'Submitted',
        won: 'Won',
        lost: 'Lost',
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            approved_by_director: 'bg-blue-100 text-blue-800 border-blue-200',
            approved: 'bg-green-100 text-green-800 border-green-200',
            rejected: 'bg-red-100 text-red-800 border-red-200',
            submitted: 'bg-blue-100 text-blue-800 border-blue-200',
            won: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            lost: 'bg-gray-100 text-gray-800 border-gray-200',
            checked_by_storekeeper: 'bg-purple-100 text-purple-800 border-purple-200',
            budget_verified: 'bg-green-100 text-green-800 border-green-200',
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Welcome back, {user?.name}! 👋
                    </h1>
                    <p className="text-gray-600 text-lg">Here's what's happening with your account today.</p>
                </div>

                {/* User Info Card */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
                    <div className="flex items-center space-x-6">
                        <div className="flex-shrink-0">
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-3xl">
                                {user?.role === 'supplier' ? '🏢' : user?.role === 'administrator' ? '⚙️' : '👤'}
                            </div>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold mb-2">{user?.name}</h2>
                            <div className="flex flex-wrap gap-4 text-indigo-100">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                    </svg>
                                    {user?.email}
                                </div>
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                    {user?.role?.replace(/_/g, ' ').toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Requisitions Section */}
                {(user?.role === 'user' || user?.role === 'administrator' || user?.role === 'department_head' || user?.role === 'purchasing_team') && (
                    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">
                                📋 Requisitions
                            </h2>
                            <span className="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full font-semibold">
                                {requisitions.length} Total
                            </span>
                        </div>

                        {requisitions.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {requisitions.map(req => (
                                    <div
                                        key={req._id}
                                        className="group bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-indigo-300 transition-all duration-300 transform hover:-translate-y-1"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                {req.title}
                                            </h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(req.status)}`}>
                                                {STATUS_LABELS[req.status] || req.status?.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <div className="space-y-2 text-sm text-gray-600">
                                            <div className="flex items-center">
                                                <span className="font-semibold mr-2">Category:</span>
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">{req.category}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="font-semibold mr-2">Budget:</span>
                                                <span className="text-green-600 font-bold">ETB {req.estimatedBudget?.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="font-semibold mr-2">By:</span>
                                                <span>{req.requestedBy?.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">📭</div>
                                <p className="text-gray-500 text-lg">No requisitions yet</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Bids Section */}
                {user?.role === 'supplier' && (
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">
                                💼 My Bids
                            </h2>
                            <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full font-semibold">
                                {bids.length} Total
                            </span>
                        </div>

                        {bids.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {bids.map(bid => (
                                    <div
                                        key={bid._id}
                                        className="group bg-gradient-to-br from-white to-purple-50 border-2 border-purple-200 rounded-xl p-6 hover:shadow-xl hover:border-purple-400 transition-all duration-300 transform hover:-translate-y-1"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                                                {bid.tenderFile?.title || 'Tender'}
                                            </h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(bid.status)}`}>
                                                {STATUS_LABELS[bid.status] || bid.status?.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <div className="space-y-2 text-sm text-gray-600">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold">Proposed Price:</span>
                                                <span className="text-purple-600 font-bold text-lg">ETB {bid.proposedPrice?.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold">Submitted:</span>
                                                <span>{new Date(bid.timestamp).toLocaleDateString()}</span>
                                            </div>
                                            {bid.evaluationScore && (
                                                <div className="flex items-center justify-between pt-2 border-t border-purple-200">
                                                    <span className="font-semibold">Score:</span>
                                                    <span className="px-3 py-1 bg-purple-600 text-white rounded-full font-bold">
                                                        {bid.evaluationScore}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">📝</div>
                                <p className="text-gray-500 text-lg">No bids submitted yet</p>
                                <p className="text-gray-400 mt-2">Start bidding on available tenders</p>
                            </div>
                        )}
                    </div>
                )}
                {/* Storekeeper Section */}
                {user?.role === 'storekeeper' && storekeepData && (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                            {[
                                { label: 'Total Items', value: storekeepData.inventory.length, color: 'border-indigo-500', bg: 'bg-indigo-100', icon: '📦' },
                                { label: 'In Stock', value: storekeepData.inventory.filter(i => i.quantity >= 10).length, color: 'border-green-500', bg: 'bg-green-100', icon: '✅' },
                                { label: 'Pending Checks', value: storekeepData.pendingChecks.length, color: 'border-yellow-500', bg: 'bg-yellow-100', icon: '🔍' },
                                { label: 'Pending Receipts', value: storekeepData.pendingReceipts.length, color: 'border-purple-500', bg: 'bg-purple-100', icon: '📬' },
                            ].map((s, i) => (
                                <div key={i} className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 ${s.color}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">{s.label}</p>
                                            <p className="text-3xl font-bold text-gray-900 mt-2">{s.value}</p>
                                        </div>
                                        <div className={`${s.bg} rounded-full p-3 text-2xl`}>{s.icon}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Inventory Management */}
                        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">📦 Inventory Management</h2>
                            {storekeepData.inventory.length === 0 ? (
                                <p className="text-gray-400 text-center py-6">No inventory items registered yet</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                {['Item Name', 'Category', 'Quantity', 'Location', 'Status'].map(h => (
                                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {storekeepData.inventory.map(item => {
                                                const qty = item.quantity;
                                                const status = qty === 0 ? { label: 'Out of Stock', cls: 'bg-red-100 text-red-800' }
                                                    : qty < 10 ? { label: 'Low Stock', cls: 'bg-yellow-100 text-yellow-800' }
                                                        : { label: 'In Stock', cls: 'bg-green-100 text-green-800' };
                                                return (
                                                    <tr key={item._id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 font-medium text-gray-900">{item.itemName}</td>
                                                        <td className="px-4 py-3 text-gray-600">{item.category}</td>
                                                        <td className="px-4 py-3 font-bold text-gray-900">{item.quantity}</td>
                                                        <td className="px-4 py-3 text-gray-600">{item.location || 'Main Store'}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status.cls}`}>{status.label}</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Requisition Checks */}
                        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">🔍 Requisition Checks — Pending Availability</h2>
                            {storekeepData.pendingChecks.length === 0 ? (
                                <p className="text-gray-400 text-center py-6">No requisitions pending availability check</p>
                            ) : (
                                <div className="space-y-3">
                                    {storekeepData.pendingChecks.map(req => (
                                        <div key={req._id} className="flex items-center justify-between p-4 border border-yellow-200 bg-yellow-50 rounded-xl">
                                            <div>
                                                <p className="font-semibold text-gray-900">{req.title}</p>
                                                <p className="text-sm text-gray-500">{req.category} · Qty: {req.quantity} · By: {req.requestedBy?.name}</p>
                                            </div>
                                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">Awaiting Check</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pending Receipts */}
                        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">📬 Item Receipts — Pending from Suppliers</h2>
                            {storekeepData.pendingReceipts.length === 0 ? (
                                <p className="text-gray-400 text-center py-6">No items pending receipt</p>
                            ) : (
                                <div className="space-y-3">
                                    {storekeepData.pendingReceipts.map(req => (
                                        <div key={req._id} className="flex items-center justify-between p-4 border border-purple-200 bg-purple-50 rounded-xl">
                                            <div>
                                                <p className="font-semibold text-gray-900">{req.title}</p>
                                                <p className="text-sm text-gray-500">{req.category} · Qty Ordered: {req.quantity} · By: {req.requestedBy?.name}</p>
                                            </div>
                                            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">Items Ordered</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Recent Activity Log */}
                        <div className="bg-white rounded-2xl shadow-lg p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">🕒 Recent Activities</h2>
                            {storekeepData.activities.length === 0 ? (
                                <p className="text-gray-400 text-center py-6">No activities recorded yet</p>
                            ) : (
                                <div className="flow-root">
                                    <ul className="divide-y divide-gray-100">
                                        {storekeepData.activities.map((act, i) => {
                                            const actionConfig = {
                                                added: { label: 'Registered', icon: '➕', cls: 'bg-green-100 text-green-700' },
                                                adjusted: { label: 'Adjusted', icon: '🔧', cls: 'bg-blue-100 text-blue-700' },
                                                removed: { label: 'Issued to Dept', icon: '📤', cls: 'bg-orange-100 text-orange-700' },
                                                received_from_supplier: { label: 'Received from Supplier', icon: '📥', cls: 'bg-purple-100 text-purple-700' },
                                            };
                                            const cfg = actionConfig[act.action] || { label: act.action, icon: '📋', cls: 'bg-gray-100 text-gray-700' };
                                            return (
                                                <li key={i} className="py-4 flex items-start gap-4">
                                                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${cfg.cls}`}>
                                                        {cfg.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {cfg.label} — <span className="text-indigo-600">{act.itemName}</span>
                                                            </p>
                                                            <span className="text-xs text-gray-400 ml-4 whitespace-nowrap">
                                                                {act.date ? new Date(act.date).toLocaleString() : '—'}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-500 mt-0.5">
                                                            Qty: {act.previousQuantity} → {act.newQuantity}
                                                            {act.performedBy?.name && <span className="ml-2 text-gray-400">by {act.performedBy.name}</span>}
                                                        </p>
                                                        {act.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{act.notes}</p>}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
