import React, { useEffect, useState } from 'react';
import axios from 'axios';

const STATUS_COLORS = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved_by_director: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    checked_by_storekeeper: 'bg-purple-100 text-purple-800',
    budget_verified: 'bg-indigo-100 text-indigo-800',
    arranged: 'bg-cyan-100 text-cyan-800',
    items_ordered: 'bg-orange-100 text-orange-800',
    items_received: 'bg-teal-100 text-teal-800',
    completed: 'bg-green-100 text-green-800',
};

const STATUS_LABELS = {
    pending: 'Pending',
    approved_by_director: 'Approved by Head',
    rejected: 'Rejected',
    checked_by_storekeeper: 'Checked by Storekeeper',
    budget_verified: 'Budget Verified',
    arranged: 'Arranged',
    items_ordered: 'Items Ordered',
    items_received: 'Items Received',
    completed: 'Completed',
};

const Requisitions = () => {
    const [requisitions, setRequisitions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('');

    useEffect(() => {
        axios.get('http://localhost:5000/api/requisitions')
            .then(res => setRequisitions(res.data.requisitions || []))
            .catch(() => setError('Failed to load requisitions'))
            .finally(() => setLoading(false));
    }, []);

    const filtered = filter ? requisitions.filter(r => r.status === filter) : requisitions;

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Requisitions</h1>
                <select
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                >
                    <option value="">All Statuses</option>
                    {Object.keys(STATUS_COLORS).map(s => (
                        <option key={s} value={s}>{STATUS_LABELS[s] || s.replace(/_/g, ' ')}</option>
                    ))}
                </select>
            </div>

            {loading && <p className="text-gray-500">Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!loading && !error && (
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Title', 'Category', 'Qty', 'Est. Budget (ETB)', 'Requested By', 'Status', 'Date'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No requisitions found</td></tr>
                            ) : filtered.map(r => (
                                <tr key={r._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{r.title}</td>
                                    <td className="px-4 py-3 text-gray-600">{r.category}</td>
                                    <td className="px-4 py-3 text-gray-600">{r.quantity}</td>
                                    <td className="px-4 py-3 text-gray-600">ETB {r.estimatedBudget?.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-gray-600">{r.requestedBy?.name || '—'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-700'}`}>
                                            {STATUS_LABELS[r.status] || r.status?.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-sm">{new Date(r.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Requisitions;
