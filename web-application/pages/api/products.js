import oracledb from 'oracledb';

export default async function handler(req, res) {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  try {
    const connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER_NAME,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_HOST + ':' + process.env.ORACLE_PORT + '/' + process.env.ORACLE_DATABASE
    });

    const result = await connection.execute(
      `
      SELECT *
      FROM (
        SELECT p.*, ROWNUM rnum
        FROM (
          SELECT * FROM SAMPLE.RUNNING_PRODUCTS ORDER BY ID
        ) p
        WHERE ROWNUM <= :maxRow
      )
      WHERE rnum > :minRow
      `,
      {
        maxRow: offset + pageSize,
        minRow: offset
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    await connection.close();
    res.status(200).json({ products: result.rows });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
}
