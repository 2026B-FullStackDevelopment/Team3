import React, { useState } from 'react';

export default function FoodBrowsing({ listings, isLoading, error, onSelectItem }) {
  const [searchTerm, setSearchTerm] = useState('');

  if (isLoading) return <div className="loading">Loading active donations...</div>;
  if (error) return <div className="error-banner">Error: {error}</div>;
  if (!listings || listings.length === 0) return <div>No active listings found.</div>;

  return (
    <div className="food-browsing-wrapper">
      {/* Search and Filters */}
      <div className="filters-bar">
        <input 
          type="text" 
          placeholder="Search by name (e.g. Bread, Rice)" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select className="filter-dropdown"><option>City</option></select>
        <select className="filter-dropdown"><option>Category</option></select>
        <select className="filter-dropdown"><option>Price</option></select>
      </div>

      {/* Food Grid */}
      <div className="food-grid">
        {listings.map((item) => (
          <div key={item._id || item.id} className="food-card">
            <div className="card-image-container">
               <span className="category-badge">{item.foodCategory}</span>
               <img src={item.imageUrl} alt={item.name} className="food-image" />
            </div>
            
            <div className="card-content">
              <h3>{item.name}</h3>
              <p className="donor-name">{item.donorName || 'Local Farm'}</p>
              
              <div className="card-footer">
                <span className="stock-info">{item.remainingQuantity} {item.measurementUnit} left</span>
                <span className="price">
                  {item.price === 0 ? 'FREE' : `${item.price.toLocaleString()} VND`}
                </span>
              </div>
              
              <button 
                className="btn-reserve" 
                onClick={() => onSelectItem(item)}
              >
                View and Reserve
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}