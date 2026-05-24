import { useState, useEffect } from 'react';
import BASE_URL from '../services/baseUrl';
import { toast } from 'react-toastify';
import axios from 'axios';

const Storekeeper = () => {
    const [activeTab, setActiveTab] = useState('inventory');
    const [inventory, setInventory] = useState([]);
    const [pendingChecks, setPendingChecks] = useState([]);
    const [pendingReceipts, setPendingReceipts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showCheckModal, setShowCheckModal] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [selectedRequisition, setSelectedRequisition] = useState(null);
    const [formData, setFormData] = useState({
        itemName: '',
        category: '',
        description: '',
        quantity: '',
        location: 'Main Store'
    });
    const [checkData, setCheckData] = useState({
        isAvailableInStore: false,
        notes: ''
    });
    const [receiptData, setReceiptData] = useState({
        quantityReceived: '',
        notes: ''
    });

    const categories = [
        'Office Supplies',
        'Laboratory Equipment',
        'Furniture',
        'Electronics',
        'Cleaning Supplies',
        'Medical Supplies',
        'Books & Publications',
        'Other'
    ];

    useEffect(() => {
        fetchAllData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        await Promise.all([
            fetchInventory(),
            fetchPendingChecks(),
            fetchPendingReceipts()
        ]);
        setLoading(false);
    };

    const fetchInventory = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(BASE_URL + '/api/storekeeper/inventory', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInventory(res.data.inventory || []);
        } catch (error) {
            toast.error('Failed to fetch inventory');
        }
    };

    const fetchPendingChecks = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(BASE_URL + '/api/storekeeper/pending-checks', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingChecks(res.data.requisitions || []);
        } catch (error) {
            console.error('Failed to fetch pending checks:', error);
        }
    };

    const fetchPendingReceipts = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(BASE_URL + '/api/storekeeper/pending-receipts', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingReceipts(res.data.requisitions || []);
        } catch (error) {
            console.error('Failed to fetch pending receipts:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const dataToSend = {
                ...formData,
                quantity: parseInt(formData.quantity) || 0
            };

            if (editingItem) {
                await axios.put(
                    BASE_URL + '/api/storekeeper/inventory/' + editingItem._id,
                    dataToSend,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success('Inventory item updated successfully');
            } else {
                await axios.post(
                    BASE_URL + '/api/storekeeper/inventory',
                    dataToSend,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                toast.success('Inventory item registered successfully');
            }

            setShowModal(false);
            resetForm();
            fetchInventory();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            itemName: item.itemName,
            category: item.category,
            description: item.description || '',
            quantity: item.quantity,
            location: item.location || 'Main Store'
        });
        setShowModal(true);
    };

    const handleDelete = async (itemId) => {
        if (!window.confirm('Are you sure you want to delete this inventory item?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(BASE_URL + '/api/storekeeper/inventory/' + itemId, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Inventory item deleted successfully');
            fetchInventory();
        } catch (error) {
            toast.error('Failed to delete inventory item');
        }
    };

    const handleCheckAvailability = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                BASE_URL + '/api/storekeeper/check-availability/' + selectedRequisition._id,
                checkData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (checkData.isAvailableInStore) {
                toast.success('Items available in store. Requisition completed.');
            } else {
                toast.success('Requisition forwarded to Finance Department for budget verification.');
            }

            setShowCheckModal(false);
            setSelectedRequisition(null);
            setCheckData({ isAvailableInStore: false, notes: '' });
            fetchPendingChecks();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to check availability');
        }
    };

    const handleReceiveItems = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                BASE_URL + '/api/storekeeper/receive-items/' + selectedRequisition._id,
                receiptData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('Items received and added to inventory successfully');
            setShowReceiptModal(false);
            setSelectedRequisition(null);
            setReceiptData({ quantityReceived: '', notes: '' });
            fetchPendingReceipts();
            fetchInventory();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to receive items');
        }
    };

    const resetForm = () => {
        setFormData({
            itemName: '',
            category: '',
            description: '',
            quantity: '',
            location: 'Main Store'
        });
        setEditingItem(null);
    };

    const getStockStatus = (quantity) => {
        if (quantity === 0) {
            return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
        } else if (quantity < 10) {
            return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
        } else {
            return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Storekeeper Dashboard</h1>
                    <p className="text-gray-600">Manage inventory, check requisitions, and receive items</p>
                </div>

                {/* Tabs */}
                <div className="mb-6 border-b border-gray-200">
                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('inventory')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'inventory'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                                Inventory Management
                                <span className="ml-2 bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full text-xs font-semibold">
                                    {inventory.length}
                                </span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('checks')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'checks'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Requisition Checks
                                {pendingChecks.length > 0 && (
                                    <span className="ml-2 bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full text-xs font-semibold">
                                        {pendingChecks.length}
                                    </span>
                                )}
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('receipts')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'receipts'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                                Item Receipts
                                {pendingReceipts.length > 0 && (
                                    <span className="ml-2 bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-semibold">
                                        {pendingReceipts.length}
                                    </span>
                                )}
                            </div>
                        </button>
                    </nav>
                </div>

                {/* Tab Content */}
                {activeTab === 'inventory' && (
                    <>
                        {/* Inventory Header */}
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
                                <p className="text-gray-600 mt-1">Register, update, and manage university store inventory</p>
                            </div>
                            <button
                                onClick={() => {
                                    resetForm();
                                    setShowModal(true);
                                }}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Register New Item
                            </button>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-indigo-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Items</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">{inventory.length}</p>
                                    </div>
                                    <div className="bg-indigo-100 rounded-full p-3">
                                        <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">In Stock</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">
                                            {inventory.filter(item => item.quantity >= 10).length}
                                        </p>
                                    </div>
                                    <div className="bg-green-100 rounded-full p-3">
                                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Low Stock</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">
                                            {inventory.filter(item => item.quantity > 0 && item.quantity < 10).length}
                                        </p>
                                    </div>
                                    <div className="bg-yellow-100 rounded-full p-3">
                                        <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-red-500">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">
                                            {inventory.filter(item => item.quantity === 0).length}
                                        </p>
                                    </div>
                                    <div className="bg-red-100 rounded-full p-3">
                                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Inventory Table */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-2xl font-bold text-gray-900">Inventory Items</h2>
                                <p className="text-gray-600 mt-1">All items currently available in the university store</p>
                            </div>

                            {inventory.length === 0 ? (
                                <div className="text-center py-12">
                                    <svg className="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                    </svg>
                                    <p className="text-gray-500 text-lg">No inventory items registered yet</p>
                                    <button
                                        onClick={() => setShowModal(true)}
                                        className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                        Register First Item
                                    </button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Item Name</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Category</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Quantity</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Location</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Last Updated</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {inventory.map((item) => {
                                                const status = getStockStatus(item.quantity);
                                                return (
                                                    <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-semibold text-gray-900">{item.itemName}</div>
                                                            {item.description && (
                                                                <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                                {item.category}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-lg font-bold text-gray-900">{item.quantity}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-600">
                                                            {item.location || 'Main Store'}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}>
                                                                {status.label}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-600">
                                                            {new Date(item.updatedAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-medium">
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleEdit(item)}
                                                                    className="text-indigo-600 hover:text-indigo-900 font-semibold"
                                                                >
                                                                    Update
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(item._id)}
                                                                    className="text-red-600 hover:text-red-900 font-semibold"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Requisition Checks Tab */}
                {activeTab === 'checks' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Requisition Availability Checks</h2>
                            <p className="text-gray-600 mt-1">Check if requested items are available in store</p>
                        </div>

                        {pendingChecks.length === 0 ? (
                            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                                <svg className="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                                <p className="text-gray-500 text-lg">No requisitions pending availability check</p>
                                <p className="text-gray-400 text-sm mt-2">Requisitions approved by Department Head will appear here</p>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {pendingChecks.map((req) => (
                                    <div key={req._id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <h3 className="text-xl font-bold text-gray-900">{req.title}</h3>
                                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                                                        Approved by Head
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 mb-4">{req.description}</p>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                    <div>
                                                        <p className="text-xs text-gray-500 font-semibold">Department</p>
                                                        <p className="text-sm text-gray-900">{req.requestedBy?.department || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 font-semibold">Requested By</p>
                                                        <p className="text-sm text-gray-900">{req.requestedBy?.name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 font-semibold">Category</p>
                                                        <p className="text-sm text-gray-900">{req.category}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 font-semibold">Quantity</p>
                                                        <p className="text-sm text-gray-900 font-bold">{req.quantity}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-xs text-gray-500 font-semibold">Estimated Budget</p>
                                                        <p className="text-sm text-gray-900">ETB {req.estimatedBudget?.toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 font-semibold">Urgency</p>
                                                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${req.urgency === 'high' ? 'bg-red-100 text-red-800' :
                                                            req.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-green-100 text-green-800'
                                                            }`}>
                                                            {req.urgency}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setSelectedRequisition(req);
                                                    setShowCheckModal(true);
                                                }}
                                                className="ml-4 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                                            >
                                                Check Availability
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Item Receipts Tab */}
                {activeTab === 'receipts' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Pending Item Receipts</h2>
                            <p className="text-gray-600 mt-1">Receive items from suppliers and add to inventory</p>
                        </div>

                        {pendingReceipts.length === 0 ? (
                            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                                <svg className="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                                <p className="text-gray-500 text-lg">No items pending receipt</p>
                                <p className="text-gray-400 text-sm mt-2">Items ordered from suppliers will appear here</p>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {pendingReceipts.map((req) => (
                                    <div key={req._id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <h3 className="text-xl font-bold text-gray-900">{req.title}</h3>
                                                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                                        Items Ordered
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 mb-4">{req.description}</p>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                    <div>
                                                        <p className="text-xs text-gray-500 font-semibold">Department</p>
                                                        <p className="text-sm text-gray-900">{req.requestedBy?.department || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 font-semibold">Requested By</p>
                                                        <p className="text-sm text-gray-900">{req.requestedBy?.name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 font-semibold">Category</p>
                                                        <p className="text-sm text-gray-900">{req.category}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 font-semibold">Quantity Ordered</p>
                                                        <p className="text-sm text-gray-900 font-bold">{req.quantity}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setSelectedRequisition(req);
                                                    setReceiptData({ quantityReceived: req.quantity.toString(), notes: '' });
                                                    setShowReceiptModal(true);
                                                }}
                                                className="ml-4 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                                            >
                                                Receive Items
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Register/Update Inventory Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {editingItem ? 'Update Inventory Item' : 'Register New Inventory Item'}
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Item Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.itemName}
                                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                    placeholder="e.g., A4 Paper, Laptop, Desk Chair"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                    required
                                >
                                    <option value="">Select category...</option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                    rows="3"
                                    placeholder="Additional details about the item..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Quantity <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                    placeholder="Enter quantity"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Storage Location
                                </label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                    placeholder="e.g., Main Store, Room 101, Shelf A"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                                >
                                    {editingItem ? 'Update Item' : 'Register Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Check Availability Modal */}
            {showCheckModal && selectedRequisition && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">Check Item Availability</h2>
                                <button
                                    onClick={() => {
                                        setShowCheckModal(false);
                                        setSelectedRequisition(null);
                                        setCheckData({ isAvailableInStore: false, notes: '' });
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleCheckAvailability} className="p-6 space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <h3 className="font-bold text-gray-900 mb-2">{selectedRequisition.title}</h3>
                                <p className="text-sm text-gray-600 mb-3">{selectedRequisition.description}</p>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-gray-500">Category:</span>
                                        <span className="ml-2 font-semibold">{selectedRequisition.category}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Quantity:</span>
                                        <span className="ml-2 font-semibold">{selectedRequisition.quantity}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-3">
                                    Is this item available in store? <span className="text-red-500">*</span>
                                </label>
                                <div className="space-y-3">
                                    <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                        <input
                                            type="radio"
                                            name="availability"
                                            checked={checkData.isAvailableInStore === true}
                                            onChange={() => setCheckData({ ...checkData, isAvailableInStore: true })}
                                            className="w-4 h-4 text-indigo-600"
                                        />
                                        <div className="ml-3">
                                            <p className="font-semibold text-gray-900">Yes, available in store</p>
                                            <p className="text-sm text-gray-500">Items will be issued from inventory and requisition will be completed</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                        <input
                                            type="radio"
                                            name="availability"
                                            checked={checkData.isAvailableInStore === false}
                                            onChange={() => setCheckData({ ...checkData, isAvailableInStore: false })}
                                            className="w-4 h-4 text-indigo-600"
                                        />
                                        <div className="ml-3">
                                            <p className="font-semibold text-gray-900">No, not available in store</p>
                                            <p className="text-sm text-gray-500">Requisition will be forwarded to Finance for budget verification</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={checkData.notes}
                                    onChange={(e) => setCheckData({ ...checkData, notes: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                    rows="3"
                                    placeholder="Add any additional notes about availability..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCheckModal(false);
                                        setSelectedRequisition(null);
                                        setCheckData({ isAvailableInStore: false, notes: '' });
                                    }}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg"
                                >
                                    Submit Check
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Receive Items Modal */}
            {showReceiptModal && selectedRequisition && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">Receive Items from Supplier</h2>
                                <button
                                    onClick={() => {
                                        setShowReceiptModal(false);
                                        setSelectedRequisition(null);
                                        setReceiptData({ quantityReceived: '', notes: '' });
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleReceiveItems} className="p-6 space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <h3 className="font-bold text-gray-900 mb-2">{selectedRequisition.title}</h3>
                                <p className="text-sm text-gray-600 mb-3">{selectedRequisition.description}</p>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-gray-500">Category:</span>
                                        <span className="ml-2 font-semibold">{selectedRequisition.category}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Quantity Ordered:</span>
                                        <span className="ml-2 font-semibold">{selectedRequisition.quantity}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Quantity Received <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={receiptData.quantityReceived}
                                    onChange={(e) => setReceiptData({ ...receiptData, quantityReceived: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                    placeholder="Enter quantity received"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">Items will be automatically added to inventory</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Receipt Notes (Optional)
                                </label>
                                <textarea
                                    value={receiptData.notes}
                                    onChange={(e) => setReceiptData({ ...receiptData, notes: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                    rows="3"
                                    placeholder="Add notes about the received items (condition, packaging, etc.)"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowReceiptModal(false);
                                        setSelectedRequisition(null);
                                        setReceiptData({ quantityReceived: '', notes: '' });
                                    }}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-lg"
                                >
                                    Confirm Receipt
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Storekeeper;
