export async function register() {
  // RSS cache is filled on the first request / cron refresh.
  // Importing the feed module here makes Next.js file-trace local cache files
  // into the serverless bundle, which breaks Vercel deploys.
}
