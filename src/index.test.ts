import { describe, it, expect } from '@jest/globals';
import type { UnstableDevWorker } from 'wrangler';
import { unstable_dev } from 'wrangler';

describe('Worker', () => {
	let worker: UnstableDevWorker;

	beforeAll(async () => {
		worker = await unstable_dev('src/index.ts', {
			experimental: { disableExperimentalWarning: true },
		});
	});

	afterAll(async () => {
		await worker.stop();
	});

	it('Should return 403', async () => {
		const response = await worker.fetch('http://localhost:8787/', {
			method: 'GET',
			mode: 'no-cors',
		});
		expect(response.status).toBe(403);
	});

	it('Should return 405', async () => {
		const response = await worker.fetch('http://localhost:8787/', {
			method: 'GET',
			headers: {
				origin: 'http://localhost:8787',
			},
		});
		expect(response.status).toBe(405);
	});

	it('Should return 400', async () => {
		const response = await worker.fetch('http://localhost:8787/', {
			method: 'POST',
			headers: {
				origin: 'http://localhost:8787',
			},
		});
		expect(response.status).toBe(400);
	});

	it('Should return 500 (empty body)', async () => {
		const response = await worker.fetch('http://localhost:8787/', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				origin: 'http://localhost:8787',
			},
		});

		expect(response.status).toBe(500);
	});

	it('Should return 400 (no email)', async () => {
		const response = await worker.fetch('http://localhost:8787/', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				origin: 'http://localhost:8787',
			},
			body: JSON.stringify({ email: '' }),
		});

		expect(response.status).toBe(400);
		const responseBody = await response.text();
		expect(responseBody).toBe('Email is required');
	});
});
