# 📋 Prince Form Builder

[![Python Version](https://img.shields.io/badge/python-3.8%20%7C%203.9%20%7C%203.10%20%7C%203.11-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.95.0+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4.4+-4ea94b.svg?style=flat&logo=mongodb)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.0-indigo.svg)](#)

Prince Form is an ultra-premium, modern, and highly interactive drag-and-drop web form builder. Designed with a sleek, split-screen SaaS dashboard interface, it allows creators to easily design multi-page forms, configure advanced validation constraints, preview form links, and monitor submissions in real time.

---

## 🚀 Key Features

### 🎨 Visual & Layout Upgrades (v2.0)
*   **Dual-Column Visual Designer**: Drag and drop form blocks (Headers, Text Fields, Dropdowns, Choice lists, Date Pickers, and File Upload zones) from the toolbox sidebar directly onto the canvas.
*   **Collapsible Onboarding Guide**: Interactive left marketing sidebar featuring onboarding guides, a "View Demo" trigger to instantly populate a pre-designed multi-page template, and a "Get Started" toggle.
*   **Multi-Page Layouts & Steppers**: Organizes extensive forms into numbered pages, controlled dynamically with page tabs on the editor canvas and responsive navigation bars on the responder interface.
*   **Split-Screen Premium Login**: Modern sign-in page featuring a light blue underwater watercolor gradient, an inline SVG checklist clipboard graphic, a hardware-accelerated carousel slideshow, and underline inputs.
*   **Input Cursor Protection**: Disables standard I-beam cursors and highlights on static text fields (`user-select: none; cursor: default;`) to provide a native application experience.

### 🔒 Core Capabilities (v1.0)
*   **Secure Creator Authentication**: Uses cryptographically secure random session tokens (`secrets.token_hex(32)`) and secure PBKDF2 hashing functions.
*   **Brute-Force Lockout Defense**: Monitors authentication attempts and locks accounts for 15 minutes after 5 consecutive failures.
*   **Live Password Strength Indicator**: Interactive checklist verifying uppercase letters, lowercase letters, numbers, special characters, and minimum length requirements dynamically as the user types.
*   **Padlock Visibility Toggle**: Clickable padlock icon next to password input fields that transitions between locked and unlocked paths to reveal or hide the text.
*   **Submission Base64 File Loader**: Handles client-side file reading (`FileReader.readAsDataURL`) and saves the Base64 representation directly in MongoDB.

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
│   ├── database.py       # Asynchronous connection handler for MongoDB
│   ├── models.py         # Pydantic schema validation structures
│   └── main.py           # Routing endpoints, auth, validation, and session logics
│
├── frontend/
│   ├── static/
│   │   ├── css/
│   │   │   ├── common.css     # Global variables and premium typography tokens
│   │   │   ├── dashboard.css  # Sidebar element widgets and drag classes
│   │   │   └── form.css       # Responder card styles and brand watermarks
│   │   └── js/
│   │       ├── dashboard.js   # Drag & Drop engine, duplication, and guide toggles
│   │       └── form.js        # Responder pagination steppers and Base64 uploads
│   └── templates/
│       ├── auth.html          # Split-screen access control with carousel
│       ├── dashboard.html     # Creator workspace canvas
│       └── form_view.html     # Public-facing responder wizard
│
├── requirements.txt      # Python dependencies list
├── run.py                # Setup, dependency updates, and server bootstrap runner
└── server.txt            # PowerShell process launch commands reference
```

---

## ⚙️ Configuration & Environment

The application reads configurations from a local `.env` file. Copy the sample file to configure your local setup:

```bash
cp .env.example .env
```

Define the following environment variables:

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `PORT` | Local server port binding | `5000` |
| `ENV` | Environment state indicator | `development` / `production` |
| `MONGO_URI` | MongoDB Connection URL | `mongodb+srv://<user>:<password>@cluster.mongodb.net/princeform` |

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

## 🧪 Testing

The repository contains isolated test cases to verify the database sessions, PBKDF2 hash verify routines, brute-force lockouts, and password validation.

Run the security test script inside the virtual environment:

```bash
# Windows
.\.venv\Scripts\python scratch/test_advanced_auth.py

# Linux/macOS
./.venv/bin/python scratch/test_advanced_auth.py
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
