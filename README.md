# Proxy Manager

A Cloudflare Workers project that manages and rotates multiple proxy endpoints for GET and POST requests.

## Overview

This project acts as a proxy manager that distributes requests across multiple proxy endpoints (implemented using [proxy-single](https://github.com/rafaelsg-01/proxy-single)) to rotate IPs for each request.

## Setup Instructions

1. Clone this repository
2. Deploy to Cloudflare Workers:
   ```bash
   wrangler deploy
   ```

3. Create a D1 database and bind it to your worker:
   ```bash
   wrangler d1 create proxy-manager-db
   wrangler d1 execute proxy-manager-db --file ./create_d1/initial_setup.sql
   ```

4. Configure the following Secret Environment Variables in your Cloudflare Workers dashboard:
   - `EnvSecret_tokenProxySelf`: A random string that will serve as your authentication token
   - `EnvSecret_listProxy`: A comma-separated list of your proxy URLs (e.g., "proxy-01.com,proxy-02.com,proxy-03.com")

## Usage

Send requests to your worker URL with the following parameters:

```
https://your-worker.workers.dev/proxy-manager?token=YOUR_TOKEN&url=TARGET_URL
```

Parameters:
- `token`: Your authentication token (must match EnvSecret_tokenProxySelf)
- `url`: The target URL you want to request through the proxy

Supported methods:
- GET
- POST

The system will automatically rotate through your proxy list for each request, distributing the load and providing different IPs.

## Related Projects

For setting up the individual proxy endpoints, please refer to [proxy-single](https://github.com/rafaelsg-01/proxy-single). Each proxy-single instance can be deployed to different AWS regions, allowing for up to 33 different IP addresses for rotation.
