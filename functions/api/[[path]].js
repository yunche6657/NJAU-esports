import worker from '../../backend-cf/worker.js';

// Reuse the tested Worker router inside Cloudflare Pages Functions.
// Bind D1 as `DB` and set `ADMIN_KEY` in the Pages project settings.
export async function onRequest(context) {
  return worker.fetch(context.request, context.env, context);
}
