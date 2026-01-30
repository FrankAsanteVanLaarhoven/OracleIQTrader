# API Documentation Deployment

This directory contains the OracleIQTrader API documentation.

## Deployment Options

### Option 1: GitHub Pages
1. Push `/app/docs/` to a GitHub repository
2. Enable GitHub Pages in repo settings
3. Access at: `https://your-username.github.io/repo-name/`

### Option 2: Vercel
```bash
cd /app/docs
npx vercel --prod
```

### Option 3: Netlify
1. Drag and drop the `/app/docs/` folder to netlify.com/drop
2. Or use CLI: `npx netlify deploy --prod --dir=./docs`

### Option 4: Add to Main Nginx (Recommended)
Add to your nginx.conf:
```nginx
location /docs {
    alias /var/www/api-docs;
    index API_DOCUMENTATION.html;
}
```

### Option 5: Docker Sidecar
Use the provided `Dockerfile.docs` to run as a separate service.

## Files Included
- `API_DOCUMENTATION.md` - Full API reference in Markdown
- `openapi.yaml` - OpenAPI 3.0 specification
- `index.html` - Interactive documentation viewer (Swagger UI)

## Live Documentation URL
Once deployed: `https://docs.oracleiqtrader.com/`
