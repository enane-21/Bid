import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../services/api';
import './ProductList.css';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [filters, setFilters] = useState({ search: '', status: 'active' });

    useEffect(() => {
        fetchProducts();
    }, [filters]);

    const fetchProducts = async () => {
        try {
            const res = await productAPI.getAll(filters);
            setProducts(res.data.products);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    return (
        <div className="container product-list-page">
            <h1>Active Auctions</h1>

            <div className="filters">
                <input
                    type="text"
                    placeholder="Search auctions..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
            </div>

            <div className="grid">
                {products.map(product => (
                    <Link to={`/products/${product._id}`} key={product._id} className="product-card">
                        <h3>{product.title}</h3>
                        <p className="description">{product.description.substring(0, 100)}...</p>
                        <div className="product-info">
                            <p><strong>Current Price:</strong> ${product.currentPrice}</p>
                            <p><strong>Status:</strong> {product.status}</p>
                            <p><strong>Ends:</strong> {new Date(product.endTime).toLocaleDateString()}</p>
                        </div>
                    </Link>
                ))}
            </div>

            {products.length === 0 && (
                <p className="no-products">No auctions found</p>
            )}
        </div>
    );
};

export default ProductList;
