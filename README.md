# E-Commerce Platform

## Architecture Overview

This project is a modern, high-performance e-commerce application utilizing a decoupled architecture.

- **Frontend:** Next.js (React), deployed on Vercel.
- **Backend:** FastAPI (Python 3.11), containerized with Docker and deployed on Google Cloud Platform (Cloud Run).
- **Database:** PostgreSQL, managed via Supabase.
- **AI Integration:** Google Gemini API for intelligent product recommendations and customer assistance.

## Repository Structure

The repository is structured into two main directories:

- `/src` & `/public` - Contains the Next.js frontend application.
- `/backend` - Contains the FastAPI backend application.

## Prerequisites

- Node.js (v18 or higher)
- Python (3.11 or higher)
- Docker (for local containerized testing)
- Google Cloud SDK (gcloud CLI)

## Environment Configuration

### Backend Environment Variables (`/backend/.env`)

Ensure the following variables are configured in your production environment (GCP Cloud Run -> Variables & Secrets):
DATABASE_URL=postgresql://[user]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
SECRET_KEY=[your_jwt_secret_key]
GEMINI_API_KEY=[your_google_gemini_api_key]
BASE_URL=https://[your-gcp-cloud-run-url]

### Frontend Environment Variables (`/.env.local`)

NEXT_PUBLIC_API_URL=https://[your-gcp-cloud-run-url]

## Local Development Setup

### Backend Setup

1. Navigate to the backend directory: `cd backend`
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment.
4. Install dependencies: `pip install -r requirements.txt`
5. Run the development server: `uvicorn main:app --reload --port 8000`

### Frontend Setup

1. Return to the root directory.
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Access the application at `http://localhost:3000`.

## Deployment Guidelines

### Backend Deployment (Google Cloud Run)

The backend is containerized and hosted on GCP Cloud Run. To deploy a new revision:

1. Authenticate with Google Cloud: `gcloud auth login`
2. Set the project ID: `gcloud config set project [PROJECT_ID]`
3. Submit the build to Artifact Registry:
   `gcloud builds submit --tag [REGION]-docker.pkg.dev/[PROJECT_ID]/[REPO_NAME]/backend:latest`
4. Deploy to Cloud Run:
   `gcloud run deploy backend --image [REGION]-docker.pkg.dev/[PROJECT_ID]/[REPO_NAME]/backend:latest --region [REGION]`

### Frontend Deployment (Vercel)

The frontend is deployed on Vercel. Pushing to the main branch will automatically trigger a new build. Ensure `NEXT_PUBLIC_API_URL` is updated in the Vercel project settings to point to the active GCP Cloud Run service.
