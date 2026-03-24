import { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const AdminLayout = ({ children }) => {
    const { user } = useContext(AuthContext);
    const location = useLocation();

    // Only show sidebar for administrators
    if (user?.role !== 'administrator') {
        return <>{children}</>;
    }

    const adminMenuItems = [
        {
            title: 'Dashboard',
            path: '/dashboard',
            icon: '📊',
            description: 'Overview & Statistics'
        },
        {
            title: 'User Management',
            path: '/users',
            icon: '👥',
            description: 'Manage Staff & Suppliers'
        },
        {
            title: 'Requisitions',
            path: '/requisitions',
            icon: '📋',
            description: 'View All Requisitions'
        },
        {
            title: 'Tenders',
            path: '/tenders',
            icon: '📄',
            description: 'Manage Tender Files'
        },
        {
            title: 'Bids',
            path: '/bids',
            icon: '💼',
            description: 'Review All Bids'
        },
        {
            title: 'Budgets',
            path: '/budgets',
            icon: '💰',
            description: 'Budget Management'
        },
        {
            title: 'Messages',
            path: '/messages',
            icon: '💬',
            description: 'Communication Center'
        }
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Sidebar */}
            <aside className="w-80 bg-white shadow-2xl border-r border-gray-200 fixed h-screen overflow-y-auto">
                {/* Sidebar Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl">
                            ⚙️
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Admin Panel</h2>
                            <p className="text-indigo-100 text-sm">System Management</p>
                        </div>
                    </div>
                </div>

                {/* Admin Info */}
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{user?.name}</p>
                            <p className="text-xs text-gray-600 truncate">{user?.email}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="p-4">
                    <div className="mb-3">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 mb-2">
                            Admin Tasks
                        </h3>
                    </div>
                    <ul className="space-y-1">
                        {adminMenuItems.map((item) => (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    className={`
                                        flex items-start gap-3 px-4 py-3 rounded-xl transition-all duration-200
                                        ${isActive(item.path)
                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-105'
                                            : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                                        }
                                    `}
                                >
                                    <span className="text-2xl flex-shrink-0">{item.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className={`font-semibold ${isActive(item.path) ? 'text-white' : 'text-gray-900'}`}>
                                            {item.title}
                                        </div>
                                        <div className={`text-xs ${isActive(item.path) ? 'text-indigo-100' : 'text-gray-500'}`}>
                                            {item.description}
                                        </div>
                                    </div>
                                    {isActive(item.path) && (
                                        <div className="flex-shrink-0">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Quick Stats */}
                <div className="p-4 border-t border-gray-200 mt-4">
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4">
                        <h4 className="text-sm font-bold text-gray-700 mb-3">Quick Access</h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">System Status</span>
                                <span className="flex items-center gap-1 text-green-600 font-semibold">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Online
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Role</span>
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                                    Administrator
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-80">
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;
