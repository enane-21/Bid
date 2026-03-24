import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const authAPI = {
    register: (data) => axios.post(`${API_URL}/auth/register`, data),
    login: (data) => axios.post(`${API_URL}/auth/login`, data),
    getProfile: () => axios.get(`${API_URL}/auth/profile`)
};

export const requisitionAPI = {
    getAll: (params) => axios.get(`${API_URL}/requisitions`, { params }),
    getOne: (id) => axios.get(`${API_URL}/requisitions/${id}`),
    create: (data) => axios.post(`${API_URL}/requisitions`, data),
    approve: (id) => axios.put(`${API_URL}/requisitions/${id}/approve`),
    reject: (id, data) => axios.put(`${API_URL}/requisitions/${id}/reject`, data),
    arrange: (id) => axios.put(`${API_URL}/requisitions/${id}/arrange`)
};

export const tenderAPI = {
    getAll: (params) => axios.get(`${API_URL}/tenders`, { params }),
    getOne: (id) => axios.get(`${API_URL}/tenders/${id}`),
    create: (data) => axios.post(`${API_URL}/tenders`, data),
    disable: (id) => axios.put(`${API_URL}/tenders/${id}/disable`),
    close: (id) => axios.put(`${API_URL}/tenders/${id}/close`)
};

export const bidAPI = {
    submit: (data) => axios.post(`${API_URL}/bids`, data),
    getByTender: (tenderId) => axios.get(`${API_URL}/bids/tender/${tenderId}`),
    getSupplierBids: () => axios.get(`${API_URL}/bids/supplier`),
    evaluate: (id, data) => axios.put(`${API_URL}/bids/${id}/evaluate`, data),
    announceWinner: (id) => axios.put(`${API_URL}/bids/${id}/announce-winner`)
};

export const messageAPI = {
    send: (data) => axios.post(`${API_URL}/messages`, data),
    getReceived: () => axios.get(`${API_URL}/messages/received`),
    getSent: () => axios.get(`${API_URL}/messages/sent`),
    markAsRead: (id) => axios.put(`${API_URL}/messages/${id}/read`)
};

export const budgetAPI = {
    getAll: () => axios.get(`${API_URL}/budgets`),
    getOne: (id) => axios.get(`${API_URL}/budgets/${id}`),
    create: (data) => axios.post(`${API_URL}/budgets`, data),
    check: (data) => axios.post(`${API_URL}/budgets/check`, data),
    allocate: (id, data) => axios.put(`${API_URL}/budgets/${id}/allocate`, data)
};

export const userAPI = {
    getAll: () => axios.get(`${API_URL}/users`),
    getOne: (id) => axios.get(`${API_URL}/users/${id}`),
    update: (id, data) => axios.put(`${API_URL}/users/${id}`, data),
    delete: (id) => axios.delete(`${API_URL}/users/${id}`),
    approve: (id) => axios.put(`${API_URL}/users/${id}/approve`),
    verify: (id) => axios.put(`${API_URL}/users/${id}/verify`)
};

export const storekeeperAPI = {
    getPendingChecks: () => axios.get(`${API_URL}/storekeeper/pending-checks`),
    checkAvailability: (id, data) => axios.post(`${API_URL}/storekeeper/check-availability/${id}`, data),
    getPendingReceipts: () => axios.get(`${API_URL}/storekeeper/pending-receipts`),
    receiveItems: (id, data) => axios.post(`${API_URL}/storekeeper/receive-items/${id}`, data),
    getInventory: (params) => axios.get(`${API_URL}/storekeeper/inventory`, { params }),
    getInventoryItem: (id) => axios.get(`${API_URL}/storekeeper/inventory/${id}`),
    adjustInventory: (id, data) => axios.post(`${API_URL}/storekeeper/inventory/${id}/adjust`, data),
    getDashboard: () => axios.get(`${API_URL}/storekeeper/dashboard`)
};
