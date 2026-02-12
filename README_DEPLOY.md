# Deployment Guide: CogniPath LMS

This guide explains how to deploy the CogniPath LMS application to Google Cloud Platform (Cloud Run) and Firebase Hosting using the automated `deploy.sh` script.

## Pre-requisites

Before running the deployment script, ensure you have completed the following setup steps.

### 1. Google Cloud Project Setup

1.  **Create a Project**: Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a new project (or select an existing one). Note your **Project ID**.
2.  **Enable Billing**: Ensure billing is enabled for your project.
3.  **Enable APIs**: Enable the following APIs in the "APIs & Services" > "Library" section:
    *   **Cloud Run Admin API**
    *   **Artifact Registry API** (or Container Registry API)
    *   **Cloud Build API**

### 2. Firebase Setup

1.  **Create a Firebase Project**: Go to the [Firebase Console](https://console.firebase.google.com/). You can add Firebase to your existing Google Cloud Project.
2.  **Upgrade to Blaze Plan**: Cloud Run functions (if used) and certain Google Cloud integrations require the "Blaze" (Pay as you go) plan. Even for the free tier usage, a credit card is often required for verification.
    *   Go to "Usage and Billing" in Firebase project settings and switch to **Blaze**.
3.  **Install Firebase CLI**:
    ```bash
    npm install -g firebase-tools
    ```
4.  **Login**:
    ```bash
    firebase login
    ```

### 3. Google Cloud CLI Setup

1.  **Install gcloud CLI**: Download and install the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install).
2.  **Login**:
    ```bash
    gcloud auth login
    ```
3.  **Configure Project**:
    ```bash
    gcloud config set project [YOUR_PROJECT_ID]
    ```

## Usage

Once the setup is complete, you can deploy the entire stack with a single command.

### Run the Script

Open your terminal (Git Bash or WSL recommended on Windows) and run:

```bash
# Make the script executable (only needed once)
chmod +x deploy.sh

# Run the deployment script
./deploy.sh [YOUR_PROJECT_ID]
```

*Replace `[YOUR_PROJECT_ID]` with your actual Google Cloud Project ID.*

### What the Script Does

1.  **Environment Check**: Verifies `gcloud` and `firebase` are installed.
2.  **Frontend Build**: Installs npm dependencies and builds the React app in `client/`.
3.  **Backend Build**: Submits the `server/` code to Cloud Build and stores the container image in Google Container Registry (GCR).
4.  **Backend Deploy**: Deploys the container to **Cloud Run** (Region: `asia-southeast1`, Public access enabled).
5.  **Hosting Deploy**: Deploys the built frontend (`client/dist`) to **Firebase Hosting**.

## Post-Deployment Configuration

After deployment, you may need to update your frontend environment variables to point to the live backend URL.

1.  Get the Backend URL from the script output (or Cloud Run console).
2.  Update your `client/.env.production` (or create it) with:
    ```
    VITE_API_URL=[YOUR_CLOUD_RUN_URL]
    ```
3.  Re-run the deployment script (or just `npm run build` inside `client` and `firebase deploy --only hosting`) to apply the changes.
