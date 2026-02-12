#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting Deployment Process..."

# 1. Environment Check
echo "🔍 Checking dependencies..."
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed."
    exit 1
fi

if ! command -v firebase &> /dev/null; then
    echo "❌ Error: firebase CLI is not installed."
    exit 1
fi
echo "✅ Dependencies found."

# 2. Configuration (User Prompt or Argument)
PROJECT_ID=$1
if [ -z "$PROJECT_ID" ]; then
    read -p "🔹 Enter your Google Cloud Project ID: " PROJECT_ID
fi

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: Project ID is required."
    exit 1
fi

echo "✅ Using Project ID: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# 3. Frontend Build
echo "📦 Building Frontend..."
cd client
echo "   - Installing dependencies..."
npm install
echo "   - Running build..."
npm run build
cd ..
echo "✅ Frontend build complete."

# 4. Backend Containerization & Cloud Run Deployment
echo "🐳 Building & Deploying Backend to Cloud Run..."
IMAGE_TAG="gcr.io/$PROJECT_ID/cognipath-backend"

echo "   - Submitting build to Cloud Build..."
gcloud builds submit --tag $IMAGE_TAG ./server

echo "   - Deploying to Cloud Run..."
gcloud run deploy cognipath-backend \
    --image $IMAGE_TAG \
    --platform managed \
    --region asia-southeast1 \
    --allow-unauthenticated \
    --set-env-vars GOOGLE_CLOUD_PROJECT=$PROJECT_ID

echo "✅ Backend deployed successfully."

# 5. Firebase Hosting
echo "🔥 Deploying to Firebase Hosting..."
firebase deploy --only hosting --project $PROJECT_ID

echo "🎉 Deployment Complete!"
echo "   - Backend URL: (Check Cloud Run output above)"
echo "   - Frontend URL: (Check Firebase Hosting output above)"
