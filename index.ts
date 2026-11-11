#!/usr/bin/env -S npx tsx
import { parseArgs } from "node:util";
import http from "node:http";
import fs from "node:fs";

// Where the cache is saved: next to this file, no matter which folder you run the command from.
const CACHE_FILE = new URL("./cache.json", import.meta.url);

const { values } = parseArgs({
	options: {
		port: { type: "string" },
		origin: { type: "string" },
		"clear-cache": { type: "boolean" }, // on/off switch: true if passed, undefined if not
	},
});

// `caching-proxy --clear-cache` is a different "mode": do the clear, then exit
// before the server below ever starts.
if (values["clear-cache"]) {
	// force: true = don't throw an error if the file doesn't exist (cache already empty)
	fs.rmSync(CACHE_FILE, { force: true });
	console.log("Cache cleared");
	process.exit(0);
}

const port = Number(values.port);
const origin = values.origin;

// Load the saved cache from disk (if there is one), otherwise start empty.
// The file holds a plain object, so we turn it back into a Map.
const cache = fs.existsSync(CACHE_FILE)
	? new Map(Object.entries(JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"))))
	: new Map();

// The 'handler'
const server = http.createServer(async (req, res) => {
	const route = req.url;

	// the key is made of the request method & url
	// request arrives, check if it exists in the map
	const key = `${req.method}:${route}`;

	// If `--clear-cache` deleted the file while we're running, forget what's in memory too.
	if (!fs.existsSync(CACHE_FILE)) cache.clear();

	if (cache.has(key)) {
		const cachedResponse = cache.get(key);
		res.writeHead(cachedResponse.status, { ...cachedResponse.headers, "X-Cache": "HIT" });
		res.end(cachedResponse.body);
		return;
	}

	const response = await fetch(new URL(route!, origin).toString());
	const responseBody = await response.text();

	// Copy the origin's headers (Content-Type etc.), minus the ones that no longer match:
	// fetch already un-gzipped the body, so the original encoding/length would be wrong.
	const headers = Object.fromEntries(response.headers);
	delete headers["content-encoding"];
	delete headers["content-length"];
	delete headers["transfer-encoding"];

	cache.set(key, { status: response.status, headers, body: responseBody });
	// Save the whole cache to disk. A Map can't be JSON'd directly, so convert to a plain object first.
	fs.writeFileSync(CACHE_FILE, JSON.stringify(Object.fromEntries(cache), null, 2));

	res.writeHead(response.status, { ...headers, "X-Cache": "MISS" });
	res.end(responseBody);
});

server.listen(port, () => {
	console.log(`Proxy listening on port ${port}, forwarding to ${origin}`);
});
