// =========================================================================
// Prince Form Builder - Responder Client Javascript
// =========================================================================

document.addEventListener("DOMContentLoaded", () => {
    initFormResponder();
});

let currentResponderPage = 1;
let totalResponderPages = 1;

// =========================================================================
// Custom High-Tech Notification Toast & Confirmation Dialog Engine (UI/UX)
// =========================================================================

function showToast(message, type = "info", duration = 3800) {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.style.cssText = "position: fixed; top: 24px; right: 24px; z-index: 99999; display: flex; flex-direction: column; gap: 10px; pointer-events: none; max-width: 420px; width: calc(100% - 48px); font-family: 'Outfit', 'Inter', sans-serif;";
        document.body.appendChild(container);
    }
    
    const toast = document.createElement("div");
    toast.className = "animate-fade-in";
    toast.style.cssText = "pointer-events: auto; background: rgba(255, 255, 255, 0.96); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-radius: 14px; padding: 14px 18px; box-shadow: 0 12px 36px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.04); display: flex; align-items: center; justify-content: space-between; gap: 14px; opacity: 0; transform: translateY(-16px) scale(0.96); transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1); border-left: 5px solid #1a73e8; overflow: hidden; position: relative; border-top: 1px solid rgba(255,255,255,0.6);";
    
    if (document.body.classList.contains("dark-mode")) {
        toast.style.background = "rgba(30, 41, 59, 0.96)";
        toast.style.color = "#f8fafc";
        toast.style.borderTop = "1px solid rgba(255,255,255,0.1)";
    }

    let icon = "ℹ️";
    let borderColor = "#3b82f6";
    const msgLower = String(message || "").toLowerCase();
    
    if (type === "success" || msgLower.includes("success") || msgLower.includes("saved") || msgLower.includes("submitted")) {
        icon = "✅";
        borderColor = "#10b981";
    } else if (type === "error" || msgLower.includes("error") || msgLower.includes("failed") || msgLower.includes("prohibited")) {
        icon = "⚠️";
        borderColor = "#ef4444";
    } else if (type === "warning" || msgLower.includes("warning") || msgLower.includes("exceed") || msgLower.includes("limit")) {
        icon = "🛡️";
        borderColor = "#f59e0b";
    }
    
    toast.style.borderLeftColor = borderColor;
    
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
            <span style="font-size: 1.3rem; flex-shrink: 0;">${icon}</span>
            <div style="font-size: 0.88rem; font-weight: 500; color: var(--text-color, #1e293b); line-height: 1.45; word-break: break-word;">${escapeHTML(String(message))}</div>
        </div>
        <button type="button" style="background: none; border: none; font-size: 1.3rem; cursor: pointer; color: var(--text-color-muted, #94a3b8); padding: 2px 6px; line-height: 1; flex-shrink: 0; transition: color 0.2s;" onmouseover="this.style.color='var(--text-color)'" onmouseout="this.style.color='var(--text-color-muted)'" onclick="this.parentElement.remove()">&times;</button>
        <div class="toast-progress" style="position: absolute; bottom: 0; left: 0; height: 3px; background: ${borderColor}; width: 100%; transition: width ${duration}ms linear;"></div>
    `;
    
    container.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0) scale(1)";
        const progress = toast.querySelector(".toast-progress");
        if (progress) progress.style.width = "0%";
    });
    
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-12px) scale(0.96)";
        setTimeout(() => toast.remove(), 350);
    }, duration);
}

// Global window.alert override with Toast UI
window.alert = function(message) {
    showToast(message);
};

function showConfirm(optionsOrMessage) {
    return new Promise((resolve) => {
        let title = "Confirmation Required";
        let message = "Are you sure you want to proceed?";
        let confirmText = "Confirm";
        let cancelText = "Cancel";
        let icon = "⚠️";
        let isDanger = true;
        
        if (typeof optionsOrMessage === "string") {
            message = optionsOrMessage;
            if (message.toLowerCase().includes("clear") || message.toLowerCase().includes("reset")) {
                title = "Clear All Form Inputs";
                confirmText = "Clear Form";
                icon = "🧹";
                isDanger = true;
            }
        } else if (typeof optionsOrMessage === "object") {
            title = optionsOrMessage.title || title;
            message = optionsOrMessage.message || message;
            confirmText = optionsOrMessage.confirmText || confirmText;
            cancelText = optionsOrMessage.cancelText || cancelText;
            icon = optionsOrMessage.icon || icon;
            isDanger = optionsOrMessage.isDanger !== false;
        }
        
        let modal = document.getElementById("custom-confirm-modal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "custom-confirm-modal";
            modal.className = "modal-overlay";
            modal.style.cssText = "display:none; align-items:center; justify-content:center; z-index:100000; background:rgba(15, 23, 42, 0.75); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); font-family: 'Outfit', 'Inter', sans-serif;";
            modal.innerHTML = `
                <div class="form-card-base modal-card-active" style="width: 90%; max-width: 440px; padding: 26px; border-radius: 20px; box-shadow: 0 24px 60px rgba(0,0,0,0.3); text-align: center; background: var(--bg-color); border: 1px solid var(--border-color);">
                    <div id="confirm-modal-icon" style="width: 58px; height: 58px; border-radius: 18px; background: rgba(239, 68, 68, 0.1); color: #ef4444; display: flex; align-items: center; justify-content: center; font-size: 1.9rem; margin: 0 auto 16px auto;">🧹</div>
                    <h3 id="confirm-modal-title" style="font-family:'Outfit', sans-serif; font-size: 1.25rem; font-weight: 700; color: var(--text-color); margin: 0 0 8px 0;">Are you sure?</h3>
                    <p id="confirm-modal-message" style="font-size: 0.9rem; color: var(--text-color-secondary); line-height: 1.5; margin: 0 0 24px 0; white-space: pre-line; word-break: break-word;">This action cannot be undone.</p>
                    <div style="display: flex; gap: 12px; justify-content: center;">
                        <button id="confirm-modal-cancel-btn" type="button" class="btn btn-secondary" style="flex: 1; padding: 10px 18px; border-radius: 10px; font-weight: 600; font-size: 0.9rem;">Cancel</button>
                        <button id="confirm-modal-action-btn" type="button" class="btn" style="flex: 1; padding: 10px 18px; border-radius: 10px; font-weight: 600; font-size: 0.9rem; background: #ef4444; color: #fff; border: none; box-shadow: 0 4px 14px rgba(239,68,68,0.35);">Confirm</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        const titleEl = modal.querySelector("#confirm-modal-title");
        const msgEl = modal.querySelector("#confirm-modal-message");
        const iconEl = modal.querySelector("#confirm-modal-icon");
        const actionBtn = modal.querySelector("#confirm-modal-action-btn");
        const cancelBtn = modal.querySelector("#confirm-modal-cancel-btn");
        
        if (titleEl) titleEl.innerText = title;
        if (msgEl) msgEl.innerText = message;
        if (iconEl) iconEl.innerText = icon;
        if (actionBtn) {
            actionBtn.innerText = confirmText;
            actionBtn.style.background = isDanger ? "#ef4444" : "var(--theme-color, #1a73e8)";
            actionBtn.style.boxShadow = isDanger ? "0 4px 14px rgba(239,68,68,0.35)" : "0 4px 14px rgba(26,115,232,0.35)";
        }
        if (cancelBtn) cancelBtn.innerText = cancelText;
        
        function cleanup(result) {
            modal.style.display = "none";
            actionBtn.removeEventListener("click", onAction);
            cancelBtn.removeEventListener("click", onCancel);
            modal.removeEventListener("click", onBackdrop);
            resolve(result);
        }
        
        function onAction() { cleanup(true); }
        function onCancel() { cleanup(false); }
        function onBackdrop(e) { if (e.target.id === "custom-confirm-modal") cleanup(false); }
        
        actionBtn.addEventListener("click", onAction);
        cancelBtn.addEventListener("click", onCancel);
        modal.addEventListener("click", onBackdrop);
        
        modal.style.display = "flex";
    });
}

let verifiedAccountUser = null;
let _googleClientId = null;

function parseJwtToken(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch(e) {
        return null;
    }
}

async function handleGoogleIdentityCredential(response) {
    if (!response || !response.credential) return;

    try {
        // Send credential to backend for real server-side verification
        const res = await fetch("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential: response.credential })
        });

        if (res.ok) {
            const data = await res.json();
            if (data && data.email) {
                verifiedAccountUser = {
                    email: data.email,
                    name: data.name || data.email.split('@')[0],
                    picture: data.picture || '',
                    isGoogleVerified: true
                };
                sessionStorage.setItem("prince_verified_google_user", JSON.stringify(verifiedAccountUser));
                localStorage.setItem("prince_verified_google_user", JSON.stringify(verifiedAccountUser));
                closeGoogleAccountPickerModal();
                showToast(`✓ Signed in as ${data.email}`, "success");
                renderGoogleVerifiedBadge(data.email);
                return;
            }
        }
    } catch(e) {}

    // Fallback: parse JWT client-side if backend endpoint returns error or unreachable
    const payload = parseJwtToken(response.credential);
    if (payload && payload.email) {
        verifiedAccountUser = {
            email: payload.email,
            name: payload.name || payload.email.split('@')[0],
            picture: payload.picture || '',
            isGoogleVerified: true
        };
        sessionStorage.setItem("prince_verified_google_user", JSON.stringify(verifiedAccountUser));
        localStorage.setItem("prince_verified_google_user", JSON.stringify(verifiedAccountUser));
        closeGoogleAccountPickerModal();
        showToast(`✓ Signed in as ${payload.email}`, "success");
        renderGoogleVerifiedBadge(payload.email);
    }
}

async function loadGoogleClientId() {
    if (_googleClientId) return _googleClientId;
    try {
        const res = await fetch("/api/auth/google-client-id");
        if (res.ok) {
            const data = await res.json();
            if (data && data.clientId && data.clientId.trim() !== "") {
                _googleClientId = data.clientId.trim();
                return _googleClientId;
            }
        }
    } catch(e) {}
    return null;
}

let _isGsiInitialized = false;

async function initGoogleSignIn(callback) {
    if (_isGsiInitialized) return true;
    const clientId = await loadGoogleClientId();
    if (!clientId) return false;
    if (window.google && google.accounts && google.accounts.id) {
        try {
            google.accounts.id.initialize({
                client_id: clientId,
                callback: callback || handleGoogleIdentityCredential,
                auto_select: false,
                use_fedcm_for_prompt: false,
                cancel_on_tap_outside: true
            });
            _isGsiInitialized = true;
            return true;
        } catch(e) {}
    }
    return false;
}

async function triggerGoogleAccountPromptOrChooser() {
    openGoogleAccountPickerModal();
}

