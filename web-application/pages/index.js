import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import Layout from "../components/Layout";

const Home = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async (pageNum) => {
    setLoading(true);
    setProducts([]); // clear to avoid flicker
    const res = await fetch(`/api/products?page=${pageNum}`);
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts(page);
  }, [page]);

  return (
    <div className="bg-light min-vh-100 py-4">
      <div className="container">
        <header className="text-center mb-5">
          <h1 className="display-5 fw-bold text-dark">River Runners</h1>
          <p className="text-muted fs-5">Gear up for the trail. Shop our latest running essentials.</p>
        </header>

        {loading ? (
          <div className="text-center my-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="mt-3">Loading products...</p>
          </div>
        ) : (
          <div className="row g-4">
            {products.map((product) => (
              <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={product.ID}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}

        <div className="d-flex justify-content-center align-items-center mt-5 gap-3">
          <button
            className="btn btn-outline-secondary"
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1 || loading}
          >
            ← Previous
          </button>
          <span className="fw-semibold text-muted">Page {page}</span>
          <button
            className="btn btn-outline-secondary"
            onClick={() => setPage((p) => p + 1)}
            disabled={loading}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default function RiverRunnersApp() {
  return (
    <Layout title="River Runners">
      <Home />
    </Layout>
  );
}
