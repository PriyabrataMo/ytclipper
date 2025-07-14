# Docker Deployment Guide

## Environment Configuration

### Critical Production Settings

For production deployment, ensure these environment variables are properly configured:

#### Cookie Configuration
```bash
COOKIE_DOMAIN=.ytclipper.com    # Set to your domain (with leading dot for subdomains)
COOKIE_SECURE=true              # MUST be true for HTTPS (production)
COOKIE_HTTP_ONLY=true           # Security best practice
```

**Important**: If cookies are not being set in production:
1. Verify `COOKIE_DOMAIN` matches your domain (use `.example.com` for subdomains)
2. Ensure `COOKIE_SECURE=true` for HTTPS connections
3. Check that your frontend and backend are on the same domain or properly configured subdomains

### Setup
1. Copy `env.example` to `.env`
2. Update all placeholder values with production secrets
3. Pay special attention to cookie configuration for cross-origin authentication