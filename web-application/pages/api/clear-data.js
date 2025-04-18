import { MongoClient } from 'mongodb';
import oracledb from 'oracledb';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'river_running';
const COLLECTION_NAME = 'running_products';

const oracleConfig = {
  user: process.env.ORACLE_USER_NAME,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_HOST + ':' + process.env.ORACLE_PORT + '/' + process.env.ORACLE_DATABASE
};

export default async function handler(req, res) {
  const mongoClient = new MongoClient(MONGODB_URI);
  let oracleConnection;

  try {
    // MongoDB: Delete all documents
    await mongoClient.connect();
    const db = mongoClient.db(DB_NAME);
    const mongoResult = await db.collection(COLLECTION_NAME).deleteMany({});

    // Oracle: Delete all rows
    oracleConnection = await oracledb.getConnection(oracleConfig);
    const oracleResult = await oracleConnection.execute('DELETE FROM SAMPLE.RUNNING_PRODUCTS');
    await oracleConnection.commit();

    res.status(200).json({
      mongoDeletedCount: mongoResult.deletedCount,
      oracleRowsDeleted: oracleResult.rowsAffected
    });
  } catch (err) {
    console.error('Error clearing data:', err);
    res.status(500).json({ error: 'Failed to clear data' });
  } finally {
    await mongoClient.close();
    if (oracleConnection) await oracleConnection.close();
  }
}
