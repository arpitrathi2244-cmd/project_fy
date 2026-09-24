# AI-Powered Smart Road Safety & Accident Prevention System — Frontend

This folder contains the current HTML/CSS/JavaScript frontend prototype.

## Run

Open `index.html` with VS Code Live Server. The authentication pages are available from the top-right `Sign In` and `Sign Up` buttons.

## Authentication Demo

1. Open `pages/sign-up.html`.
2. Enter the registration fields.
3. Click `Send OTP` and `Send Verification Code`. The generated codes are displayed as demo messages because no backend is connected yet.
4. Verify both codes.
5. Complete the captcha and register.
6. The demo account is stored in browser `localStorage` and the page redirects to Sign In.
7. Sign in with the registered email and password.

## Important

This is frontend-only prototype behavior. Real OTP delivery, secure password handling, JWT authentication, GPS services, AI risk prediction and database persistence will be connected to the backend later.




git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git branch -M main
git push -u origin main