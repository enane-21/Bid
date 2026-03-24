import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { productAPI } from '../services/api';
import './CreateProduct.css';

const CreateProduct = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        startingPrice: '',
        startTime: '',
        endTime: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await productAPI.create(formData);
            toast.success('Auction created successfully!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create auction');
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="container create-product">
            <h1>Create New Auction</h1>
            <form onSubmit={handleSubmit} className="card">
                <div className="form-group">
                    <label>Title</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Category</label>
                    <input
                        type="text"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Starting Price ($)</label>
                    <input
                        type="number"
                        name="startingPrice"
                        value={formData.startingPrice}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Start Time</label>
                    <input
                        type="datetime-local"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>End Time</label>
                    <input
                        type="datetime-local"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleChange}
                        required
                    />
                </div>

                <button type="submit" className="btn btn-primary">Create Auction</button>
            </form>
        </div>
    );
};

export default CreateProduct;
