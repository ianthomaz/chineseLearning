/**
 * Alipay sign / verify / state cookie. No network, no real keys.
 *
 *   cd web && npm run test:alipay
 */
import { generateKeyPairSync, createSign } from "node:crypto";
import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

const dir = mkdtempSync(join(tmpdir(), "lc-alipay-"));
process.env.SITE_DB = join(dir, "test.sqlite");

process.env.AUTH_SECRET = "test-secret-test-secret-test-secret";
process.env.AUTH_URL = "https://learnchinese.today";
process.env.NEXT_PUBLIC_BASE_PATH = "";

const alipay = await import(pathToFileURL(join(process.cwd(), "src/server/auth/alipay.ts")).href);
const session = await import(pathToFileURL(join(process.cwd(), "src/server/auth/session-cookie.ts")).href);
const { decode } = await import("next-auth/jwt");

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });

function signNode(content) {
  const signer = createSign("RSA-SHA256");
  signer.update(content);
  signer.end();
  return signer.sign(privateKey).toString("base64");
}

let failed = 0;
async function test(name, fn) {
  try {
    await fn();
    console.log(`ok  ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL ${name}`);
    console.error(err);
  }
}

await test("canonical string sorts and skips sign", () => {
  const signed = alipay.canonicalSignString({
    sign: "nope",
    version: "1.0",
    app_id: "1",
    empty: "",
    charset: "utf-8",
  });
  assert.equal(signed, "app_id=1&charset=utf-8&version=1.0");
});

await test("RSA2 sign verifies and rejects a changed byte", () => {
  const params = { app_id: "2021007115619132", method: "alipay.system.oauth.token", code: "once" };
  const signature = alipay.signAlipay(params, privateKey);
  const content = alipay.canonicalSignString(params);
  assert.equal(alipay.verifyAlipay(content, signature, publicKey), true);
  assert.equal(alipay.verifyAlipay(`${content}x`, signature, publicKey), false);
});

await test("token body yields open_id, union_id and access_token only when the signature matches", () => {
  const node = JSON.stringify({
    open_id: "open-id-1",
    union_id: "union-1",
    access_token: "tok-once",
  });
  const raw = `{"alipay_system_oauth_token_response":${node},"sign":"${signNode(node)}"}`;
  const ok = alipay.readTokenResponse(raw, publicKey);
  assert.equal(ok.ok, true);
  assert.equal(ok.openId, "open-id-1");
  assert.equal(ok.unionId, "union-1");
  assert.equal(ok.accessToken, "tok-once");

  const tampered = raw.replace("open-id-1", "open-id-2");
  assert.equal(alipay.readTokenResponse(tampered, publicKey).reason, "bad_sign");
});

await test("token body without union_id still logs in via open_id", () => {
  const node = JSON.stringify({ open_id: "open-only", access_token: "tok" });
  const raw = `{"alipay_system_oauth_token_response":${node},"sign":"${signNode(node)}"}`;
  const ok = alipay.readTokenResponse(raw, publicKey);
  assert.equal(ok.ok, true);
  assert.equal(ok.openId, "open-only");
  assert.equal(ok.unionId, null);
});

await test("user share keeps email when Alipay sends one", () => {
  const node = JSON.stringify({
    code: "10000",
    nick_name: "小明",
    avatar: "https://example.com/a.png",
    email: "same@example.com",
  });
  const raw = `{"alipay_user_info_share_response":${node},"sign":"${signNode(node)}"}`;
  const profile = alipay.readUserShareResponse(raw, publicKey, "open-id-1");
  assert.equal(profile?.openId, "open-id-1");
  assert.equal(profile?.email, "same@example.com");
  assert.equal(profile?.name, "小明");
  assert.equal(profile?.image, "https://example.com/a.png");

  const noMail = JSON.stringify({ code: "10000", nick_name: "小明" });
  const noMailRaw = `{"alipay_user_info_share_response":${noMail},"sign":"${signNode(noMail)}"}`;
  const bare = alipay.readUserShareResponse(noMailRaw, publicKey, "open-id-1");
  assert.equal(bare?.email, null);
  assert.equal(bare?.name, "小明");
});

await test("missing open_id and error_response do not count as a login", () => {
  const noId = JSON.stringify({ user_id: "2088000000000000", access_token: "x" });
  const noIdRaw = `{"alipay_system_oauth_token_response":${noId},"sign":"${signNode(noId)}"}`;
  assert.equal(alipay.readTokenResponse(noIdRaw, publicKey).reason, "missing_open_id");

  const errorNode = JSON.stringify({ code: "40002", sub_code: "isv.code-invalid" });
  const errorRaw = `{"error_response":${errorNode},"sign":"${signNode(errorNode)}"}`;
  const error = alipay.readTokenResponse(errorRaw, publicKey);
  assert.equal(error.ok, false);
  assert.equal(error.reason, "alipay_error");
  assert.equal(error.detail, "isv.code-invalid");
});

