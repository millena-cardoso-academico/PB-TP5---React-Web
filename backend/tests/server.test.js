const request = require('supertest');
const { app, db } = require('../server.js');

describe('POST /login', () => {
  beforeAll((done) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE,
          password TEXT
        )
      `, () => {
        db.run('INSERT INTO users (username, password) VALUES (?, ?)', ['testuser', 'password123'], done);
      });
    });

    app.locals.db = db;
  });

  afterAll((done) => {
    app.locals.db.close(done);
  });

  test('should login successfully with valid credentials', async () => {
    const response = await request(app)
      .post('/login')
      .send({ username: 'testuser', password: 'password123' });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('message', 'Login bem-sucedido');
  });

  test('should fail login with invalid credentials', async () => {
    const response = await request(app)
      .post('/login')
      .send({ username: 'testuser', password: 'wrongpassword' });

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty('error', 'Credenciais inválidas');
  });

  test('should fail login with non-existent user', async () => {
    const response = await request(app)
      .post('/login')
      .send({ username: 'nonexistent', password: 'password123' });

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty('error', 'Credenciais inválidas');
  });

});
