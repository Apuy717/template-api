import App from "../src/app";

// import request from 'supertest';
const { expect } = require('chai');
import request from 'supertest';


describe('Express API End-to-End Tests', function () {
  let app: any;

  before(async function () {
    app = new App().instance;
  });

  after(async function () {
    if (typeof app.close === 'function') {
      await app.close();
    }
  });

  it('should return status ok', async function () {
    const response = await request(app).get('/health');
    expect(response.status).to.equal(200);
    expect(response.body).to.deep.equal({ statusCode: 200, msg: 'OK' });
  });
});
