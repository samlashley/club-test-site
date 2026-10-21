// Minimal GitHub OAuth helper for Decap CMS.
// Decap opens /auth in a popup -> GitHub login -> /callback -> token handed back to /admin.

const GITHUB_AUTHORIZE = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN = "https://github.com/login/oauth/access_token";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/auth") return startLogin(url, env);
    if (url.pathname === "/callback") return finishLogin(request, url, env);
    return new Response("Decap OAuth helper is running.", { status: 200 });
  },
};

function startLogin(url, env) {
  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: `${url.origin}/callback`,
    scope: url.searchParams.get("scope") || "public_repo",
    state,
  });
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${GITHUB_AUTHORIZE}?${params}`,
      // Checked on the way back to block forged callbacks
      "Set-Cookie": `oauth_state=${state}; Path=/callback; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
  });
}

async function finishLogin(request, url, env) {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = (request.headers.get("Cookie") || "").match(/oauth_state=([^;]+)/)?.[1];

  if (!code || !state || state !== cookieState) {
    return reply(env, "error", { message: "Login expired or was tampered with. Close this window and try again." });
  }

  const res = await fetch(GITHUB_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const data = await res.json();

  if (!data.access_token) {
    return reply(env, "error", { message: data.error_description || "GitHub did not return a token." });
  }
  return reply(env, "success", { token: data.access_token, provider: "github" });
}

// Sends the result to the /admin window using Decap's postMessage handshake
function reply(env, status, payload) {
  const message = `authorization:github:${status}:${JSON.stringify(payload)}`;
  const allowed = JSON.stringify(env.ALLOWED_ORIGIN || "");
  const html = `<!doctype html><html><body><p>Finishing login…</p><script>
    (function () {
      var allowed = ${allowed};
      function receive(e) {
        if (allowed && e.origin !== allowed) return;
        window.opener.postMessage(${JSON.stringify(message)}, e.origin);
        window.removeEventListener("message", receive);
        setTimeout(function () { window.close(); }, 500);
      }
      window.addEventListener("message", receive);
      window.opener.postMessage("authorizing:github", "*");
    })();
  </script></body></html>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Set-Cookie": "oauth_state=; Path=/callback; Max-Age=0",
    },
  });
}
