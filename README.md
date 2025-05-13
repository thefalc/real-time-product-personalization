# River Runners: Real-Time AI Personalization with Oracle, Kafka, Flink, and MongoDB

This demo shows how to turn your Oracle database into a real-time personalization engine using Confluent Cloud, Apache Kafka, Flink, and MongoDB.

The diagram below illustrates the real-time RAG architecture.

<p align="center">
  <img src="/architecture-diagram.png" />
</p>

## What It Does
We built a fake outdoor gear store called River Runners to show how you can:
* Stream product updates from Oracle in real time
* Use AI to enrich each product and create a searchable vector
* Track which products customers click on
* Recommend similar items instantly

## How It Works
1. New product data is added to Oracle
2. Oracle XStream CDC Connector streams the changes to Kafka
3. A RAG pipeline enriches the product and stores an embedding in MongoDB via Flink SQL
4. Kafka tracks product clicks in real time
5. The River Runners front end shows smart recommendations based on what you just viewed

## Project Breakdown
* `data-ingestion/` – Script to add product data to Oracle
* `services/` – Listens to Kafka and runs web scrapping data enrichment
* `web-application/` – Front end for River Runners with live recommendations
* `flink-statements/` – Flink SQL for enriching data and generating embeddings

Follow the setup instructions here and then run the individual projects by following the instructions in each project directory.

## Confluent Cloud Setup

To run this demo end-to-end, you'll need to configure several connectors and topics in **Confluent Cloud**.

### ✅ Step 1: Create Oracle XStream CDC Source Connector

Set up the **Oracle XStream CDC Source Connector** in Confluent Cloud to stream changes from your Oracle DB.

- **Source table**: `SAMPLE.RUNNING_PRODUCTS`
- **Destination topic**: `PROD.SAMPLE.RUNNING_PRODUCTS`

Refer to [Confluent's documentation](https://docs.confluent.io/cloud/current/connectors/cc-oracle-xstream-cdc-source.html) for setup instructions.

### ✅ Step 2: Create HTTP Sink Connector for Product Enrichment

Create an **HTTP Sink Connector** that listens to the `PROD.SAMPLE.RUNNING_PRODUCTS` topic and sends records to: `https://REPLACE_ME/api/product-enrichment`

> 💡 You can use [ngrok](https://ngrok.com/) to expose your local service to the internet during development.

### ✅ Step 3: Create Topics and Schemas

Create the following topics with the associated JSON Schema.

#### `enriched_running_products`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "EnrichedProduct",
  "type": "object",
  "required": [
    "ID", "NAME", "MAIN_CATEGORY", "SUB_CATEGORY",
    "IMAGE", "LINK", "RATINGS", "NO_OF_RATINGS",
    "DISCOUNT_PRICE", "ACTUAL_PRICE"
  ],
  "properties": {
    "ID": { "type": "number" },
    "NAME": { "type": "string" },
    "MAIN_CATEGORY": { "type": "string" },
    "SUB_CATEGORY": { "type": "string" },
    "IMAGE": { "type": "string", "format": "uri" },
    "LINK": { "type": "string", "format": "uri" },
    "RATINGS": { "type": "number" },
    "NO_OF_RATINGS": { "type": "number" },
    "DISCOUNT_PRICE": { "type": "string" },
    "ACTUAL_PRICE": { "type": "string" },
    "about_this_item": {
      "type": "array",
      "items": { "type": "string" }
    },
    "product_description": { "type": "string" },
    "product_details": {
      "type": "object",
      "additionalProperties": { "type": "string" }
    }
  },
  "additionalProperties": false
}
```

#### `product_as_documents`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "VectorEncodedProduct",
  "type": "object",
  "required": ["id", "product_summary"],
  "properties": {
    "id": { "type": "number" },
    "product_summary": { "type": "string" }
  },
  "additionalProperties": false
}
```

#### `product_embeddings`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "VectorEncodedProduct",
  "type": "object",
  "required": ["id", "embedding", "original_text"],
  "properties": {
    "id": { "type": "number" },
    "embedding": {
      "type": "array",
      "items": { "type": "number" },
      "minItems": 1536,
      "maxItems": 1536
    },
    "original_text": { "type": "string" }
  },
  "additionalProperties": false
}
```
#### `product_click_traffic`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SessionMessage",
  "type": "object",
  "required": ["sessionId", "id"],
  "properties": {
    "id": { "type": "number" },
    "sessionId": { "type": "string" }
  },
  "additionalProperties": false
}
```

### Step 4: Create HTTP Sink Connector for Embedding Sync

Create another HTTP Sink Connector that listens to the product_embeddings topic and sends records to:

Create an **HTTP Sink Connector** that listens to the `PROD.SAMPLE.RUNNING_PRODUCTS` topic and sends records to: `https://REPLACE_ME/api/sync-product-embeddings`

### Step 5: Setting Up MongoDB
In MongoDB Atlas, create a database called river_running with the following collection:

