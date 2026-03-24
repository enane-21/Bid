import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { productAPI, bidAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './ProductDetail.css';

const ProductDetail = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const [product, setProduct] = useState(null);
    const [bids, setBids] = useState([]);
    const [bidAmount, setBidAmount] = useState('');

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            const res = await productAPI.getOne(id);
            setProduct(res.data.product);
            setBids(res.data.bids);
        } catch (error) {
            toast.error('Error loading product');
        }
    };

    const handlePlaceBid = async (e) => {
        e.preventDefault();
        if (!user) {
            toast.error('Please login to place a bid');
            return;
        }

        try {
            await bidAPI.place({ productId: id, amount: parseFloat(bidAmount) });
            toast.success('Bid placed successfully!');
            setBidAmount('');
            fetchProduct();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to place bid');
        }
    };

    if (!product) return <div className="container">Loading...</div>;

    return (
        <div className="container product-detail">
            <div className="product-main">
                <h1>{product.title}</h1>
                <p className="description">{product.description}</p>

                <div className="product-meta">
                    <p><strong>Category:</strong> {product.category}</p>
                    <p><strong>Starting Price:</strong> ${product.startingPrice}</p>
                    <p><strong>Current Price:</strong> ${product.currentPrice}</p>
                    <p><strong>Status:</strong> {product.status}</p>
                    <p><strong>Ends:</strong> {new Date(product.endTime).toLocaleString()}</p>
                    <p><strong>Seller:</strong> {product.seller?.name}</p>
                </div>

                {user && product.status === 'active' && (
                    <form onSubmit={handlePlaceBid} className="bid-form">
                        <h3>Place Your Bid</h3>
                        <input
                            type="number"
                            placeholder="Enter bid amount"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            min={product.currentPrice + 1}
                            required
                        />
                        <button type="submit" className="btn btn-primary">Place Bid</button>
                    </form>
                )}
            </div>

            <div className="bid-history">
                <h2>Bid History</h2>
                {bids.length > 0 ? (
                    <div className="bids-list">
                        {bids.map(bid => (
                            <div key={bid._id} className="bid-entry">
                                <p><strong>{bid.bidder?.name}</strong></p>
                                <p>${bid.amount}</p>
                                <p className="timestamp">{new Date(bid.timestamp).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No bids yet</p>
                )}
            </div>
        </div>
    );
};

export default ProductDetail;
