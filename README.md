# Redirector

A small redirection service built with [Deno](https://deno.com) and TypeScript. Paste a link, get back a short alternative URL on this site's domain, and change where that short URL points whenever you like. The short URL itself never changes.

## How it works

1. **Paste a link.** You submit any `http://` or `https://` URL.
2. **Get an alternative.** The site generates a short link on its own domain, e.g. `https://your-domain.com/aB3xK9`. You also receive a private **edit key**.
3. **Share the short link.** Anyone who opens it is redirected to your original URL.
4. **Change the destination later.** Use the edit key to point the same short link somewhere else. Everyone who already has the link follows the new target.

> Keep your edit key safe. It is the only way to change a link, and it is shown only once.

## Features

- Create a short redirect from any URL
- Edit the destination of an existing short link at any time
- Optional custom slug (e.g. `/my-link`)
- Edit keys are stored hashed, never in plain text
- Persistent storage with [Deno KV](https://docs.deno.com/deploy/kv/manual/), no external database needed
- Zero third-party dependencies

## Requirements

- [Deno](https://docs.deno.com/runtime/getting_started/installation/) 2.x or newer

## Getting started

```bash
git clone <your-repo-url>
cd redirector
deno task dev
```

Then open <http://localhost:8000>.

### Suggested `deno.json`

```json
{
  "tasks": {
    "dev": "deno run --allow-net --allow-read --allow-env --unstable-kv --watch main.ts",
    "start": "deno run --allow-net --allow-read --allow-env --unstable-kv main.ts"
  }
}
```

(`--unstable-kv` is not needed on recent Deno versions where KV is stable.)

## Configuration

| Variable      | Default                 | Description                                   |
| ------------- | ----------------------- | --------------------------------------------- |
| `PORT`        | `8000`                  | Port the server listens on                    |
| `BASE_URL`    | `http://localhost:8000` | Public base URL used when building short links |
| `SLUG_LENGTH` | `6`                     | Length of auto-generated slugs                |

## Usage

### Web UI

1. Open the site and paste your link into the input box.
2. Click **Shorten**. Copy the short link and your edit key.
3. To change the destination, open the **Edit** section, enter the slug, your edit key and the new URL, then save.

### API

#### Create a redirect

```http
POST /api/links
Content-Type: application/json

{
  "url": "https://example.com/some/long/page",
  "slug": "my-link"
}
```

`slug` is optional. If omitted, one is generated.

Response `201 Created`:

```json
{
  "slug": "my-link",
  "shortUrl": "https://your-domain.com/my-link",
  "target": "https://example.com/some/long/page",
  "editKey": "k_9f3b2c1e7a..."
}
```

#### Change where a link redirects

```http
PUT /api/links/my-link
Content-Type: application/json
X-Edit-Key: k_9f3b2c1e7a...

{
  "url": "https://example.org/a/new/destination"
}
```

Response `200 OK`:

```json
{
  "slug": "my-link",
  "shortUrl": "https://your-domain.com/my-link",
  "target": "https://example.org/a/new/destination"
}
```

#### Inspect a link

```http
GET /api/links/my-link
```

Returns the slug and its current target. The edit key is never returned.

#### Follow a link

```http
GET /my-link
```

Responds with an HTTP redirect to the current target.

### Errors

| Status | Meaning                                  |
| ------ | ---------------------------------------- |
| `400`  | Invalid URL or slug                      |
| `401`  | Missing or wrong edit key                |
| `404`  | Slug does not exist                      |
| `409`  | Custom slug is already taken             |

## Project structure

```
.
├── main.ts        # HTTP server and routing
├── store.ts       # Deno KV storage helpers
├── static/        # Frontend (HTML, CSS, JS)
├── deno.json      # Tasks and config
└── README.md
```

## Design notes

- **Redirect type:** links respond with `302 Found` so that changing a destination takes effect immediately. A `301` would be cached by browsers and make edits unreliable.
- **Validation:** only `http` and `https` targets are accepted. Targets that point back at this site are rejected to prevent redirect loops.
- **Authorization:** the edit key is generated with `crypto.randomUUID()`-grade randomness, stored as a SHA-256 hash, and compared in constant time.

## Deployment

### Deno Deploy

1. Push the repository to GitHub.
2. Create a project on [Deno Deploy](https://deno.com/deploy) and link the repo, using `main.ts` as the entry point.
3. Set `BASE_URL` to your production domain.

Deno KV is available on Deno Deploy out of the box.

### Self-hosted

```bash
deno run --allow-net --allow-read --allow-env main.ts
```

Put it behind a reverse proxy (Caddy, nginx) for HTTPS, and make sure the KV database file location is persisted between restarts.

## License

MIT
