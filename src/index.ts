/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	HASHNODE_API_URL: string;
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	HASHNODE_SUBSCRIBE_ENDPOINT: string;
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	HASHNODE_PUBLICATION_ID: string;
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
	ALLOWED_HOST: Array<string>;
	// Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
	// MY_QUEUE: Queue;
}

interface RequestBody {
	email?: string;
	// Add other properties if needed
}

const handler = {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		/**
		 * Get the request body as json.
		 *
		 * @param request
		 * @returns Request body as json.
		 */
		const getReqBody = async (request: Request) => {
			const { headers } = request;

			const contentType = headers.get('content-type') || '';

			if (contentType.includes('application/json')) {
				try {
					const jsonData = await request.json<RequestBody>();
					return jsonData;
				} catch (error) {
					throw new Error('Failed to parse JSON body');
				}
			}

			return null; // return null if body is not json
		};

		/**
		 * POST request to the Hashnode API to add the client email to the newsletter.
		 *
		 * @param email
		 * @returns Responses
		 */
		const subscribe = async (email: string) => {
			// Hashnode API URL (change this to your own blog URL)
			const hashnodeAPI = env.HASHNODE_API_URL;
			// Hashnode API endpoint
			const subscribeEndpoint = env.HASHNODE_SUBSCRIBE_ENDPOINT;
			const publicationId = env.HASHNODE_PUBLICATION_ID;

			const subscribeURL = `${hashnodeAPI}${subscribeEndpoint}`;

			const subscribeOptions = {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					publicationId,
					email,
				}),
			};

			const subscribeRequest = new Request(subscribeURL, subscribeOptions);
			const subscribeResponse = await fetch(subscribeRequest);

			return subscribeResponse;
		};

		/**
		 * Wraps getReqBody and subscribe functions and returns the response to the client
		 * with the appropriate status code and CORS headers.
		 *
		 * @param request
		 */
		const subscribeResHandler = async (request: Request) => {
			const reqOrigin = (await request.headers.get('origin')) || '';

			if (!env.ALLOWED_HOST.includes(reqOrigin)) {
				return new Response('Forbidden', {
					status: 403,
					headers: {
						'Access-Control-Allow-Origin': env.ALLOWED_HOST[0],
					},
				});
			}

			// if request method is not POST return 405
			if (request.method !== 'POST') {
				return new Response('Method not allowed', {
					status: 405,
					headers: {
						Allow: 'POST',
						'Access-Control-Allow-Origin': reqOrigin,
					},
				});
			}

			const reqBody = await getReqBody(request);

			if (!reqBody) {
				return new Response('Request body is not json', {
					status: 400,
					headers: {
						'Content-Type': 'text/plain',
						'Access-Control-Allow-Origin': reqOrigin,
					},
				});
			}

			const { email } = reqBody;

			if (!email) {
				return new Response('Email is required', {
					status: 400,
					headers: {
						'Content-Type': 'text/plain',
						'Access-Control-Allow-Origin': reqOrigin,
					},
				});
			}

			const headers = new Headers({
				'Access-Control-Allow-Origin': reqOrigin,
				'Access-Control-Allow-Methods': 'POST',
				'Access-Control-Allow-Headers': 'Content-Type',
				'Access-Control-Max-Age': '86400',
				'Context-Type': 'application/json',
			});

			const subscribeResponse = await subscribe(email);
			const subscribeResBody = await subscribeResponse.json();

			if (subscribeResponse.status === 200) {
				return new Response(JSON.stringify(subscribeResBody), {
					status: 200,
					headers,
				});
			}

			return new Response(JSON.stringify(subscribeResBody), {
				status: 400,
				headers,
			});
		};

		return await subscribeResHandler(request);
	},
};

export default handler;