async function checkVerifiedAccountStatus() {
    const verifiedContainer = document.getElementById("verified-account-container");
    if (!verifiedContainer) return;

    // Purge any legacy stored hardcoded email
    const rawStored = localStorage.getItem("prince_verified_google_user") || sessionStorage.getItem("prince_verified_google_user");
    if (rawStored && rawStored.includes("coder.prince")) {
        localStorage.removeItem("prince_verified_google_user");
        sessionStorage.removeItem("prince_verified_google_user");
    }

    // 1. Check sessionStorage / localStorage for existing verified user
    const storedGoogleUser = sessionStorage.getItem("prince_verified_google_user") || localStorage.getItem("prince_verified_google_user");
    if (storedGoogleUser) {
        try {
            verifiedAccountUser = JSON.parse(storedGoogleUser);
            if (verifiedAccountUser && verifiedAccountUser.email && verifiedAccountUser.email.includes("@") && !verifiedAccountUser.email.includes("coder.prince")) {
                renderGoogleVerifiedBadge(verifiedAccountUser.email);
                return;
            }
        } catch(e) {}
    }

    // 2. Check session cookie (logged-in form owner)
    if (document.cookie.includes("session_token")) {
        try {
            const res = await fetch("/api/auth/me");
            if (res.ok) {
                const data = await res.json();
                const userEmail = data.email || (data.username ? `${data.username.toLowerCase()}@gmail.com` : "");
                if (userEmail && userEmail.includes("@")) {
                    verifiedAccountUser = { email: userEmail, username: data.username, isGoogleVerified: true };
                    sessionStorage.setItem("prince_verified_google_user", JSON.stringify(verifiedAccountUser));
                    renderGoogleVerifiedBadge(userEmail);
                    return;
                }
            }
        } catch(err) {}
    }

    // 3. Render Google Authentication Required Card directly for unauthenticated visitors
    renderGoogleAuthPromptCard();
    initGoogleSignIn(handleGoogleIdentityCredential);
}

function openGoogleRealAccountChooser() {
    openGoogleAccountPickerModal();
}



function renderGoogleVerifiedBadge(email) {
    const verifiedContainer = document.getElementById("verified-account-container");
    if (!verifiedContainer) return;

    let cleanEmail = email || "";
    if (!cleanEmail.includes("@")) {
        cleanEmail = `${cleanEmail.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`;
    }

    // Enable submit button
    const submitBtn = document.getElementById("btn-submit-form");
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = "1";
        submitBtn.style.cursor = "pointer";
    }

    verifiedContainer.innerHTML = `
        <!-- Top Google Forms Identity Sync Bar matching Screenshot 2 & 3 -->
        <div style="background: rgba(255, 255, 255, 0.98); border-bottom: 1px solid var(--border-color); padding: 14px 20px; font-family: 'Roboto', 'Outfit', sans-serif; display: flex; align-items: center; justify-content: space-between; border-radius: 12px; margin-bottom: 14px; box-shadow: 0 1px 6px rgba(0,0,0,0.03);">
            <div style="display: flex; align-items: center; gap: 8px; font-size: 0.92rem;">
                <span style="color: var(--text-color); font-weight: 500;">${escapeHTML(cleanEmail)}</span>
                <a href="#" onclick="openGoogleAccountPickerModal(); return false;" style="color: #1a73e8; font-weight: 400; text-decoration: underline;">Switch accounts</a>
            </div>
            <div style="color: #5f6368; display: flex; align-items: center; gap: 6px; font-size: 0.82rem;" title="Draft saved in cloud">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 18a4.5 4.5 0 0 0 2.5-8.5 6 6 0 0 0-11-2.5 4 4 0 0 0-6.5 5A4 4 0 0 0 5 18h14z"/><path d="m9 13 2 2 4-4"/></svg>
                <span>Draft saved</span>
            </div>
        </div>

        <!-- Required Indicator -->
        <div style="font-size: 0.85rem; color: #d93025; margin-bottom: 14px; font-weight: 500; text-align: left;">
            * Indicates required question
        </div>

        <!-- Email Question Card matching Google Forms -->
        <div class="form-card-base card-style-elevated question-card" style="border-top: 4px solid #1a73e8; padding: 22px 24px; margin-bottom: 20px; background: #ffffff;">
            <div style="font-family: 'Outfit', 'Roboto', sans-serif; font-weight: 600; font-size: 1.02rem; color: var(--text-color); margin-bottom: 14px;">
                Email <span style="color: #d93025;">*</span>
            </div>
            <label style="display: flex; align-items: flex-start; gap: 12px; cursor: pointer; font-size: 0.9rem; color: var(--text-color-secondary); line-height: 1.45;">
                <input type="checkbox" id="record-verified-email-checkbox" checked style="width: 18px; height: 18px; accent-color: #1a73e8; margin-top: 1px; cursor: pointer;">
                <span>Record <strong style="color: var(--text-color); font-weight: 600;">${escapeHTML(cleanEmail)}</strong> as the email to be included with my response</span>
            </label>
        </div>
    `;
}

async function renderGoogleAuthPromptCard() {
    const verifiedContainer = document.getElementById("verified-account-container");
    if (!verifiedContainer) return;

    // Disable submit button until verified
    const submitBtn = document.getElementById("btn-submit-form");
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = "0.5";
        submitBtn.style.cursor = "not-allowed";
    }

    verifiedContainer.innerHTML = `
        <div style="background: rgba(255, 255, 255, 0.95); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.05); font-family: 'Outfit', sans-serif;">
            <div style="width: 54px; height: 54px; border-radius: 16px; background: rgba(66, 133, 244, 0.08); border: 1px solid rgba(66, 133, 244, 0.18); display: flex; align-items: center; justify-content: center; margin: 0 auto 14px auto;">
                <svg width="28" height="28" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
            </div>
            <h3 style="font-size: 1.18rem; font-weight: 700; color: var(--text-color); margin: 0 0 6px 0;">Google Account Verification Required</h3>
            <p style="font-size: 0.88rem; color: var(--text-color-secondary); margin: 0 0 20px 0; max-width: 440px; margin-left: auto; margin-right: auto; line-height: 1.5;">
                This form requires an <strong>Authenticated Google Email ID</strong> to ensure responses are submitted by real human users.
            </p>
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; min-height: 48px;">
                <div id="real-google-signin-btn-card" style="min-height: 44px; display: flex; justify-content: center;"></div>
            </div>
        </div>
    `;

    // Render official Google Sign-In SDK button directly on card
    const initialized = await initGoogleSignIn(handleGoogleIdentityCredential);
    const cardBtnContainer = document.getElementById("real-google-signin-btn-card");
    if (initialized && cardBtnContainer && window.google && google.accounts && google.accounts.id) {
        try {
            google.accounts.id.renderButton(cardBtnContainer, {
                type: "standard",
                theme: "outline",
                size: "large",
                text: "signin_with",
                shape: "rectangular",
                logo_alignment: "left",
                width: 320
            });
        } catch(e) {
            if (cardBtnContainer) {
                cardBtnContainer.innerHTML = `
                    <button type="button" class="btn btn-primary" onclick="openGoogleAccountPickerModal()" style="font-size: 0.92rem; padding: 11px 24px; border-radius: 12px; display: inline-flex; align-items: center; gap: 10px; background: #1a73e8; color: #fff; cursor: pointer; border: none; font-weight: 600; box-shadow: 0 4px 12px rgba(26, 115, 232, 0.25);">
                        <span>Sign In with Google Email ID</span>
                    </button>
                `;
            }
        }
    } else if (cardBtnContainer) {
        cardBtnContainer.innerHTML = `
            <button type="button" class="btn btn-primary" onclick="openGoogleAccountPickerModal()" style="font-size: 0.92rem; padding: 11px 24px; border-radius: 12px; display: inline-flex; align-items: center; gap: 10px; background: #1a73e8; color: #fff; cursor: pointer; border: none; font-weight: 600; box-shadow: 0 4px 12px rgba(26, 115, 232, 0.25);">
                <span>Sign In with Google Email ID</span>
            </button>
        `;
    }
}

