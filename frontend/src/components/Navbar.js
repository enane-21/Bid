import { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setShowUserMenu(false);
    };

    const isActive = (path) => location.pathname === path;

    const roleConfig = {
        department_head: {
            label: 'Department Head',
            icon: '🏢',
            color: 'from-blue-500 to-cyan-500',
            links: [
                { path: '/department-head', label: 'Dashboard', icon: '📊' },
                { path: '/messages', label: 'Messages', icon: '💬' }
            ]
        },
        purchasing_team: {
            label: 'Purchasing Team',
            icon: '📋',
            color: 'from-green-500 to-emerald-500',
            links: [
                { path: '/purchasing-team', label: 'Dashboard', icon: '📊' },
                { path: '/messages', label: 'Messages', icon: '💬' }
            ]
        },
        finance: {
            label: 'Finance',
            icon: '💰',
            color: 'from-yellow-500 to-orange-500',
            links: [
                { path: '/finance', label: 'Dashboard', icon: '📊' },
                { path: '/messages', label: 'Messages', icon: '💬' }
            ]
        },
        supplier: {
            label: 'Supplier',
            icon: '📦',
            color: 'from-purple-500 to-pink-500',
            links: [
                { path: '/supplier', label: 'Dashboard', icon: '📊' },
                { path: '/messages', label: 'Messages', icon: '💬' }
            ]
        },
        storekeeper: {
            label: 'Storekeeper',
            icon: '📦',
            color: 'from-indigo-500 to-purple-500',
            links: [
                { path: '/storekeeper', label: 'Inventory', icon: '📦' },
                { path: '/messages', label: 'Messages', icon: '💬' }
            ]
        },
        administrator: {
            label: 'Administrator',
            icon: '⚙️',
            color: 'from-red-500 to-rose-500',
            links: [
                { path: '/dashboard', label: 'Dashboard', icon: '📊' },
                { path: '/users', label: 'Users', icon: '👥' },
                { path: '/requisitions', label: 'Requisitions', icon: '📋' },
                { path: '/tenders', label: 'Tenders', icon: '📄' },
                { path: '/bids', label: 'Bids', icon: '💼' },
                { path: '/budgets', label: 'Budgets', icon: '💰' }
            ]
        }
    };

    const config = user ? roleConfig[user.role] : null;

    return (
        <nav className="navbar-modern">
            <div className="navbar-container">
                {/* Logo */}
                <Link to="/" className="navbar-logo">
                    <div className="logo-wrapper">
                        <img src="/dtulogo.jpg" alt="DTU Logo" className="logo-image" />
                        <div className="logo-text">
                            <span className="logo-title">E-Bid System</span>
                            <span className="logo-subtitle">Procurement Platform</span>
                        </div>
                    </div>
                </Link>

                {/* Navigation Links */}
                {user && config && (
                    <div className="nav-links-modern">
                        {config.links.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
                            >
                                <span className="nav-link-icon">{link.icon}</span>
                                <span className="nav-link-text">{link.label}</span>
                                {isActive(link.path) && <div className="nav-link-indicator" />}
                            </Link>
                        ))}
                    </div>
                )}

                {/* User Menu or Auth Buttons */}
                {user ? (
                    <div className="user-menu-wrapper">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="user-menu-trigger"
                        >
                            <div className={`user-avatar bg-gradient-to-br ${config?.color || 'from-gray-500 to-gray-600'}`}>
                                {user.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="user-info">
                                <span className="user-name">{user.name}</span>
                                <span className="user-role">{config?.label || user.role}</span>
                            </div>
                            <svg
                                className={`chevron ${showUserMenu ? 'rotate' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showUserMenu && (
                            <>
                                <div className="menu-backdrop" onClick={() => setShowUserMenu(false)} />
                                <div className="user-dropdown">
                                    <div className="dropdown-header">
                                        <div className={`dropdown-avatar bg-gradient-to-br ${config?.color}`}>
                                            {user.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="dropdown-name">{user.name}</p>
                                            <p className="dropdown-email">{user.email}</p>
                                            <span className={`dropdown-badge bg-gradient-to-r ${config?.color}`}>
                                                {config?.icon} {config?.label}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="dropdown-divider" />
                                    <button onClick={handleLogout} className="dropdown-logout">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Logout
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="auth-buttons">
                        <Link to="/login" className="btn-login">Login</Link>
                        <Link to="/register" className="btn-register">Get Started</Link>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
