# Hashnode Newsletter Worker

Proxy server that bypasses the CORS error and passes the request from your front-end to Hashnode as POST request.

## Why Cloudflare Worker?

Cloudflare worker is a serverless computing platform offered by Cloudflare. Cloudflare has a 0ms cold start which makes the code run almost instantly. Among other things cloudflare has one of the best free tier packet which is more than enough for indefinite the deployment of this proxy service.

## What is Workerd?

Project uses Workerd for its development environment. Workerd is an open-source Cloudflare Workers runtime. This is the same runtime that is deployed on CLoudflare's network.