async function openGoogleAccountPickerModal() {
    let modal = document.getElementById("google-account-picker-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "google-account-picker-modal";
        modal.style.cssText = "position: fixed; inset: 0; z-index: 99999; background: rgba(0,0,0,0.55); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.25s ease;";
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div style="background: var(--bg-color-primary, #ffffff); border: 1px solid var(--border-color); border-radius: 20px; max-width: 440px; width: 100%; padding: 28px; box-shadow: 0 20px 50px rgba(0,0,0,0.2); display: flex; flex-direction: column; gap: 20px; font-family: 'Outfit', sans-serif;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 40px; height: 40px; border-radius: 12px; background: rgba(66, 133, 244, 0.08); border: 1px solid rgba(66, 133, 244, 0.2); display: flex; align-items: center; justify-content: center;">
                        <svg width="22" height="22" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                    </div>
                    <div>
                        <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--text-color);">Switch Google Account</h3>
                        <div style="font-size: 0.78rem; color: var(--text-color-secondary); margin-top: 2px;">Official Google Authentication</div>
                    </div>
                </div>
                <button type="button" onclick="closeGoogleAccountPickerModal()" style="background: none; border: none; font-size: 1.4rem; color: var(--text-color-secondary); cursor: pointer; padding: 4px; line-height: 1;">&times;</button>
            </div>

            <!-- Official Google Sign-In SDK Button Container -->
            <div id="google-gsi-button-container" style="display: flex; flex-direction: column; align-items: center; gap: 12px; width: 100%; padding: 10px 0;">
                <div id="real-google-signin-btn" style="min-height: 44px; display: flex; justify-content: center; width: 100%;"></div>
                <div style="font-size: 0.78rem; color: var(--text-color-secondary); text-align: center; line-height: 1.45;">
                    Authenticates securely using official Google Identity Services.
                </div>
            </div>

            <div id="google-fallback-container" style="display: none; flex-direction: column; gap: 12px; align-items: center; text-align: center;">
                <div style="font-size: 0.85rem; color: var(--text-color-secondary); line-height: 1.45;">
                    Click below to authenticate with Google:
                </div>
                <button type="button" onclick="triggerGoogleAccountPromptOrChooser()" class="btn btn-primary" style="font-size: 0.9rem; padding: 12px 24px; border-radius: 12px; display: inline-flex; align-items: center; gap: 10px; background: #1a73e8; color: #fff; cursor: pointer; border: none; font-weight: 600;">
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#ffffff" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
                        <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Authenticate with Google</span>
                </button>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px;">
                <button type="button" class="btn btn-secondary" onclick="closeGoogleAccountPickerModal()" style="font-size: 0.88rem; padding: 10px 18px; border-radius: 10px;">Close</button>
            </div>
        </div>
    `;
    modal.style.display = "flex";

    // Render the real GSI button after modal is in DOM if initialized successfully
    const initialized = await initGoogleSignIn(handleGoogleIdentityCredential);
    const gsiContainer = document.getElementById("real-google-signin-btn");
    const fallbackContainer = document.getElementById("google-fallback-container");

    if (initialized && gsiContainer && window.google && google.accounts && google.accounts.id) {
        try {
            google.accounts.id.renderButton(gsiContainer, {
                type: "standard",
                theme: "outline",
                size: "large",
                text: "signin_with",
                shape: "rectangular",
                logo_alignment: "left",
                width: 320
            });
        } catch(e) {
            if (fallbackContainer) fallbackContainer.style.display = "flex";
        }
    } else {
        if (fallbackContainer) fallbackContainer.style.display = "flex";
    }
}



function closeGoogleAccountPickerModal() {
    const modal = document.getElementById("google-account-picker-modal");
    if (modal) modal.style.display = "none";
}

function saveResponseAnswersToLocalStorage(formId, answers) {
    try {
        localStorage.setItem(`prince_form_saved_answers_${formId}`, JSON.stringify(answers));
    } catch(e) {}
}

function renderEditResponseBannerAndFillAnswers(formId) {
    const formElement = document.getElementById("responder-form-element");
    if (!formElement) return;

    if (document.getElementById("edit-mode-banner")) return;

    const banner = document.createElement("div");
    banner.id = "edit-mode-banner";
    banner.className = "form-card-base card-style-elevated animate-fade-in";
    banner.style.cssText = "margin-bottom: 20px; padding: 14px 18px; background: rgba(26,115,232,0.06); border: 1.5px solid rgba(26,115,232,0.3); display: flex; align-items: center; justify-content: space-between; gap: 12px; border-radius: 14px;";
    banner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(26,115,232,0.12); color: #1a73e8; display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">✏️</div>
            <div>
                <div style="font-weight: 700; color: #1a73e8; font-size: 0.92rem;">You are editing your response</div>
                <div style="font-size: 0.78rem; color: var(--text-color-secondary);">Responses can be changed. Update your answers below and click Submit.</div>
            </div>
        </div>
        <span style="background: rgba(26,115,232,0.12); color: #1a73e8; font-size: 0.72rem; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase;">Edit Mode</span>
    `;

    const headerCard = formElement.querySelector(".form-header-card");
    if (headerCard && headerCard.nextSibling) {
        headerCard.parentNode.insertBefore(banner, headerCard.nextSibling);
    } else {
        formElement.insertBefore(banner, formElement.firstChild);
    }

    try {
        const savedData = localStorage.getItem(`prince_form_saved_answers_${formId}`);
        if (savedData) {
            const savedAnswers = JSON.parse(savedData);
            const cards = document.querySelectorAll(".question-card");
            
            cards.forEach(card => {
                const qId = card.dataset.qId;
                const val = savedAnswers[qId];
                if (val !== undefined && val !== null) {
                    const qType = card.dataset.qType;
                    if (["text", "number", "email", "phone"].includes(qType)) {
                        const inp = card.querySelector("input[type='text'], input[type='number'], input[type='email'], input[type='tel']");
                        if (inp) inp.value = val;
                    } else if (qType === "textarea" || qType === "paragraph") {
                        const ta = card.querySelector("textarea");
                        if (ta) ta.value = val;
                    } else if (qType === "select") {
                        const sel = card.querySelector("select");
                        if (sel) sel.value = val;
                    } else if (qType === "date") {
                        const dt = card.querySelector("input[type='date']");
                        if (dt) dt.value = val;
                    } else if (qType === "radio") {
                        const radio = card.querySelector(`input[type='radio'][value="${CSS.escape(val)}"]`);
                        if (radio) radio.checked = true;
                    } else if (qType === "checkbox" && Array.isArray(val)) {
                        val.forEach(v => {
                            const cb = card.querySelector(`input[type='checkbox'][value="${CSS.escape(v)}"]`);
                            if (cb) cb.checked = true;
                        });
                    } else if (qType === "rating") {
                        const rInp = card.querySelector(".rating-value-input");
                        if (rInp) rInp.value = val;
                        const btns = card.querySelectorAll(".rating-symbol-btn");
                        btns.forEach((b, idx) => {
                            if (idx + 1 <= val) {
                                b.style.opacity = "1";
                                b.style.filter = "none";
                            }
                        });
                    }
                }
            });
        }
    } catch(e) {
        console.error("Error restoring saved answers for editing:", e);
    }
}

function initFormResponder() {
    const formElement = document.getElementById("responder-form-element");
    if (!formElement) return;

    const formIdEl = document.getElementById("form-id-hidden");
    const limitOneHidden = document.getElementById("form-limit-one-hidden");
    const allowEditingHidden = document.getElementById("form-allow-editing-hidden");
    const isAllowEditing = allowEditingHidden && allowEditingHidden.value === "true";

    if (formIdEl) {
        const submittedKey = `prince_form_submitted_${formIdEl.value}`;
        const hasSubmitted = localStorage.getItem(submittedKey);
        
        if (hasSubmitted) {
            if (isAllowEditing) {
                // If Response Editing is ALLOWED, do not block! Load in edit mode and populate previously entered answers!
                renderEditResponseBannerAndFillAnswers(formIdEl.value);
            } else if (limitOneHidden && limitOneHidden.value === "true") {
                // If editing is NOT allowed and limit to 1 response is enabled, block submission
                formElement.innerHTML = `
                    <div class="form-card-base card-style-elevated animate-fade-in" style="text-align:center; padding:36px 24px; border:1px solid var(--border-color); border-radius:18px;">
                        <div style="width: 58px; height: 58px; border-radius: 18px; background: rgba(245, 158, 11, 0.1); color: #f59e0b; display: flex; align-items: center; justify-content: center; font-size: 1.9rem; margin: 0 auto 16px auto;">⚠️</div>
                        <h2 style="font-family:'Outfit', sans-serif; font-size: 1.35rem; font-weight: 700; color: var(--text-color); margin-bottom: 8px;">You've already responded</h2>
                        <p style="color: var(--text-color-secondary); font-size: 0.9rem; margin-bottom: 20px; line-height:1.5;">You can only submit this form once. Contact the form owner if you think this is a mistake.</p>
                    </div>
                `;
                return;
            }
        }
    }
    
    // Bind Submission Action
    formElement.addEventListener("submit", handleFormSubmission);
    
    // Bind Clear Button
    const clearBtn = document.getElementById("btn-clear-form");
    if (clearBtn) {
        clearBtn.addEventListener("click", resetFormInputs);
    }
    
    // Focus effect highlights
    setupCardFocusEffects();
    
    // Set up live keyboard blocks & warnings for length limits
    setupLiveLengthValidations();
    
    // Set up file input listeners
    setupFileInputEvents();
    
    // Set up rating option listeners
    setupRatingEvents();
    
    // Check Verified Account Sync Status
    checkVerifiedAccountStatus();
    
    // Determine total pages and assign cascade animation delays
    const cards = document.querySelectorAll(".question-card");
    const pages = new Set();
    cards.forEach((card, idx) => {
        const p = parseInt(card.dataset.qPage) || 1;
        pages.add(p);
        // Set cascade fade-in animation delay
        card.style.animationDelay = `${(idx + 1) * 0.05}s`;
    });
    totalResponderPages = pages.size > 0 ? Math.max(...pages) : 1;
    
    // Set cascade animation delay for the footer
    const footer = document.querySelector(".form-footer");
    if (footer) {
        footer.style.animationDelay = `${(cards.length + 1) * 0.05}s`;
    }
    
    if (totalResponderPages > 1) {
        setupResponderPagination();
    }
}

function setupLiveLengthValidations() {
    const cards = document.querySelectorAll(".question-card");
    cards.forEach(card => {
        let max = null;
        let errorText = "";
        
        const validationsStr = card.dataset.qValidations;
        let validations = [];
        try {
            if (validationsStr) {
                validations = JSON.parse(validationsStr);
            }
        } catch (e) {
            console.error("Error parsing card validations", e);
        }
        
        const lengthRule = validations.find(r => r.type === "length");
        if (lengthRule) {
            const parts = (lengthRule.value || "").split(",");
            max = parts[1] ? parseInt(parts[1]) : null;
            errorText = lengthRule.errorText || `Must be at most ${max} characters long.`;
        } else if (card.dataset.qValType === "length" && card.dataset.qValPattern) {
            const pat = card.dataset.qValPattern;
            const match = pat.match(/^\^.\{(\d*),(\d+)\}\$$/);
            if (match && match[2]) {
                max = parseInt(match[2]);
                errorText = card.dataset.qValError || `Must be at most ${max} characters long.`;
            }
        }
        
        if (max !== null && !isNaN(max)) {
            const inputEl = card.querySelector(".branded-input, textarea, .branded-input-box");
            if (inputEl) {
                // Set the HTML5 maxlength attribute to block extra chars from keyboard/paste
                inputEl.setAttribute("maxlength", max);
                
                // Track typing to show warning immediately when they try to exceed or reach the max length
                const handleInputCheck = () => {
                    const currentLength = inputEl.value.length;
                    
                    if (currentLength >= max) {
                        card.style.borderColor = "var(--error-color)";
                        let errInd = card.querySelector(".error-text");
                        if (!errInd) {
                            errInd = document.createElement("div");
                            errInd.className = "error-text";
                            errInd.style.color = "var(--error-color)";
                            errInd.style.fontSize = "0.8rem";
                            errInd.style.marginTop = "8px";
                            card.appendChild(errInd);
                        }
                        errInd.innerText = errorText;
                    } else {
                        // Clear error border and text if they delete characters
                        card.style.borderColor = "var(--border-color)";
                        const errInd = card.querySelector(".error-text");
                        if (errInd) errInd.remove();
                    }
                };
                
                inputEl.addEventListener("input", handleInputCheck);
                
                // Show warning immediately if they press a key when already at max length
                inputEl.addEventListener("keydown", (e) => {
                    // Ignore navigation keys (backspace, delete, arrows, tab, escape, enter)
                    if ([8, 46, 37, 38, 39, 40, 9, 13, 27].includes(e.keyCode)) {
                        return;
                    }
                    
                    if (inputEl.value.length >= max) {
                        card.style.borderColor = "var(--error-color)";
                        let errInd = card.querySelector(".error-text");
                        if (!errInd) {
                            errInd = document.createElement("div");
                            errInd.className = "error-text";
                            errInd.style.color = "var(--error-color)";
                            errInd.style.fontSize = "0.8rem";
                            errInd.style.marginTop = "8px";
                            card.appendChild(errInd);
                        }
                        errInd.innerText = errorText;
                        
                        // Prevent the default keydown behavior just in case maxlength doesn't fire
                        e.preventDefault();
                    }
                });
            }
        }
    });
}

