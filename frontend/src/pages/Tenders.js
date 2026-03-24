import React, { useEffect, useState } from 'react';
import axios from 'axios';

const STATUS_COLORS = {
    draft: 'bg-gray-100 text-gray-700',
    published: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    closed: 'bg-red-100 text-red-800',
    disabled: 'bg-orange-100 text-orange-800',
    evaluated: 'bg-purple-100 text-purple-800',
    completed: 'bg-teal-100 text-teal-800',
};

const Tenders = () => {
    const [tenders, setTenders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('');

    useEffect(() => {
        axios.get('http://localhost:5000/api/tenders')
            .then(res => setTenders(res.data.tenders || []))
            .catch(() => setError('Failed to load tenders'))
            .finally(() => setLoading(false));
    }, []);

    const filtered = filter ? tenders.filter(t => t.status === filter) : tenders;

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Tenders</h1>
                <select
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                >
                    <option value="">All Statuses</option>
                    {Object.keys(STATUS_COLORS).map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
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
                                {['Title', 'Status', 'Bids', 'Start Date', 'End Date', 'Uploaded By', 'Created'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No tenders found</td></tr>
                            ) : filtered.map(t => (
                                <tr key={t._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{t.title}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[t.status] || 'bg-gray-100 text-gray-700'}`}>
                                            {t.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{t.bidCount ?? 0}</td>
                                    <td className="px-4 py-3 text-gray-500 text-sm">{t.startDate ? new Date(t.startDate).toLocaleDateString() : '—'}</td>
                                    <td className="px-4 py-3 text-gray-500 text-sm">{t.endDate ? new Date(t.endDate).toLocaleDateString() : '—'}</td>
                                    <td className="px-4 py-3 text-gray-600">{t.uploadedBy?.name || '—'}</td>
                                    <td className="px-4 py-3 text-gray-500 text-sm">{new Date(t.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Tenders;
