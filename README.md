# Caching Proxy

A CLI tool that starts a caching proxy server. It forwards requests to an origin server and caches the responses, so repeated requests are served from the cache instead of hitting the origin again.

Project idea from roadmap.sh: https://roadmap.sh/projects/caching-server

Built with Node.js and TypeScript, using only Node's built-in modules (`node:http`, `node:fs`, `node:util`).

## Setup

```bash
git clone https://github.com/brian-david/caching_proxy.git
cd caching_proxy
npm install
npm link   # makes the `caching-proxy` command available in your terminal
```

## Usage

Start the proxy:

```bash
caching-proxy --port <number> --origin <url>
```

- `--port` is the port the proxy server runs on.
- `--origin` is the URL of the server requests are forwarded to.

Example:

```bash
caching-proxy --port 3000 --origin https://dummyjson.com
```

A request to `http://localhost:3000/products` is now forwarded to `https://dummyjson.com/products`.

Every response includes an `X-Cache` header:

- `X-Cache: MISS`: the response came from the origin server (and is now cached).
- `X-Cache: HIT`: the response came from the cache.

```bash
curl -i localhost:3000/products/1   # X-Cache: MISS
curl -i localhost:3000/products/1   # X-Cache: HIT
```

### Clearing the cache

```bash
caching-proxy --clear-cache
```

This works while the server is running: it notices the cache was cleared on the next request.

## How it works

- Responses are cached by request method and URL (for example `GET:/products/1`), storing the status, headers and body.
- The cache is kept in memory for fast lookups and saved to `cache.json` so it survives restarts.
- `--clear-cache` deletes `cache.json`, and the running server empties its in-memory cache when it sees the file is gone.
