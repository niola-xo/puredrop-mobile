# PureDrop Mobile

A cross-platform mobile shopping app for PureDrop pure water deliveries, built with Expo (React Native, TypeScript, Expo Router) and connected to the shared PureDrop Supabase backend.

## Links
- Live Web App: https://puredrop-mobile.vercel.app
- PureDrop Web Shop: https://puredrop-swart.vercel.app
- GitHub Repository: https://github.com/niola-xo/puredrop-mobile

## Architecture & Shared Supabase Backend
This app connects to the same Supabase project (`nsmpftalooejxcnqlfio.supabase.co`) as the main Next.js web shop:
- **Shared Authentication**: Google OAuth provider via Supabase Auth. Logging in on mobile with the same Google account links to the exact same customer record as the website.
- **Shared Database**: Products load live from the `products` table. Cart lines write to the `cart_items` table with Row Level Security (RLS) enforcing that users only access their own items.
- **Cross-Device Realtime Sync**: Both web and mobile subscribe to Supabase Realtime (`postgres_changes` on `cart_items`). Adding, changing quantities, or removing items on one device reflects immediately on the other device without manual refresh.
- **In-App Checkout API**: Integrates directly with the backend `POST /api/checkout` endpoint via secure Bearer tokens, creating orders and subscriptions and triggering Mailgun confirmation emails.
- **Foreground Refresh**: Listens to app state transitions to ensure the cart reloads fresh data when returning to the foreground.

## Features
- **Modern Polished UI**: Elevated cards, soft shadow tokens, clear typography, and responsive buttons designed for mobile touch screens.
- **Products Tab**: Live catalog with Nigerian Naira prices (`₦2,400`), product descriptions, and instant Add to Cart action with visual feedback.
- **Cart Tab**: Itemized cart items, unit prices, quantity steppers (minimum 1, maximum 99), line item totals, remove action, overall cart summary total, and direct button to in-app checkout.
- **In-App Checkout (Phase 7)**:
  - Full name, phone (min 10 digits), delivery address, and optional landmark.
  - One-time delivery with 30-day Lagos date selector starting tomorrow.
  - Subscribe & Save option with Weekly or Monthly frequency and preferred weekday selector with calculated first delivery date.
  - Demo payment mode notice (no real payment credentials taken).
  - In-screen order confirmation displaying order reference, schedule, and Mailgun delivery status.
- **Account Tab**: Displays user profile avatar, name, email, Google linked status, delivery coverage, and working Logout action.

## Environment Variables
The mobile repository only contains public values:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://nsmpftalooejxcnqlfio.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zbXBmdGFsb29lanhjbnFsZmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NDYwNDksImV4cCI6MjEwNjQyMjA0OX0.2HaoY57d8T8xCui78qLSLv4d1svOkQQKzQgg6mV8pgs
EXPO_PUBLIC_WEB_URL=https://puredrop-swart.vercel.app
EXPO_PUBLIC_API_URL=https://puredrop-swart.vercel.app
```
No secrets or service role keys are stored in the client or repository.

## Running Locally
1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/niola-xo/puredrop-mobile.git
   cd puredrop-mobile
   npm install
   ```
2. Start the development server:
   ```bash
   npx expo start -c
   ```
3. Open in Expo Go on your phone or press `w` to open in your web browser.

## Building Android APK (.apk)
The project includes an `eas.json` configuration with a `preview` profile configured to produce a standalone Android `.apk` file:

1. Install EAS CLI globally if not already installed:
   ```bash
   npm install -g eas-cli
   ```
2. Log in to your Expo account:
   ```bash
   eas login
   ```
3. Run the APK build:
   ```bash
   eas build --platform android --profile preview
   ```
4. Download the `.apk` file from the build URL provided in the terminal output and install it directly on your Android device.

## Next Steps (Out of Scope for Core Project)
- Real card payments and automatic recurring billing.
- Push notifications for order dispatch updates.
- Driver GPS live tracking.
- Dark mode theme toggle.
