# WashFlow — Setup & What Was Fixed

## How to run it

**1. Database**
```
mysql -u root -p < Backend/schema.sql
```
This creates the `laundry_booking` database and its three tables
(`users`, `bookings`, `daily_slots`). There was no schema file in the
project before, so this step is new — the app can't run without it.

**2. Backend**
```
cd Backend
npm install
node createAdmin.js      # creates an admin login (see below)
npm run dev
```
Runs on http://localhost:8000. Check `Backend/.env` matches your local
MySQL username/password.

**3. Frontend**
```
cd Frontend/Laundry-frontend
npm install
npm run dev
```
Runs on http://localhost:5173.

**4. Log in**
- Register a normal account from the app's Register screen to use the
  student/user dashboard.
- For the admin dashboard, run `node createAdmin.js` (from the Backend
  folder) — it creates/updates a login:
  - email: `admin@laundry.com`
  - password: `Admin@123`
  Change the password after first login if you plan to share this.

## Bugs fixed

**Backend**
- `express.json()` was never added, so `req.body` was `undefined` on
  every request — login, register, and booking creation were all
  broken by this alone.
- `bookingController.js` called `db.getConnection()` instead of
  `db.promise().getConnection()`, which would throw immediately —
  booking creation couldn't work at all.
- Admin "accept booking" compared a MySQL `DATE` (returned as a JS
  `Date` object) to a plain string, so it always rejected valid
  same-day bookings. Fixed by returning dates as strings from MySQL
  (`dateStrings: true`).
- `.env` had `DB_PORT=8000` (that's the app's own port, not MySQL's) —
  changed to `3306`, and added a separate `PORT=8000` entry.
- No SQL schema existed anywhere in the project — added `schema.sql`.
- `createAdmin.js` only printed a password hash to the console instead
  of creating an admin account — rewrote it to actually create/update
  one in the database.

**Frontend**
- `App.jsx`, `Login.jsx`, and `Register.jsx` called `/auth/me`,
  `/auth/login`, `/auth/register` — the real routes are
  `/auth/user/me`, `/auth/user/login`, `/auth/user/register`. This
  broke login, registration, and session checks with 404s.
- "Download Receipt" used a plain link, but that route needs an
  Authorization header, which links can't send — downloads always
  failed. Now fetches the PDF with the token and saves it as a blob.
- The QR scanner's Stop button was broken: it created a brand-new,
  never-started scanner instance and set `isScanning` to `true`
  instead of `false`. Start also never set `isScanning` to `true`.
  Rewrote both so Start/Stop actually reflect and control the camera.

## Design

Restyled to a green-and-white theme: a dark green top bar, white cards
on a soft green-tinted background, green status pills (filled =
accepted, outlined = booked), and Manrope as the typeface throughout.
