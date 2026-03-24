import { useState, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { authAPI } from '../services/api';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'supplier',
        companyName: '',
        tinNumber: '',
        fanNumber: '',
        finNumber: '',
        phone: '',
        address: ''
    });
    const [nationalIdPhoto, setNationalIdPhoto] = useState(null);
    const [selfiePhoto, setSelfiePhoto] = useState(null);
    const [nationalIdPreview, setNationalIdPreview] = useState(null);
    const [selfiePreview, setSelfiePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const nationalIdInputRef = useRef(null);
    const selfieInputRef = useRef(null);
    const videoRef = useRef(null);
    const [showCamera, setShowCamera] = useState(false);
    const [stream, setStream] = useState(null);
    const [cameraLoading, setCameraLoading] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    // Validation functions
    const validateTIN = (tin) => {
        return /^\d{10}$/.test(tin);
    };

    const validateFAN = (fan) => {
        return /^\d{16}$/.test(fan);
    };

    const validateFIN = (fin) => {
        return /^\d{12}$/.test(fin);
    };

    const validatePhone = (phone) => {
        // Accepts +2519XXXXXXXX (9 digits after +251) or 09XXXXXXXX (8 digits after 09)
        return /^(\+2519\d{8}|09\d{8})$/.test(phone);
    };

    const handlePhoneChange = (e) => {
        let value = e.target.value;
        // Remove any non-digit characters except +
        value = value.replace(/[^\d+]/g, '');

        // Auto-format: if starts with 09, keep it; if starts with 251, add +
        if (value.startsWith('251') && !value.startsWith('+251')) {
            value = '+' + value;
        }

        setFormData({ ...formData, phone: value });

        // Validate
        if (value && !validatePhone(value)) {
            setErrors({ ...errors, phone: 'Phone must be +2519XXXXXXXX or 09XXXXXXXX (8 digits)' });
        } else {
            const newErrors = { ...errors };
            delete newErrors.phone;
            setErrors(newErrors);
        }
    };

    const handleTINChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
        setFormData({ ...formData, tinNumber: value });

        if (value && !validateTIN(value)) {
            setErrors({ ...errors, tinNumber: 'TIN must be exactly 10 digits' });
        } else {
            const newErrors = { ...errors };
            delete newErrors.tinNumber;
            setErrors(newErrors);
        }
    };

    const handleFANChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 16);
        setFormData({ ...formData, fanNumber: value });

        if (value && !validateFAN(value)) {
            setErrors({ ...errors, fanNumber: 'FAN must be exactly 16 digits' });
        } else {
            const newErrors = { ...errors };
            delete newErrors.fanNumber;
            setErrors(newErrors);
        }
    };

    const handleFINChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 12);
        setFormData({ ...formData, finNumber: value });

        if (value && !validateFIN(value)) {
            setErrors({ ...errors, finNumber: 'FIN must be exactly 12 digits' });
        } else {
            const newErrors = { ...errors };
            delete newErrors.finNumber;
            setErrors(newErrors);
        }
    };

    const handleNationalIdChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }
            if (!file.type.startsWith('image/')) {
                toast.error('File must be an image');
                return;
            }
            setNationalIdPhoto(file);
            setNationalIdPreview(URL.createObjectURL(file));
        }
    };

    const handleSelfieChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }
            if (!file.type.startsWith('image/')) {
                toast.error('File must be an image');
                return;
            }
            setSelfiePhoto(file);
            setSelfiePreview(URL.createObjectURL(file));
        }
    };

    const startCamera = async () => {
        try {
            // Request camera with minimal constraints
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
                audio: false
            });

            setStream(mediaStream);
            setShowCamera(true);
            setCameraLoading(false);
            setCameraReady(true);

            // Assign video source after state updates
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                    videoRef.current.play().catch(() => { });
                }
            }, 0);
        } catch (error) {
            console.error('Camera error:', error);
            setCameraLoading(false);
            setCameraReady(false);
            setShowCamera(false);

            let errorMessage = 'Unable to access camera. ';
            if (error.name === 'NotAllowedError') {
                errorMessage += 'Please allow camera permissions.';
            } else if (error.name === 'NotFoundError') {
                errorMessage += 'No camera found.';
            } else {
                errorMessage += 'Please upload a photo instead.';
            }
            toast.error(errorMessage);
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !stream) {
            toast.error('Camera not available');
            return;
        }

        // Wait a tiny bit if video dimensions aren't ready yet
        if (videoRef.current.videoWidth === 0) {
            setTimeout(() => capturePhoto(), 100);
            return;
        }

        try {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth || 640;
            canvas.height = videoRef.current.videoHeight || 480;
            const ctx = canvas.getContext('2d');

            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' });
                    setSelfiePhoto(file);
                    setSelfiePreview(URL.createObjectURL(file));
                    stopCamera();
                    toast.success('Selfie captured successfully!');
                } else {
                    toast.error('Failed to capture photo. Please try again.');
                }
            }, 'image/jpeg', 0.92);
        } catch (error) {
            console.error('Capture error:', error);
            toast.error('Failed to capture photo. Please try again.');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setShowCamera(false);
        setCameraLoading(false);
        setCameraReady(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate all fields
        const newErrors = {};

        if (!validateTIN(formData.tinNumber)) {
            newErrors.tinNumber = 'TIN must be exactly 10 digits';
        }
        if (!validateFAN(formData.fanNumber)) {
            newErrors.fanNumber = 'FAN must be exactly 16 digits';
        }
        if (!validateFIN(formData.finNumber)) {
            newErrors.finNumber = 'FIN must be exactly 12 digits';
        }
        if (!validatePhone(formData.phone)) {
            newErrors.phone = 'Phone must be +2519XXXXXXXX or 09XXXXXXXX (8 digits)';
        }
        if (!nationalIdPhoto) {
            newErrors.nationalId = 'National ID photo is required';
        }
        if (!selfiePhoto) {
            newErrors.selfie = 'Selfie photo is required';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error('Please fix all validation errors');
            return;
        }

        setLoading(true);
        try {
            // Create FormData for file upload
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key]);
            });
            formDataToSend.append('nationalIdPhoto', nationalIdPhoto);
            formDataToSend.append('selfiePhoto', selfiePhoto);

            const res = await authAPI.register(formDataToSend);
            login(res.data.token, res.data.user);
            toast.success('Registration successful! Please check your email to verify your account.');
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full shadow-lg mb-4">
                        <span className="text-4xl">🏢</span>
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Supplier Registration</h1>
                    <p className="text-lg text-gray-600">Join our procurement platform as a supplier</p>
                </div>

                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                    <div className="p-8 md:p-12">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Personal Information */}
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                    <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                        <span className="text-green-600 font-bold">1</span>
                                    </span>
                                    Personal Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="group">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                                            placeholder="John Doe"
                                            required
                                        />
                                    </div>

                                    <div className="group">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Email Address <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                                            placeholder="you@company.com"
                                            required
                                        />
                                    </div>

                                    <div className="group">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Password <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>

                                    <div className="group">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Phone Number <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={handlePhoneChange}
                                            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 transition-all outline-none ${errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-green-500 focus:ring-green-100'
                                                }`}
                                            placeholder="+251912345678 or 0912345678"
                                            required
                                        />
                                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                        <p className="text-xs text-gray-500 mt-1">Format: +2519XXXXXXXX or 09XXXXXXXX</p>
                                    </div>
                                </div>

                                <div className="mt-5">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Address
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none"
                                        placeholder="123 Main St, City, Country"
                                    />
                                </div>
                            </div>

                            {/* Company Information */}
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                    <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                        <span className="text-green-600 font-bold">2</span>
                                    </span>
                                    Company Information
                                </h3>
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Company Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.companyName}
                                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none bg-white"
                                            placeholder="Your Company Ltd."
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                TIN Number (10 digits) <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.tinNumber}
                                                onChange={handleTINChange}
                                                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 transition-all outline-none bg-white ${errors.tinNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-green-200 focus:border-green-500 focus:ring-green-100'
                                                    }`}
                                                placeholder="1234567890"
                                                maxLength="10"
                                                required
                                            />
                                            {errors.tinNumber && <p className="text-red-500 text-xs mt-1">{errors.tinNumber}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                FAN Number (16 digits) <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.fanNumber}
                                                onChange={handleFANChange}
                                                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 transition-all outline-none bg-white ${errors.fanNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-green-200 focus:border-green-500 focus:ring-green-100'
                                                    }`}
                                                placeholder="1234567890123456"
                                                maxLength="16"
                                                required
                                            />
                                            {errors.fanNumber && <p className="text-red-500 text-xs mt-1">{errors.fanNumber}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                FIN Number (12 digits) <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.finNumber}
                                                onChange={handleFINChange}
                                                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 transition-all outline-none bg-white ${errors.finNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-green-200 focus:border-green-500 focus:ring-green-100'
                                                    }`}
                                                placeholder="123456789012"
                                                maxLength="12"
                                                required
                                            />
                                            {errors.finNumber && <p className="text-red-500 text-xs mt-1">{errors.finNumber}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Document Upload */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                    <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                        <span className="text-blue-600 font-bold">3</span>
                                    </span>
                                    Identity Verification
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* National ID Photo */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            National ID Photo <span className="text-red-500">*</span>
                                        </label>
                                        <div className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-blue-500 transition-all ${errors.nationalId ? 'border-red-500' : 'border-blue-300'
                                            }`} onClick={() => nationalIdInputRef.current?.click()}>
                                            {nationalIdPreview ? (
                                                <div className="relative">
                                                    <img src={nationalIdPreview} alt="National ID" className="max-h-48 mx-auto rounded-lg" />
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setNationalIdPhoto(null);
                                                            setNationalIdPreview(null);
                                                        }}
                                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="py-8">
                                                    <svg className="w-12 h-12 mx-auto text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                    <p className="text-sm text-gray-600">Click to upload National ID</p>
                                                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            ref={nationalIdInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleNationalIdChange}
                                            className="hidden"
                                        />
                                        {errors.nationalId && <p className="text-red-500 text-xs mt-1">{errors.nationalId}</p>}
                                    </div>

                                    {/* Selfie Photo */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Selfie Photo <span className="text-red-500">*</span>
                                        </label>
                                        {!showCamera ? (
                                            <div className={`border-2 border-dashed rounded-xl p-4 text-center ${errors.selfie ? 'border-red-500' : 'border-blue-300'
                                                }`}>
                                                {selfiePreview ? (
                                                    <div className="relative">
                                                        <img src={selfiePreview} alt="Selfie" className="max-h-48 mx-auto rounded-lg" />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelfiePhoto(null);
                                                                setSelfiePreview(null);
                                                            }}
                                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="py-6 space-y-3">
                                                        <button
                                                            type="button"
                                                            onClick={startCamera}
                                                            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold text-base flex items-center justify-center gap-2 shadow-md"
                                                        >
                                                            <span className="text-2xl">📸</span> Take Selfie with Camera
                                                        </button>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 border-t border-gray-300"></div>
                                                            <span className="text-xs text-gray-500 font-medium">OR</span>
                                                            <div className="flex-1 border-t border-gray-300"></div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => selfieInputRef.current?.click()}
                                                            className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold text-base flex items-center justify-center gap-2 shadow-md"
                                                        >
                                                            <span className="text-2xl">📁</span> Upload Photo from Device
                                                        </button>
                                                        <p className="text-xs text-gray-500 text-center mt-2">PNG, JPG, GIF up to 5MB</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="border-2 border-blue-500 rounded-xl p-4 bg-gray-900">
                                                {cameraLoading ? (
                                                    <div className="flex items-center justify-center bg-gray-800 rounded-lg" style={{ minHeight: '240px' }}>
                                                        <div className="text-center">
                                                            <svg className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            <p className="text-white text-sm">Starting camera...</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <video
                                                            ref={videoRef}
                                                            autoPlay
                                                            playsInline
                                                            muted
                                                            className="w-full rounded-lg mb-3 bg-black"
                                                            style={{ minHeight: '240px', maxHeight: '400px' }}
                                                        ></video>
                                                        {cameraReady && (
                                                            <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                                                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                                                Camera Ready
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex gap-2 mt-3">
                                                    <button
                                                        type="button"
                                                        onClick={capturePhoto}
                                                        disabled={cameraLoading || !cameraReady}
                                                        className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                    >
                                                        <span className="text-xl">📷</span> {cameraReady ? 'Capture' : 'Loading...'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={stopCamera}
                                                        className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-base flex items-center justify-center gap-2"
                                                    >
                                                        <span className="text-xl">✕</span> Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        <input
                                            ref={selfieInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleSelfieChange}
                                            className="hidden"
                                        />
                                        {errors.selfie && <p className="text-red-500 text-xs mt-1">{errors.selfie}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Info Box */}
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-blue-700">
                                            <strong>Note:</strong> Internal staff accounts (Department Heads, Finance, etc.) are created by the system administrator.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 px-8 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating your account...
                                    </span>
                                ) : (
                                    'Register as Supplier'
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-gray-600">
                                Already have an account?{' '}
                                <Link
                                    to="/login"
                                    className="font-bold text-green-600 hover:text-emerald-600 transition-colors"
                                >
                                    Sign in here
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
