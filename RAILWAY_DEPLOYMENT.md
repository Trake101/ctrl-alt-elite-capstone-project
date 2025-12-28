# Railway Deployment Guide

This guide will help you deploy your full-stack application to Railway.

## Prerequisites

1. A Railway account (sign up at [railway.app](https://railway.app))
2. Railway CLI installed (optional, but helpful): `npm i -g @railway/cli`
3. Your project repository connected to GitHub/GitLab/Bitbucket

## Project Structure

This is a monorepo with three main components:
- **Backend**: FastAPI application (Python)
- **Frontend**: Next.js application (Node.js)
- **Database**: PostgreSQL (provided by Railway)

## Deployment Steps

### 1. Create a New Project on Railway

1. Go to [railway.app](https://railway.app) and create a new project
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository

### 2. Add PostgreSQL Database

1. In your Railway project, click "New" → "Database" → "Add PostgreSQL"
2. Railway will automatically create a PostgreSQL database
3. Note the connection details (you'll need the `DATABASE_URL` environment variable)

### 3. Deploy Backend Service

1. In your Railway project, click "New" → "GitHub Repo" (or use the existing repo)
2. Select your repository
3. Railway should detect the `backend/railway.json` file
4. If not, configure the service:
   - **Root Directory**: `backend`
   - **Build Command**: (auto-detected from railway.json)
   - **Start Command**: (auto-detected from railway.json)

#### Backend Environment Variables

Add these environment variables in the Railway service settings:

- `DATABASE_URL`: The PostgreSQL connection string from your database service
  - Format: `postgresql://user:password@host:port/database`
  - Railway provides this automatically if you link the database service
- `CLERK_SECRET_KEY`: Your Clerk secret key (for authentication)
- `PORT`: Railway sets this automatically (usually 8000 or dynamic)

**To link the database:**
1. Go to your backend service settings
2. Click "Variables" tab
3. Click "Reference Variable"
4. Select your PostgreSQL service
5. Select `DATABASE_URL`

### 4. Deploy Frontend Service

1. In your Railway project, click "New" → "GitHub Repo" (or use the existing repo)
2. Select your repository again (same repo, different service)
3. Railway should detect the `frontend/railway.json` file
4. If not, configure the service:
   - **Root Directory**: `frontend`
   - **Build Command**: (auto-detected from railway.json)
   - **Start Command**: (auto-detected from railway.json)

#### Frontend Environment Variables

Add these environment variables in the Railway service settings:

- `NEXT_PUBLIC_BACKEND_URL`: The public URL of your backend service
  - Format: `https://your-backend-service.railway.app`
  - You can find this in your backend service's settings under "Domains"
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
- `CLERK_SECRET_KEY`: Your Clerk secret key
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`: `/sign-in` (or your custom sign-in path)
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`: `/sign-up` (or your custom sign-up path)
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`: `/dashboard`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`: `/dashboard`

**Important**: The `NEXT_PUBLIC_*` prefix makes these variables available in the browser.

### 5. Configure Domains

1. For each service (backend and frontend), go to the service settings
2. Click on "Settings" → "Generate Domain"
3. Railway will provide a `.railway.app` domain
4. For production, you can add a custom domain in the "Domains" section

### 6. Update Frontend Backend URL

After deploying the backend:
1. Copy the backend service's public URL (from the Domains section)
2. Update the frontend service's `NEXT_PUBLIC_BACKEND_URL` environment variable
3. Redeploy the frontend service

## Environment Variables Summary

### Backend Service
```
DATABASE_URL=postgresql://... (auto-provided by Railway when linked)
CLERK_SECRET_KEY=sk_test_... (from Clerk dashboard)
PORT=8000 (auto-set by Railway)
```

### Frontend Service
```
NEXT_PUBLIC_BACKEND_URL=https://your-backend.railway.app
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... (from Clerk dashboard)
CLERK_SECRET_KEY=sk_test_... (from Clerk dashboard)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

## Database Migrations

The backend service is configured to automatically run Alembic migrations on startup using the command in `backend/railway.json`:

```bash
alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

This ensures your database schema is always up to date when the backend starts.

## Troubleshooting

### Backend won't start
- Check that `DATABASE_URL` is correctly set and the database is accessible
- Verify that migrations can run successfully
- Check the Railway logs for error messages

### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_BACKEND_URL` is set correctly
- Ensure the backend service is running and accessible
- Check CORS settings if you see CORS errors

### Database connection issues
- Ensure the database service is running
- Verify the `DATABASE_URL` format is correct
- Check that the database service is linked to the backend service

### Build failures
- Check that all dependencies are in `requirements.txt` (backend) and `package.json` (frontend)
- Verify Dockerfiles are using the correct build targets (`prod`)
- Review build logs in Railway dashboard

## Monitoring

Railway provides:
- Real-time logs for each service
- Metrics and usage statistics
- Automatic restarts on failure
- Health check endpoints (your backend has `/health`)

## Cost Considerations

Railway offers:
- Free tier with $5 credit per month
- Pay-as-you-go pricing
- Database included in the free tier (with limits)

Monitor your usage in the Railway dashboard to stay within your budget.

## Next Steps

1. Set up custom domains for production
2. Configure environment-specific variables (staging vs production)
3. Set up CI/CD pipelines if needed
4. Configure monitoring and alerts
5. Set up backups for your database

## Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