#### Collection: running_products
This collection stores product embeddings for semantic search and recommendations. Each document should follow this structure:
* id – Number: Unique product ID
* original_text – String: AI-generated summary of the product
* embedding – Array[1536]: Vector embedding of the product text

#### Create a Vector Search Index
To enable semantic search, you need to create a vector index on the embedding field.

Steps:
1. In MongoDB Atlas, go to the Search tab for the river_running database
2. Click + CREATE SEARCH INDEX
3. Choose JSON Editor under Atlas Vector Search, then click Next
4. Paste the following configuration into the editor:

```json
{
  "fields": [
    {
      "numDimensions": 1536,
      "path": "embedding",
      "similarity": "dotProduct",
      "type": "vector"
    },
    {
      "path": "id",
      "type": "filter"
    }
  ]
}
```

5. Click Next and create the index

Once the index is ready, your vector search will be live and ready to support real-time product recommendations.

### Step 6: Setting Up Flink SQL Jobs

This demo includes three Flink jobs that power the product enrichment and recommendation workflow. Each job should be created and run separately in Confluent Cloud’s Stream Processing workspace.

Before running these jobs, you need to set up a connection to OpenAI.

#### Connect Flink to OpenAI

Use the Confluent CLI to create an OpenAI connection for model inference:

```bash
confluent flink connection create openai-connection \
  --cloud aws \
  --region us-east-1 \
  --type openai \
  --endpoint https://api.openai.com/v1/chat/completions \
  --api-key REPLACE_WITH_YOUR_KEY
```

Then, create a second connection for the embedding endpoint:

```bash
confluent flink connection create openai-embedding-connection \
  --cloud aws \
  --region us-east-1 \
  --type openai \
  --endpoint https://api.openai.com/v1/embeddings \
  --api-key REPLACE_WITH_YOUR_KEY
```

Make sure the `--region` matches your Confluent Cloud region.

#### Flink Job 1: Create Product Description Model

In your Flink SQL workspace, run the following to create a model that generates search-friendly product summaries:

```sql
CREATE MODEL product_description_model
INPUT(message STRING)
OUTPUT(response STRING)
COMMENT 'Prepares the product data to work well for search.'
WITH (
  'provider' = 'openai',
  'task' = 'text_generation',
  'openai.connection' = 'openai-connection',
  'openai.model_version' = 'gpt-4',
  'openai.system_prompt' = 'You are a helpful AI assistant that specializes in writing product descriptions based on structured data. Your goal is to generate clear, natural, and informative summaries that capture a product’s core attributes, features, and value propositions.

  The descriptions should be written in fluent, human-like language with an emphasis on semantic richness to support vector search and retrieval. Avoid lists or bullet points—write a short paragraph (2–5 sentences) that flows naturally.

  Do not repeat field names. Instead, infer and summarize meaning where appropriate. Be concise, avoid marketing fluff, and focus on factual details. You may reorder, rephrase, or omit information that isn’t useful for semantic understanding. If the data contains irrelevant or noisy fields (e.g., internal codes, redundant values), ignore them.'
);
```

#### Flink Job 2: Generate Product Summaries
This job takes enriched product data and uses the model to create a summarized description. It writes the output to the `product_as_documents` topic.

```sql
INSERT INTO product_as_documents
SELECT
  CAST(CAST(ID AS STRING) AS BYTES) AS `key`,
  ID,
  product_summary.response
FROM enriched_running_products
CROSS JOIN LATERAL TABLE(
  ml_predict(
    'product_description_model',
    CONCAT_WS(
      ' ',
      'Name: ', `NAME`,
      'Rating: ', CAST(`RATINGS` AS STRING),
      'Price: ', `ACTUAL_PRICE`,
      'About: ', REGEXP_REPLACE(CAST(about_this_item AS STRING), '\\[|\\]', ''), '\n',
      'Product Description: ', product_description, '\n',
      'Product Details: ', REGEXP_REPLACE(CAST(product_details AS STRING), '\\{|\}', '')
    )
  )
) AS product_summary;
```

#### Flink Job 3: Generate Product Embeddings

This job converts product summaries into 1536-dimensional vector embeddings and writes them to the `product_embeddings` topic.

First, create the embedding model:

```sql
CREATE MODEL `vector_encoding`
INPUT (input STRING)
OUTPUT (vector ARRAY<FLOAT>)
WITH(
  'TASK' = 'embedding',
  'PROVIDER' = 'openai',
  'OPENAI.CONNECTION' = 'openai-embedding-connection'
);
```

Then run the embedding job:

```sql
INSERT INTO product_embeddings
SELECT
  CAST(CAST(id AS STRING) AS BYTES) AS `key`,
  embedding,
  id,
  product_summary
FROM product_as_documents,
LATERAL TABLE (
  ml_predict(
    'vector_encoding',
    product_summary
  )
) AS T(embedding);
```

You now have:
* Product descriptions created with GPT-4
* Semantic embeddings generated for vector search
* Output flowing into MongoDB via HTTP sink for real-time personalization

Follow the individual project READMEs for further instructions.