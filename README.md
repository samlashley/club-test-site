# Club site (test build)

Static site built with **Eleventy**, hosted on **Cloudflare Pages**, edited by officers through **Decap CMS** at `/admin`.

```
src/
  _data/site.json      team name, links, calendar URLs   (editable in /admin)
  _data/results.json   game results                       (editable in /admin)
  roster/*.md          one file per player                (editable in /admin)
  news/*.md            one file per post                  (editable in /admin)
  _includes/           page layouts
  css/style.css        all styles
  admin/               Decap CMS (index.html + config.yml)
oauth-worker/          tiny Cloudflare Worker for GitHub login to /admin
```

## Run it locally

```bash
npm install
npm run dev          # site at http://localhost:8080
```

Try the editor without GitHub: in a second terminal run `npm run cms`, then open
http://localhost:8080/admin/ and pick "Work with local repository". Edits save straight to your files.

## Deploy the site (Cloudflare Pages)

1. Push this folder to a GitHub repo (ideally under a club GitHub organization).
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick the repo.
3. Build command: `npm run build` · Output directory: `_site`
4. Node version comes from `.nvmrc` (22).

## Turn on /admin logins

1. **Deploy the Worker:**
   ```bash
   cd oauth-worker
   npm install
   npx wrangler login
   npx wrangler deploy        # note the *.workers.dev URL it prints
   ```
2. **Create a GitHub OAuth app** (club org → Settings → Developer settings → OAuth Apps):
   - Homepage URL: your Pages URL
   - Authorization callback URL: `https://<worker-url>/callback`
3. **Add the secrets to the Worker:**
   ```bash
   npx wrangler secret put GITHUB_CLIENT_ID
   npx wrangler secret put GITHUB_CLIENT_SECRET
   ```
4. Set `ALLOWED_ORIGIN` in `oauth-worker/wrangler.toml` to your site's URL, then `npx wrangler deploy` again.
5. In `src/admin/config.yml`, set `repo` and `base_url` (the Worker URL). Push.
6. Add each officer to the GitHub repo with **Write** access. They log in at `yoursite/admin`.

## Swap in the real calendar

Google Calendar → the team calendar's Settings → **Integrate calendar**:
- copy the `src="..."` URL from the embed code into `calendarEmbedUrl`
- copy "Public address in iCal format" into `calendarSubscribeUrl`

(The calendar must be public. Add `&mode=AGENDA` to the embed URL for a phone-friendly list.)

## Handoff checklist

- [ ] Cloudflare account, domain, Google Calendar under a shared club email
- [ ] Repo + OAuth app in a club GitHub org with 2+ owners
- [ ] Domain auto-renew on (or just use the free `.pages.dev` address)
- [ ] Each year: remove graduating officers from the repo, add new ones

## Upgrading Decap

`src/admin/index.html` pins Decap with an integrity hash. To upgrade, change the version and regenerate the hash:

```bash
V=3.17.1
curl -s https://unpkg.com/decap-cms@$V/dist/decap-cms.js | openssl dgst -sha384 -binary | openssl base64 -A
```

Paste the result after `sha384-` in the `integrity` attribute. If `/admin` loads as a blank page, check the browser console for an integrity error.
