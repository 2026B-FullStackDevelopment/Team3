import { useState } from 'react';
import { formatDateTime } from '@/shared/utils/formatters.js';

export default function FoodBrowsing({ listings, isLoading, error, onSelectItem }) {
  const [searchTerm, setSearchTerm] = useState('');

  if (isLoading) return <div className="loading">Loading active donations...</div>;
  if (error) return <div className="error-banner">Error: {error}</div>;
  if (!listings || listings.length === 0) return <div>No active listings found.</div>;

  // Filter listings based on the search input
  const filteredListings = listings.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="food-browsing-wrapper">
      {/* Search and Filters */}
      <div className="filters-bar">
        <div className="search-wrapper">
          <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name (e.g. Bread, Rice)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        {/* Mockup filter icon */}
        <svg className="filter-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        <select className="filter-dropdown"><option>City</option></select>
        <select className="filter-dropdown"><option>Category</option></select>
        <select className="filter-dropdown"><option>Price</option></select>
      </div>

      {/* Food Grid */}
      <div className="food-grid">
        {filteredListings.length > 0 ? (
          filteredListings.map((item) => {
            const allowsOnlineReservation =
              item.reservationPolicy?.allowsOnlineReservation ??
              item.measurementUnit !== 'PerRequest';

            return (
            <div key={item._id || item.id} className="food-card">
              <div className="card-image-container">
                <span className="category-badge">{item.foodCategory}</span>
                <span className={`vegetarian-badge ${item.isVegetarian ? 'is-vegetarian' : ''}`}>
                  {item.isVegetarian ? 'Vegetarian' : 'Non-vegetarian'}
                </span>
                <img src={item.imageUrl} alt={item.name} className="food-image" />
              </div>
              
              <div className="card-content">
                <h3>{item.name}</h3>
                <p className="donor-name">{item.donorName || 'Local Donor'}</p>
                <div className="listing-meta">
                  <span>{item.donorMunicipality || 'Municipality unavailable'}</span>
                  <span>Posted {formatDateTime(item.createdAt)}</span>
                </div>
                
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
                  {allowsOnlineReservation ? 'View and Reserve' : 'View Details'}
                </button>
              </div>
            </div>
            );
          })
        ) : (
          <div className="no-results">No food listings match your search.</div>
        )}
      </div>
    </div>
  );
}
