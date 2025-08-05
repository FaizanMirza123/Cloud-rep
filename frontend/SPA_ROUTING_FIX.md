# Fix for React Router + Vite SPA routing

## Development Server

The development server should automatically handle client-side routing. If you're getting 404 errors when refreshing pages, try:

1. **Kill all Node processes**:

   ```powershell
   Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force
   ```

2. **Start the server fresh**:

   ```bash
   npm run dev
   ```

3. **If issue persists, try starting Vite directly**:
   ```bash
   npx vite --port 5173 --host
   ```

## Production Build

For production, ensure your hosting provider (Vercel, Netlify, etc.) is configured for SPA routing with a fallback to `index.html`.

## Common Causes

- Browser cache issues (hard refresh: Ctrl+Shift+R)
- Multiple Node processes running
- Incorrect base URL configuration
- Authentication context loading race condition

## Quick Fix

Try accessing the app via `http://localhost:5173` (not `127.0.0.1`) and use browser navigation instead of direct URL entry when possible.
