import { Link, useNavigate } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

const Home = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [stats, setStats] = useState({ activeUsers: null, tendersProcessed: null, totalBids: null });

    useEffect(() => {
        fetch('http://localhost:5000/api/stats')
            .then(res => res.json())
            .then(data => { if (data.success) setStats(data); })
            .catch(() => { });
    }, []);

    useEffect(() => {
        // Redirect logged-in users to their respective dashboards
        if (user) {
            switch (user.role) {
                case 'administrator':
                    navigate('/users');
                    break;
                case 'department_head':
                    navigate('/department-head');
                    break;
                case 'purchasing_team':
                    navigate('/purchasing-team');
                    break;
                case 'finance':
                    navigate('/finance');
                    break;
                case 'storekeeper':
                    navigate('/storekeeper');
                    break;
                case 'supplier':
                    navigate('/supplier');
                    break;
                default:
                    navigate('/dashboard');
            }
        }
    }, [user, navigate]);

    const features = [
        {
            title: 'Requisition Management',
            description: 'Create and track purchase requisitions with approval workflows',
            icon: '📋',
            gradient: 'from-blue-500 to-cyan-500',
            bgColor: 'bg-blue-50'
        },
        {
            title: 'Tender Management',
            description: 'Manage tender files and supplier bidding process',
            icon: '📄',
            gradient: 'from-purple-500 to-pink-500',
            bgColor: 'bg-purple-50'
        },
        {
            title: 'Bid Evaluation',
            description: 'Evaluate and compare supplier bids efficiently',
            icon: '⚖️',
            gradient: 'from-green-500 to-emerald-500',
            bgColor: 'bg-green-50'
        },
        {
            title: 'Budget Control',
            description: 'Check and allocate budgets in real-time',
            icon: '💰',
            gradient: 'from-yellow-500 to-orange-500',
            bgColor: 'bg-yellow-50'
        },
        {
            title: 'Multi-Role System',
            description: 'Role-based access for different departments',
            icon: '👥',
            gradient: 'from-red-500 to-rose-500',
            bgColor: 'bg-red-50'
        },
        {
            title: 'Messaging',
            description: 'Internal communication between stakeholders',
            icon: '💬',
            gradient: 'from-indigo-500 to-blue-500',
            bgColor: 'bg-indigo-50'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 pt-20 pb-32">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center space-y-8">
                        {/* Logo */}
                        <div className="flex justify-center mb-6">
                            <img src="/dtulogo.jpg" alt="DTU Logo" className="h-24 sm:h-32 w-auto rounded-2xl shadow-2xl" />
                        </div>

                        {/* Main Heading */}
                        <div className="space-y-4">
                            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight">
                                Welcome to
                            </h1>
                            <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold">
                                <span className="bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200 bg-clip-text text-transparent">
                                    E-Bid Processing System
                                </span>
                            </h2>
                        </div>

                        {/* Subtitle */}
                        <p className="max-w-3xl mx-auto text-xl sm:text-2xl text-indigo-100 font-light leading-relaxed">
                            Your comprehensive procurement and bidding platform for seamless operations
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
                            <Link
                                to="/register"
                                className="group relative px-10 py-4 bg-white text-indigo-600 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 w-full sm:w-auto overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    Get Started
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </span>
                            </Link>
                            <Link
                                to="/login"
                                className="px-10 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/40 rounded-2xl font-bold text-lg hover:bg-white/20 hover:border-white/60 transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 w-full sm:w-auto"
                            >
                                Login
                            </Link>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto pt-12">
                            {[
                                { number: stats.activeUsers !== null ? stats.activeUsers : '...', label: 'Active Users' },
                                { number: stats.tendersProcessed !== null ? stats.tendersProcessed : '...', label: 'Tenders Processed' },
                                { number: stats.totalBids !== null ? stats.totalBids : '...', label: 'Total Bids Submitted' }
                            ].map((stat, index) => (
                                <div key={index} className="text-center">
                                    <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{stat.number}</div>
                                    <div className="text-sm sm:text-base text-indigo-200">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Wave Divider */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                        <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="rgb(248 250 252)" />
                    </svg>
                </div>
            </div>

            {/* Features Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center mb-16">
                    <span className="inline-block px-4 py-2 bg-indigo-100 text-indigo-600 rounded-full text-sm font-semibold mb-4">
                        FEATURES
                    </span>
                    <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                        Why Choose Us?
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Powerful features designed to streamline your procurement process
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group relative bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 overflow-hidden border border-gray-100"
                        >
                            {/* Gradient Overlay */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

                            {/* Content */}
                            <div className="relative p-8">
                                {/* Icon */}
                                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white text-4xl mb-6 shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                                    {feature.icon}
                                </div>

                                {/* Title */}
                                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 transition-all duration-300">
                                    {feature.title}
                                </h3>

                                {/* Description */}
                                <p className="text-gray-600 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>

                            {/* Bottom Accent */}
                            <div className={`h-2 bg-gradient-to-r ${feature.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* How It Works Section */}
            <div className="bg-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-2 bg-purple-100 text-purple-600 rounded-full text-sm font-semibold mb-4">
                            PROCESS
                        </span>
                        <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                            How It Works
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Simple steps to streamline your procurement
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            { step: '1', title: 'Register', desc: 'Create your account', icon: '📝' },
                            { step: '2', title: 'Submit', desc: 'Create requisitions', icon: '📋' },
                            { step: '3', title: 'Evaluate', desc: 'Review bids', icon: '⚖️' },
                            { step: '4', title: 'Award', desc: 'Select winner', icon: '🏆' }
                        ].map((item, index) => (
                            <div key={index} className="relative text-center">
                                <div className="relative inline-block">
                                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl shadow-xl mx-auto mb-4 transform hover:scale-110 transition-transform duration-300">
                                        {item.icon}
                                    </div>
                                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-gray-900 font-bold text-lg shadow-lg">
                                        {item.step}
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                                <p className="text-gray-600">{item.desc}</p>
                                {index < 3 && (
                                    <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-indigo-300 to-purple-300 -ml-4"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-20">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                        Ready to Get Started?
                    </h2>
                    <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
                        Join us today and transform your procurement process with our powerful platform
                    </p>
                    <Link
                        to="/register"
                        className="inline-flex items-center gap-3 px-10 py-5 bg-white text-indigo-600 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300"
                    >
                        Create Your Account
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </div>

        </div>
    );
};

export default Home;
