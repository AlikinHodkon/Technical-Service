import request from 'supertest';
import app from './src/app.ts';

for (let i = 0; i < 12; i++) {
	const res = await request(app)
		.post('/api/auth/login')
		.send({ email: 'x@x.com', password: 'wrong' });
	console.log(i, res.status, res.headers['ratelimit-remaining']);
}
