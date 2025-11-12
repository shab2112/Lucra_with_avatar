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
  description: string;
  property_type: string;
}

interface PropertyDetailProps {
  property: Property;
  onClose: () => void;
}

const PropertyDetail: React.FC<PropertyDetailProps> = ({ property, onClose }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="property-detail-overlay" onClick={onClose}>
      <div className="property-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="property-detail-image">
          <img src={property.image_url} alt={property.title} />
          <span className="property-type-badge-large">{property.property_type}</span>
        </div>

        <div className="property-detail-content">
          <div className="property-detail-header">
            <div>
              <h2>{property.title}</h2>
              <p className="property-location">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                {property.address}, {property.city}
              </p>
            </div>
            <div className="property-detail-price">
              {formatPrice(property.price)}
            </div>
          </div>

          <div className="property-detail-specs">
            <div className="spec-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <div>
                <span className="spec-label">Bedrooms</span>
                <span className="spec-value">{property.bedrooms}</span>
              </div>
            </div>

            <div className="spec-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <div>
                <span className="spec-label">Bathrooms</span>
                <span className="spec-value">{property.bathrooms}</span>
              </div>
            </div>

            <div className="spec-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              </svg>
              <div>
                <span className="spec-label">Square Feet</span>
                <span className="spec-value">{property.sqft.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="property-detail-description">
            <h3>Description</h3>
            <p>{property.description}</p>
          </div>

          <div className="property-detail-actions">
            <button className="action-button primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              Contact Agent
            </button>
            <button className="action-button secondary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
              Save Property
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;
