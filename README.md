# 📋 Prince Form Builder

[![Python Version](https://img.shields.io/badge/python-3.8%20%7C%203.9%20%7C%203.10%20%7C%203.11-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.95.0+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4.4+-4ea94b.svg?style=flat&logo=mongodb)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.8-indigo.svg)](#)

Prince Form is an ultra-premium, modern, and highly interactive drag-and-drop web form builder. Designed with a sleek, split-screen SaaS dashboard interface, it allows creators to easily design multi-page forms, configure advanced validation constraints, upload custom branding (logo/banners), preview form links, and monitor submissions in real time.

---

## 🚀 Key Features

### ⚡ Performance & Database Indexing (v2.8)
*   **Eliminated Base64 Storage Bloat**: Custom logo and banner uploads are sent directly to the `/api/upload` endpoint, saving lightweight filesystem paths in MongoDB rather than bloating database records with megabytes of raw Base64 data.
*   **Optimized Query Speeds**: Implemented compound database indexes `[("userId", 1), ("createdAt", -1)]` and unique lookups on `username`/`email` to make dashboard loads and auth checks instant.
*   **Keep-Alive Health Routes**: Added `/health` and `/api/health` lightweight JSON endpoints for keep-alive pings and uptime monitors to prevent "Failed (output too large)" errors.
*   **Automatic TTL Pruning**: Enabled automatic Time-To-Live database indexes to clean up expired sessions (30 days) and expired password recovery codes automatically.

### 🔒 Enterprise-Grade Security (v2.2 - v2.7)
*   **OWASP Security Headers**: Injected standard security headers (Content-Security-Policy, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) on every response.
*   **Brute-Force Lockout Defense**: Monitors login failures per user and locks the account for 15 minutes after 5 consecutive failed attempts.
*   **SMTP Password Recovery System**: Asynchronous HTML verification mailer delivering 6-digit codes via SMTP with a 60-second request rate-limit.
*   **Recovery Code Guess Lockout**: Automatically invalidates verification codes if guessed incorrectly 5 times, preventing brute-force pin entry.
*   **Security Alert Confirmations**: Automatically emails a red-branded security warning message to the user immediately upon password changes.
*   **Username Fallback Search**: Supports forgot password recovery search by either username or email address, showing masked email hints (e.g. `pr***m@gm***.com`) in the user interface.
*   **Local Administration CLI Tool**: Exposes a git-ignored interactive script (`scripts/admin_reset.py`) allowing hosts to reset passwords, update associated emails, or clear lockout counters locally.

### 🎨 Visual & Layout Upgrades (v2.0 - v2.1)
*   **Dual-Column Visual Designer**: Drag and drop form blocks (Headers, Text Fields, Dropdowns, Choice lists, Date Pickers, and File Upload zones) from the toolbox sidebar directly onto the canvas.
*   **Collapsible Onboarding Guide**: Interactive left marketing sidebar featuring onboarding guides, a "View Demo" trigger to instantly populate a pre-designed multi-page template, and a "Get Started" toggle.
*   **Split-Screen Premium Login**: Modern sign-in page featuring a light blue underwater watercolor gradient, checklist illustrations, padlocks, and real-time password complexity checklists.
*   **Legal Disclosures**: Fully responsive integrated pages for Terms of Service (`/terms`), Privacy Policy (`/privacy`), and Security Guidelines (`/security`) linked on the login form.

---

## 🛠️ Tech Stack

*   **Backend**: [FastAPI](https://fastapi.tiangolo.com/) (Asynchronous Python Framework), [Motor](https://motor.readthedocs.io/) (Async MongoDB driver), [Uvicorn](https://www.uvicorn.org/) (ASGI server)
*   **Frontend**: HTML5 Semantic templates, Vanilla CSS3 (Underwater radial gradients, translucent grid overlay, glassmorphism), Vanilla JavaScript (HTML5 Drag and Drop API)
*   **Database**: [MongoDB](https://www.mongodb.com/) (User accounts, secure sessions, forms metadata, and client response records)

---

## 📁 Project Structure

```text
Prince Form/
│
├── backend/
│   ├── database.py       # MongoDB connections, indexing, and TTL settings
│   ├── models.py         # Pydantic schema validation structures
│   └── main.py           # Routes, auth, session checks, SMTP alerts, and CSP middleware
│
├── frontend/
│   ├── static/
│   │   ├── css/
│   │   │   ├── common.css     # Global variables and premium typography tokens
│   │   │   ├── dashboard.css  # Sidebar element widgets and drag classes
│   │   │   └── form.css       # Responder card styles and brand watermarks
│   │   └── js/
│   │       ├── dashboard.js   # Drag & Drop engine, server uploads, and guide toggles
│   │       └── form.js        # Responder pagination steppers and validations
│   └── templates/
│       ├── auth.html          # Split-screen access control with countdown resends
│       ├── dashboard.html     # Creator workspace canvas
│       ├── terms.html         # Terms & Conditions page
│       ├── privacy.html       # Privacy Policy page
│       ├── security.html      # Security Guidelines statement
│       └── form_view.html     # Public-facing responder wizard
│
├── scripts/
│   └── admin_reset.py    # Local interactive CLI db override tool (Git-ignored)
│
├── requirements.txt      # Python dependencies list
├── run.py                # Setup, dependency updates, and server bootstrap runner
└── render.yaml           # Render deployment configuration parameters template
```

---

## ⚙️ Configuration & Environment

The application reads configurations from a local `.env` file. Copy the sample file to configure your local setup:

```bash
cp .env.example .env
```

Define the following environment variables in your `.env` file:

| Variable | Description | Default Value |
| :--- | :--- | :--- |
| `PORT` | Local server port binding | `5000` |
| `ENV` | Environment state indicator | `development` / `production` |
| `MONGODB_URL` | MongoDB Connection URL | `mongodb://localhost:27017` |
| `DATABASE_NAME` | Database identifier | `prince_form_db` |
| `ALLOWED_ORIGINS`| CORS allowed origin domains (comma separated) | `http://localhost:5000` |
| `SMTP_HOST` | Transactional email host | `smtp.gmail.com` |
| `SMTP_PORT` | Transactional email port | `587` |
| `SMTP_USER` | Transactional sender email address | `contact.princeform@gmail.com` |
| `SMTP_PASSWORD` | Transactional email app password | `your-smtp-password` |
| `SMTP_FROM_NAME` | Dispatcher name header | `Prince Form` |

---

## 🏁 Local Installation & Quick Start

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/PrinceSanchela/PrinceForm.git
    cd PrinceForm
    ```

2.  **Start the Server**:
    Run the automated helper script. This script will automatically create a local Python virtual environment (`.venv`), upgrade pip, install dependencies from `requirements.txt`, and boot the Uvicorn server:
    ```bash
    python run.py
    ```

3.  **Access the Dashboard**:
    Open [http://localhost:5000](http://localhost:5000) in your browser to build forms. If you are not authenticated, you will be redirected to the secure login page at [http://localhost:5000/login](http://localhost:5000/login).

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