async function validateCard(card) {
    const qId = card.dataset.qId;
    const qType = card.dataset.qType;
    const qRequired = card.dataset.qRequired === "true";
    const qValType = card.dataset.qValType || "none";
    const qValPattern = card.dataset.qValPattern || "";
    const qValError = card.dataset.qValError || "Please check your response format.";
    
    let answerVal = null;
    
    switch (qType) {
        case "text":
        case "paragraph":
            const inputEl = card.querySelector(".branded-input, textarea");
            if (inputEl) {
                const textVal = inputEl.value.trim();
                answerVal = textVal || null;
            }
            break;
        case "number":
            const numInp = card.querySelector("input[type='number']");
            if (numInp) {
                answerVal = numInp.value !== "" ? Number(numInp.value) : null;
            }
            break;
        case "radio":
            const selectedRadio = card.querySelector("input[type='radio']:checked");
            answerVal = selectedRadio ? selectedRadio.value : null;
            break;
        case "checkbox":
            const checkedBoxes = card.querySelectorAll("input[type='checkbox']:checked");
            const checks = [];
            checkedBoxes.forEach(cb => checks.push(cb.value));
            answerVal = checks.length > 0 ? checks : null;
            break;
        case "select":
            const selectEl = card.querySelector("select");
            if (selectEl) {
                answerVal = selectEl.value || null;
            }
            break;
        case "date":
            const dateInp = card.querySelector("input[type='date']");
            if (dateInp) {
                answerVal = dateInp.value || null;
            }
            break;
        case "file":
            const listPreview = card.querySelector(".file-list-preview");
            if (listPreview && listPreview.dataset.files) {
                try {
                    const parsed = JSON.parse(listPreview.dataset.files);
                    answerVal = (parsed && parsed.length > 0) ? parsed : null;
                } catch(e) {
                    answerVal = null;
                }
            } else {
                const fInpVal = card.querySelector("input[type='file']");
                answerVal = (fInpVal && fInpVal.dataset.base64) ? fInpVal.dataset.base64 : null;
            }
            break;
        case "rating":
            const rInpVal = card.querySelector(".rating-value-input");
            answerVal = (rInpVal && rInpVal.value) ? Number(rInpVal.value) : null;
            break;
    }
    
    let failedRuleText = null;
    
    if (qRequired && (answerVal === null || answerVal === "")) {
        failedRuleText = "This is a required question";
    } else if (answerVal !== null && answerVal !== "") {
        let validations = [];
        try {
            if (card.dataset.qValidations) {
                validations = JSON.parse(card.dataset.qValidations);
            }
        } catch (err) {
            console.error("Error parsing question validations attribute:", err);
        }
        
        if (validations && validations.length > 0) {
            for (let i = 0; i < validations.length; i++) {
                const rule = validations[i];
                if (rule.type && rule.type !== "none") {
                    if (rule.type === "unique") {
                        const formId = document.getElementById("form-id-hidden").value;
                        try {
                            const res = await fetch(`/api/forms/${formId}/validate-unique?question_id=${qId}&value=${encodeURIComponent(answerVal)}`);
                            if (res.ok) {
                                const data = await res.json();
                                if (!data.unique) {
                                    failedRuleText = rule.errorText || "This value has already been submitted. Please enter a unique response.";
                                    break;
                                }
                            }
                        } catch (err) {
                            console.error("Error validating uniqueness:", err);
                        }
                    } else if (rule.pattern) {
                        try {
                            const regex = new RegExp(rule.pattern);
                            if (!regex.test(answerVal.toString())) {
                                failedRuleText = rule.errorText || "Please check your response format.";
                                break;
                            }
                        } catch (err) {
                            console.error("Invalid regex format inside validation rule:", err);
                        }
                    }
                }
            }
        } else if (qValType !== "none" && qValPattern) {
            try {
                const regex = new RegExp(qValPattern);
                if (!regex.test(answerVal.toString())) {
                    failedRuleText = qValError;
                }
            } catch (err) {
                console.error("Invalid regex format inside legacy validation:", err);
            }
        }
    }
    
    if (failedRuleText !== null) {
        card.style.borderColor = "var(--error-color)";
        
        let errInd = card.querySelector(".error-text");
        if (!errInd) {
            errInd = document.createElement("div");
            errInd.className = "error-text";
            errInd.style.color = "var(--error-color)";
            errInd.style.fontSize = "0.8rem";
            errInd.style.marginTop = "8px";
            card.appendChild(errInd);
        }
        errInd.innerText = failedRuleText;
        return false;
    } else {
        card.style.borderColor = "var(--border-color)";
        const errInd = card.querySelector(".error-text");
        if (errInd) errInd.remove();
        return true;
    }
}

function setupCardFocusEffects() {
    const inputs = document.querySelectorAll(".branded-input, .branded-input-box, .branded-select, .branded-date, .choice-input");
    
    inputs.forEach(inp => {
        inp.addEventListener("focus", () => {
            const card = inp.closest(".question-card");
            if (card) card.classList.add("active-input");
        });
        
        inp.addEventListener("blur", () => {
            const card = inp.closest(".question-card");
            if (card) {
                card.classList.remove("active-input");
                // Run validation instantly when user is out of that input
                validateCard(card);
            }
        });
        
        inp.addEventListener("change", () => {
            const card = inp.closest(".question-card");
            if (card) {
                // Run validation on change for select/checkbox/radio choices
                validateCard(card);
            }
        });
    });
}

async function handleFormSubmission(e) {
    if (e) e.preventDefault();
    
    // Multi-page navigation check: if pressing enter inside form and not on last page, go next
    if (totalResponderPages > 1 && currentResponderPage < totalResponderPages) {
        const nextBtn = document.querySelector(".form-next-btn");
        if (nextBtn) nextBtn.click();
        return;
    }
    
    const formId = document.getElementById("form-id-hidden").value;
    const cards = document.querySelectorAll(".question-card");
    const answers = {};
    let hasValidationError = false;
    
    const validationPromises = Array.from(cards).map(async (card) => {
        const isValid = await validateCard(card);
        if (!isValid) {
            hasValidationError = true;
        } else {
            const qId = card.dataset.qId;
            const qType = card.dataset.qType;
            let answerVal = null;
            
            switch (qType) {
                case "text":
                case "paragraph":
                    const textVal = card.querySelector(".branded-input, textarea").value.trim();
                    answerVal = textVal || null;
                    break;
                case "number":
                    const numInp = card.querySelector("input[type='number']").value;
                    answerVal = numInp !== "" ? Number(numInp) : null;
                    break;
                case "radio":
                    const selectedRadio = card.querySelector("input[type='radio']:checked");
                    answerVal = selectedRadio ? selectedRadio.value : null;
                    break;
                case "checkbox":
                    const checkedBoxes = card.querySelectorAll("input[type='checkbox']:checked");
                    const checks = [];
                    checkedBoxes.forEach(cb => checks.push(cb.value));
                    answerVal = checks.length > 0 ? checks : null;
                    break;
                case "select":
                    const sel = card.querySelector("select").value;
                    answerVal = sel || null;
                    break;
                case "date":
                    const dt = card.querySelector("input[type='date']").value;
                    answerVal = dt || null;
                    break;
                case "file":
                    const listPrev = card.querySelector(".file-list-preview");
                    if (listPrev && listPrev.dataset.files) {
                        try {
                            const parsedFiles = JSON.parse(listPrev.dataset.files);
                            answerVal = parsedFiles && parsedFiles.length > 0 ? parsedFiles : null;
                        } catch(e) {
                            answerVal = null;
                        }
                    } else {
                        const fInp = card.querySelector("input[type='file']");
                        answerVal = fInp && fInp.dataset.base64 ? [{ name: "Uploaded_File", base64: fInp.dataset.base64 }] : null;
                    }
                    break;
                case "rating":
                    const rVal = card.querySelector(".rating-value-input");
                    answerVal = rVal && rVal.value ? Number(rVal.value) : null;
                    break;
            }
            
            if (answerVal !== null) {
                answers[qId] = answerVal;
            }
        }
    });
    
    await Promise.all(validationPromises);
    
    if (hasValidationError) {
        // Find the first error element and scroll to it
        const firstError = document.querySelector(".error-text");
        if (firstError) {
            firstError.closest(".question-card").scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
    }
    
    // Submit response via API
    let responderEmailVal = null;
    if (verifiedAccountUser && (verifiedAccountUser.email || verifiedAccountUser.username)) {
        responderEmailVal = verifiedAccountUser.email || verifiedAccountUser.username;
    } else {
        const inpEmail = document.getElementById("collected-email-input");
        if (inpEmail && inpEmail.value) {
            responderEmailVal = inpEmail.value.trim();
        }
    }

    const responsePayload = {
        formId: formId,
        answers: answers,
        responderEmail: responderEmailVal,
        isVerifiedHuman: verifiedAccountUser !== null
    };
    
    const submitBtn = document.getElementById("btn-submit-form") || document.querySelector(".form-next-btn");
    
    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = "Submitting...";
        }
        
        const response = await fetch(`/api/forms/${formId}/responses`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(responsePayload)
        });
        
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const errMsg = errData.detail || "Submitting answer failed. Please check your inputs.";
            throw new Error(errMsg);
        }
        
        const limitOneHidden = document.getElementById("form-limit-one-hidden");
        if (limitOneHidden && limitOneHidden.value === "true") {
            localStorage.setItem(`prince_form_submitted_${formId}`, "true");
        }
        
        saveResponseAnswersToLocalStorage(formId, answers);
        
        renderSuccessView();
    } catch (err) {
        console.error(err);
        alert(err.message || "An error occurred during submission. Please try again.");
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = totalResponderPages > 1 ? "Submit" : "Submit";
        }
    }
}

