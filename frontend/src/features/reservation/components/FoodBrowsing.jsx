import { VN_CITIES } from '@/config/constants.js';
import { formatDateTime } from '@/shared/utils/formatters.js';

const CATEGORY_OPTIONS = [
  { value: 'Fruit', label: 'Fruit' },
  { value: 'Vegetable', label: 'Vegetable' },
  { value: 'Meat', label: 'Meat' },
  { value: 'CookedDish', label: 'Cooked Dish' },
  { value: 'BakedGoods', label: 'Baked Goods' },
  { value: 'Drink', label: 'Drink' },
];

export default function FoodBrowsing({
  listings,
  isLoading,
  error,
  filters,
  onFiltersChange,
  onResetFilters,
  onSelectItem,
}) {
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="food-browsing-wrapper">
      <div className="filters-bar">
        <div className="search-wrapper">
          <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search by food name"
            value={filters.search}
            onChange={(event) => onFiltersChange({ search: event.target.value })}
            className="search-input"
          />
        </div>

        <select
          className="filter-dropdown"
          aria-label="Filter by municipality"
          value={filters.municipality}
          onChange={(event) => onFiltersChange({ municipality: event.target.value })}
        >
          <option value="">All municipalities</option>
          {VN_CITIES.map((city) => <option key={city} value={city}>{city}</option>)}
        </select>

        <select
          className="filter-dropdown"
          aria-label="Filter by category"
          value={filters.foodCategory}
          onChange={(event) => onFiltersChange({ foodCategory: event.target.value })}
        >
          <option value="">All categories</option>
          {CATEGORY_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select
          className="filter-dropdown"
          aria-label="Filter or sort by price"
          value={filters.priceOption}
          onChange={(event) => onFiltersChange({ priceOption: event.target.value })}
        >
          <option value="">All prices</option>
          <option value="free">Free</option>
          <option value="under-50000">Up to 50,000 VND</option>
          <option value="50000-100000">50,000–100,000 VND</option>
          <option value="over-100000">100,000 VND and above</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>

        {hasFilters && (
          <button type="button" className="btn-reset-filters" onClick={onResetFilters}>
            Reset
          </button>
        )}
      </div>

      {isLoading && <div className="loading">Loading active donations...</div>}
      {!isLoading && error && <div className="error-banner">Error: {error}</div>}
      {!isLoading && !error && (!listings || listings.length === 0) && (
        <div className="no-results">No active listings match these filters.</div>
      )}

      {!isLoading && !error && listings?.length > 0 && (
        <div className="food-grid">
          {listings.map((item) => {
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

                  <button className="btn-reserve" onClick={() => onSelectItem(item)}>
                    {allowsOnlineReservation ? 'View and Reserve' : 'View Details'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
