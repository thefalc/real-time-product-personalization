# Embedding Pipeline

Two microservices that are used to enrich product data and sync embeddings to the vector database.

## Setting up the application

Need to create a .env file with the following parameters:

```shell
MONGODB_URI=
```

## Running the application

From the your terminal, navigate to the `/services` directory and enter the following command:

```shell
python -m venv env
source env/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```