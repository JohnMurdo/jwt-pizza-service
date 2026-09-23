const request = require('supertest');
const mysql = require('mysql2/promise');
const config = require('../src/config.js');

const testDatabaseName = process.env.TEST_DB_NAME || 'pizza_test';
const originalDatabaseName = config.db.connection.database;

let app;
let DB;

// async function createAdminUser() {
//   let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
//   user.name = randomName();
//   user.email = user.name + '@admin.com';

//   await DB.addUser(user);
//   user.password = 'toomanysecrets';

//   return user;
// }

async function resetDatabase() {
  const { DB: db } = require('../src/database/database.js');
  const dbModel = require('../src/database/dbModel.js');
  DB = db;

  config.db.connection.database = testDatabaseName;
  await DB.initialized;

  const connection = await mysql.createConnection({
    host: config.db.connection.host,
    user: config.db.connection.user,
    password: config.db.connection.password,
    connectTimeout: config.db.connection.connectTimeout,
  });

  try {
    await connection.query(`DROP DATABASE IF EXISTS ${testDatabaseName}`);
    await connection.query(`CREATE DATABASE ${testDatabaseName}`);
    await connection.query(`USE ${testDatabaseName}`);

    for (const statement of dbModel.tableCreateStatements) {
      await connection.query(statement);
    }

    await DB.addMenuItem({
      title: 'Crusty',
      description: 'A crunchy, satisfying slice of pizza perfection',
      image: 'pizza3.png',
      price: 0.006,
    });

    await DB.addMenuItem({
      title: 'Veggie',
      description: 'A garden of delight',
      image: 'pizza1.png',
      price: 0.0038,
    });
  } finally {
    await connection.end();
  }
}

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserAuthToken;

beforeAll(async () => {
  config.db.connection.database = testDatabaseName;
  await resetDatabase();
  app = require('../src/service');

  testUser.email = `${Math.random().toString(36).substring(2, 12)}@test.com`;
  const registerRes = await request(app).post('/api/auth').send(testUser);
  testUserAuthToken = registerRes.body.token;
});

afterAll(() => {
  config.db.connection.database = originalDatabaseName;
});

test('login', async () => {
  const loginRes = await request(app).put('/api/auth').send(testUser);
  expect(loginRes.status).toBe(200);
  expect(loginRes.body.token).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);

  const user = { ...testUser, roles: [{ role: 'diner' }] };
  delete user.password;
  expect(loginRes.body.user).toMatchObject(user);
});

test('get menu as registered user', async () => {
  const menuRes = await request(app)
    .get('/api/order/menu')
    .set('Authorization', `Bearer ${testUserAuthToken}`);

  expect(menuRes.status).toBe(200);
  expect(Array.isArray(menuRes.body)).toBe(true);
  expect(menuRes.body.some((pizza) => pizza.title && pizza.title.toLowerCase().includes('crusty'))).toBe(true);
});


