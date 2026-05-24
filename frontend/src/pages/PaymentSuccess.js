import { useEffect, useState } from 'react';
import BASE_URL from '../services/baseUrl';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                // Get transaction reference from URL
                const txRef = searchParams.get('trx_ref') || searchParams.get('tx_ref');
                const status = searchParams.get('status');

                if (!txRef) {
                    // No transaction reference in URL - redirect to finance dashboard
                    console.log('No transaction reference found, redirecting to dashboard');
                    setTimeout(() => {
                        navigate('/finance');
                    }, 3000);
                    setError('Payment completed! Redirecting to dashboard...');
                    setLoading(false);
                    return;
                }

                // Verify payment with backend
                const token = localStorage.getItem('token');
                const response = await axios.get(
                    BASE_URL + '/api/payments/chapa/verify/' + txRef,
                    { headers: { Authorization: 'Bearer ' + token } }
                );

                setPaymentStatus({
                    success: response.data.success,
                    status: status,
                    txRef: txRef,
                    payment: response.data.payment,
                    chapaData: response.data.chapaData
                });
                setLoading(false);
            } catch (err) {
                console.error('Payment verification error:', err);
                setError(err.response?.data?.message || 'Failed to verify payment');
                setLoading(false);
            }
        };

        verifyPayment();
    }, [searchParams, navigate]);

    const handleBackToDashboard = () => {
        navigate('/finance');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 text-lg">Verifying payment...</p>
                </div>
            </div>
        );
    }

    if (error) {
        const isRedirecting = error.includes('Redirecting');
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
                    <div className="text-center">
                        <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${isRedirecting ? 'bg-green-100' : 'bg-yellow-100'} mb-4`}>
                            {isRedirecting ? (
                                <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="h-10 w-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            )}
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {isRedirecting ? 'Payment Completed' : 'Verification Issue'}
                        </h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        {!isRedirecting && (
                            <button
                                onClick={handleBackToDashboard}
                                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                            >
                                Back to Dashboard
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const isSuccess = paymentStatus?.success && paymentStatus?.chapaData?.status === 'success';

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className={`p-8 ${isSuccess ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-yellow-500 to-yellow-600'}`}>
                    <div className="text-center text-white">
                        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-white bg-opacity-20 mb-4">
                            {isSuccess ? (
                                <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                        </div>
                        <h1 className="text-3xl font-bold mb-2">
                            {isSuccess ? 'Payment Successful!' : 'Payment Processing'}
                        </h1>
                        <p className="text-white text-opacity-90">
                            {isSuccess
                                ? 'Your payment has been processed successfully'
                                : 'Your payment is being processed'}
                        </p>
                    </div>
                </div>

                {/* Payment Details */}
                <div className="p-8">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-gray-200">
                            <span className="text-gray-600 font-medium">Transaction Reference</span>
                            <span className="text-gray-900 font-mono text-sm">{paymentStatus?.txRef}</span>
                        </div>

                        <div className="flex justify-between items-center py-3 border-b border-gray-200">
                            <span className="text-gray-600 font-medium">Status</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${isSuccess
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {paymentStatus?.status?.toUpperCase() || 'PROCESSING'}
                            </span>
                        </div>

                        {paymentStatus?.payment && (
                            <>
                                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                                    <span className="text-gray-600 font-medium">Amount</span>
                                    <span className="text-gray-900 font-semibold text-lg">
                                        {paymentStatus.payment.amount?.toLocaleString()} {paymentStatus.payment.currency}
                                    </span>
                                </div>

                                {paymentStatus.payment.supplier && (
                                    <div className="flex justify-between items-center py-3 border-b border-gray-200">
                                        <span className="text-gray-600 font-medium">Supplier</span>
                                        <span className="text-gray-900 font-semibold">
                                            {paymentStatus.payment.supplier.companyName || paymentStatus.payment.supplier.name}
                                        </span>
                                    </div>
                                )}

                                {paymentStatus.payment.tender && (
                                    <div className="flex justify-between items-center py-3 border-b border-gray-200">
                                        <span className="text-gray-600 font-medium">Tender</span>
                                        <span className="text-gray-900 font-semibold">
                                            {paymentStatus.payment.tender.title}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}

                        {paymentStatus?.chapaData?.data?.reference && (
                            <div className="flex justify-between items-center py-3 border-b border-gray-200">
                                <span className="text-gray-600 font-medium">Chapa Reference</span>
                                <span className="text-gray-900 font-mono text-sm">
                                    {paymentStatus.chapaData.data.reference}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Success Message */}
                    {isSuccess && (
                        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-start">
                                <svg className="h-5 w-5 text-green-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <h3 className="text-sm font-semibold text-green-900">Payment Confirmed</h3>
                                    <p className="text-sm text-green-700 mt-1">
                                        The payment has been successfully processed. The supplier will be notified and the storekeeper can now receive the items.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-8 flex gap-4">
                        <button
                            onClick={handleBackToDashboard}
                            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                        >
                            Back to Finance Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;
