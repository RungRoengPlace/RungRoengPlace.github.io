# Village Account App - Setup Guide

This project is a modern React application that replicates the original Google Apps Script interface.

## Local Development (Mock Mode)

The application is currently configured to use **Mock Data** for local development. This means you can run the app immediately without connecting to Google Sheets, but data changes will not persist after refresh.

To run:
1. `npm install`
2. `npm run dev`
3. Open the URL shown (e.g., `http://localhost:5173`)

## Connect to Google Sheets (Real Database)

To use your existing Google Sheet as the real database:

### 1. Update Google Apps Script
1. Go to your Google Sheet: [`1XPM_5eS7lRXQOHoDM6R5zR_yfeiP2x7EwRnsinNovfw`](https://docs.google.com/spreadsheets/d/1XPM_5eS7lRXQOHoDM6R5zR_yfeiP2x7EwRnsinNovfw)
2. Open **Extensions > Apps Script**.
3. Create a new file or replace `code.gs` with the content of `src/server/code-api.js` (found in this project).
   - This new code transforms your script into a JSON API.
4. **Deploy** as a Web App:
   - Click **Deploy** > **New Deployment**.
   - Select type: **Web app**.
   - Description: "Village API".
   - Execute as: **Me** (your google account).
   - **Who has access**: **Anyone** (Important! This allows the React app to access it).
   - Click **Deploy**.
   - **Copy the Web App URL** (e.g., `https://script.google.com/macros/s/.../exec`).

### 2. Configure React App
1. Open `src/lib/api.ts` in this project.
2. Update the configuration at the top:
   ```typescript
   const USE_REAL_API = true;
   const GOOGLE_SCRIPT_URL = 'PASTE_YOUR_WEB_APP_URL_HERE';
   ```
3. Save the file. The app will now fetch and save data to your real Google Sheet!

## Project Structure

- `src/components`: UI Components (Login, Dashboard, Income, Expense, Reports).
- `src/lib/api.ts`: Central service for data fetching. Handles both Mock and Real API.
- `src/types.ts`: Data definitions.
- `original_source/`: Backup of your original files.
