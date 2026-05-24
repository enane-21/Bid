import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const VerifyEmail = () => {
    const [loading, setLoading] = useState(true);
    const [verified, setVerified] = useState(false);
    const [error, setError] = useState('');
    const { token } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        verifyEmail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const verifyEmail = async () => {
        try {
            const res = await axios.get(BASE_URL + '/api/auth/verify-email/' + token);
            setVerified(true);
            toast.success(res.data.message);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'Verification failed');
            toast.error(error.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 p-8">
                    {loading ? (
                        <div className="text-center py-12">
                            <svg className="animate-spin h-16 w-16 text-green-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email...</h2>
                            <p className="text-gray-600">Please wait while we verify your email address.</p>
                        </div>
                    ) : verified ? (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
                            <p className="text-gray-600 mb-4">
                                Your email has been successfully verified.
                            </p>
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 text-left">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-blue-700">
                                            <strong>Next Step:</strong> Your account is now pending administrator approval. You will receive an email once your account is approved.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">Redirecting to login page...</p>
                            <Link
                                to="/login"
                                className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                            >
                                Go to Login
                            </Link>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
                                <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
                            <p className="text-gray-600 mb-6">{error}</p>
                            <div className="space-y-3">
                                <Link
                                    to="/login"
                                    className="block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                                >
                                    Go to Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
                                >
                                    Register Again
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