await test("timestamp is Beijing time with a space", () => {
  const stamp = alipay.alipayTimestamp(new Date("2026-11-04T09:25:00Z"));
  assert.equal(stamp, "2026-11-04 17:25:00");
});

await test("authorize URL uses the launched app id and encodes the callback", () => {
  assert.equal(
    alipay.alipayRedirectUri(),
    "https://learnchinese.today/api/auth/alipay/callback",
  );
  const url = new URL(
    alipay.alipayAuthorizeUrl(
      {
        appId: "2021007115619132",
        redirectUri: "https://learnchinese.today/api/auth/alipay/callback",
      },
      "abc",
    ),
  );
  assert.equal(url.origin + url.pathname, "https://openauth.alipay.com/oauth2/publicAppAuthorize.htm");
  assert.equal(url.searchParams.get("app_id"), "2021007115619132");
  assert.equal(url.searchParams.get("scope"), "auth_user");
  assert.equal(url.searchParams.get("redirect_uri"), "https://learnchinese.today/api/auth/alipay/callback");
  assert.equal(url.searchParams.get("state"), "abc");
});

await test("state cookie round-trips a same-site path and drops an open redirect", () => {
  const packed = alipay.packStateCookie("state-1", "/tutor?x=1");
  assert.deepEqual(alipay.unpackStateCookie(packed), { state: "state-1", returnPath: "/tutor?x=1" });
  assert.equal(alipay.isSafeReturnPath("//evil.example"), false);
  assert.equal(alipay.isSafeReturnPath("/ok"), true);
  assert.equal(alipay.withAuthError("/tutor?x=1"), "/tutor?x=1&authError=alipay");
});

await test("session token is the Auth.js cookie for this user id", async () => {
  const secure = false;
  const token = await session.authSessionToken("u_alipay", secure);
  const decoded = await decode({
    token,
    secret: process.env.AUTH_SECRET,
    salt: session.authSessionCookieName(secure),
  });
  assert.equal(decoded?.sub, "u_alipay");
});

await test("mobile auth-info uses the mobile APPID and a valid URL-encoded RSA2 signature", () => {
  const config = { appId: "2021007115685095", pid: "2088000000000000", privateKey };
  const params = new URLSearchParams(alipay.buildMobileAuthInfoStr(config, "target-id-123456"));
  assert.equal(params.get("app_id"), config.appId);
  assert.equal(params.get("pid"), config.pid);
  assert.equal(params.get("target_id"), "target-id-123456");
  assert.equal(params.get("method"), "alipay.open.auth.sdk.code.get");
  assert.equal(params.get("scope"), "kuaijie");
  assert.equal(params.get("sign_type"), "RSA2");
  assert.equal(alipay.verifyAlipay(alipay.canonicalSignString(Object.fromEntries(params)), params.get("sign"), publicKey), true);
  params.set("app_id", "2021007115619132");
  assert.equal(alipay.verifyAlipay(alipay.canonicalSignString(Object.fromEntries(params)), params.get("sign"), publicKey), false);
});

await test("signed token errors and unsigned bodies never become identities", () => {
  const node = JSON.stringify({ code: "40004", sub_code: "isv.code-invalid", open_id: "must-not-login" });
  const raw = `{"alipay_system_oauth_token_response":${node},"sign":"${signNode(node)}"}`;
  assert.deepEqual(alipay.readTokenResponse(raw, publicKey), { ok: false, reason: "alipay_error", detail: "isv.code-invalid" });
  assert.equal(alipay.readTokenResponse('{"alipay_system_oauth_token_response":{"open_id":"unsigned"}}', publicKey).ok, false);
});

await test("auth-info rejects missing configuration and invalid PID, then signs a valid request", async () => {
  const { GET } = await import(pathToFileURL(join(process.cwd(), "src/app/api/app/alipay/auth-info/route.server.ts")).href);
  delete process.env.ALIPAY_MOBILE_PID;
  const req = new Request("https://learnchinese.today/api/app/alipay/auth-info?targetId=target-id-123456");
  assert.equal(GET(req).status, 503);
  assert.equal((await GET(req).json()).error, "alipay_mobile_unconfigured");
  process.env.ALIPAY_MOBILE_APP_ID = "2021007115685095";
  process.env.ALIPAY_MOBILE_APPLICATION_PRIVATE_KEY = privateKey.export({ type: "pkcs8", format: "pem" });
  process.env.ALIPAY_MOBILE_PUBLIC_KEY = publicKey.export({ type: "spki", format: "pem" });
  process.env.ALIPAY_MOBILE_PID = "invalid";
  assert.equal(alipay.alipayMobileConfig(), null);
  process.env.ALIPAY_MOBILE_PID = "2088000000000000";
  assert.equal(GET(new Request("https://learnchinese.today/api/app/alipay/auth-info?targetId=short")).status, 400);
  const result = GET(req);
  assert.equal(result.status, 200);
  const body = await result.json();
  assert.equal(body.scheme, "today.learnchinese.app");
  assert.equal(new URLSearchParams(body.infoStr).get("app_id"), "2021007115685095");
});

