import React, { useEffect, useState } from 'react';
import axios from 'axios';

const STATUS_COLORS = {
    submitted: 'bg-blue-100 text-blue-800',
    under_evaluation: 'bg-yellow-100 text-yellow-800',
    technically_qualified: 'bg-indigo-100 text-indigo-800',
    financially_qualified: 'bg-purple-100 text-purple-800',
    approved: 'bg-teal-100 text-teal-800',
    rejected: 'bg-red-100 text-red-800',
    winner: 'bg-green-100 text-green-800',
};

const Bids = () => {
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('');

    useEffect(() => {
        axios.get('http://localhost:5000/api/bids')
            .then(res => setBids(res.data.bids || []))
            .catch(() => setError('Failed to load bids'))
            .finally(() => setLoading(false));
    }, []);

    const filtered = filter ? bids.filter(b => b.status === filter) : bids;

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">All Bids</h1>
                <select
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                >
                    <option value="">All Statuses</option>
                    {Object.keys(STATUS_COLORS).map(s => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
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
                                {['Tender', 'Supplier', 'Proposed Price (ETB)', 'Status', 'Winner', 'Submitted'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No bids found</td></tr>
                            ) : filtered.map(b => (
                                <tr key={b._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{b.tenderFile?.title || '—'}</td>
                                    <td className="px-4 py-3 text-gray-600">{b.supplier?.companyName || b.supplier?.name || '—'}</td>
                                    <td className="px-4 py-3 text-gray-600">ETB {b.financialProposal?.proposedPrice?.toLocaleString() || '—'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-700'}`}>
                                            {b.status?.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">{b.isWinner ? '🏆' : '—'}</td>
                                    <td className="px-4 py-3 text-gray-500 text-sm">{new Date(b.timestamp).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Bids;
