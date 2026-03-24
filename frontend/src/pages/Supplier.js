import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const Supplier = () => {
    const [tenders, setTenders] = useState([]);
    const [myBids, setMyBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('tenders');
    const [selectedTender, setSelectedTender] = useState(null);
    const [showBidModal, setShowBidModal] = useState(false);
    const [bidForm, setBidForm] = useState({
        proposedPrice: '',
        currency: 'ETB',
        paymentTerms: '',
        validityPeriod: '',
        specifications: '',
        deliveryTime: '',
        warranty: '',
        afterSalesService: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [tendersRes, bidsRes] = await Promise.all([
                axios.get('http://localhost:5000/api/tenders', { headers }),
                axios.get('http://localhost:5000/api/bids/supplier', { headers })
            ]);

            // Filter to show only published and active tenders (backend already filters for suppliers)
            const availableTenders = (tendersRes.data.tenders || []).filter(
                t => ['published', 'active'].includes(t.status)
            );

            setTenders(availableTenders);
            setMyBids(bidsRes.data.bids || []);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to fetch data');
            setLoading(false);
        }
    };

    const handleSubmitBid = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                'http://localhost:5000/api/bids',
                {
                    tenderFileId: selectedTender._id,
                    financialProposal: {
                        proposedPrice: parseFloat(bidForm.proposedPrice),
                        currency: bidForm.currency,
                        paymentTerms: bidForm.paymentTerms,
                        validityPeriod: bidForm.validityPeriod
                    },
                    technicalProposal: {
                        specifications: bidForm.specifications,
                        deliveryTime: bidForm.deliveryTime,
                        warranty: bidForm.warranty,
                        afterSalesService: bidForm.afterSalesService
                    }
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Bid submitted successfully');
            setShowBidModal(false);
            resetBidForm();
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit bid');
        }
    };

    const resetBidForm = () => {
        setBidForm({
            proposedPrice: '',
            currency: 'ETB',
            paymentTerms: '',
            validityPeriod: '',
            specifications: '',
            deliveryTime: '',
            warranty: '',
            afterSalesService: ''
        });
        setSelectedTender(null);
    };

    const getStatusBadge = (status) => {
        const config = {
            'active': { label: 'Active', color: 'bg-green-100 text-green-800' },
            'submitted': { label: 'Submitted', color: 'bg-yellow-100 text-yellow-800' },
            'under_evaluation': { label: 'Under Evaluation', color: 'bg-orange-100 text-orange-800' },
            'winner': { label: '🏆 Winner', color: 'bg-green-100 text-green-800' },
            'rejected': { label: 'Not Selected', color: 'bg-red-100 text-red-800' }
        };
        return config[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    };

    const isDeadlinePassed = (endDate) => {
        return new Date() > new Date(endDate);
    };

    const hasBidForTender = (tenderId) => {
        return myBids.some(bid => bid.tenderFile?._id === tenderId);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Supplier Dashboard</h1>
                    <p className="text-gray-600">Browse active tenders and manage your bids</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Tenders</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{tenders.length}</p>
                            </div>
                            <div className="bg-green-100 rounded-full p-3">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">My Bids</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{myBids.length}</p>
                            </div>
                            <div className="bg-yellow-100 rounded-full p-3">
                                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-orange-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Under Evaluation</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {myBids.filter(b => b.status === 'under_evaluation').length}
                                </p>
                            </div>
                            <div className="bg-orange-100 rounded-full p-3">
                                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-indigo-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Won Tenders</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {myBids.filter(b => b.isWinner).length}
                                </p>
                            </div>
                            <div className="bg-indigo-100 rounded-full p-3">
                                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('tenders')}
                                className={`px-6 py-4 text-sm font-semibold border-b-2 ${activeTab === 'tenders'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Active Tenders ({tenders.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('mybids')}
                                className={`px-6 py-4 text-sm font-semibold border-b-2 ${activeTab === 'mybids'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                My Bids ({myBids.length})
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'tenders' && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Available Tenders</h3>
                                {tenders.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No active tenders available</p>
                                ) : (
                                    <div className="space-y-4">
                                        {tenders.map((tender) => {
                                            const deadlinePassed = isDeadlinePassed(tender.endDate);
                                            const alreadyBid = hasBidForTender(tender._id);
                                            return (
                                                <div key={tender._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3">
                                                                <h4 className="font-semibold text-gray-900">{tender.title}</h4>
                                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(tender.status).color}`}>
                                                                    {getStatusBadge(tender.status).label}
                                                                </span>
                                                                {alreadyBid && (
                                                                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                                        ✓ Bid Submitted
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-600 mt-2">{tender.description}</p>
                                                            <div className="flex gap-4 mt-2 text-sm text-gray-600">
                                                                <span>Opens: {new Date(tender.startDate).toLocaleDateString()}</span>
                                                                <span className={deadlinePassed ? 'text-red-600 font-semibold' : ''}>
                                                                    Closes: {new Date(tender.endDate).toLocaleDateString()}
                                                                </span>
                                                                {tender.announcementDetails?.venue && (
                                                                    <span>Venue: {tender.announcementDetails.venue}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            {!deadlinePassed && !alreadyBid ? (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedTender(tender);
                                                                        setShowBidModal(true);
                                                                    }}
                                                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
                                                                >
                                                                    Submit Bid
                                                                </button>
                                                            ) : deadlinePassed ? (
                                                                <span className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg font-semibold">
                                                                    Closed
                                                                </span>
                                                            ) : (
                                                                <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-semibold">
                                                                    Bid Submitted
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'mybids' && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4">My Submitted Bids</h3>
                                {myBids.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">You haven't submitted any bids yet</p>
                                ) : (
                                    <div className="space-y-4">
                                        {myBids.map((bid) => (
                                            <div key={bid._id} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3">
                                                            <h4 className="font-semibold text-gray-900">{bid.tenderFile?.title || 'Tender'}</h4>
                                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(bid.status).color}`}>
                                                                {getStatusBadge(bid.status).label}
                                                            </span>
                                                        </div>
                                                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                                                            <p>Proposed Price: <span className="font-semibold text-green-600">ETB {bid.financialProposal?.proposedPrice.toLocaleString()}</span></p>
                                                            <p>Delivery Time: <span className="font-semibold">{bid.technicalProposal?.deliveryTime}</span></p>
                                                            <p>Submitted: {new Date(bid.timestamp).toLocaleDateString()}</p>
                                                            {bid.evaluation && (
                                                                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                                                    <p className="font-semibold text-gray-900">Evaluation Results:</p>
                                                                    <p>Technical Score: {bid.evaluation.technicalScore}/100</p>
                                                                    <p>Financial Score: {bid.evaluation.financialScore}/100</p>
                                                                    <p>Total Score: <span className="font-bold text-indigo-600">{bid.evaluation.totalScore}/200</span></p>
                                                                    {bid.evaluation.notes && (
                                                                        <p className="mt-1 text-xs">Notes: {bid.evaluation.notes}</p>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {bid.isWinner && (
                                                                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                                                    <p className="font-semibold text-green-800">🎉 Congratulations! You won this tender!</p>
                                                                    <p className="text-sm text-green-700">Announced: {new Date(bid.winnerAnnouncedDate).toLocaleDateString()}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Submit Bid Modal */}
            {showBidModal && selectedTender && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">Submit Bid</h2>
                                <button
                                    onClick={() => {
                                        setShowBidModal(false);
                                        resetBidForm();
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="mt-2">
                                <h3 className="font-semibold text-gray-900">{selectedTender.title}</h3>
                                <p className="text-sm text-gray-600">{selectedTender.description}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitBid} className="p-6 space-y-6">
                            {/* Financial Proposal */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Financial Proposal</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Proposed Price ($) <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={bidForm.proposedPrice}
                                                onChange={(e) => setBidForm({ ...bidForm, proposedPrice: e.target.value })}
                                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Currency</label>
                                            <select
                                                value={bidForm.currency}
                                                onChange={(e) => setBidForm({ ...bidForm, currency: e.target.value })}
                                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none"
                                            >
                                                <option value="ETB">ETB (Ethiopian Birr)</option>
                                                <option value="USD">USD</option>
                                                <option value="EUR">EUR</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Payment Terms</label>
                                        <input
                                            type="text"
                                            value={bidForm.paymentTerms}
                                            onChange={(e) => setBidForm({ ...bidForm, paymentTerms: e.target.value })}
                                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none"
                                            placeholder="e.g., 30% advance, 70% on delivery"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Validity Period</label>
                                        <input
                                            type="text"
                                            value={bidForm.validityPeriod}
                                            onChange={(e) => setBidForm({ ...bidForm, validityPeriod: e.target.value })}
                                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none"
                                            placeholder="e.g., 90 days from submission"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Technical Proposal */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Technical Proposal</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Specifications <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={bidForm.specifications}
                                            onChange={(e) => setBidForm({ ...bidForm, specifications: e.target.value })}
                                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none"
                                            rows="3"
                                            placeholder="Detailed technical specifications of your offer..."
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Delivery Time <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={bidForm.deliveryTime}
                                            onChange={(e) => setBidForm({ ...bidForm, deliveryTime: e.target.value })}
                                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none"
                                            placeholder="e.g., 30 days from order confirmation"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Warranty</label>
                                        <input
                                            type="text"
                                            value={bidForm.warranty}
                                            onChange={(e) => setBidForm({ ...bidForm, warranty: e.target.value })}
                                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none"
                                            placeholder="e.g., 2 years manufacturer warranty"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">After-Sales Service</label>
                                        <textarea
                                            value={bidForm.afterSalesService}
                                            onChange={(e) => setBidForm({ ...bidForm, afterSalesService: e.target.value })}
                                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none"
                                            rows="2"
                                            placeholder="Describe your after-sales support..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowBidModal(false);
                                        resetBidForm();
                                    }}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 shadow-lg"
                                >
                                    Submit Bid
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Supplier;
