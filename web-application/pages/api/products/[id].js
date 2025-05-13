// pages/api/products/[id].js
import oracledb from 'oracledb';
const { publishToTopic } = require("../../../util/publish-to-topic");
import { withSessionRoute } from '../../../util/session';
import crypto from 'crypto';
import { withIronSessionApiRoute } from 'iron-session/next';

export const sessionOptions = {
  password: process.env.SESSION_PASSWORD, // must be at least 32 characters
  cookieName: 'myapp_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

const CLICK_DATA_TOPIC = "product_click_traffic"

async function saveClickData(req, id, sessionId) {
  publishToTopic(CLICK_DATA_TOPIC, [ { id, sessionId } ]);

  // Store last 10 clicks in session
  req.session.recentClicks = req.session.recentClicks || [];

  // Add the new click to the front
  req.session.recentClicks.unshift(parseInt(id, 10));

  // Keep only the last 10
  req.session.recentClicks = req.session.recentClicks.slice(0, 4);

  console.log(req.session.recentClicks);

  // Save updated session
  await req.session.save();
}

export default withSessionRoute(async function handler(req, res) {
  const { id } = req.query;

  let sessionId = req.session.id;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    req.session.id = sessionId;
    await req.session.save();
  }

  console.log("sessionId: " + sessionId);

  saveClickData(req, id, sessionId);

  try {
    const connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER_NAME,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_HOST + ':' + process.env.ORACLE_PORT + '/' + process.env.ORACLE_DATABASE
    });

    const result = await connection.execute(
      `SELECT * FROM SAMPLE.RUNNING_PRODUCTS WHERE ID = :id`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    await connection.close();

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json({ product: result.rows[0] });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});