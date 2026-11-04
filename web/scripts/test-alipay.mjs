/**
 * Alipay sign / verify / state cookie. No network, no real keys.
 *
 *   cd web && npm run test:alipay
 */
import { generateKeyPairSync, createSign } from "node:crypto";
import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

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

await test("token body yields open_id only when the signature matches", () => {
  const node = JSON.stringify({ open_id: "open-id-1", access_token: "do-not-keep" });
  const raw = `{"alipay_system_oauth_token_response":${node},"sign":"${signNode(node)}"}`;
  const ok = alipay.readTokenResponse(raw, publicKey);
  assert.equal(ok.ok, true);
  assert.equal(ok.openId, "open-id-1");

  const tampered = raw.replace("open-id-1", "open-id-2");
  assert.equal(alipay.readTokenResponse(tampered, publicKey).reason, "bad_sign");
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

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log("\n8 passed");
