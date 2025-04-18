from fastapi import APIRouter, Response, Request
import asyncio
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Load environment variables from .env file
load_dotenv()

client = AsyncIOMotorClient(os.environ.get("MONGODB_URI"))
db = client["river_running"]
collection = db["running_products"]

router = APIRouter()

async def sync_embeddings(product):
    """
    Sync a product embedding to MongoDB.

    Args:
        product (dict): Contains:
            - id (str): Product ID
            - embedding (List[float]): Vector embedding
            - original_text (str): Text used to generate the embedding
    """
    document = {
        "_id": product["id"],
        "embedding": product["embedding"],
        "original_text": product["original_text"]
    }

    try:
        # Upsert into MongoDB
        await collection.update_one(
            {"_id": product["id"]},
            {"$set": product},
            upsert=True
        )
        print(f"Synced embedding for product ID: {product['id']}")
    except Exception as e:
        print(f"Failed to sync embedding for product ID {product['id']}: {e}")

@router.api_route("/sync-product-embeddings", methods=["GET", "POST"])
async def sync_product_embeddings(request: Request):
    print("sync_product_embeddings")
    if request.method == "POST":
        # print(request)
        data = await request.json()
        
        print(data)

        for product in data:
            asyncio.create_task(sync_embeddings(product))

        return Response(content="Sync Product Embeddings Started", media_type="text/plain", status_code=200)
    else:
        return Response(content="Sync Product Embeddings Started", media_type="text/plain", status_code=200)