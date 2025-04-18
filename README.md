# Oracle RAG Pipeline Demo

This application is a demo showing Oracle to Confluent via the CDC connector. Each new product entered into the Oracle database
triggers a data enrichment and embedding generation pipeline.

Embeddings are stored in MongoDB as the vector database.

The `web-application` uses Oracle and MongoDB to retrieve products and show similar products. Similar products are based on
the semantic similarity between the current product and the average of the recently viewed products.