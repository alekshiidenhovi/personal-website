/**
 * Runs in front of the static build (see `assets` in wrangler.jsonc) so the
 * site has one address: requests for www or the old workers.dev URL are
 * permanently redirected to the same path on hiidenhovi.dev. Everything else
 * is served from the build as is.
 */
const CANONICAL_HOST = "hiidenhovi.dev";

const redirectsToCanonical = (host: string) => host === `www.${CANONICAL_HOST}` || host.endsWith(".workers.dev");

interface Env {
  /** The static build */
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (redirectsToCanonical(url.hostname)) {
      // Browsers keep the #fragment across the redirect, so section links still land
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
