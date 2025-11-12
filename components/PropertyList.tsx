import React from 'react';

interface Property {
  id: string;
  title: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  address: string;
  city: string;
  image_url: string;
  property_type: string;
}

interface PropertyListProps {
  properties: Property[];
  onPropertyClick: (property: Property) => void;
  selectedPropertyId?: string;
}

const PropertyList: React.FC<PropertyListProps> = ({
  properties,
  onPropertyClick,
  selectedPropertyId
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="property-list">
      <div className="property-list-header">
        <h2>Available Properties</h2>
        <span className="property-count">{properties.length} properties</span>
      </div>

      <div className="property-grid">
        {properties.map((property) => (
          <div
            key={property.id}
            className={`property-card ${selectedPropertyId === property.id ? 'selected' : ''}`}
            onClick={() => onPropertyClick(property)}
          >
            <div className="property-image">
              <img src={property.image_url} alt={property.title} />
              <span className="property-type-badge">{property.property_type}</span>
            </div>

            <div className="property-info">
              <h3>{property.title}</h3>
              <p className="property-address">{property.address}, {property.city}</p>

              <div className="property-details">
                <span className="detail-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                  {property.bedrooms} bed
                </span>
                <span className="detail-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  {property.bathrooms} bath
                </span>
                <span className="detail-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  </svg>
                  {property.sqft.toLocaleString()} sqft
                </span>
              </div>

              <div className="property-price">
                {formatPrice(property.price)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertyList;
