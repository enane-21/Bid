import { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const DepartmentHead = () => {
    const { user } = useContext(AuthContext);
    const [requisitions, setRequisitions] = useState([]);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [selectedRequisition, setSelectedRequisition] = useState(null);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [formData, setFormData] = useState({
        title: '', description: '', category: '', quantity: '', estimatedBudget: ''
    });

    const categories = [
        'Office Supplies', 'Laboratory Equipment', 'Furniture', 'Electronics',
        'Cleaning Supplies', 'Medical Supplies', 'Books & Publications', 'Other'
    ];

    useEffect(() => {
        fetchRequisitions();
        fetchMessages();
    }, []);

    const fetchRequisitions = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/requisitions', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequisitions(res.data.requisitions || []);
        } catch (error) {
            toast.error('Failed to fetch requisitions');
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/messages', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(res.data.messages || []);
        } catch (error) {
            console.error('Failed to fetch messages');
        }
    };

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                'http://localhost:5000/api/requisitions',
                { ...formData, quantity: parseInt(formData.quantity), estimatedBudget: parseFloat(formData.estimatedBudget) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Purchase request submitted successfully');
            setShowRequestModal(false);
            setFormData({ title: '', description: '', category: '', quantity: '', estimatedBudget: '' });
            fetchRequisitions();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit request');
        }
    };

    const handleApprove = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:5000/api/requisitions/${selectedRequisition._id}/approve`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Requisition approved');
            setShowApprovalModal(false);
            setSelectedRequisition(null);
            fetchRequisitions();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to approve');
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) { toast.error('Please provide a rejection reason'); return; }
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:5000/api/requisitions/${selectedRequisition._id}/reject`,
                { reason: rejectionReason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Requisition rejected');
            setShowRejectModal(false);
            setSelectedRequisition(null);
            setRejectionReason('');
            fetchRequisitions();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reject');
        }
    };

    const getStatusBadge = (status) => {
        const map = {
            pending: { label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800' },
            approved_by_director: { label: 'Approved by Head', color: 'bg-blue-100 text-blue-800' },
            rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
            checked_by_storekeeper: { label: 'Checked by Storekeeper', color: 'bg-purple-100 text-purple-800' },
            budget_verified: { label: 'Budget Verified', color: 'bg-indigo-100 text-indigo-800' },
            arranged: { label: 'Tender Created', color: 'bg-cyan-100 text-cyan-800' },
            items_ordered: { label: 'Items Ordered', color: 'bg-orange-100 text-orange-800' },
            items_received: { label: 'Items Received', color: 'bg-teal-100 text-teal-800' },
            completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
        };
        return map[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    };

    const myRequisitions = requisitions.filter(r =>
        r.requestedBy?._id === user?._id || r.requestedBy === user?._id
    );
    const pendingApproval = requisitions.filter(r => r.status === 'pending');
    const approvedList = requisitions.filter(r =>
        ['approved_by_director', 'checked_by_storekeeper', 'budget_verified', 'arranged', 'items_ordered', 'items_received', 'completed'].includes(r.status)
    );
    const rejectedList = requisitions.filter(r => r.status === 'rejected');

    const tabData = { pending: pendingApproval, approved: approvedList, rejected: rejectedList, mine: myRequisitions };
    const displayList = tabData[activeTab] || [];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-1">Department Head Dashboard</h1>
                        <p className="text-gray-600">Create requests and approve pending requisitions</p>
                    </div>
                    <button
                        onClick={() => setShowRequestModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Purchase Request
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: 'Pending Approval', value: pendingApproval.length, color: 'border-yellow-500', bg: 'bg-yellow-100', icon: '⏳' },
                        { label: 'Approved', value: approvedList.length, color: 'border-green-500', bg: 'bg-green-100', icon: '✅' },
                        { label: 'Rejected', value: rejectedList.length, color: 'border-red-500', bg: 'bg-red-100', icon: '❌' },
                        { label: 'Unread Messages', value: messages.filter(m => !m.isRead).length, color: 'border-blue-500', bg: 'bg-blue-100', icon: '💬' },
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

                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px overflow-x-auto">
                            {[
                                { key: 'pending', label: `Pending Approval (${pendingApproval.length})` },
                                { key: 'approved', label: `Approved (${approvedList.length})` },
                                { key: 'rejected', label: `Rejected (${rejectedList.length})` },
                                { key: 'mine', label: `My Requests (${myRequisitions.length})` },
                            ].map(tab => (
                                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                    className={`px-6 py-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.key
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {displayList.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <p className="text-lg">No requisitions in this category</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {['Request Details', 'Requested By', 'Category', 'Qty', 'Budget (ETB)', 'Status', 'Date', 'Actions'].map(h => (
                                            <th key={h} className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {displayList.map(req => {
                                        const status = getStatusBadge(req.status);
                                        return (
                                            <tr key={req._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-semibold text-gray-900">{req.title}</div>
                                                    <div className="text-xs text-gray-500 mt-1 line-clamp-1">{req.description}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {req.requestedBy?.name || '—'}
                                                    <div className="text-xs text-gray-400">{req.requestedBy?.department}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">{req.category}</span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-semibold text-gray-900">{req.quantity}</td>
                                                <td className="px-6 py-4 text-sm font-semibold text-gray-900">ETB {req.estimatedBudget?.toLocaleString()}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>{status.label}</span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-sm font-medium">
                                                    {req.status === 'pending' ? (
                                                        <div className="flex gap-2">
                                                            <button onClick={() => { setSelectedRequisition(req); setShowApprovalModal(true); }}
                                                                className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-100">Approve</button>
                                                            <button onClick={() => { setSelectedRequisition(req); setShowRejectModal(true); }}
                                                                className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-100">Reject</button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => setSelectedRequisition(req)}
                                                            className="text-indigo-600 hover:text-indigo-900 font-semibold text-xs">View</button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>


            {/* New Request Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">New Purchase Request</h2>
                            <button onClick={() => setShowRequestModal(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Item Title <span className="text-red-500">*</span></label>
                                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Description <span className="text-red-500">*</span></label>
                                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none" rows="3" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Category <span className="text-red-500">*</span></label>
                                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none" required>
                                    <option value="">Select category...</option>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Quantity <span className="text-red-500">*</span></label>
                                    <input type="number" min="1" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Estimated Budget (ETB) <span className="text-red-500">*</span></label>
                                    <input type="number" min="0" step="0.01" value={formData.estimatedBudget} onChange={e => setFormData({ ...formData, estimatedBudget: e.target.value })}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none" required />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowRequestModal(false)}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50">Cancel</button>
                                <button type="submit"
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold">Submit Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Approve Modal */}
            {showApprovalModal && selectedRequisition && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Approve Requisition</h2>
                        <p className="text-gray-700 mb-2 font-semibold">{selectedRequisition.title}</p>
                        <p className="text-gray-500 text-sm mb-4">{selectedRequisition.description}</p>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6 text-sm text-green-800">
                            Approving will forward this to the Storekeeper for availability check.
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => { setShowApprovalModal(false); setSelectedRequisition(null); }}
                                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50">Cancel</button>
                            <button onClick={handleApprove}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">Approve</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && selectedRequisition && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Reject Requisition</h2>
                        <p className="text-gray-700 mb-4 font-semibold">{selectedRequisition.title}</p>
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Rejection Reason <span className="text-red-500">*</span></label>
                            <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-red-500 outline-none" rows="3"
                                placeholder="Provide a reason..." />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => { setShowRejectModal(false); setSelectedRequisition(null); setRejectionReason(''); }}
                                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50">Cancel</button>
                            <button onClick={handleReject}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700">Reject</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {selectedRequisition && !showApprovalModal && !showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Requisition Details</h2>
                            <button onClick={() => setSelectedRequisition(null)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">{selectedRequisition.title}</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><p className="text-gray-500">Category</p><p className="font-semibold">{selectedRequisition.category}</p></div>
                                <div><p className="text-gray-500">Quantity</p><p className="font-semibold">{selectedRequisition.quantity}</p></div>
                                <div><p className="text-gray-500">Budget</p><p className="font-semibold">{selectedRequisition.estimatedBudget?.toLocaleString()} ETB</p></div>
                                <div><p className="text-gray-500">Status</p>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedRequisition.status).color}`}>
                                        {getStatusBadge(selectedRequisition.status).label}
                                    </span>
                                </div>
                                <div><p className="text-gray-500">Requested By</p><p className="font-semibold">{selectedRequisition.requestedBy?.name}</p></div>
                                <div><p className="text-gray-500">Department</p><p className="font-semibold">{selectedRequisition.requestedBy?.department || '—'}</p></div>
                            </div>
                            <div><p className="text-gray-500 text-sm mb-1">Description</p><p className="text-gray-800">{selectedRequisition.description}</p></div>
                            {selectedRequisition.rejectionReason && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-sm font-semibold text-red-800">Rejection Reason</p>
                                    <p className="text-red-700 text-sm mt-1">{selectedRequisition.rejectionReason}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DepartmentHead;
