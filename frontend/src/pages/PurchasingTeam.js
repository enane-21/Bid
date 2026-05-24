import { useState, useEffect } from 'react';
import BASE_URL from '../services/baseUrl';
import { toast } from 'react-toastify';
import axios from 'axios';

const PurchasingTeam = () => {
    const [requisitions, setRequisitions] = useState([]);
    const [tenders, setTenders] = useState([]);
    const [bids, setBids] = useState([]);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('requisitions');
    const [showTenderModal, setShowTenderModal] = useState(false);
    const [showEvaluationModal, setShowEvaluationModal] = useState(false);
    const [selectedRequisition, setSelectedRequisition] = useState(null);
    const [selectedTender, setSelectedTender] = useState(null);
    const [selectedBid, setSelectedBid] = useState(null);
    const [tenderDocument, setTenderDocument] = useState(null);
    const [tenderForm, setTenderForm] = useState({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        announcementNumber: '',
        venue: ''
    });
    const [evaluationForm, setEvaluationForm] = useState({
        technicalScore: '',
        financialScore: '',
        notes: '',
        recommendation: '',
        status: 'under_evaluation'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch requisitions with budget_verified OR arranged status
            const [reqRes, tenderRes, msgRes] = await Promise.all([
                axios.get(BASE_URL + '/api/requisitions', { headers }),
                axios.get(BASE_URL + '/api/tenders', { headers }),
                axios.get(BASE_URL + '/api/messages', { headers })
            ]);

            // Filter requisitions to show only budget_verified (not yet arranged)
            const filteredReqs = (reqRes.data.requisitions || []).filter(
                req => req.status === 'budget_verified'
            );

            setRequisitions(filteredReqs);
            setTenders(tenderRes.data.tenders || []);
            setMessages(msgRes.data.messages || []);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to fetch data');
            setLoading(false);
        }
    };

    const handleArrangeRequisition = async (requisitionId, requisition) => {
        // Just open the tender modal — arrange happens on tender submit
        setSelectedRequisition(requisition);
        setTenderForm({
            ...tenderForm,
            title: requisition.title,
            description: requisition.description
        });
        setShowTenderModal(true);
    };

    const handleCreateTender = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');

            // Step 1: Arrange the requisition first
            await axios.put(
                BASE_URL + '/api/requisitions/' + selectedRequisition._id + '/arrange',
                {},
                { headers: { Authorization: 'Bearer ' + token } }
            );

            // Step 2: Create the tender
            const formData = new FormData();
            formData.append('requisition', selectedRequisition._id);
            formData.append('title', tenderForm.title);
            formData.append('description', tenderForm.description);
            formData.append('startDate', tenderForm.startDate);
            formData.append('endDate', tenderForm.endDate);

            if (tenderForm.announcementNumber) {
                formData.append('announcementDetails[announcementNumber]', tenderForm.announcementNumber);
            }
            if (tenderForm.venue) {
                formData.append('announcementDetails[venue]', tenderForm.venue);
            }
            formData.append('announcementDetails[publicationDate]', new Date().toISOString());
            formData.append('announcementDetails[closingDate]', tenderForm.endDate);

            if (tenderDocument) {
                formData.append('document', tenderDocument);
            }

            await axios.post(
                BASE_URL + '/api/tenders',
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            toast.success('Tender created successfully');
            setShowTenderModal(false);
            resetTenderForm();
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create tender');
        }
    };

    const handlePublishTender = async (tenderId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                BASE_URL + '/api/tenders/' + tenderId + '/publish',
                {},
                { headers: { Authorization: 'Bearer ' + token } }
            );
            toast.success('Tender published successfully');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to publish tender');
        }
    };

    const handleDisableTender = async (tenderId) => {
        if (!window.confirm('Are you sure you want to disable this tender?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                BASE_URL + '/api/tenders/' + tenderId + '/disable',
                {},
                { headers: { Authorization: 'Bearer ' + token } }
            );
            toast.success('Tender disabled successfully');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to disable tender');
        }
    };

    const fetchBidsForTender = async (tenderId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(
                BASE_URL + '/api/bids/tender/' + tenderId,
                { headers: { Authorization: 'Bearer ' + token } }
            );
            setBids(res.data.bids || []);
        } catch (error) {
            toast.error('Failed to fetch bids');
        }
    };

    const handleEvaluateBid = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                BASE_URL + '/api/bids/' + selectedBid._id + '/evaluate',
                {
                    ...evaluationForm,
                    technicalScore: parseFloat(evaluationForm.technicalScore),
                    financialScore: parseFloat(evaluationForm.financialScore)
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Bid evaluated successfully');
            setShowEvaluationModal(false);
            resetEvaluationForm();
            if (selectedTender) {
                fetchBidsForTender(selectedTender._id);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to evaluate bid');
        }
    };

    const handleAnnounceWinner = async (bidId) => {
        if (!window.confirm('Are you sure you want to announce this bid as winner?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                BASE_URL + '/api/bids/' + bidId + '/announce-winner',
                {},
                { headers: { Authorization: 'Bearer ' + token } }
            );
            toast.success('Winner announced successfully');
            if (selectedTender) {
                fetchBidsForTender(selectedTender._id);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to announce winner');
        }
    };

    const resetTenderForm = () => {
        setTenderForm({
            title: '',
            description: '',
            startDate: '',
            endDate: '',
            announcementNumber: '',
            venue: ''
        });
        setTenderDocument(null);
        setSelectedRequisition(null);
    };

    const resetEvaluationForm = () => {
        setEvaluationForm({
            technicalScore: '',
            financialScore: '',
            notes: '',
            recommendation: '',
            status: 'under_evaluation'
        });
        setSelectedBid(null);
    };

    const getStatusBadge = (status) => {
        const config = {
            'draft': { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
            'published': { label: 'Published', color: 'bg-blue-100 text-blue-800' },
            'active': { label: 'Active', color: 'bg-green-100 text-green-800' },
            'closed': { label: 'Closed', color: 'bg-red-100 text-red-800' },
            'disabled': { label: 'Disabled', color: 'bg-gray-100 text-gray-800' },
            'evaluated': { label: 'Evaluated', color: 'bg-purple-100 text-purple-800' },
            'submitted': { label: 'Submitted', color: 'bg-yellow-100 text-yellow-800' },
            'under_evaluation': { label: 'Under Evaluation', color: 'bg-orange-100 text-orange-800' },
            'winner': { label: 'Winner', color: 'bg-green-100 text-green-800' },
            'rejected': { label: 'Rejected', color: 'bg-red-100 text-red-800' }
        };
        return config[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
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
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Purchasing Team Dashboard</h1>
                    <p className="text-gray-600">Manage requisitions, tenders, and bid evaluations</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-indigo-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Approved Requisitions</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{requisitions.length}</p>
                            </div>
                            <div className="bg-indigo-100 rounded-full p-3">
                                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Tenders</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {tenders.filter(t => ['published', 'active'].includes(t.status)).length}
                                </p>
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
                                <p className="text-sm font-medium text-gray-600">Total Tenders</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{tenders.length}</p>
                            </div>
                            <div className="bg-yellow-100 rounded-full p-3">
                                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Messages</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    {messages.filter(m => !m.isRead).length}
                                </p>
                            </div>
                            <div className="bg-blue-100 rounded-full p-3">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
                                onClick={() => setActiveTab('requisitions')}
                                className={`px-6 py-4 text-sm font-semibold border-b-2 ${activeTab === 'requisitions'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Approved Requisitions ({requisitions.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('tenders')}
                                className={`px-6 py-4 text-sm font-semibold border-b-2 ${activeTab === 'tenders'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Tenders ({tenders.length})
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'requisitions' && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Budget-Verified Requisitions</h3>
                                {requisitions.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No approved requisitions</p>
                                ) : (
                                    <div className="space-y-4">
                                        {requisitions.map((req) => (
                                            <div key={req._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3">
                                                            <h4 className="font-semibold text-gray-900">{req.title}</h4>
                                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${req.status === 'budget_verified'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-blue-100 text-blue-800'
                                                                }`}>
                                                                {req.status === 'budget_verified' ? 'Budget Verified' : 'Arranged'}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-1">{req.description}</p>
                                                        <div className="flex gap-4 mt-2 text-sm">
                                                            <span className="text-gray-600">Dept: <span className="font-semibold">{req.requestedBy?.department}</span></span>
                                                            <span className="text-gray-600">Budget: <span className="font-semibold">ETB {req.estimatedBudget?.toLocaleString() || 'N/A'}</span></span>
                                                            <span className="text-gray-600">Qty: <span className="font-semibold">{req.quantity}</span></span>
                                                        </div>
                                                    </div>
                                                    {req.status === 'budget_verified' ? (
                                                        <button
                                                            onClick={() => handleArrangeRequisition(req._id, req)}
                                                            className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
                                                        >
                                                            Create Tender
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedRequisition(req);
                                                                setTenderForm({
                                                                    ...tenderForm,
                                                                    title: req.title,
                                                                    description: req.description
                                                                });
                                                                setShowTenderModal(true);
                                                            }}
                                                            className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                                                        >
                                                            Create Tender
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'tenders' && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4">All Tenders</h3>
                                {tenders.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No tenders created yet</p>
                                ) : (
                                    <div className="space-y-4">
                                        {tenders.map((tender) => (
                                            <div key={tender._id} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3">
                                                            <h4 className="font-semibold text-gray-900">{tender.title}</h4>
                                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(tender.status).color}`}>
                                                                {getStatusBadge(tender.status).label}
                                                            </span>
                                                            {tender.bidCount > 0 && (
                                                                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                                    {tender.bidCount} {tender.bidCount === 1 ? 'Bid' : 'Bids'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-1">{tender.description}</p>
                                                        <div className="flex gap-4 mt-2 text-sm text-gray-600">
                                                            <span>Start: {new Date(tender.startDate).toLocaleDateString()}</span>
                                                            <span>End: {new Date(tender.endDate).toLocaleDateString()}</span>
                                                            {tender.announcementDetails?.announcementNumber && (
                                                                <span>Announcement #: {tender.announcementDetails.announcementNumber}</span>
                                                            )}
                                                        </div>
                                                        {tender.documents && tender.documents.length > 0 && (
                                                            <div className="mt-2">
                                                                <span className="text-xs text-gray-500">
                                                                    📎 {tender.documents.length} document(s) attached
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2 ml-4">
                                                        {tender.status === 'draft' && (
                                                            <button
                                                                onClick={() => handlePublishTender(tender._id)}
                                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold"
                                                            >
                                                                Publish
                                                            </button>
                                                        )}
                                                        {['published', 'active'].includes(tender.status) && (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedTender(tender);
                                                                        fetchBidsForTender(tender._id);
                                                                    }}
                                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold"
                                                                >
                                                                    View Bids {tender.bidCount > 0 && `(${tender.bidCount})`}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDisableTender(tender._id)}
                                                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-semibold"
                                                                >
                                                                    Disable
                                                                </button>
                                                            </>
                                                        )}
                                                        {tender.status === 'closed' && tender.bidCount > 0 && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedTender(tender);
                                                                    fetchBidsForTender(tender._id);
                                                                }}
                                                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-semibold"
                                                            >
                                                                View Results
                                                            </button>
                                                        )}
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

            {/* Create Tender Modal */}
            {showTenderModal && selectedRequisition && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">Create Tender</h2>
                        </div>
                        <form onSubmit={handleCreateTender} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
                                <input
                                    type="text"
                                    value={tenderForm.title}
                                    onChange={(e) => setTenderForm({ ...tenderForm, title: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                                <textarea
                                    value={tenderForm.description}
                                    onChange={(e) => setTenderForm({ ...tenderForm, description: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none"
                                    rows="3"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Start Date</label>
                                    <input
                                        type="date"
                                        value={tenderForm.startDate}
                                        onChange={(e) => setTenderForm({ ...tenderForm, startDate: e.target.value })}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">End Date</label>
                                    <input
                                        type="date"
                                        value={tenderForm.endDate}
                                        onChange={(e) => setTenderForm({ ...tenderForm, endDate: e.target.value })}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Announcement Number</label>
                                    <input
                                        type="text"
                                        value={tenderForm.announcementNumber}
                                        onChange={(e) => setTenderForm({ ...tenderForm, announcementNumber: e.target.value })}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Venue</label>
                                    <input
                                        type="text"
                                        value={tenderForm.venue}
                                        onChange={(e) => setTenderForm({ ...tenderForm, venue: e.target.value })}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Tender Document (Optional)
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => setTenderDocument(e.target.files[0])}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">Upload tender specifications, terms & conditions (PDF, DOC, DOCX)</p>
                                {tenderDocument && (
                                    <p className="text-sm text-green-600 mt-2">✓ {tenderDocument.name}</p>
                                )}
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowTenderModal(false);
                                        resetTenderForm();
                                    }}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                                >
                                    Create Tender
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bids Modal */}
            {selectedTender && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-900">Bids for {selectedTender.title}</h2>
                            <button onClick={() => setSelectedTender(null)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6">
                            {bids.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No bids submitted yet</p>
                            ) : (
                                <div className="space-y-4">
                                    {bids.map((bid) => (
                                        <div key={bid._id} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <h4 className="font-semibold text-gray-900">{bid.supplier?.companyName || bid.supplier?.name}</h4>
                                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(bid.status).color}`}>
                                                            {getStatusBadge(bid.status).label}
                                                        </span>
                                                        {bid.isWinner && (
                                                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                                🏆 Winner
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-gray-500">Proposed Price</p>
                                                            <p className="font-bold text-lg text-gray-900">
                                                                ETB {bid.financialProposal?.proposedPrice.toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">Delivery Time</p>
                                                            <p className="font-semibold text-gray-900">{bid.technicalProposal?.deliveryTime}</p>
                                                        </div>
                                                        {bid.technicalProposal?.warranty && (
                                                            <div>
                                                                <p className="text-gray-500">Warranty</p>
                                                                <p className="font-semibold text-gray-900">{bid.technicalProposal.warranty}</p>
                                                            </div>
                                                        )}
                                                        {bid.financialProposal?.paymentTerms && (
                                                            <div>
                                                                <p className="text-gray-500">Payment Terms</p>
                                                                <p className="font-semibold text-gray-900">{bid.financialProposal.paymentTerms}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {bid.evaluation && (
                                                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                                            <p className="text-sm font-semibold text-gray-700 mb-2">Evaluation Scores</p>
                                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                                                <div>
                                                                    <p className="text-gray-500">Technical</p>
                                                                    <p className="font-bold text-blue-600">{bid.evaluation.technicalScore}/100</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-gray-500">Financial</p>
                                                                    <p className="font-bold text-green-600">{bid.evaluation.financialScore}/100</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-gray-500">Total Score</p>
                                                                    <p className="font-bold text-indigo-600">{bid.evaluation.totalScore}/200</p>
                                                                </div>
                                                            </div>
                                                            {bid.evaluation.notes && (
                                                                <p className="text-xs text-gray-600 mt-2">Notes: {bid.evaluation.notes}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="mt-2 text-xs text-gray-500">
                                                        Submitted: {new Date(bid.timestamp).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2 ml-4">
                                                    {!bid.isWinner && bid.status !== 'rejected' && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedBid(bid);
                                                                    if (bid.evaluation) {
                                                                        setEvaluationForm({
                                                                            technicalScore: bid.evaluation.technicalScore,
                                                                            financialScore: bid.evaluation.financialScore,
                                                                            notes: bid.evaluation.notes || '',
                                                                            recommendation: bid.evaluation.recommendation || '',
                                                                            status: bid.status
                                                                        });
                                                                    }
                                                                    setShowEvaluationModal(true);
                                                                }}
                                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold"
                                                            >
                                                                {bid.evaluation ? 'Re-evaluate' : 'Evaluate'}
                                                            </button>
                                                            {bid.evaluation && (
                                                                <button
                                                                    onClick={() => handleAnnounceWinner(bid._id)}
                                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold"
                                                                >
                                                                    Announce Winner
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Evaluation Modal */}
            {showEvaluationModal && selectedBid && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">Evaluate Bid</h2>
                        </div>
                        <form onSubmit={handleEvaluateBid} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Technical Score (0-100)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={evaluationForm.technicalScore}
                                        onChange={(e) => setEvaluationForm({ ...evaluationForm, technicalScore: e.target.value })}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Financial Score (0-100)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={evaluationForm.financialScore}
                                        onChange={(e) => setEvaluationForm({ ...evaluationForm, financialScore: e.target.value })}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Notes</label>
                                <textarea
                                    value={evaluationForm.notes}
                                    onChange={(e) => setEvaluationForm({ ...evaluationForm, notes: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none"
                                    rows="3"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Recommendation</label>
                                <textarea
                                    value={evaluationForm.recommendation}
                                    onChange={(e) => setEvaluationForm({ ...evaluationForm, recommendation: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none"
                                    rows="2"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEvaluationModal(false);
                                        resetEvaluationForm();
                                    }}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                                >
                                    Submit Evaluation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchasingTeam;