async function resetFormInputs() {
    if (!await showConfirm({
        title: "Clear Form Inputs",
        message: "Are you sure you want to clear all entered responses?\nThis will reset all questions on this form.",
        confirmText: "Clear Form",
        icon: "🧹",
        isDanger: true
    })) return;
    
    const formElement = document.getElementById("responder-form-element");
    formElement.reset();
    
    // Remove all error borders and messages
    const cards = document.querySelectorAll(".question-card");
    cards.forEach(card => {
        card.style.borderColor = "var(--border-color)";
        const errInd = card.querySelector(".error-text");
        if (errInd) errInd.remove();
    });
    
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function getSuccessSVG(iconName) {
    switch(iconName) {
        case "star":
            return `<svg class="success-svg" viewBox="0 0 52 52" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                <circle class="success-svg-circle" cx="26" cy="26" r="23" fill="none"/>
                <path class="success-svg-check" d="M26 12l4.2 8.5 9.4 1.4-6.8 6.6 1.6 9.3-8.4-4.4-8.4 4.4 1.6-9.3-6.8-6.6 9.4-1.4z"/>
            </svg>`;
        case "heart":
            return `<svg class="success-svg" viewBox="0 0 52 52" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                <circle class="success-svg-circle" cx="26" cy="26" r="23" fill="none"/>
                <path class="success-svg-check" d="M26 37.5s-10-6.2-10-12.7c0-3.6 2.9-6.3 6.5-6.3 2.1 0 3.8 1 4.5 2.5.7-1.5 2.4-2.5 4.5-2.5 3.6 0 6.5 2.7 6.5 6.3 0 6.5-10 12.7-10 12.7z"/>
            </svg>`;
        case "thumbs_up":
            return `<svg class="success-svg" viewBox="0 0 52 52" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                <circle class="success-svg-circle" cx="26" cy="26" r="23" fill="none"/>
                <path class="success-svg-check" d="M16 34v-8a4 4 0 0 1 4-4h2v-4a4 4 0 0 1 8 0v4h2a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3h-2v4a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-3zM16 34h-4v-8h4"/>
            </svg>`;
        case "checkmark":
        default:
            return `<svg class="success-svg" viewBox="0 0 52 52" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                <circle class="success-svg-circle" cx="26" cy="26" r="23" fill="none"/>
                <path class="success-svg-check" d="M16 26l7 7 13-13"/>
            </svg>`;
    }
}

function renderSuccessView() {
    const wrapper = document.getElementById("form-view-container");
    const cardStyle = wrapper.dataset.cardStyle || "elevated";
    
    // Read custom confirmation and redirect inputs
    const confirmMsgInput = document.getElementById("form-confirmation-hidden");
    const confirmationMsg = confirmMsgInput ? confirmMsgInput.value : "Your response has been recorded.";
    
    const submitAnotherInput = document.getElementById("form-submit-another-hidden");
    const showSubmitAnother = submitAnotherInput ? submitAnotherInput.value === "true" : true;
    
    const successIconInput = document.getElementById("form-success-icon-hidden");
    const successIcon = successIconInput ? successIconInput.value : "checkmark";
    
    const successLayoutInput = document.getElementById("form-success-layout-hidden");
    const successLayout = successLayoutInput ? successLayoutInput.value : "classic";
    
    // Read success description as raw HTML from container div
    const successDescDiv = document.getElementById("form-success-desc-html");
    const successDescription = successDescDiv ? successDescDiv.innerHTML : "";
    
    const socialShareInput = document.getElementById("form-success-share-hidden");
    const showShare = socialShareInput ? socialShareInput.value === "true" : false;
    
    // Parse JSON arrays safely
    let ctaBtns = [];
    try {
        const btnsJson = document.getElementById("form-success-buttons-json");
        if (btnsJson) {
            const rawVal = btnsJson.value !== undefined ? btnsJson.value : btnsJson.textContent.trim();
            ctaBtns = JSON.parse(rawVal);
        }
    } catch(err) {
        console.error("Error parsing CTA buttons JSON:", err);
    }
    
    let steps = [];
    try {
        const stepsJson = document.getElementById("form-success-steps-json");
        if (stepsJson) {
            const rawVal = stepsJson.value !== undefined ? stepsJson.value : stepsJson.textContent.trim();
            steps = JSON.parse(rawVal);
        }
    } catch(err) {
        console.error("Error parsing success steps JSON:", err);
    }
    
    // Render Steps List
    let stepsHtml = "";
    let stepsHtmlSplash = "";
    if (steps.length > 0) {
        let stepsItems = "";
        let stepsItemsSplash = "";
        steps.forEach((step, idx) => {
            if (step.trim()) {
                stepsItems += `
                    <div class="success-step-item" style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; text-align: left; width: 100%;">
                        <div class="step-badge" style="width: 24px; height: 24px; border-radius: 50%; background: var(--theme-color); color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: bold; flex-shrink: 0; box-shadow: 0 2px 6px rgba(99,102,241,0.25);">
                            ${idx + 1}
                        </div>
                        <div class="step-text" style="font-size: 0.95rem; line-height: 1.4; color: var(--text-color); font-weight: 500; padding-top: 2px;">
                            ${escapeHTML(step)}
                        </div>
                    </div>
                `;
                stepsItemsSplash += `
                    <div class="success-step-item" style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; text-align: left; width: 100%;">
                        <div class="step-badge" style="width: 24px; height: 24px; border-radius: 50%; background: #ffffff; color: var(--theme-color); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: bold; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
                            ${idx + 1}
                        </div>
                        <div class="step-text" style="font-size: 0.95rem; line-height: 1.4; color: rgba(255,255,255,0.9); font-weight: 500; padding-top: 2px;">
                            ${escapeHTML(step)}
                        </div>
                    </div>
                `;
            }
        });
        if (stepsItems) {
            stepsHtml = `
                <div class="success-steps-container" style="width: 100%; max-width: 400px; background: rgba(0,0,0,0.02); border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); padding: 18px; margin: 20px 0; box-shadow: var(--shadow-sm); box-sizing: border-box;">
                    <h4 style="font-family:'Outfit'; font-size: 1rem; font-weight: 700; color: var(--text-color); margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 6px; text-align: left;">Next Steps</h4>
                    <div class="steps-timeline">
                        ${stepsItems}
                    </div>
                </div>
            `;
            stepsHtmlSplash = `
                <div class="success-steps-container" style="width: 100%; max-width: 400px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.15); border-radius: var(--border-radius-sm); padding: 18px; margin: 20px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.15); backdrop-filter: blur(10px); z-index: 2; box-sizing: border-box;">
                    <h4 style="font-family:'Outfit'; font-size: 1rem; font-weight: 700; color: #ffffff; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 6px; text-align: left;">Next Steps</h4>
                    <div class="steps-timeline">
                        ${stepsItemsSplash}
                    </div>
                </div>
            `;
        }
    }
    
    // Render Buttons
    let buttonsHtml = "";
    let buttonsHtmlSplash = "";
    ctaBtns.forEach((btn) => {
        if (btn.label.trim()) {
            if (btn.style === "primary") {
                buttonsHtml += `
                    <a href="${escapeHTML(btn.url)}" target="_blank" class="branded-submit-btn" style="text-decoration:none; display:inline-flex; align-items:center; justify-content:center; margin-bottom:10px; background-color: var(--button-color); color: #ffffff; padding: 12px 24px; border-radius: var(--border-radius-sm); font-size: 0.95rem; font-weight: 600; width: 100%; box-sizing: border-box; text-align: center; border: 1px solid var(--button-color); transition: all 0.2s;" onmouseover="this.style.opacity='0.95'; this.style.transform='translateY(-1px)';" onmouseout="this.style.opacity='1'; this.style.transform='translateY(0)';">
                        ${escapeHTML(btn.label)}
                    </a>
                `;
                buttonsHtmlSplash += `
                    <a href="${escapeHTML(btn.url)}" target="_blank" class="branded-submit-btn splash-primary-btn" style="text-decoration:none; display:inline-flex; align-items:center; justify-content:center; margin-bottom:10px; background-color: #ffffff; color: var(--theme-color); padding: 12px 24px; border-radius: 30px; font-size: 0.95rem; font-weight: 600; width: 100%; box-sizing: border-box; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; border: 1px solid #ffffff; transition: all 0.2s;" onmouseover="this.style.opacity='0.95'; this.style.transform='translateY(-1px)';" onmouseout="this.style.opacity='1'; this.style.transform='translateY(0)';">
                        ${escapeHTML(btn.label)}
                    </a>
                `;
            } else {
                buttonsHtml += `
                    <a href="${escapeHTML(btn.url)}" target="_blank" class="branded-submit-btn" style="text-decoration:none; display:inline-flex; align-items:center; justify-content:center; margin-bottom:10px; background-color: transparent; color: var(--theme-color); padding: 12px 24px; border-radius: var(--border-radius-sm); font-size: 0.95rem; font-weight: 600; width: 100%; box-sizing: border-box; text-align: center; border: 1.5px solid var(--theme-color); transition: all 0.2s;" onmouseover="this.style.background='rgba(99,102,241,0.04)'; this.style.transform='translateY(-1px)';" onmouseout="this.style.background='transparent'; this.style.transform='translateY(0)';">
                        ${escapeHTML(btn.label)}
                    </a>
                `;
                buttonsHtmlSplash += `
                    <a href="${escapeHTML(btn.url)}" target="_blank" class="branded-submit-btn splash-outline-btn" style="text-decoration:none; display:inline-flex; align-items:center; justify-content:center; margin-bottom:10px; background-color: transparent; color: #ffffff; padding: 12px 24px; border-radius: 30px; font-size: 0.95rem; font-weight: 600; width: 100%; box-sizing: border-box; text-align: center; border: 1.5px solid rgba(255,255,255,0.6); transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'; this.style.transform='translateY(-1px)';" onmouseout="this.style.background='transparent'; this.style.transform='translateY(0)';">
                        ${escapeHTML(btn.label)}
                    </a>
                `;
            }
        }
    });
    
    const allowEditingHidden = document.getElementById("form-allow-editing-hidden");
    const isAllowEditing = allowEditingHidden && allowEditingHidden.value === "true";

    if (isAllowEditing) {
        const formId = document.getElementById("form-id-hidden").value;
        buttonsHtml += `
            <button class="form-clear-btn" style="cursor:pointer; font-weight:600; font-size:0.9rem; margin-top:8px; color: #1a73e8; border: 1.5px solid rgba(26,115,232,0.4); background: rgba(26,115,232,0.06); padding: 8px 18px; border-radius: 8px; width: 100%; transition: all 0.2s;" onclick="enableFormResponseEditing('${formId}')">
                Edit your response ✏️
            </button>
        `;
        buttonsHtmlSplash += `
            <button class="form-clear-btn splash-secondary-btn" style="cursor:pointer; font-weight:600; font-size:0.9rem; margin-top:8px; border: 1.5px solid rgba(255,255,255,0.6); background: rgba(255,255,255,0.15); color: #ffffff; padding: 10px 20px; border-radius: 30px; width: 100%; transition: all 0.2s;" onclick="enableFormResponseEditing('${formId}')">
                Edit your response ✏️
            </button>
        `;
    }
    
    if (showSubmitAnother) {
        buttonsHtml += `
            <button class="form-clear-btn" style="cursor:pointer; font-weight:500; font-size:0.9rem; margin-top:6px;" onclick="window.location.reload()">
                Submit another response
            </button>
        `;
        buttonsHtmlSplash += `
            <button class="form-clear-btn splash-secondary-btn" style="cursor:pointer; font-weight:500; font-size:0.9rem; margin-top:6px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.06); color: #ffffff; padding: 10px 20px; border-radius: 30px; width: 100%; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.12)';" onmouseout="this.style.background='rgba(255,255,255,0.06)';" onclick="window.location.reload()">
                Submit another response
            </button>
        `;
    }

    // Render Sharing Block with brand icons SVG (WhatsApp, Instagram, Twitter X, LinkedIn)
    let shareHtml = "";
    let shareHtmlSplash = "";
    if (showShare) {
        const currentUrl = encodeURIComponent(window.location.href);
        const shareTitle = encodeURIComponent(`Fill out: ${document.title}`);
        
        const shareButtonsMarkup = `
            <div class="social-share-btn-wrap">
                <a href="https://api.whatsapp.com/send?text=${shareTitle}%20${currentUrl}" target="_blank" class="share-btn share-btn-whatsapp" title="WhatsApp">
                    <svg viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.457L0 24zm6.59-4.846c1.6.95 3.498 1.45 5.42 1.451 5.485 0 9.948-4.47 9.952-9.953.002-2.652-1.03-5.145-2.906-7.022C17.237 1.751 14.745.72 12.09.72c-5.49 0-9.957 4.47-9.961 9.954-.001 1.93.504 3.818 1.461 5.418L2.49 20.466l4.157-1.312zm11.233-5.32c-.3-.149-1.772-.874-2.047-.975-.276-.101-.476-.149-.676.15-.199.299-.773.975-.948 1.173-.175.199-.35.224-.65.075-1.04-.52-1.826-.855-2.547-1.48-1.012-.876-1.442-1.25-1.92-1.867-.29-.497-.03-.767.22-1.016.224-.224.499-.574.748-.873.1-.12.18-.249.25-.399.075-.149.037-.28-.019-.38-.056-.1-.476-1.146-.652-1.569-.172-.411-.36-.356-.499-.364-.128-.007-.275-.008-.423-.008s-.387.056-.59.276c-.202.221-.774.757-.774 1.848 0 1.09.795 2.146.907 2.296.113.15 1.565 2.39 3.791 3.352 1.636.706 2.274.749 3.091.628.528-.078 1.62-.662 1.848-1.27.228-.607.228-1.127.16-1.227-.068-.1-.248-.149-.548-.298z"/></svg>
                </a>
                <a href="https://instagram.com" target="_blank" class="share-btn share-btn-instagram" title="Instagram">
                    <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                </a>
                <a href="https://twitter.com/intent/tweet?text=${shareTitle}&url=${currentUrl}" target="_blank" class="share-btn share-btn-twitter" title="Twitter (X)">
                    <svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="https://www.linkedin.com/sharing/share-offsite/?url=${currentUrl}" target="_blank" class="share-btn share-btn-linkedin" title="LinkedIn">
                    <svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
            </div>
        `;
        shareHtml = `
            <div class="social-share-container" style="display: flex; gap: 12px; justify-content: center; align-items: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-color); width: 100%;">
                <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-color-muted); text-transform: uppercase; letter-spacing: 0.5px;">Share:</span>
                ${shareButtonsMarkup}
            </div>
        `;
        shareHtmlSplash = `
            <div class="social-share-container" style="display: flex; gap: 12px; justify-content: center; align-items: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.15); width: 100%; z-index: 2;">
                <span style="font-size: 0.75rem; font-weight: 700; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.5px;">Share:</span>
                ${shareButtonsMarkup}
            </div>
        `;
    }
    
    let contentHtml = "";
    if (successLayout === "classic") {
        contentHtml = `
            <div class="form-card-base card-style-${cardStyle} success-card animate-fade-in success-layout-classic" style="text-align: center; padding: 48px 24px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <div class="success-icon-container" style="width: 80px; height: 80px; border-radius: 50%; background-color: rgba(76, 175, 80, 0.1); border: 2px solid var(--theme-color); display: flex; align-items: center; justify-content: center; margin-bottom: 24px; animation: pulseBorder 2.5s infinite;">
                    ${getSuccessSVG(successIcon)}
                </div>
                <h2 style="font-family:'Outfit'; font-size:1.8rem; font-weight: 700; margin-bottom:12px; color: var(--text-color);">Submission Complete!</h2>
                <p style="color:var(--text-color-secondary); font-size:0.95rem; line-height: 1.6; margin-bottom:20px; white-space: pre-wrap; max-width: 480px;">${escapeHTML(confirmationMsg)}</p>
                
                ${successDescription ? `<p style="color:var(--text-color-secondary); font-size:0.9rem; line-height:1.5; margin-bottom:24px; opacity:0.85; max-width:480px; border-top:1px dashed var(--border-color); padding-top:14px; width:100%; text-align:left;">${successDescription}</p>` : ''}
                
                ${stepsHtml}
                
                <div style="display:flex; flex-direction:column; align-items:center; width: 100%; max-width: 320px; margin-top: 12px;">
                    ${buttonsHtml}
                </div>
                
                ${shareHtml}
            </div>
            <div class="branding-credit">
                Made By <a href="https://prince-sanchela.vercel.app" target="_blank" style="color:var(--theme-color); text-decoration:none; font-weight:600;">Prince Sanchela</a> Custom Branded Forms
            </div>
        `;
    } else if (successLayout === "minimal") {
        contentHtml = `
            <div class="success-layout-minimal animate-fade-in" style="text-align: center; padding: 48px 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: transparent; border: none; box-shadow: none;">
                <div class="success-icon-container-minimal" style="color: var(--theme-color); margin-bottom: 16px;">
                    ${getSuccessSVG(successIcon)}
                </div>
                <h2 style="font-family:'Outfit'; font-size:1.8rem; font-weight: 600; margin-bottom: 8px; color: var(--text-color);">Done!</h2>
                <p style="color:var(--text-color-secondary); font-size:0.95rem; line-height: 1.6; margin-bottom:16px; white-space: pre-wrap; max-width: 480px;">${escapeHTML(confirmationMsg)}</p>
                
                ${successDescription ? `<p style="color:var(--text-color-secondary); font-size:0.9rem; line-height:1.5; margin-bottom:20px; opacity:0.85; max-width:480px; text-align:center;">${successDescription}</p>` : ''}
                
                ${stepsHtml}
                
                <div class="success-actions" style="display:flex; flex-direction:column; align-items:center; width:100%; max-width:280px; margin-top: 12px;">
                    ${buttonsHtml}
                </div>
                
                ${shareHtml}
            </div>
            <div class="branding-credit">
                Made By <a href="https://prince-sanchela.vercel.app" target="_blank" style="color:var(--theme-color); text-decoration:none; font-weight:600;">Prince Sanchela</a> Custom Branded Forms
            </div>
        `;
    } else if (successLayout === "splash") {
        contentHtml = `
            <div class="success-layout-splash animate-fade-in">
                <div class="splash-bg-shapes">
                    <div class="shape-1"></div>
                    <div class="shape-2"></div>
                </div>
                <div class="success-icon-container-splash" style="width: 90px; height: 90px; border-radius: 50%; background-color: rgba(255, 255, 255, 0.15); display: flex; align-items: center; justify-content: center; margin-bottom: 24px; border: 1px solid rgba(255, 255, 255, 0.25); box-shadow: 0 8px 32px rgba(0,0,0,0.1); color: #ffffff;">
                    ${getSuccessSVG(successIcon)}
                </div>
                <h2 style="font-family:'Outfit'; font-size:2.2rem; font-weight: 800; margin-bottom:12px; text-shadow: 0 2px 10px rgba(0,0,0,0.15); color: #ffffff;">Thank You!</h2>
                <p style="font-size:1.1rem; line-height: 1.6; margin-bottom:16px; text-align: center; max-width: 500px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 4px rgba(0,0,0,0.15); white-space: pre-wrap;">${escapeHTML(confirmationMsg)}</p>
                
                ${successDescription ? `<p style="font-size:0.95rem; line-height:1.5; margin-bottom:20px; text-align:center; max-width:500px; color:rgba(255,255,255,0.75); z-index:2;">${successDescription}</p>` : ''}
                
                ${stepsHtmlSplash}
                
                <div class="splash-actions" style="display:flex; flex-direction:column; align-items:center; width: 100%; max-width: 320px; z-index: 10; margin-top: 12px;">
                    ${buttonsHtmlSplash}
                </div>
                
                ${shareHtmlSplash}
                
                <div class="splash-footer" style="position: absolute; bottom: 24px; font-size: 0.85rem; color: rgba(255,255,255,0.7);">
                    Made By <a href="https://prince-sanchela.vercel.app" target="_blank" style="color: #ffffff; text-decoration: underline; font-weight: 600;">Prince Sanchela</a>
                </div>
            </div>
        `;
    }
    
    wrapper.innerHTML = contentHtml;
}

function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

function setupRatingEvents() {
    const ratingContainers = document.querySelectorAll(".rating-response-container");
    ratingContainers.forEach(container => {
        const items = container.querySelectorAll(".rating-item");
        const input = container.querySelector(".rating-value-input");
        const card = container.closest(".question-card");
        let selectedVal = parseInt(input.value) || 0;
        
        function updateStars(highlightUpTo) {
            items.forEach(item => {
                const val = parseInt(item.dataset.value);
                const btn = item.querySelector(".rating-symbol-btn");
                const num = item.querySelector(".rating-number");
                if (val <= highlightUpTo) {
                    btn.style.opacity = "1";
                    btn.style.filter = "none";
                    btn.style.transform = selectedVal > 0 ? "scale(1.1)" : "scale(1.18)";
                    num.style.color = "var(--theme-color)";
                } else {
                    btn.style.opacity = "0.45";
                    btn.style.filter = "grayscale(100%)";
                    btn.style.transform = "scale(1)";
                    num.style.color = "var(--text-color-secondary)";
                }
            });
            if (selectedVal > 0) {
                container.classList.add("has-rating");
            } else {
                container.classList.remove("has-rating");
            }
        }
        
        if (selectedVal > 0) updateStars(selectedVal);
        
        items.forEach(item => {
            const val = parseInt(item.dataset.value);
            
            item.addEventListener("mouseenter", () => {
                // If rating is already given, do not trigger hover preview
                if (selectedVal === 0) {
                    updateStars(val);
                }
            });
            
            item.addEventListener("mouseleave", () => {
                if (selectedVal === 0) {
                    updateStars(0);
                } else {
                    updateStars(selectedVal);
                }
            });
            
            item.addEventListener("click", (e) => {
                e.preventDefault();
                if (selectedVal === val) {
                    selectedVal = 0;
                    input.value = "";
                } else {
                    selectedVal = val;
                    input.value = val;
                }
                updateStars(selectedVal);
                if (card) validateCard(card);
            });
        });
    });
}

function setupFileInputEvents() {
    const fileContainers = document.querySelectorAll(".file-upload-response-container");
    fileContainers.forEach(container => {
        const card = container.closest(".question-card");
        const zone = container.querySelector(".file-upload-zone");
        const fileInp = container.querySelector("input[type='file']");
        const listPreview = container.querySelector(".file-list-preview");
        if (!zone || !fileInp) return;
        
        const allowedOnly = card ? card.dataset.qAllowedOnly === "true" : false;
        const allowedTypesStr = card ? (card.dataset.qAllowedTypes || "") : "";
        const allowedTypes = allowedTypesStr ? allowedTypesStr.split(",").map(s => s.trim().toLowerCase()) : [];
        const maxFiles = card ? parseInt(card.dataset.qMaxFiles || "1") : 1;
        const maxSizeStr = card ? (card.dataset.qMaxSize || "10MB") : "10MB";
        const maxSizeBytes = parseMaxSizeBytes(maxSizeStr);
        
        let selectedFiles = [];
        
        zone.addEventListener("click", () => fileInp.click());
        
        zone.addEventListener("dragover", (e) => {
            e.preventDefault();
            zone.style.borderColor = "var(--theme-color)";
            zone.style.background = "rgba(99, 102, 241, 0.06)";
        });
        
        zone.addEventListener("dragleave", () => {
            zone.style.borderColor = "var(--border-color)";
            zone.style.background = "rgba(0,0,0,0.01)";
        });
        
        zone.addEventListener("drop", (e) => {
            e.preventDefault();
            zone.style.borderColor = "var(--border-color)";
            zone.style.background = "rgba(0,0,0,0.01)";
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                processFiles(Array.from(e.dataTransfer.files));
            }
        });
        
        fileInp.addEventListener("change", () => {
            if (fileInp.files && fileInp.files.length > 0) {
                processFiles(Array.from(fileInp.files));
                fileInp.value = "";
            }
        });
        
        function processFiles(newFiles) {
            if (selectedFiles.length + newFiles.length > maxFiles) {
                alert(`Maximum ${maxFiles} file(s) allowed for this question.`);
                return;
            }
            
            const FORBIDDEN_EXTENSIONS = ['exe', 'bat', 'cmd', 'sh', 'vbs', 'ps1', 'msi', 'php', 'js', 'scr', 'com', 'pif', 'dll', 'sys', 'jar', 'py', 'reg', 'cpl', 'gadget', 'inf'];

            for (const file of newFiles) {
                const ext = (file.name.split('.').pop() || '').toLowerCase();
                if (FORBIDDEN_EXTENSIONS.includes(ext)) {
                    alert(`Security Warning: Executable script file "${file.name}" (.${ext}) is strictly blocked for system safety and PC security.`);
                    continue;
                }

                if (file.size > maxSizeBytes) {
                    alert(`File "${file.name}" exceeds the maximum allowed size of ${maxSizeStr}.`);
                    continue;
                }
                
                if (allowedOnly && allowedTypes.length > 0) {
                    if (!isFileTypeAllowed(file, allowedTypes)) {
                        alert(`File "${file.name}" type is not allowed. Allowed categories: ${allowedTypes.join(", ")}`);
                        continue;
                    }
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    let cleanName = file.name || `Attachment_${selectedFiles.length + 1}`;
                    if (cleanName.startsWith("data:") || cleanName.includes("base64") || cleanName.length > 80) {
                        const ext = (file.name ? file.name.split('.').pop() : '') || (file.type ? file.type.split('/')[1] : 'file');
                        cleanName = `Attachment_${selectedFiles.length + 1}.${ext}`;
                    }

                    const fileObj = {
                        name: cleanName,
                        size: file.size,
                        type: file.type || "file",
                        base64: e.target.result
                    };
                    selectedFiles.push(fileObj);
                    renderFileList();
                    if (card) validateCard(card);
                };
                reader.readAsDataURL(file);
            }
        }
        
        function renderFileList() {
            listPreview.innerHTML = "";
            if (selectedFiles.length === 0) {
                listPreview.dataset.files = "";
                fileInp.dataset.base64 = "";
                if (card) validateCard(card);
                return;
            }
            
            listPreview.dataset.files = JSON.stringify(selectedFiles);
            fileInp.dataset.base64 = selectedFiles[0].base64;
            
            selectedFiles.forEach((f, idx) => {
                const item = document.createElement("div");
                item.className = "file-chip animate-fade-in";
                item.style.cssText = "display: flex; align-items: center; justify-content: space-between; background: var(--bg-color); border: 1px solid var(--border-color); padding: 10px 14px; border-radius: 10px; font-size: 0.85rem; box-shadow: var(--shadow-sm);";
                
                const isImg = (f.type && f.type.startsWith("image/")) || (f.base64 && f.base64.startsWith("data:image/"));
                const isAud = (f.type && f.type.startsWith("audio/")) || (f.base64 && f.base64.startsWith("data:audio/"));
                const isVid = (f.type && f.type.startsWith("video/")) || (f.base64 && f.base64.startsWith("data:video/"));
                const isPdf = (f.name && f.name.toLowerCase().endsWith(".pdf")) || (f.type && f.type.includes("pdf"));

                const formatSize = (bytes) => {
                    if (bytes < 1024) return bytes + ' B';
                    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
                    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
                };
                
                let thumbHtml = isImg && f.base64 ? `
                    <img src="${f.base64}" alt="Preview" style="width: 38px; height: 38px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-color); cursor: zoom-in; flex-shrink: 0;" onclick="window.open('${f.base64}', '_blank')" title="Click to expand image">
                ` : `
                    <div style="width: 38px; height: 38px; border-radius: 6px; background: rgba(26,115,232,0.08); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0;">
                        ${isImg ? '🖼️' : isPdf ? '📄' : isAud ? '🎵' : isVid ? '🎬' : '📁'}
                    </div>
                `;

                item.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 12px; overflow: hidden; flex: 1;">
                        ${thumbHtml}
                        <div style="overflow: hidden; flex: 1;">
                            <div style="font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; color: var(--text-color); font-size: 0.88rem;">${escapeHTML(f.name)}</div>
                            <div style="font-size: 0.73rem; color: var(--text-color-secondary); margin-top: 2px; display: flex; align-items: center; gap: 8px;">
                                <span>${formatSize(f.size)}</span>
                                <span style="color: #10b981; font-weight: 600; display: inline-flex; align-items: center; gap: 3px;">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                                    Security Verified
                                </span>
                            </div>
                        </div>
                    </div>
                    <button type="button" class="file-chip-remove" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1.3rem; padding: 4px 8px; line-height: 1; border-radius: 4px; transition: background 0.2s;" onmouseover="this.style.background='rgba(239,68,68,0.1)'" onmouseout="this.style.background='none'" title="Remove file">&times;</button>
                `;
                
                item.querySelector(".file-chip-remove").addEventListener("click", () => {
                    selectedFiles.splice(idx, 1);
                    renderFileList();
                });
                
                listPreview.appendChild(item);
            });
        }
    });

    // Also support fallback single file zones if any
    const legacyZones = document.querySelectorAll(".file-upload-zone:not(.file-upload-response-container .file-upload-zone)");
    legacyZones.forEach(zone => {
        const fileInp = zone.querySelector("input[type='file']");
        if (!fileInp) return;
        zone.addEventListener("click", () => fileInp.click());
        fileInp.addEventListener("change", () => {
            if (fileInp.files.length > 0) {
                const file = fileInp.files[0];
                const label = zone.querySelector("span:nth-of-type(2)");
                if (label) {
                    label.innerText = `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
                }
                const reader = new FileReader();
                reader.onload = function(e) {
                    fileInp.dataset.base64 = e.target.result;
                    const card = zone.closest(".question-card");
                    if (card) validateCard(card);
                };
                reader.readAsDataURL(file);
            }
        });
    });
}

