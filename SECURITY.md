# Security operations

Secrets belong only in local `.env` files and the Render/Vercel environment-variable dashboards. Never commit them. Variables beginning with `NEXT_PUBLIC_` are included in browser JavaScript and must only contain public identifiers or public keys.

## Required production rotation

Rotate credentials immediately if they were pasted into chat, screenshots, logs, or commits:

- MongoDB Atlas database password
- JWT access and refresh secrets
- Paystack secret key
- Brevo API key
- Cloudinary API secret
- Admin password
- Vercel OIDC token

After rotation, update Render/Vercel variables and redeploy. Use a dedicated least-privilege MongoDB application user, restrict Atlas network access as tightly as the hosting setup allows, enable MFA on GitHub/Vercel/Render/Atlas/Paystack, and protect the production branch.

## Production configuration

- Vercel `BACKEND_URL`: the HTTPS Render service origin
- Vercel `NEXT_PUBLIC_API_URL`: `/api/v1`
- Render `WEB_URL`: the exact HTTPS Vercel production origin, without a trailing slash
- Render `NODE_ENV`: `production`
- Do not expose server secrets with a `NEXT_PUBLIC_` prefix
