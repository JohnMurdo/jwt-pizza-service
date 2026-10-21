const request = require('supertest');
const app = require('../src/app');

// DELETE /users/:id
// Requires authentication and deletes the user account for the authenticated user.
describe('DELETE /users/:id', () => {
  it('deletes the authenticated user', async () => {
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ username: 'testuser', password: 'password123' });

    const token = loginResponse.body.token;

    const response = await request(app)
      .delete('/users/' + loginResponse.body.user.id)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      message: 'User deleted successfully',
    });
  });
});
