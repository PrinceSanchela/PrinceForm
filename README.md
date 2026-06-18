# Prince Form ?

Prince Form is a self-hosted custom form builder with dynamic glassmorphic branding, real-time validations, database-backed multi-user workspaces, and integrated response analytics.

Developed as a highly customizable alternative to Google Forms, Prince Form allows form creators to build, style, and secure questionnaires with a modern SaaS aesthetic.

---

## Key Features

*   **Multi-User Workspaces**: Secure creator registration and login with multi-user isolation. Creators only see and manage their own forms.
*   **Brute-Force Account Protection**: Automatic creator account lockout for 15 minutes after 5 consecutive failed login attempts.
*   **Base64 Media Persistence**: Client-side media conversion to Base64 strings. Logos and header banners are stored directly in MongoDB, bypassing ephemeral file-system wipes on host platforms like Render.
*   **Advanced Response Validations**:
    *   Configure multiple validation rules (e.g. Length + Starts With) per question field.
    *   Asynchronous **Unique Answer** lookup to check database submissions on-blur and prevent duplicate records.
    *   Regular expression mapping, character boundary restrictions, and input formatting.
*   **Aesthetic Branding Options**: Glassmorphic and elevated layout configurations, custom font pairings, custom accent color themes, and success screen splash layouts.
*   **Response Analytics**: Visual analytics breakdown, response tracking table, and CSV exporting capability.

---

## Tech Stack

*   **Backend**: FastAPI, Uvicorn, Pydantic, Motor (MongoDB Async Driver)
*   **Database**: MongoDB (Atlas or Local)
*   **Frontend**: Vanilla HTML5, Vanilla CSS3 (Glassmorphism & Drift Aura Animations), Vanilla JS

---

## Getting Started

### Prerequisites

*   Python 3.8+
*   MongoDB Instance (local or MongoDB Atlas connection URI)

### Quick Setup

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/yourusername/prince-form.git
    cd prince-form
    ```

2.  **Environment Variables Setup**:
    Copy the sample environment file and replace values with your database credentials:
    ```bash
    cp .env.example .env
    ```
    Open `.env` and configure your `MONGODB_URL` and `DATABASE_NAME`.

3.  **Run the Server Startup Bootstrapper**:
    Prince Form includes an automatic runner script that configures the virtual environment, installs all backend requirements, and starts the server:
    ```bash
    python run.py
    ```

4.  **Access the Dashboard**:
    Open [http://localhost:5000](http://localhost:5000) in your web browser.

---

## Project Structure

```text
+-- backend/            # FastAPI ASGI backend app
¦   +-- config.py       # Configuration configurations loader
¦   +-- database.py     # MongoDB client and indexes setup
¦   +-- main.py         # Routing, authentication, and form APIs
¦   +-- models.py       # Pydantic schemas (User, Form, Response)
+-- frontend/           # Static templates and web assets
¦   +-- templates/      # Jinja2 HTML pages (auth, dashboard, form_view)
¦   +-- static/         # Public CSS stylesheets and JS files
+-- run.py              # Local virtual environment bootstrapper and runner
+-- render.yaml         # Cloud blueprint for Render hosting
```

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
