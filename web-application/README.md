# River Runners Frontend

This is the web interface for River Runners, a demo e-commerce site that shows real-time product recommendations powered by Oracle, Kafka, and MongoDB.

## Setup

Create a `.env` file in the `web-application/` directory with the following values:

```shell
ORACLE_USER_NAME=
ORACLE_PASSWORD=
ORACLE_HOST=
ORACLE_PORT=
ORACLE_DATABASE=
MONGODB_DB_USER=
MONGODB_DB_PWD=
MONGODB_URI=
SESSION_PASSWORD=
```

Make sure the Oracle and MongoDB services are running and accessible.

Next, following the [instructions](https://docs.confluent.io/cloud/current/client-apps/config-client.html) to create a new Java client. Once the client downloads, unzip it and find the `client.properties` file. Copy this file into the `web-application/` folder.

## Running the application

From the your terminal, navigate to the `/web-application` directory and enter the following command:

```shell
npm install
npm run dev
```