/**
 * The mobile sign-in flow ends by redirecting the browser to the app with a token in the URL.
 * If we redirected to ANY url that would be a token-theft hole, so only app deep links are allowed.
 *
 *  - `shopmobile://` and `exp+shopmobile://`: the installed / dev-build app (scheme set in the app's app.json)
 *  - `exp://`: Expo Go. Allowed only for localhost / private-network hosts (your phone and laptop on the
 *    same wifi). Tunnel hosts (*.exp.direct) can be registered by anyone, so they need ALLOW_EXPO_GO_REDIRECT=true.
 */
const ALWAYS_OK = ["shopmobile://", "exp+shopmobile://"];

function isPrivateHost(host: string): boolean {
  if (host === "localhost" || host.endsWith(".local")) return true;
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return a === 10 || a === 127 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31);
}

export function isAllowedMobileRedirect(url: string | null | undefined): url is string {
  if (!url) return false;
  let parsed: URL;
  try { parsed = new URL(url); } catch { return false; }
  if (ALWAYS_OK.some((p) => url.startsWith(p))) return true;
  if (parsed.protocol === "exp:") {
    return process.env.ALLOW_EXPO_GO_REDIRECT === "true" || isPrivateHost(parsed.hostname);
  }
  return false;
}

export function appendToken(redirect: string, token: string): string {
  const u = new URL(redirect);
  u.searchParams.set("token", token);
  return u.toString();
}
