from fastapi import FastAPI
from app.routers import product_enrichment, sync_product_embeddings

app = FastAPI()

# Include the routers
app.include_router(product_enrichment.router, prefix="/api", tags=["Product Enrichment"])
app.include_router(sync_product_embeddings.router, prefix="/api", tags=["Product Embeddings"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the API!"}