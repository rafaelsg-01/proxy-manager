# Proxy Manager (Beta)

A simple proxy manager built with Cloudflare Workers that rotates requests through multiple Google Cloud Functions deployed in different regions, providing different IP addresses for each request.

## Features

- Rotates through 25 different proxy endpoints
- Supports GET and POST methods
- Maintains basic headers (Authorization and Content-Type)
- Token-based authentication
- Request origin tracking to ensure proper rotation

## How it Works

1. Each request to `/proxy-manager` is authenticated using a token
2. The system rotates through different proxy endpoints based on the request's origin
3. The request is forwarded to one of the 25 proxy endpoints (hosted on Google Cloud Functions)
4. Each proxy endpoint is deployed in a different region using code from [proxy-single repository](https://github.com/rafaelsg-01/proxy-single)

## Setup

1. Deploy the proxy-single code to Google Cloud Functions in different regions
2. Update the proxy list in `src/list-proxy-single.ts` with your function URLs
3. Deploy this proxy manager to Cloudflare Workers

## Usage

```http
GET/POST /proxy-manager?token=YOUR_TOKEN&url=TARGET_URL
```

### Parameters

- `token`: Authentication token
- `url`: Target URL to proxy the request to

### Supported Methods
- GET
- POST

### Supported Headers
- Authorization
- Content-Type

## Limitations

- Currently in beta
- Limited header support
- Only supports GET and POST methods