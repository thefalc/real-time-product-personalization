import { MongoClient, ObjectId } from 'mongodb';
import oracledb from 'oracledb';
import { withSessionRoute } from '../../util/session';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'river_running';
const COLLECTION_NAME = 'running_products';

let client;

async function getMongoClient() {
  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
  }
  return client;
}

async function getOracleConnection() {
  return await oracledb.getConnection({
    user: process.env.ORACLE_USER_NAME,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_HOST + ':' + process.env.ORACLE_PORT + '/' + process.env.ORACLE_DATABASE
  });
}

async function getProductEmbedding(productId) {
  const client = await getMongoClient();
  const collection = client.db(DB_NAME).collection(COLLECTION_NAME);

  const numericId = parseFloat(productId);
  const product = await collection.findOne({ _id: numericId });

  if (!product || !product.embedding) {
    throw new Error('Product not found or missing embedding');
  }

  return { product, numericId };
}

async function getProductEmbeddingsByIds(productIds) {
  const client = await getMongoClient();
  const collection = client.db(DB_NAME).collection(COLLECTION_NAME);

  const numericIds = productIds.map(id => parseFloat(id));
  const products = await collection
    .find({ _id: { $in: numericIds }, embedding: { $exists: true } })
    .toArray();

  return products.map(p => p.embedding);
}

function averageVectors(vectors) {
  if (vectors.length === 0) return null;

  const dim = vectors[0].length;
  const sum = Array(dim).fill(0);

  vectors.forEach(vec => {
    for (let i = 0; i < dim; i++) {
      sum[i] += vec[i];
    }
  });

  return sum.map(v => v / vectors.length);
}

async function findSimilarProductIds(embedding, excludeId) {
  const client = await getMongoClient();
  const collection = client.db(DB_NAME).collection(COLLECTION_NAME);

  const agg = [
    {
      $vectorSearch: {
        index: 'product_description',
        filter: { id: { $ne: excludeId } },
        path: 'embedding',
        queryVector: embedding,
        numCandidates: 150,
        limit: 4
      }
    },
    {
      $project: {
        _id: 0,
        id: 1,
        score: { $meta: 'vectorSearchScore' }
      }
    }
  ];

  const similar = await collection.aggregate(agg).toArray();
  return similar;
}

async function getOracleProductsByIds(ids) {
  const connection = await getOracleConnection();

  const bindVars = ids.map((_, i) => `:id${i}`).join(', ');
  const sql = `SELECT * FROM SAMPLE.RUNNING_PRODUCTS WHERE id IN (${bindVars})`;

  const binds = {};
  ids.forEach((id, i) => {
    binds[`id${i}`] = id;
  });

  const result = await connection.execute(sql, binds, {
    outFormat: oracledb.OUT_FORMAT_OBJECT
  });

  await connection.close();
  return result.rows;
}

function attachScores(oracleRows, scoreMap) {
  return oracleRows.map((row) => ({
    ...row,
    score: scoreMap[row.ID] || null
  }));
}

export default withSessionRoute(async function handler(req, res) {
  const productId = req.query.id || req.body?.id;

  if (!productId) {
    return res.status(400).json({ error: 'Missing product ID' });
  }

  try {
    const { product, numericId } = await getProductEmbedding(productId);
    const recentClicks = req.session.recentClicks || [];

    console.log("recentClicks: " + recentClicks);

    let queryEmbedding;
    if (recentClicks.length > 0) {
      const vectors = await getProductEmbeddingsByIds(recentClicks);
      if (vectors.length > 0) {
        queryEmbedding = averageVectors(vectors);
      }

      console.log('using averaged vectors');
    }

    // Fallback to current product's embedding
    if (!queryEmbedding) {
      queryEmbedding = product.embedding;
    }

    const similarProducts = await findSimilarProductIds(queryEmbedding, numericId);
    if (similarProducts.length === 0) {
      return res.status(200).json({ similarProducts: [] });
    }

    const ids = similarProducts.map(p => p.id);
    const scoreMap = Object.fromEntries(similarProducts.map(p => [p.id, p.score]));

    const oracleRows = await getOracleProductsByIds(ids);
    const enriched = attachScores(oracleRows, scoreMap);

    res.status(200).json({ similarProducts: enriched });
  } catch (err) {
    console.error('Error finding similar products:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});