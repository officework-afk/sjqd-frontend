# SJQD Frontend

## Local browser use

Run the frontend:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Mobile phone use on the same Wi-Fi

1. Keep the backend running on the same computer at port `5000`.
2. Run the frontend with:

```bash
npm run dev:mobile
```

3. Find your computer's local IP address.
4. Open `http://YOUR_PC_IP:3000` on your mobile phone browser.

The frontend now uses a same-origin proxy path (`/backend-api`) so your phone only needs access to the frontend port. The Next.js server forwards backend requests to the local backend automatically.

## Public deployment

If you deploy the frontend publicly, set:

```bash
SJQD_BACKEND_ORIGIN=https://your-backend-domain.com
```

Then build and start normally:

```bash
npm run build
npm run start:mobile
```

## Install on phone

The app now includes mobile-friendly viewport settings and a web app manifest. On Android Chrome or iPhone Safari, open the site and use `Add to Home Screen` to install it like an app.
