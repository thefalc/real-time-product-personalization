import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);

  useEffect(() => {
    if (!id) return;
  
    // Clear the previous content immediately
    setProduct(null);
    setSimilarProducts([]);
  
    // Fetch new product
    fetch(`/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => setProduct(data.product));
  
    // Fetch similar products
    fetch(`/api/similar-products?id=${id}`)
      .then((res) => res.json())
      .then((data) => setSimilarProducts(data.similarProducts || []));
  }, [id]);

  if (!product) {
    return <div className="container py-5 text-center">Loading product...</div>;
  }

  const stars = Array(5)
    .fill(0)
    .map((_, i) => (
      <span key={i} className={i < product.RATINGS ? 'text-warning' : 'text-light'}>
        ★
      </span>
    ));

  return (
    <>
      <Head>
        <title>River Runners</title>
      </Head>

      {/* Navigation Bar */}
      <nav className="navbar navbar-light bg-white border-bottom mb-4">
        <div className="container">
          <Link href="/" className="navbar-brand fw-bold fs-4 text-primary text-decoration-none">
            River Runners
          </Link>
        </div>
      </nav>

      {/* Product Detail Content */}
      <div className="container py-4">
        <div className="mb-3">
          <Link href="/" className="text-decoration-none">
            ← Back to Products
          </Link>
        </div>

        <div className="row g-4 mb-5">
          <div className="col-md-6">

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

          <div className="col-md-6 d-flex flex-column">
            <h1 className="mb-3">{product.NAME}</h1>
            <div className="mb-2">
              <span className="fs-4 fw-bold text-primary">
                {product.ACTUAL_PRICE}
              </span>
            </div>
            <div className="mb-3">
              <div className="text-warning">{stars}</div>
              <small className="text-muted">{product.RATINGS} out of 5</small>
            </div>

            <div className="mb-4">
              <p className="text-muted">{product.DESCRIPTION || 'No description provided.'}</p>
              {product.AVAILABILITY && (
                <span className="badge bg-success">In Stock</span>
              )}
            </div>

            <div className="mt-auto">
              <button className="btn btn-primary btn-lg w-100">Add to Cart</button>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <>
            <h4 className="mb-3">You Might Also Like</h4>
            <div className="row g-4">
              {similarProducts.map((sim) => (
                <div key={sim.ID} className="col-sm-6 col-md-4 col-lg-3">
                  <Link href={`/product/${sim.ID}`} className="text-decoration-none text-dark">
                    <div className="card h-100 shadow-sm">
                      
                      <img
                        src={sim.IMAGE }
                        onError={(e) => {
                          console.log(e);
                          e.target.onerror = null; // Prevent infinite loop
                          e.target.src = '/placeholder.jpg'; // Replace with your fallback image path
                        }}
                        alt={sim.NAME}
                        className="img-fluid rounded"
                        style={{ objectFit: 'cover', width: '100%', maxHeight: '500px' }}
                      />
                      <div className="card-body">
                        <h6 className="card-title mb-2">{sim.NAME}</h6>
                        <p className="mb-1 text-primary fw-bold">
                          {sim.ACTUAL_PRICE}
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