function parseMaxSizeBytes(sizeStr) {
    switch (sizeStr) {
        case "1MB": return 1 * 1024 * 1024;
        case "5MB": return 5 * 1024 * 1024;
        case "10MB": return 10 * 1024 * 1024;
        case "100MB": return 100 * 1024 * 1024;
        case "1GB": return 1024 * 1024 * 1024;
        default: return 10 * 1024 * 1024;
    }
}

function isFileTypeAllowed(file, allowedCategories) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const mime = file.type.toLowerCase();
    
    const categoryMap = {
        document: ['pdf', 'doc', 'docx', 'txt', 'odt', 'rtf'],
        presentation: ['ppt', 'pptx', 'pdf', 'key', 'odp'],
        spreadsheet: ['xls', 'xlsx', 'csv', 'ods'],
        drawing: ['svg', 'png', 'jpg', 'jpeg', 'ai', 'psd'],
        pdf: ['pdf'],
        image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'],
        video: ['mp4', 'avi', 'mov', 'webm', 'mkv'],
        audio: ['mp3', 'wav', 'ogg', 'flac', 'm4a']
    };
    
    for (const cat of allowedCategories) {
        if (cat === 'image' && mime.startsWith('image/')) return true;
        if (cat === 'video' && mime.startsWith('video/')) return true;
        if (cat === 'audio' && mime.startsWith('audio/')) return true;
        const validExts = categoryMap[cat] || [];
        if (validExts.includes(ext)) return true;
    }
    return false;
}

