"""
Product Enrichment Service

This FastAPI module defines an endpoint for enriching product data by scraping the product page.
It extracts structured fields such as:
- Product details (e.g., material, fit, sleeve type)
- "About this item" highlights
- Product description text

Enriched results are added to the product object and can be published to a Kafka topic.

Endpoints:
- POST /product-enrichment: Accepts a list of product change events, enriches each product asynchronously
"""

from fastapi import APIRouter, Response, Request
import asyncio
from ..utils.publish_to_topic import produce
import httpx
from bs4 import BeautifulSoup

router = APIRouter()

# Topic to publish the enriched product information into
ENRICHED_PRODUCT_TOPIC = "enriched_running_products"

async def enrich_product(product):
    await asyncio.sleep(1)
    
    url = product.get('LINK')
     
    if not url:
        return None

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/122.0.0.0 Safari/537.36"
        )
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=10.0)
            response.raise_for_status()
        except Exception as e:
            print(f"Failed to fetch URL: {url} — {e}")
            return None

    soup = BeautifulSoup(response.text, 'lxml')

    product_details = {}
    details_ul = soup.select_one("#productFactsDesktopExpander ul.a-nostyle")
    if details_ul:
        for li in details_ul.find_all("li"):
            try:
                key = li.select_one(".a-col-left span.a-color-base")
                value = li.select_one(".a-col-right span.a-color-base")
                if key and value:
                    product_details[key.text.strip()] = value.text.strip()
            except Exception:
                continue
    
    print(product_details)
    
    ### 🟡 Parse About This Item
    about_this_item = []
    about_section = soup.find("h3", string=" About this item ")
    print(about_section)
    if about_section:
        ul = about_section.find_next("ul")
        if ul:
            for li in ul.find_all("li"):
                text = li.get_text(strip=True)
                if text:
                    about_this_item.append(text)

    print(about_this_item)
    
    product_description = ""
    desc_heading = soup.find("h2", string=lambda text: text and " Product description  " in text)
    if desc_heading:
        desc_container = desc_heading.find_next("div", id="productDescription")
        if desc_container:
            product_description = desc_container.get_text(strip=True)

    print(product_description)

    product["about_this_item"] = about_this_item
    product["product_details"] = product_details
    product["product_description"] = product_description
    
    print(product)
    
    produce(ENRICHED_PRODUCT_TOPIC, product)

@router.api_route("/product-enrichment", methods=["GET", "POST"])
async def product_enrichment(request: Request):
    print("product_enrichment")
    if request.method == "POST":
        # print(request)
        data = await request.json()

        for item in data:
            product = item.get('after')
            
            print(product)
                   
            asyncio.create_task(enrich_product(product))

        return Response(content="Product Enrichment Started", media_type="text/plain", status_code=200)
    else:
        asyncio.create_task(enrich_product({
            "LINK": "https://www.amazon.in/Amazon-Brand-Symbol-T-Shirt-AW17-SYSP-03B_Medium_Viridian/dp/B071GTQH6K/ref=sr_1_313?qid=1679217352&s=sports&sr=1-313"
        }))
        return Response(content="Product Enrichment Started", media_type="text/plain", status_code=200)