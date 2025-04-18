// components/ProductCard.js
import Link from 'next/link';

export default function ProductCard({ product }) {
  const stars = Array(5)
    .fill(0)
    .map((_, i) => (
      <span key={i} className={i < product.RATINGS ? 'text-warning' : 'text-light'}>
        ★
      </span>
    ));

    return (
      <Link href={`/product/${product.ID}`} className="text-decoration-none text-dark">
        <div className="card h-100 border-0 shadow-sm">
          <div className="position-relative">
            <img
              src={product.IMAGE || 'placeholder.jpg'}
              onError={(e) => {
                e.target.onerror = null; // Prevent infinite loop
                e.target.src = '/placeholder.jpg'; // Replace with your fallback image path
              }}
              alt={product.NAME}
              className="img-fluid rounded"
              style={{ objectFit: 'cover', width: '100%', maxHeight: '500px' }}
            />
          </div>
  
          <div className="card-body d-flex flex-column">
            <h6 className="text-muted mb-1" style={{ fontSize: '0.9rem' }}>
              Product ID: {product.ID}
            </h6>
            <h5 className="card-title fw-semibold">{product.NAME}</h5>
  
            <div className="mt-auto d-flex justify-content-between align-items-center">
              <span className="fs-5 fw-bold text-primary">
                {product.ACTUAL_PRICE || 'N/A'}
              </span>
              <div className="text-warning small">{stars}</div>
            </div>
          </div>
        </div>
      </Link>
    );
}