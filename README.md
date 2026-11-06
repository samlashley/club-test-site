# Team Handball at UGA

Static site for Team Handball at UGA, built with [Eleventy 3](https://www.11ty.dev/), deployed on Cloudflare Pages, and edited by club officers through [Decap CMS](https://decapcms.org/) at `/admin`.

There is no database. The GitHub repo is the source of truth — every CMS edit is a git commit to `main`, and every push rebuilds the site.

## Run locally

```bash
npm install
npm run dev     # http://localhost:8080
```

## Build

```bash
npm run build   # outputs to _site/
```

## Edit content locally (without touching GitHub)

```bash
npm run cms     # run in a second terminal
```

Then open `http://localhost:8080/admin/` and choose "Work with local repository." Edits write straight to disk and are not committed automatically.

## Try the CMS UI with zero setup

Just want to click around the editor — on your phone, a colleague's laptop, whatever — without logging into GitHub or running `npm run cms`? Open `http://localhost:8080/admin/test.html` (or your network IP on another device, e.g. `http://<your-computer's-LAN-IP>:8080/admin/test.html`). It uses Decap's built-in test backend: no login, but also no persistence — nothing is saved anywhere, and a refresh wipes out whatever you typed. Never use it to make real content changes.

## Deploy

| Cloudflare Pages setting | Value |
|---|---|
| Build command | `npm run build` |
| Output directory | `_site` |
| Node | 22 (`.nvmrc`) |

## OAuth Worker (required for production CMS logins)

`oauth-worker/` is a small Cloudflare Worker that handles the GitHub OAuth handshake for Decap CMS in production.

```bash
cd oauth-worker
npm install
npx wrangler deploy
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
```

Set `ALLOWED_ORIGIN` in `oauth-worker/wrangler.toml` to the production site origin before deploying.

## Setup order (first-time handoff)

1. Deploy Cloudflare Pages (connect this repo).
2. Deploy the OAuth Worker (`oauth-worker/`).
3. Create a GitHub OAuth App; callback URL is `https://<worker-url>/callback`.
4. Set Worker secrets (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`) and `ALLOWED_ORIGIN`, then redeploy the Worker.
5. Update `src/admin/config.yml` with the real `repo` and `base_url`.
6. Push, then give officers Write access to the repo.

See [CLAUDE.md](CLAUDE.md) for the full content model, branding rules, and remaining placeholders.
