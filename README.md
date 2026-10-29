# Redirection

A redirection site built with [Deno](https://deno.com) and TypeScript. Paste a link, get a short alternative URL on the site's own domain, and change where that URL points whenever you want. The short URL itself never changes.

**Live:** <https://redirection.volvos12.deno.net/>

## How it works

1. **Paste a link.** Submit the URL you want to redirect to.
2. **Get an alternative.** The site gives you a short link on its own domain.
3. **Share it.** Anyone who opens the short link is sent to your URL.
4. **Change it later.** Update the destination of the same short link at any time. Everyone who already has the link follows the new target.

This makes it useful for anything you can't easily update after sharing it: printed material, QR codes, social bios, documents and messages.

## Project structure

```
.
├── .github/workflows/   # CI
├── src/                 # Server code
├── static/              # Frontend assets
├── tests/               # Tests
├── deno.json            # Deno config and tasks
├── deno.lock            # Dependency lockfile
└── README.md
```

## Requirements

- [Deno](https://docs.deno.com/runtime/getting_started/installation/) 2.x or newer

## Getting started

```bash
git clone https://github.com/volvos12/redirection.git
cd redirection
deno task start
```

Check `deno.json` for the exact tasks available in your version.

## Running the tests

```bash
deno test --allow-all
```

## Deployment

The project is deployed on [Deno Deploy](https://deno.com/deploy). To deploy your own copy:

1. Fork or clone this repository.
2. Create a project on Deno Deploy and link the repository.
3. Point the entry point at the server file in `src/`.

## Contributing

Issues and pull requests are welcome. Please run the tests before submitting changes.

## License

MIT
