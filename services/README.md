# Embedding Pipeline

This app runs two microservices used to enrich product data with embeddings and sync them to a MongoDB vector store.

These services expose HTTP endpoints that must be publicly accessible so they can be called by a Confluent Cloud HTTP Sink Connector. You can use [ngrok](https://ngrok.com/) to expose your local server to the internet during development.

## Setting up the application

In the `services/` directory, create a `.env` file with the following variable:

```shell
MONGODB_URI=
```

This should point to your MongoDB instance with vector search enabled.

Next, following the [instructions](https://docs.confluent.io/cloud/current/client-apps/config-client.html) to create a new Java client. Once the client downloads, unzip it and find the `client.properties` file. Copy this file into the `services/app/` folder.

## Running the application

From the your terminal, navigate to the `/services` directory and enter the following command:

```shell
python -m venv env
source env/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```