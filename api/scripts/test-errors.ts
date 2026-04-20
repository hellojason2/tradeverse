import fastify from 'fastify';
import { DomainError } from '../src/types/errors.js';
import { asyncErrorWrapper } from '../src/utils/asyncErrorWrapper.js';

const app = fastify();

app.get('/test-400', asyncErrorWrapper(async () => {
  throw new DomainError('USER_INPUT', 'bad input');
}));

app.get('/test-409', asyncErrorWrapper(async () => {
  throw new DomainError('USER_STATE', 'already exists');
}));

app.get('/test-422', asyncErrorWrapper(async () => {
  throw new DomainError('BUSINESS_RULE', 'x');
}));

app.get('/test-500', asyncErrorWrapper(async () => {
  throw new Error('unexpected');
}));

async function run() {
  const r422 = await app.inject({ method: 'GET', url: '/test-422' });
  console.log('422 test:', r422.statusCode, r422.json().error.code);
  if (r422.statusCode !== 422 || r422.json().error.code !== 'BUSINESS_RULE') {
    console.error('FAILED: BUSINESS_RULE did not map to 422');
    process.exit(1);
  }

  const r400 = await app.inject({ method: 'GET', url: '/test-400' });
  console.log('400 test:', r400.statusCode, r400.json().error.code);

  const r409 = await app.inject({ method: 'GET', url: '/test-409' });
  console.log('409 test:', r409.statusCode, r409.json().error.code);

  const r500 = await app.inject({ method: 'GET', url: '/test-500' });
  console.log('500 test:', r500.statusCode, r500.json().error.code);

  console.log('A3 PASS: all error codes map correctly');
}

run().catch(console.error);