await test("mobile code exchange creates a Bearer session without merging an unverified Alipay email", async () => {
  const api = await import(pathToFileURL(join(process.cwd(), "src/app/api/app/auth/[provider]/route.server.ts")).href);
  const db = await import(pathToFileURL(join(process.cwd(), "src/server/db/identity.ts")).href);
  const userId = db.resolveOAuthUser({ provider: "google", providerAccountId: "google-mail", email: "same@example.com", emailVerified: true });
  const posted = globalThis.fetch;
  const params = [];
  globalThis.fetch = async (_url, init) => {
    const body = new URLSearchParams(init.body);
    assert.equal(body.get("app_id"), "2021007115685095");
    assert.equal(alipay.verifyAlipay(alipay.canonicalSignString(Object.fromEntries(body)), body.get("sign"), publicKey), true);
    params.push(body.get("method"));
    const node = JSON.stringify(body.get("method") === "alipay.system.oauth.token"
      ? { open_id: "mobile-open-id", access_token: "once", user_id: "2088000000000001" }
      : { code: "10000", nick_name: "小明", email: "same@example.com" });
    return new Response(`{"${body.get("method") === "alipay.system.oauth.token" ? "alipay_system_oauth_token_response" : "alipay_user_info_share_response"}":${node},"sign":"${signNode(node)}"}`);
  };
  try {
    const result = await api.POST(new Request("https://learnchinese.today/api/app/auth/alipay", {
      method: "POST", body: JSON.stringify({ authCode: "single-use-code", client: "ios" }),
    }), { params: Promise.resolve({ provider: "alipay" }) });
    assert.equal(result.status, 200);
    const body = await result.json();
    assert.ok(body.token);
    assert.notEqual(body.account.id, userId);
    assert.equal(db.userIdForAppToken(body.token), body.account.id);
    assert.equal(db.getIdentityUser(body.account.id).emailVerifiedAt, null);
    assert.deepEqual(params, ["alipay.system.oauth.token", "alipay.user.info.share"]);
  } finally {
    globalThis.fetch = posted;
  }
});

await test("mobile gateway failures return an Alipay error and create no session", async () => {
  const api = await import(pathToFileURL(join(process.cwd(), "src/app/api/app/auth/[provider]/route.server.ts")).href);
  const posted = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("offline"); };
  try {
    const result = await api.POST(new Request("https://learnchinese.today/api/app/auth/alipay", {
      method: "POST", body: JSON.stringify({ authCode: "single-use-code" }),
    }), { params: Promise.resolve({ provider: "alipay" }) });
    assert.equal(result.status, 502);
    const body = await result.json();
    assert.equal(body.error, "alipay_failed");
    assert.equal(body.token, undefined);
  } finally {
    globalThis.fetch = posted;
  }
});

await test("website Alipay email cannot merge accounts or enter an email-based admin session", async () => {
  const api = await import(pathToFileURL(join(process.cwd(), "src/app/api/auth/alipay/callback/route.server.ts")).href);
  const { NextRequest } = await import("next/server.js");
  const db = await import(pathToFileURL(join(process.cwd(), "src/server/db/identity.ts")).href);
  process.env.ALIPAY_APP_ID = "2021007115619132";
  process.env.ALIPAY_APPLICATION_PRIVATE_KEY = privateKey.export({ type: "pkcs8", format: "pem" });
  process.env.ALIPAY_PUBLIC_KEY = publicKey.export({ type: "spki", format: "pem" });
  const posted = globalThis.fetch;
  globalThis.fetch = async (_url, init) => {
    const body = new URLSearchParams(init.body);
    assert.equal(body.get("app_id"), "2021007115619132");
    const node = JSON.stringify(body.get("method") === "alipay.system.oauth.token"
      ? { open_id: "web-open-id", access_token: "once" }
      : { code: "10000", email: "same@example.com" });
    return new Response(`{"${body.get("method") === "alipay.system.oauth.token" ? "alipay_system_oauth_token_response" : "alipay_user_info_share_response"}":${node},"sign":"${signNode(node)}"}`);
  };
  try {
    const result = await api.GET(new NextRequest("https://learnchinese.today/api/auth/alipay/callback?state=state-1&auth_code=once", {
      headers: { cookie: `${alipay.ALIPAY_STATE_COOKIE}=${alipay.packStateCookie("state-1", "/")}` },
    }));
    assert.equal(result.status, 307);
    assert.equal(result.headers.get("location"), "https://learnchinese.today/");
    const token = result.cookies.get(session.authSessionCookieName(true))?.value;
    assert.ok(token);
    const decoded = await decode({ token, secret: process.env.AUTH_SECRET, salt: session.authSessionCookieName(true) });
    assert.equal(decoded.email, null);
    assert.deepEqual(db.providersOf(decoded.sub), ["alipay"]);
    assert.equal(db.getIdentityUser(decoded.sub).emailVerifiedAt, null);
  } finally {
    globalThis.fetch = posted;
  }
});

rmSync(dir, { recursive: true, force: true });
if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log("\n15 passed");
