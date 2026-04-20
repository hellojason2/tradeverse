import pg from 'pg';
async function run() {
  const c = new pg.Client({ connectionString: 'postgresql://tradeverse:tradeverse@localhost:5433/tradeverse' });
  await c.connect();
  const r = await c.query('SELECT 1');
  console.log(r.rows);
  await c.end();
}
run().catch(console.error);
