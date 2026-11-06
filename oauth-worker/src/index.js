const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const STATE_COOKIE = "decap_oauth_state";

function randomState() {
  return crypto.randomUUID();
}

function parseCookies(request) {
  const header = request.headers.get("Cookie") || "";
  return header.split(";").reduce((cookies, part) => {
    const [key, ...rest] = part.trim().split("=");
    if (key) cookies[key] = rest.join("=");
    return cookies;
  }, {});
}

async function handleAuth(request, env) {
  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") || "public_repo";
  const state = randomState();

  const authorizeUrl = new URL(GITHUB_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  authorizeUrl.searchParams.set("scope", scope);
  authorizeUrl.searchParams.set("state", state);

  const cookie = [
    `${STATE_COOKIE}=${state}`,
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Path=/callback",
    "Max-Age=600",
  ].join("; ");

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizeUrl.toString(),
      "Set-Cookie": cookie,
      "Cache-Control": "no-store",
    },
  });
}

function renderCallbackScript(status, payload, allowedOrigin) {
  const message = JSON.stringify({ status, ...payload });
  const originArg = allowedOrigin ? JSON.stringify(allowedOrigin) : "'*'";
  return `<!doctype html>
<html><body>
<script>
(function () {
  function receiveMessage(message) {
    window.opener.postMessage(
      'authorization:github:${status}:${message}',
      ${originArg}
    );
    window.removeEventListener("message", receiveMessage, false);
  }
  window.addEventListener("message", receiveMessage, false);
  window.opener.postMessage("authorizing:github", ${originArg});
})();
</script>
</body></html>`;
}

async function handleCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookies = parseCookies(request);
  const cookieState = cookies[STATE_COOKIE];

  const clearCookie = `${STATE_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/callback; Max-Age=0`;
  const baseHeaders = {
    "Content-Type": "text/html;charset=UTF-8",
    "Cache-Control": "no-store",
    "Set-Cookie": clearCookie,
  };

  if (!state || !cookieState || state !== cookieState) {
    return new Response(
      renderCallbackScript("error", { message: "Invalid or missing state" }, env.ALLOWED_ORIGIN),
      { status: 400, headers: baseHeaders }
    );
  }

  const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok || tokenData.error || !tokenData.access_token) {
    return new Response(
      renderCallbackScript(
        "error",
        { message: tokenData.error_description || "GitHub token exchange failed" },
        env.ALLOWED_ORIGIN
      ),
      { status: 400, headers: baseHeaders }
    );
  }

  return new Response(
    renderCallbackScript(
      "success",
      { token: tokenData.access_token, provider: "github" },
      env.ALLOWED_ORIGIN
    ),
    { status: 200, headers: baseHeaders }
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (env.ALLOWED_ORIGIN === "https://club.lashleyhomelab.com") {
      return new Response("ALLOWED_ORIGIN must not be the old test domain", { status: 500 });
    }

    if (url.pathname === "/auth") {
      return handleAuth(request, env);
    }

    if (url.pathname === "/callback") {
      return handleCallback(request, env);
    }

    return new Response("Decap OAuth helper is running.", {
      headers: { "Content-Type": "text/plain" },
    });
  },
};
