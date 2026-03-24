import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Budgets = () => {
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        axios.get('http://localhost:5000/api/budgets')
            .then(res => setBudgets(res.data.budgets || []))
            .catch(() => setError('Failed to load budgets'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
            </div>

            {loading && <p className="text-gray-500">Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!loading && !error && (
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Department', 'Fiscal Year', 'Total (ETB)', 'Allocated (ETB)', 'Remaining (ETB)', 'Managed By'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {budgets.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No budgets found</td></tr>
                            ) : budgets.map(b => {
                                const pct = b.totalBudget > 0 ? Math.round((b.allocatedBudget / b.totalBudget) * 100) : 0;
                                return (
                                    <tr key={b._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">{b.department}</td>
                                        <td className="px-4 py-3 text-gray-600">{b.fiscalYear}</td>
                                        <td className="px-4 py-3 text-gray-600">ETB {b.totalBudget?.toLocaleString()}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-indigo-500 h-2 rounded-full"
                                                        style={{ width: `${Math.min(pct, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm text-gray-600 whitespace-nowrap">
                                                    ETB {b.allocatedBudget?.toLocaleString()} ({pct}%)
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`font-semibold ${b.remainingBudget < b.totalBudget * 0.2 ? 'text-red-600' : 'text-green-600'}`}>
                                                ETB {b.remainingBudget?.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{b.managedBy?.name || '—'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Budgets;
