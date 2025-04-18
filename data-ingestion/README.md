# Data Import

Imports the product data into Oracle.

## Setting up the application

Need to create a .env file with the following parameters:

```shell
ORACLE_USER_NAME=
ORACLE_PASSWORD=
ORACLE_HOST=
ORACLE_PORT=
ORACLE_DATABASE=
ORACLE_INSTANT_CLIENT=
```

## Running the application

From the your terminal, navigate to the `/data-ingestion` directory and enter the following command:

```shell
python -m venv env
source env/bin/activate
pip install -r requirements.txt
python csv_to_oracle_ingestion.py
```