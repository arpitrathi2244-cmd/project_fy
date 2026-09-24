# Frontend Code Structure

```text
frontend/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── login.js
│   └── register.js
└── pages/
    ├── sign-in.html
    ├── sign-up.html
    ├── live-map.html
    ├── risk-prediction.html
    ├── alerts.html
    ├── reports.html
    ├── safe-route.html
    ├── emergency.html
    ├── services.html
    └── analytics.html
```

## Authentication

- `sign-in.html` uses the same centered glass-card design shown in the reference.
- `sign-up.html` uses the same design language with the lamp/cord scene removed.
- `register.js` provides frontend-only demo validation, OTP, email-code, captcha and localStorage registration.
- `login.js` provides frontend-only demo login using the locally registered demo account.

> Real OTP delivery, password hashing, JWT authentication and database persistence will be connected later through the Spring Boot backend.