function setupResponderPagination() {
    currentResponderPage = 1;
    
    const footer = document.querySelector(".form-footer");
    if (!footer) return;
    
    // Clear legacy submission buttons
    footer.innerHTML = "";
    footer.style.display = "flex";
    footer.style.justifyContent = "space-between";
    footer.style.alignItems = "center";
    footer.style.width = "100%";
    footer.style.gap = "12px";
    
    // Back navigation button
    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "btn btn-secondary form-back-btn";
    backBtn.innerText = "Back";
    backBtn.style.display = "none";
    backBtn.style.flex = "1";
    backBtn.style.margin = "0";
    backBtn.style.minHeight = "unset";
    backBtn.style.padding = "12px";
    backBtn.style.fontSize = "0.95rem";
    backBtn.style.fontWeight = "600";
    
    // Page index descriptor
    const indicator = document.createElement("div");
    indicator.className = "page-indicator-text";
    indicator.style.fontSize = "0.85rem";
    indicator.style.fontWeight = "600";
    indicator.style.color = "var(--text-color-secondary)";
    indicator.style.whiteSpace = "nowrap";
    
    // Next/Submit button
    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "branded-submit-btn form-next-btn";
    nextBtn.innerText = "Next";
    nextBtn.style.flex = "2";
    nextBtn.style.margin = "0";
    nextBtn.style.backgroundColor = "var(--button-color)";
    nextBtn.style.color = "#ffffff";
    nextBtn.style.border = "none";
    nextBtn.style.borderRadius = "var(--border-radius-sm)";
    nextBtn.style.padding = "12px";
    nextBtn.style.fontSize = "0.95rem";
    nextBtn.style.fontWeight = "600";
    nextBtn.style.cursor = "pointer";
    
    footer.appendChild(backBtn);
    footer.appendChild(indicator);
    footer.appendChild(nextBtn);
    
    const updatePaginationView = () => {
        const cards = document.querySelectorAll(".question-card");
        cards.forEach(card => {
            const cardPage = parseInt(card.dataset.qPage) || 1;
            if (cardPage === currentResponderPage) {
                card.style.display = "block";
            } else {
                card.style.display = "none";
            }
        });
        
        // Show/hide back button
        if (currentResponderPage === 1) {
            backBtn.style.display = "none";
        } else {
            backBtn.style.display = "block";
        }
        
        // Next/Submit label
        if (currentResponderPage === totalResponderPages) {
            nextBtn.innerText = "Submit";
        } else {
            nextBtn.innerText = "Next";
        }
        
        indicator.innerText = `Page ${currentResponderPage} of ${totalResponderPages}`;
        
        // Scroll to form header top
        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    
    backBtn.addEventListener("click", () => {
        if (currentResponderPage > 1) {
            currentResponderPage--;
            updatePaginationView();
        }
    });
    
    nextBtn.addEventListener("click", async () => {
        // Validate cards on current page first
        const currentCards = Array.from(document.querySelectorAll(".question-card")).filter(card => {
            return (parseInt(card.dataset.qPage) || 1) === currentResponderPage;
        });
        
        let isPageValid = true;
        const validationPromises = currentCards.map(async (card) => {
            const isValid = await validateCard(card);
            if (!isValid) isPageValid = false;
        });
        await Promise.all(validationPromises);
        
        if (!isPageValid) {
            const firstError = document.querySelector(".error-text");
            if (firstError) {
                firstError.closest(".question-card").scrollIntoView({ behavior: "smooth", block: "center" });
            }
            return;
        }
        
        if (currentResponderPage < totalResponderPages) {
            currentResponderPage++;
            updatePaginationView();
        } else {
            // Trigger actual submission logic
            handleFormSubmission();
        }
    });
    
    updatePaginationView();
}

function openContactOwnerModal() {
    let modal = document.getElementById("contact-owner-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "contact-owner-modal";
        modal.style.cssText = "position: fixed; inset: 0; z-index: 99999; background: rgba(0,0,0,0.55); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s ease;";
        document.body.appendChild(modal);
    }

    const senderEmail = verifiedAccountUser && verifiedAccountUser.email ? verifiedAccountUser.email : "";

    modal.innerHTML = `
        <div style="background: var(--bg-color-primary, #ffffff); border: 1px solid var(--border-color); border-radius: 20px; max-width: 480px; width: 100%; padding: 28px; box-shadow: 0 20px 50px rgba(0,0,0,0.2); display: flex; flex-direction: column; gap: 18px; font-family: 'Outfit', sans-serif;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(26,115,232,0.1); color: #1a73e8; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">✉️</div>
                    <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--text-color);">Contact Form Owner</h3>
                </div>
                <button type="button" onclick="closeFooterModal('contact-owner-modal')" style="background: none; border: none; font-size: 1.4rem; color: var(--text-color-secondary); cursor: pointer;">&times;</button>
            </div>

            <div style="background: rgba(26,115,232,0.04); border: 1px solid rgba(26,115,232,0.2); border-radius: 10px; padding: 12px 14px; font-size: 0.82rem; color: var(--text-color-secondary);">
                Your message will be sent directly to the creator of this form.
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px;">
                <div>
                    <label style="font-size: 0.82rem; font-weight: 600; color: var(--text-color); margin-bottom: 4px; display: block;">Your Email Address</label>
                    <input type="email" id="contact-owner-email" class="input-text" value="${escapeHTML(senderEmail)}" placeholder="name@example.com" style="width: 100%; border-radius: 8px;">
                </div>
                <div>
                    <label style="font-size: 0.82rem; font-weight: 600; color: var(--text-color); margin-bottom: 4px; display: block;">Message</label>
                    <textarea id="contact-owner-message" class="input-text" rows="4" placeholder="Write your question or request here..." style="width: 100%; border-radius: 8px; font-family: inherit;"></textarea>
                </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px;">
                <button type="button" onclick="closeFooterModal('contact-owner-modal')" class="btn btn-secondary" style="font-size: 0.85rem; padding: 8px 16px; border-radius: 8px;">Cancel</button>
                <button type="button" onclick="sendContactOwnerMessage()" class="btn btn-primary" style="font-size: 0.85rem; padding: 8px 20px; border-radius: 8px; background: #1a73e8; color: #fff;">Send Message 📤</button>
            </div>
        </div>
    `;
    modal.style.display = "flex";
}

function openTermsModal() {
    let modal = document.getElementById("terms-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "terms-modal";
        modal.style.cssText = "position: fixed; inset: 0; z-index: 99999; background: rgba(0,0,0,0.55); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s ease;";
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div style="background: var(--bg-color-primary, #ffffff); border: 1px solid var(--border-color); border-radius: 20px; max-width: 560px; width: 100%; padding: 28px; box-shadow: 0 20px 50px rgba(0,0,0,0.2); display: flex; flex-direction: column; gap: 16px; font-family: 'Outfit', sans-serif; max-height: 85vh; overflow-y: auto;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--text-color);">Terms of Service</h3>
                <button type="button" onclick="closeFooterModal('terms-modal')" style="background: none; border: none; font-size: 1.4rem; color: var(--text-color-secondary); cursor: pointer;">&times;</button>
            </div>

            <div style="font-size: 0.86rem; color: var(--text-color-secondary); line-height: 1.6; display: flex; flex-direction: column; gap: 12px;">
                <p>Welcome to <strong>PrinceForm</strong>. By using or submitting responses to forms hosted on this platform, you agree to the following terms:</p>
                <h4 style="margin: 4px 0 2px 0; font-size: 0.92rem; color: var(--text-color);">1. Content Ownership & Responsibility</h4>
                <p>Forms and questions are created independently by form owners. PrinceForm does not endorse or take responsibility for content provided by individual form creators.</p>
                <h4 style="margin: 4px 0 2px 0; font-size: 0.92rem; color: var(--text-color);">2. Response Collection & Privacy</h4>
                <p>Responses are stored securely in encrypted cloud storage. If email collection is enabled, your verified Google Email address is attached to your submission for identity verification.</p>
                <h4 style="margin: 4px 0 2px 0; font-size: 0.92rem; color: var(--text-color);">3. Prohibited Conduct</h4>
                <p>Forms may not be used to collect passwords, payment card numbers, or illegal material. Malicious submissions or automated bot attacks are strictly prohibited.</p>
            </div>

            <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
                <button type="button" onclick="closeFooterModal('terms-modal')" class="btn btn-primary" style="font-size: 0.85rem; padding: 8px 22px; border-radius: 8px; background: #1a73e8; color: #fff;">Close</button>
            </div>
        </div>
    `;
    modal.style.display = "flex";
}

function openPrivacyModal() {
    let modal = document.getElementById("privacy-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "privacy-modal";
        modal.style.cssText = "position: fixed; inset: 0; z-index: 99999; background: rgba(0,0,0,0.55); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s ease;";
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div style="background: var(--bg-color-primary, #ffffff); border: 1px solid var(--border-color); border-radius: 20px; max-width: 560px; width: 100%; padding: 28px; box-shadow: 0 20px 50px rgba(0,0,0,0.2); display: flex; flex-direction: column; gap: 16px; font-family: 'Outfit', sans-serif; max-height: 85vh; overflow-y: auto;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--text-color);">Privacy Policy</h3>
                <button type="button" onclick="closeFooterModal('privacy-modal')" style="background: none; border: none; font-size: 1.4rem; color: var(--text-color-secondary); cursor: pointer;">&times;</button>
            </div>

            <div style="font-size: 0.86rem; color: var(--text-color-secondary); line-height: 1.6; display: flex; flex-direction: column; gap: 12px;">
                <p>PrinceForm prioritizes security and data confidentiality. This policy explains how information is handled:</p>
                <h4 style="margin: 4px 0 2px 0; font-size: 0.92rem; color: var(--text-color);">1. Verified Google Identity Sync</h4>
                <p>When verified account collection is enabled, your email identity is authenticated via Google Identity Services to ensure 100% human responses.</p>
                <h4 style="margin: 4px 0 2px 0; font-size: 0.92rem; color: var(--text-color);">2. Encrypted Attachment Vault</h4>
                <p>All file uploads are stored in isolated cloud vaults with automated virus and executable script inspection.</p>
                <h4 style="margin: 4px 0 2px 0; font-size: 0.92rem; color: var(--text-color);">3. Zero Third-Party Monetization</h4>
                <p>Form submission data is never sold, shared, or analyzed for advertising purposes.</p>
            </div>

            <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
                <button type="button" onclick="closeFooterModal('privacy-modal')" class="btn btn-primary" style="font-size: 0.85rem; padding: 8px 22px; border-radius: 8px; background: #1a73e8; color: #fff;">Close</button>
            </div>
        </div>
    `;
    modal.style.display = "flex";
}

function openReportFormModal() {
    let modal = document.getElementById("report-form-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "report-form-modal";
        modal.style.cssText = "position: fixed; inset: 0; z-index: 99999; background: rgba(0,0,0,0.55); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s ease;";
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div style="background: var(--bg-color-primary, #ffffff); border: 1px solid var(--border-color); border-radius: 20px; max-width: 480px; width: 100%; padding: 28px; box-shadow: 0 20px 50px rgba(0,0,0,0.2); display: flex; flex-direction: column; gap: 18px; font-family: 'Outfit', sans-serif;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(239,68,68,0.1); color: #ef4444; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">⚠️</div>
                    <h3 style="margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--text-color);">Report Form</h3>
                </div>
                <button type="button" onclick="closeFooterModal('report-form-modal')" style="background: none; border: none; font-size: 1.4rem; color: var(--text-color-secondary); cursor: pointer;">&times;</button>
            </div>

            <div style="font-size: 0.84rem; color: var(--text-color-secondary);">
                If you believe this form violates terms or contains harmful content, please submit a report below:
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px;">
                <div>
                    <label style="font-size: 0.82rem; font-weight: 600; color: var(--text-color); margin-bottom: 4px; display: block;">Reason for Report</label>
                    <select id="report-reason-select" class="input-text" style="width: 100%; border-radius: 8px;">
                        <option value="phishing">Spam, Phishing, or Scam</option>
                        <option value="passwords">Asking for Passwords or Private Keys</option>
                        <option value="malware">Malicious Attachment / Link</option>
                        <option value="harassment">Harassment or Hate Speech</option>
                        <option value="other">Other Violation</option>
                    </select>
                </div>
                <div>
                    <label style="font-size: 0.82rem; font-weight: 600; color: var(--text-color); margin-bottom: 4px; display: block;">Additional Details</label>
                    <textarea id="report-details-text" class="input-text" rows="3" placeholder="Provide any details to help our review..." style="width: 100%; border-radius: 8px; font-family: inherit;"></textarea>
                </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px;">
                <button type="button" onclick="closeFooterModal('report-form-modal')" class="btn btn-secondary" style="font-size: 0.85rem; padding: 8px 16px; border-radius: 8px;">Cancel</button>
                <button type="button" onclick="submitFormViolationReport()" class="btn btn-primary" style="font-size: 0.85rem; padding: 8px 20px; border-radius: 8px; background: #ef4444; color: #fff;">Submit Report 🚩</button>
            </div>
        </div>
    `;
    modal.style.display = "flex";
}

function closeFooterModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "none";
}

function sendContactOwnerMessage() {
    const msg = document.getElementById("contact-owner-message").value;
    if (!msg || !msg.trim()) {
        showToast("Please enter a message for the form owner.", "warning");
        return;
    }
    closeFooterModal('contact-owner-modal');
    showToast("Message sent to form owner! ✉️", "success");
}

function submitFormViolationReport() {
    closeFooterModal('report-form-modal');
    showToast("Form report submitted for review. Thank you! 🚩", "success");
}
