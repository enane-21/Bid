import { useState, useEffect, useContext } from 'react';
import BASE_URL from '../services/baseUrl';
import { toast } from 'react-toastify';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Messages = () => {
    const { user } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCompose, setShowCompose] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [formData, setFormData] = useState({
        recipientId: '',
        subject: '',
        message: ''
    });

    useEffect(() => {
        fetchMessages();
        fetchUsers();
    }, []);

    const fetchMessages = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(BASE_URL + '/api/messages', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(res.data);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to fetch messages');
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(BASE_URL + '/api/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data.users || res.data);
        } catch (error) {
            console.error('Failed to fetch users');
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                BASE_URL + '/api/messages',
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Message sent successfully');
            setShowCompose(false);
            setFormData({ recipientId: '', subject: '', message: '' });
            fetchMessages();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send message');
        }
    };

    const handleReply = (message) => {
        setFormData({
            recipientId: message.sender._id,
            subject: `Re: ${message.subject}`,
            message: ''
        });
        setShowCompose(true);
    };

    const markAsRead = async (messageId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                BASE_URL + '/api/messages/' + messageId + '/read',
                {},
                { headers: { Authorization: 'Bearer ' + token } }
            );
            fetchMessages();
        } catch (error) {
            console.error('Failed to mark as read');
        }
    };

    const deleteMessage = async (messageId) => {
        if (!window.confirm('Are you sure you want to delete this message?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(BASE_URL + '/api/messages/' + messageId, {
                headers: { Authorization: 'Bearer ' + token }
            });
            toast.success('Message deleted');
            fetchMessages();
            setSelectedMessage(null);
        } catch (error) {
            toast.error('Failed to delete message');
        }
    };

    const getTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };

        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
            }
        }
        return 'Just now';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading messages...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">Messages</h1>
                            <p className="text-gray-600">Internal communication system</p>
                        </div>
                        <button
                            onClick={() => {
                                setFormData({ recipientId: '', subject: '', message: '' });
                                setShowCompose(true);
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Compose Message
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Messages List */}
                    <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg overflow-hidden">
                        <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                            <h2 className="text-lg font-bold">Inbox ({messages.length})</h2>
                        </div>
                        <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                            {messages.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <p>No messages yet</p>
                                </div>
                            ) : (
                                messages.map((message) => (
                                    <div
                                        key={message._id}
                                        onClick={() => {
                                            setSelectedMessage(message);
                                            if (!message.isRead && message.recipient._id === user.id) {
                                                markAsRead(message._id);
                                            }
                                        }}
                                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedMessage?._id === message._id ? 'bg-indigo-50' : ''
                                            } ${!message.isRead && message.recipient._id === user.id ? 'bg-blue-50' : ''}`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                                    {message.sender?.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{message.sender?.name}</p>
                                                    <p className="text-xs text-gray-500">{getTimeAgo(message.createdAt)}</p>
                                                </div>
                                            </div>
                                            {!message.isRead && message.recipient._id === user.id && (
                                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                            )}
                                        </div>
                                        <p className="font-medium text-gray-900 text-sm mb-1">{message.subject}</p>
                                        <p className="text-gray-600 text-sm truncate">{message.message}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Message Detail */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg overflow-hidden">
                        {selectedMessage ? (
                            <div className="h-full flex flex-col">
                                <div className="p-6 border-b border-gray-200">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                {selectedMessage.sender?.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{selectedMessage.sender?.name}</p>
                                                <p className="text-sm text-gray-500">{selectedMessage.sender?.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleReply(selectedMessage)}
                                                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-semibold hover:bg-indigo-100 transition-colors"
                                            >
                                                Reply
                                            </button>
                                            <button
                                                onClick={() => deleteMessage(selectedMessage._id)}
                                                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedMessage.subject}</h2>
                                    <p className="text-sm text-gray-500">{new Date(selectedMessage.createdAt).toLocaleString()}</p>
                                </div>
                                <div className="flex-1 p-6 overflow-y-auto">
                                    <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                <div className="text-center">
                                    <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-lg">Select a message to read</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Compose Modal */}
            {showCompose && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">Compose Message</h2>
                                <button
                                    onClick={() => setShowCompose(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSendMessage} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    To <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.recipientId}
                                    onChange={(e) => setFormData({ ...formData, recipientId: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                    required
                                >
                                    <option value="">Select recipient...</option>
                                    {users.filter(u => u._id !== user.id).map((u) => (
                                        <option key={u._id} value={u._id}>
                                            {u.name} ({u.role})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Subject <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                    placeholder="Enter subject..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Message <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                    rows="6"
                                    placeholder="Type your message..."
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCompose(false)}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                                >
                                    Send Message
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Messages;
