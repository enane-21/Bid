import { useState, useEffect } from 'react';
import BASE_URL from '../services/baseUrl';
import { toast } from 'react-toastify';
import axios from 'axios';

const FinanceDepartment = () => {
    const [requisitions, setRequisitions] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [payments, setPayments] = useState([]);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('requisitions');
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false); // eslint-disable-line no-unused-vars
    const [selectedRequisition, setSelectedRequisition] = useState(null);
    const [selectedBudget, setSelectedBudget] = useState(null);
    const [selectedPayment, setSelectedPayment] = useState(null); // eslint-disable-line no-unused-vars
    const [verificationForm, setVerificationForm] = useState({
        isApproved: true,
        allocatedAmount: '',
        notes: ''
    });
    const [budgetForm, setBudgetForm] = useState({
        department: '',
        fiscalYear: new Date().getFullYear().toString(),
        totalBudget: '',
        allocatedBudget: 0,
        remainingBudget: ''
    });
    const [paymentForm, setPaymentForm] = useState({
        requisition: '',
        tender: '',
        winningBid: '',
        amount: '',
        currency: 'ETB',
        paymentMethod: 'chapa',
        notes: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [reqRes, budgetRes, paymentRes, msgRes, completedReqRes] = await Promise.all([
                axios.get(BASE_URL + '/api/requisitions?status=checked_by_storekeeper', { headers }),
                axios.get(BASE_URL + '/api/budgets', { headers }),
                axios.get(BASE_URL + '/api/payments', { headers }),
                axios.get(BASE_URL + '/api/messages', { headers }),
                // Fetch requisitions ready for payment (items_ordered or completed)
                axios.get(BASE_URL + '/api/requisitions', { headers })
            ]);

            setRequisitions(reqRes.data.requisitions || []);
            setBudgets(budgetRes.data.budgets || []);
            setPayments(paymentRes.data.payments || []);
            setMessages(msgRes.data.messages || []);

            // Filter requisitions that need payment
            const allReqs = completedReqRes.data.requisitions || [];
            const readyForPayment = allReqs.filter(req =>
                req.status === 'items_ordered' || req.status === 'completed'
            );

            // Store them for payment creation
            window.requisitionsForPayment = readyForPayment;

            setLoading(false);
        } catch (error) {
            toast.error('Failed to fetch data');
            setLoading(false);
        }
    };

    const handleVerifyBudget = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                BASE_URL + '/api/requisitions/' + selectedRequisition._id + '/verify-budget',
                {
                    ...verificationForm,
                    allocatedAmount: parseFloat(verificationForm.allocatedAmount)
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(verificationForm.isApproved ? 'Budget verified successfully' : 'Budget verification declined');
            setShowVerificationModal(false);
            resetVerificationForm();
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to verify budget');
        }
    };

    const handleCreateBudget = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const dataToSend = {
                ...budgetForm,
                totalBudget: parseFloat(budgetForm.totalBudget),
                allocatedBudget: parseFloat(budgetForm.allocatedBudget) || 0,
                remainingBudget: parseFloat(budgetForm.totalBudget) - (parseFloat(budgetForm.allocatedBudget) || 0)
            };
            await axios.post(
                BASE_URL + '/api/budgets',
                dataToSend,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Budget created successfully');
            setShowBudgetModal(false);
            resetBudgetForm();
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create budget');
        }
    };

    const handleUpdateBudget = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const dataToSend = {
                ...budgetForm,
                totalBudget: parseFloat(budgetForm.totalBudget),
                allocatedBudget: parseFloat(budgetForm.allocatedBudget),
                remainingBudget: parseFloat(budgetForm.totalBudget) - parseFloat(budgetForm.allocatedBudget)
            };
            await axios.put(
                BASE_URL + '/api/budgets/' + selectedBudget._id,
                dataToSend,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Budget updated successfully');
            setShowBudgetModal(false);
            resetBudgetForm();
            setSelectedBudget(null);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update budget');
        }
    };

    const handleDeleteBudget = async (budgetId) => {
        if (!window.confirm('Are you sure you want to delete this budget?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                BASE_URL + '/api/budgets/' + budgetId,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Budget deleted successfully');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete budget');
        }
    };

    const handleCreatePayment = async (e) => { // eslint-disable-line no-unused-vars
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                BASE_URL + '/api/payments',
                {
                    ...paymentForm,
                    amount: parseFloat(paymentForm.amount)
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Payment created successfully');
            setShowPaymentModal(false);
            resetPaymentForm();
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create payment');
        }
    };

    const handleApprovePayment = async (paymentId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                BASE_URL + '/api/payments/' + paymentId + '/approve',
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Payment approved successfully');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to approve payment');
        }
    };

    const handleInitializeChapaPayment = async (paymentId) => {
        try {
            const token = localStorage.getItem('token');

            toast.info('Initializing Chapa payment...', { autoClose: 2000 });

            const response = await axios.post(
                BASE_URL + '/api/payments/' + paymentId + '/chapa/initialize',
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('Chapa initialization response:', response.data);

            const checkoutUrl = response.data.checkoutUrl;

            if (!checkoutUrl) {
                console.error('No checkout URL in response:', response.data);
                toast.error('Checkout URL not found in response');
                return;
            }

            console.log('Opening Chapa checkout:', checkoutUrl);
            toast.success('Chapa payment initialized! Opening checkout...');

            // Open Chapa checkout in new window
            const popup = window.open(checkoutUrl, '_blank', 'noopener,noreferrer');

            if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                // Popup was blocked
                toast.warning(
                    <div>
                        <div className="font-semibold">Popup blocked!</div>
                        <div className="text-sm mt-1">
                            Please allow popups for this site or{' '}
                            <a
                                href={checkoutUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline font-semibold"
                            >
                                click here to open payment page
                            </a>
                        </div>
                    </div>,
                    { autoClose: 10000 }
                );
            }

            fetchData();
        } catch (error) {
            console.error('Chapa initialization error:', error);

            // Show detailed error message
            const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to initialize Chapa payment';
            const errorDetails = error.response?.data?.details;

            toast.error(
                <div>
                    <div className="font-semibold">{errorMessage}</div>
                    {errorDetails && <div className="text-sm mt-1">{errorDetails}</div>}
                </div>,
                { autoClose: 8000 }
            );

            // Log full error for debugging
            if (error.response?.data) {
                console.error('Server error response:', error.response.data);
            }
        }
    }

    const handleVerifyChapaPayment = async (paymentId, txRef) => {
        try {
            const token = localStorage.getItem('token');

            toast.info('Verifying payment with Chapa...', { autoClose: 2000 });

            const response = await axios.get(
                BASE_URL + '/api/payments/chapa/verify/' + txRef,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast.success('Payment verified successfully!');
                fetchData();
            } else {
                toast.error('Payment verification failed');
            }
        } catch (error) {
            console.error('Payment verification error:', error);
            toast.error(error.response?.data?.message || 'Failed to verify payment');
        }
    };

    const handleMarkAsPaid = async (paymentId) => {
        if (!window.confirm('Mark this payment as completed? This will bypass Chapa payment gateway.')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                BASE_URL + '/api/payments/' + paymentId + '/mark-paid',
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Payment marked as completed successfully');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to mark payment as paid');
        }
    };

    const resetVerificationForm = () => {
        setVerificationForm({
            isApproved: true,
            allocatedAmount: '',
            notes: ''
        });
        setSelectedRequisition(null);
    };

    const resetBudgetForm = () => {
        setBudgetForm({
            department: '',
            fiscalYear: new Date().getFullYear().toString(),
            totalBudget: '',
            allocatedBudget: 0,
            remainingBudget: ''
        });
    };

    const resetPaymentForm = () => {
        setPaymentForm({
            requisition: '',
            tender: '',
            winningBid: '',
            amount: '',
            currency: 'ETB',
            paymentMethod: 'chapa',
            notes: ''
        });
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
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Finance Department Dashboard</h1>
                    <p className="text-gray-600">Verify budgets, manage financial records, and track allocations</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Pending Verification</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{requisitions.length}</p>
                            </div>
                            <div className="bg-yellow-100 rounded-full p-3">
                                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Budgets</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{budgets.length}</p>
                            </div>
                            <div className="bg-green-100 rounded-full p-3">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-indigo-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Allocated</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">
                                    ETB {budgets.reduce((sum, b) => sum + (b.allocatedBudget || 0), 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-indigo-100 rounded-full p-3">
                                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
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
                                Budget Verification ({requisitions.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('budgets')}
                                className={`px-6 py-4 text-sm font-semibold border-b-2 ${activeTab === 'budgets'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Budget Management ({budgets.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('payments')}
                                className={`px-6 py-4 text-sm font-semibold border-b-2 ${activeTab === 'payments'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Payments ({payments.length})
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'requisitions' && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Requisitions Pending Budget Verification</h3>
                                {requisitions.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No requisitions pending verification</p>
                                ) : (
                                    <div className="space-y-4">
                                        {requisitions.map((req) => (
                                            <div key={req._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-gray-900">{req.title}</h4>
                                                        <p className="text-sm text-gray-600 mt-1">{req.description}</p>
                                                        <div className="flex gap-4 mt-2 text-sm">
                                                            <span className="text-gray-600">Dept: <span className="font-semibold">{req.requestedBy?.department}</span></span>
                                                            <span className="text-gray-600">Requested By: <span className="font-semibold">{req.requestedBy?.name}</span></span>
                                                            <span className="text-gray-600">Estimated Budget: <span className="font-semibold text-green-600">ETB {req.estimatedBudget.toLocaleString()}</span></span>
                                                            <span className="text-gray-600">Qty: <span className="font-semibold">{req.quantity}</span></span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRequisition(req);
                                                            setVerificationForm({
                                                                ...verificationForm,
                                                                allocatedAmount: req.estimatedBudget.toString()
                                                            });
                                                            setShowVerificationModal(true);
                                                        }}
                                                        className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
                                                    >
                                                        Verify Budget
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'budgets' && (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-gray-900">Department Budgets</h3>
                                    <button
                                        onClick={() => setShowBudgetModal(true)}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
                                    >
                                        Create Budget
                                    </button>
                                </div>
                                {budgets.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No budgets created yet</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Department</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Fiscal Year</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Total Budget</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Allocated</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Remaining</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {budgets.map((budget) => (
                                                    <tr key={budget._id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{budget.department}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-600">{budget.fiscalYear}</td>
                                                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">ETB {budget.totalBudget.toLocaleString()}</td>
                                                        <td className="px-6 py-4 text-sm font-semibold text-orange-600">ETB {(budget.allocatedBudget || 0).toLocaleString()}</td>
                                                        <td className="px-6 py-4 text-sm font-semibold text-green-600">ETB {(budget.remainingBudget || 0).toLocaleString()}</td>
                                                        <td className="px-6 py-4 text-sm font-medium">
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedBudget(budget);
                                                                        setBudgetForm({
                                                                            department: budget.department,
                                                                            fiscalYear: budget.fiscalYear,
                                                                            totalBudget: budget.totalBudget.toString(),
                                                                            allocatedBudget: budget.allocatedBudget || 0,
                                                                            remainingBudget: budget.remainingBudget || 0
                                                                        });
                                                                        setShowBudgetModal(true);
                                                                    }}
                                                                    className="text-indigo-600 hover:text-indigo-900 font-semibold"
                                                                >
                                                                    Update
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteBudget(budget._id)}
                                                                    className="text-red-600 hover:text-red-900 font-semibold"
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
                                )}
                            </div>
                        )}

                        {activeTab === 'payments' && (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Supplier Payments</h3>
                                {payments.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">No payments created yet</p>
                                ) : (
                                    <div className="space-y-4">
                                        {payments.map((payment) => (
                                            <div key={payment._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3">
                                                            <h4 className="font-semibold text-gray-900">
                                                                {payment.tender?.title || 'Payment'}
                                                            </h4>
                                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                                payment.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                                                    payment.status === 'approved' ? 'bg-yellow-100 text-yellow-800' :
                                                                        payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                                            'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                {payment.status.toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                                                            <p>Supplier: <span className="font-semibold">{payment.supplier?.companyName || payment.supplier?.name}</span></p>
                                                            <p>Amount: <span className="font-semibold text-green-600">{payment.amount.toLocaleString()} {payment.currency}</span></p>
                                                            <p>Method: <span className="font-semibold">{payment.paymentMethod}</span></p>
                                                            {payment.chapaData?.txRef && (
                                                                <p>Tx Ref: <span className="font-mono text-xs">{payment.chapaData.txRef}</span></p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="ml-4 flex flex-col gap-2">
                                                        {payment.status === 'pending' && (
                                                            <button
                                                                onClick={() => handleApprovePayment(payment._id)}
                                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm"
                                                            >
                                                                Approve
                                                            </button>
                                                        )}
                                                        {payment.status === 'approved' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleInitializeChapaPayment(payment._id)}
                                                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-sm"
                                                                >
                                                                    Pay with Chapa
                                                                </button>
                                                                <button
                                                                    onClick={() => handleMarkAsPaid(payment._id)}
                                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm"
                                                                >
                                                                    Mark as Paid
                                                                </button>
                                                            </>
                                                        )}
                                                        {payment.status === 'processing' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleVerifyChapaPayment(payment._id, payment.chapaData?.txRef)}
                                                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-sm"
                                                                    disabled={!payment.chapaData?.txRef}
                                                                >
                                                                    Verify Payment
                                                                </button>
                                                                <button
                                                                    onClick={() => window.open(payment.chapaData?.checkoutUrl, '_blank')}
                                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm"
                                                                    disabled={!payment.chapaData?.checkoutUrl}
                                                                >
                                                                    Reopen Checkout
                                                                </button>
                                                                <button
                                                                    onClick={() => handleMarkAsPaid(payment._id)}
                                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm"
                                                                >
                                                                    Mark as Paid
                                                                </button>
                                                            </>
                                                        )}
                                                        {payment.status === 'completed' && (
                                                            <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold text-sm text-center">
                                                                ✓ Paid
                                                            </span>
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

            {/* Budget Verification Modal */}
            {showVerificationModal && selectedRequisition && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">Verify Budget</h2>
                        </div>
                        <form onSubmit={handleVerifyBudget} className="p-6 space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <h3 className="font-semibold text-gray-900 mb-2">{selectedRequisition.title}</h3>
                                <p className="text-sm text-gray-600 mb-2">{selectedRequisition.description}</p>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Department:</span>
                                        <span className="ml-2 font-semibold">{selectedRequisition.requestedBy?.department}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Estimated Budget:</span>
                                        <span className="ml-2 font-semibold text-green-600">ETB {selectedRequisition.estimatedBudget.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Approval Status</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            checked={verificationForm.isApproved === true}
                                            onChange={() => setVerificationForm({ ...verificationForm, isApproved: true })}
                                            className="mr-2"
                                        />
                                        <span className="text-green-600 font-semibold">Approve</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            checked={verificationForm.isApproved === false}
                                            onChange={() => setVerificationForm({ ...verificationForm, isApproved: false })}
                                            className="mr-2"
                                        />
                                        <span className="text-red-600 font-semibold">Decline</span>
                                    </label>
                                </div>
                            </div>

                            {verificationForm.isApproved && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Allocated Amount ($)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={verificationForm.allocatedAmount}
                                        onChange={(e) => setVerificationForm({ ...verificationForm, allocatedAmount: e.target.value })}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none"
                                        required
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Notes</label>
                                <textarea
                                    value={verificationForm.notes}
                                    onChange={(e) => setVerificationForm({ ...verificationForm, notes: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none"
                                    rows="3"
                                    placeholder="Add any notes or comments..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowVerificationModal(false);
                                        resetVerificationForm();
                                    }}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`flex-1 px-6 py-3 rounded-lg font-semibold ${verificationForm.isApproved
                                        ? 'bg-green-600 hover:bg-green-700 text-white'
                                        : 'bg-red-600 hover:bg-red-700 text-white'
                                        }`}
                                >
                                    {verificationForm.isApproved ? 'Approve Budget' : 'Decline Budget'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Budget Create/Update Modal */}
            {showBudgetModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {selectedBudget ? 'Update Budget' : 'Create Budget'}
                            </h2>
                        </div>
                        <form onSubmit={selectedBudget ? handleUpdateBudget : handleCreateBudget} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Department</label>
                                <input
                                    type="text"
                                    value={budgetForm.department}
                                    onChange={(e) => setBudgetForm({ ...budgetForm, department: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none"
                                    placeholder="e.g., Computer Science, Mechanical Engineering"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Fiscal Year</label>
                                <input
                                    type="text"
                                    value={budgetForm.fiscalYear}
                                    onChange={(e) => setBudgetForm({ ...budgetForm, fiscalYear: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none"
                                    placeholder="e.g., 2024"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Total Budget ($)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={budgetForm.totalBudget}
                                    onChange={(e) => setBudgetForm({ ...budgetForm, totalBudget: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none"
                                    placeholder="Enter total budget"
                                    required
                                />
                            </div>

                            {selectedBudget && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Allocated Budget ($)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={budgetForm.allocatedBudget}
                                        onChange={(e) => setBudgetForm({ ...budgetForm, allocatedBudget: e.target.value })}
                                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowBudgetModal(false);
                                        resetBudgetForm();
                                        setSelectedBudget(null);
                                    }}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                                >
                                    {selectedBudget ? 'Update Budget' : 'Create Budget'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinanceDepartment;
