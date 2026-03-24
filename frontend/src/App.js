import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import Requisitions from './pages/Requisitions';
import Tenders from './pages/Tenders';
import Bids from './pages/Bids';
import MyBids from './pages/MyBids';
import Approvals from './pages/Approvals';
import Budgets from './pages/Budgets';
import Users from './pages/Users';
import Messages from './pages/Messages';
import Storekeeper from './pages/Storekeeper';
import DepartmentHead from './pages/DepartmentHead';
import PurchasingTeam from './pages/PurchasingTeam';
import FinanceDepartment from './pages/FinanceDepartment';
import Supplier from './pages/Supplier';
import PaymentSuccess from './pages/PaymentSuccess';
import PrivateRoute from './components/PrivateRoute';

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="App flex flex-col min-h-screen">
                    <Navbar />
                    <main className="flex-grow">
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/verify-email/:token" element={<VerifyEmail />} />
                            <Route path="/payment/success" element={<PaymentSuccess />} />
                            <Route path="/dashboard" element={<PrivateRoute><AdminLayout><Dashboard /></AdminLayout></PrivateRoute>} />
                            <Route path="/department-head" element={<PrivateRoute><DepartmentHead /></PrivateRoute>} />
                            <Route path="/purchasing-team" element={<PrivateRoute><PurchasingTeam /></PrivateRoute>} />
                            <Route path="/finance" element={<PrivateRoute><FinanceDepartment /></PrivateRoute>} />
                            <Route path="/supplier" element={<PrivateRoute><Supplier /></PrivateRoute>} />
                            <Route path="/requisitions" element={<PrivateRoute><AdminLayout><Requisitions /></AdminLayout></PrivateRoute>} />
                            <Route path="/tenders" element={<PrivateRoute><AdminLayout><Tenders /></AdminLayout></PrivateRoute>} />
                            <Route path="/bids" element={<PrivateRoute><AdminLayout><Bids /></AdminLayout></PrivateRoute>} />
                            <Route path="/my-bids" element={<PrivateRoute><MyBids /></PrivateRoute>} />
                            <Route path="/approvals" element={<PrivateRoute><Approvals /></PrivateRoute>} />
                            <Route path="/budgets" element={<PrivateRoute><AdminLayout><Budgets /></AdminLayout></PrivateRoute>} />
                            <Route path="/storekeeper" element={<PrivateRoute><Storekeeper /></PrivateRoute>} />
                            <Route path="/users" element={<PrivateRoute><AdminLayout><Users /></AdminLayout></PrivateRoute>} />
                            <Route path="/messages" element={<PrivateRoute><AdminLayout><Messages /></AdminLayout></PrivateRoute>} />
                        </Routes>
                    </main>
                    <Footer />
                    <ToastContainer position="top-right" autoClose={3000} />
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
