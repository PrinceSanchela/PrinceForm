// =========================================================================
// Prince Form Builder - Dashboard Javascript
// =========================================================================

// Application State
let formsList = [];
let activeForm = null;
let activeFormResponses = [];
let isEditing = false;
let currentPreviewMode = "form";
let activePage = 1;
let totalPages = 1;

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
    
    if (type === "success" || msgLower.includes("success") || msgLower.includes("saved") || msgLower.includes("copied") || msgLower.includes("generated")) {
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
            if (message.toLowerCase().includes("delete") || message.toLowerCase().includes("clear") || message.toLowerCase().includes("unlink")) {
                title = "Confirm Deletion";
                confirmText = "Delete";
                icon = "🗑️";
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
                    <div id="confirm-modal-icon" style="width: 58px; height: 58px; border-radius: 18px; background: rgba(239, 68, 68, 0.1); color: #ef4444; display: flex; align-items: center; justify-content: center; font-size: 1.9rem; margin: 0 auto 16px auto;">🗑️</div>
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
            actionBtn.style.background = isDanger ? "#ef4444" : "var(--primary-color, #1a73e8)";
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

// Theme Colors Presets
const PRESET_COLORS = [
    "#673ab7", "#3f51b5", "#2196f3", "#00bcd4", 
    "#009688", "#4caf50", "#ff9800", "#ff5722", 
    "#795548", "#607d8b", "#e91e63", "#9c27b0"
];

function getRatingSymbolChar(icon) {
    switch (icon) {
        case "heart": return "❤️";
        case "thumb": return "👍";
        case "smile": return "😊";
        case "circle": return "🔴";
        default: return "⭐";
    }
}


// Document Elements
document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

function initApp() {
    checkFirstTimeVisit();
    setupTabNavigation();
    setupBrandingListeners();
    setupColorPresets();
    
    // Bind global buttons
    document.getElementById("btn-new-form").addEventListener("click", createNewForm);
    document.getElementById("btn-save-form").addEventListener("click", saveActiveForm);
    document.getElementById("btn-preview-form").addEventListener("click", () => {
        if (activeForm && activeForm.id) {
            window.open(`/form/${activeForm.id}`, '_blank');
        } else {
            alert("Please save the form first to preview it.");
        }
    });
    document.getElementById("btn-add-question").addEventListener("click", addQuestion);
    setupResponsesActionsListeners();
    setupFileModalHandlers();
    
    // Check if opening via /edit/{form_id} or ?edit={form_id}
    const pathParts = window.location.pathname.split("/").filter(Boolean);
    if (pathParts.length >= 2 && pathParts[0] === "edit") {
        const editFormId = pathParts[1];
        loadFormToEdit(editFormId);
    } else {
        const urlParams = new URLSearchParams(window.location.search);
        const editParam = urlParams.get("edit");
        if (editParam) {
            loadFormToEdit(editParam);
        }
    }

    // Guide/welcome banner toggle
    const toggleWelcomeBtn = document.getElementById("btn-toggle-welcome-banner");
    if (toggleWelcomeBtn) {
        toggleWelcomeBtn.addEventListener("click", () => {
            const wrapper = document.querySelector(".dashboard-wrapper-split");
            if (wrapper) {
                const isHidden = wrapper.classList.contains("hide-marketing");
                if (isHidden) {
                    wrapper.classList.remove("hide-marketing");
                    localStorage.setItem("princeform_visited", "false");
                } else {
                    wrapper.classList.add("hide-marketing");
                    localStorage.setItem("princeform_visited", "true");
                }
            }
        });
    }

    // Marketing sidebar button bindings
    const marketingCta = document.querySelector(".btn-marketing-cta");
    if (marketingCta) {
        marketingCta.addEventListener("click", () => {
            localStorage.setItem("princeform_visited", "true");
            const wrapper = document.querySelector(".dashboard-wrapper-split");
            if (wrapper) wrapper.classList.add("hide-marketing");
            createNewForm();
        });
    }

    const demoLink = document.querySelector(".marketing-demo-link");
    if (demoLink) {
        demoLink.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.setItem("princeform_visited", "true");
            const wrapper = document.querySelector(".dashboard-wrapper-split");
            if (wrapper) wrapper.classList.add("hide-marketing");
            loadDemoForm();
        });
    }

    // Bind Preview View Mode Toggles
    const formToggle = document.getElementById("preview-toggle-form");
    const successToggle = document.getElementById("preview-toggle-success");
    if (formToggle && successToggle) {
        formToggle.addEventListener("click", () => {
            currentPreviewMode = "form";
            formToggle.classList.add("active");
            successToggle.classList.remove("active");
            updateLivePreview();
        });
        successToggle.addEventListener("click", () => {
            currentPreviewMode = "success";
            successToggle.classList.add("active");
            formToggle.classList.remove("active");
            updateLivePreview();
        });
    }

    // Bind Success Setting Selects to trigger live preview update
    const layoutSelect = document.getElementById("form-success-layout-select");
    const iconSelect = document.getElementById("form-success-icon-select");
    if (layoutSelect) {
        layoutSelect.addEventListener("change", (e) => {
            if (activeForm) {
                activeForm.successLayout = e.target.value;
                updateLivePreview();
            }
        });
    }
    if (iconSelect) {
        iconSelect.addEventListener("change", (e) => {
            if (activeForm) {
                activeForm.successIcon = e.target.value;
                updateLivePreview();
            }
        });
    }

    const successDescInput = document.getElementById("form-success-desc-input");
    if (successDescInput) {
        successDescInput.addEventListener("input", (e) => {
            if (activeForm) {
                activeForm.successDescription = e.target.value;
                updateLivePreview();
            }
        });
    }

    const socialShareInput = document.getElementById("form-social-share-input");
    if (socialShareInput) {
        socialShareInput.addEventListener("change", (e) => {
            if (activeForm) {
                activeForm.showSocialShare = e.target.checked;
                updateLivePreview();
            }
        });
    }

    // Bind Add Success Button / Step triggers
    const addSuccessBtn = document.getElementById("btn-add-success-btn");
    if (addSuccessBtn) {
        addSuccessBtn.addEventListener("click", () => {
            if (!activeForm) return;
            if (!activeForm.successButtons) activeForm.successButtons = [];
            activeForm.successButtons.push({ label: "Visit Link", url: "https://", style: "primary" });
            renderSuccessButtonsEditor();
            updateLivePreview();
        });
    }

    const addSuccessStepBtn = document.getElementById("btn-add-success-step");
    if (addSuccessStepBtn) {
        addSuccessStepBtn.addEventListener("click", () => {
            if (!activeForm) return;
            if (!activeForm.successSteps) activeForm.successSteps = [];
            activeForm.successSteps.push("Instruction detail...");
            renderSuccessStepsEditor();
            updateLivePreview();
        });
    }

    // Initialize Rich Text Editors for descriptions
    initRichTextEditors();

    // Bind Logout Button
    const logoutBtn = document.getElementById("btn-logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            try {
                const response = await fetch("/api/auth/logout", {
                    method: "POST"
                });
                if (response.ok) {
                    window.location.href = "/login";
                } else {
                    alert("Failed to log out");
                }
            } catch (err) {
                console.error("Logout error:", err);
                alert("Error logging out");
            }
        });
    }

    // Bind Page Addition
    const addPageBtn = document.getElementById("btn-add-page");
    if (addPageBtn) {
        addPageBtn.addEventListener("click", () => {
            totalPages += 1;
            activePage = totalPages;
            renderPagesTabs();
            renderQuestionsEditorList();
            updateLivePreview();
        });
    }

    // Setup sub tabs and mobile view toggles
    setupEditorSubTabs();
    setupMobileBuilderTabs();
    setupSidebarCollapsing();

    // Setup drag and drop toolbox listeners
    initDragAndDrop();
}

function initRichTextEditors() {
    document.querySelectorAll('.editor-toolbar').forEach(tb => {
        const targetId = tb.dataset.target;
        const editor = document.getElementById(targetId);
        if (!editor) return;

        tb.querySelectorAll('.editor-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const cmd = btn.dataset.command;
                if (cmd === 'createLink') {
                    const url = prompt("Enter link URL:");
                    if (url) {
                        let formattedUrl = url.trim();
                        if (!/^https?:\/\//i.test(formattedUrl)) {
                            formattedUrl = 'https://' + formattedUrl;
                        }
                        document.execCommand(cmd, false, formattedUrl);
                    }
                } else {
                    document.execCommand(cmd, false, null);
                }
                editor.focus();
                
                // Sync to activeForm and preview
                if (activeForm) {
                    if (targetId === 'form-desc-editor') {
                        activeForm.description = editor.innerHTML;
                    } else if (targetId === 'form-success-desc-editor') {
                        activeForm.successDescription = editor.innerHTML;
                    }
                    updateLivePreview();
                }
            });
        });

        editor.addEventListener('input', () => {
            if (activeForm) {
                if (targetId === 'form-desc-editor') {
                    activeForm.description = editor.innerHTML;
                } else if (targetId === 'form-success-desc-editor') {
                    activeForm.successDescription = editor.innerHTML;
                }
                updateLivePreview();
            }
        });

        // Prevent rich formatted text (like inline colors/fonts) from pasting, keep clean HTML
        editor.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = (e.originalEvent || e).clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
        });
    });
}


// =========================================================================
// TAB NAVIGATION
// =========================================================================
function setupTabNavigation() {
    const tabs = document.querySelectorAll(".tab-btn");
    tabs.forEach(tab => {
        tab.addEventListener("click", (e) => {
            const targetTab = e.currentTarget.dataset.tab;
            
            // Prevent entering builder or responses directly without a form
            if ((targetTab === "builder" || targetTab === "responses") && !activeForm) {
                alert("Please select or create a form first.");
                return;
            }
            
            switchTab(targetTab);
        });
    });

    // Handle browser back/forward buttons (hashchange event)
    window.addEventListener("hashchange", () => {
        const targetTab = window.location.hash.slice(1) || "forms";
        if (["forms", "builder", "responses"].includes(targetTab)) {
            if ((targetTab === "builder" || targetTab === "responses") && !activeForm) {
                window.location.hash = "#forms";
                return;
            }
            switchTab(targetTab);
        }
    });

    // Load initial tab based on URL hash
    const initialTab = window.location.hash.slice(1) || "forms";
    if (["forms", "builder", "responses"].includes(initialTab)) {
        if ((initialTab === "builder" || initialTab === "responses") && !activeForm) {
            window.location.hash = "#forms";
            switchTab("forms", true);
        } else {
            switchTab(initialTab, true);
        }
    } else {
        switchTab("forms", true);
    }
}

function switchTab(tabName, force = false) {
    const activeBtn = document.querySelector(".tab-btn.active");
    const currentActiveTab = activeBtn ? activeBtn.dataset.tab : "";
    if (currentActiveTab === tabName && !force) return;

    // Synchronize browser history hash
    if (window.location.hash !== `#${tabName}`) {
        window.location.hash = tabName;
    }

    // Update navigation styles
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.tab === tabName);
    });
    
    // Update view visibility
    document.querySelectorAll(".tab-content").forEach(content => {
        content.classList.toggle("active", content.id === `${tabName}-tab`);
    });

    // Toggle builder active height styling
    const cardContent = document.querySelector(".app-card-content");
    if (cardContent) {
        if (tabName === "builder") {
            cardContent.classList.add("builder-active-mode");
            document.body.classList.add("builder-mode-active");
        } else {
            cardContent.classList.remove("builder-active-mode");
            document.body.classList.remove("builder-mode-active");
        }
    }
    
    // Perform actions on tab enter
    if (tabName === "forms") {
        loadForms();
    } else if (tabName === "responses") {
        if (!activeForm || !activeForm.id) {
            const tbody = document.getElementById("responses-table-body");
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="100" style="text-align:center; padding: 48px; color:var(--text-color-muted);">No form selected. Go to <a href="#" onclick="switchTab('forms'); return false;" style="color:var(--primary-color); text-decoration:underline;">My Forms</a> to select a form.</td></tr>`;
            }
            const countEl = document.getElementById("total-responses-count");
            if (countEl) countEl.innerText = "0";
            const chartsContainer = document.getElementById("analytics-charts-container");
            if (chartsContainer) {
                chartsContainer.innerHTML = `<div style="text-align:center; padding:48px; color:var(--text-color-muted); grid-column:1/-1;">No form selected.</div>`;
            }
            // Disable Sheets controls in UI
            updateSheetsUIState();
            return;
        }
        loadResponses(activeForm.id);
    }
}

function setupEditorSubTabs() {
    const subTabs = document.querySelectorAll(".editor-tab-btn");
    subTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const target = tab.dataset.editorTab;
            
            // Toggle active states on buttons
            subTabs.forEach(t => t.classList.toggle("active", t.dataset.editorTab === target));
            
            // Toggle visibility of content wrappers
            document.querySelectorAll("[data-editor-tab-content]").forEach(content => {
                if (content.dataset.editorTabContent === target) {
                    content.style.display = "block";
                } else {
                    content.style.display = "none";
                }
            });
        });
    });
}

function setupMobileBuilderTabs() {
    const mobileTabs = document.querySelectorAll(".m-builder-tab-btn");
    const builderLayout = document.querySelector(".builder-layout");
    
    if (builderLayout) {
        // Default to Editor panel on mobile load
        builderLayout.classList.add("show-editor");
        mobileTabs.forEach(tab => {
            tab.classList.toggle("active", tab.dataset.mTab === "editor");
        });
    }
    
    mobileTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const target = tab.dataset.mTab;
            
            mobileTabs.forEach(t => t.classList.toggle("active", t.dataset.mTab === target));
            
            if (builderLayout) {
                builderLayout.classList.remove("show-toolbox", "show-editor", "show-preview");
                if (target === "toolbox") {
                    builderLayout.classList.add("show-toolbox");
                } else if (target === "editor") {
                    builderLayout.classList.add("show-editor");
                } else if (target === "preview") {
                    builderLayout.classList.add("show-preview");
                }
            }
        });
    });
}

function setupSidebarCollapsing() {
    const btnLeft = document.getElementById("btn-toggle-left-collapse");
    const btnRight = document.getElementById("btn-toggle-right-collapse");
    const layout = document.querySelector(".builder-layout");
    
    if (btnLeft && layout) {
        btnLeft.addEventListener("click", () => {
            layout.classList.toggle("left-collapsed");
        });
    }
    
    if (btnRight && layout) {
        btnRight.addEventListener("click", () => {
            layout.classList.toggle("right-collapsed");
        });
    }
}

// =========================================================================
// API SERVICES
// =========================================================================
async function loadForms() {
    const grid = document.getElementById("forms-grid-container");
    if (grid) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; color: var(--text-color-secondary);" class="animate-fade-in">
                <span class="btn-spinner spinner-dark" style="width: 32px; height: 32px; border-width: 3px; margin-bottom: 12px;"></span>
                <span style="font-family: 'Outfit'; font-weight: 500;">Loading your forms...</span>
            </div>
        `;
    }
    try {
        const response = await fetch("/api/forms");
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Server returned error: ${response.status} - ${errText}`);
        }
        formsList = await response.json();
        renderFormsGrid();
    } catch (err) {
        console.error("Error fetching forms:", err);
        renderFormsError(err.message);
    }
}

function renderFormsError(message) {
    const grid = document.getElementById("forms-grid-container");
    grid.innerHTML = `
        <div style="grid-column: 1/-1; background-color: #fde8e8; border: 1px solid #f8b4b4; padding: 24px; border-radius: var(--border-radius-md);" class="animate-fade-in">
            <h3 style="color:#c81e1e; font-family:'Outfit'; margin-bottom:8px; display:flex; align-items:center; gap:8px;">
                <span>⚠️</span> Database Connection Failure
            </h3>
            <p style="color:#9b1c1c; font-size:0.95rem; margin-bottom:12px;">
                The Prince Form server could not connect to your MongoDB database. Please verify your configurations.
            </p>
            <div style="background:#ffffff; padding:12px; border-radius:var(--border-radius-sm); font-family:monospace; font-size:0.8rem; border:1px solid #f3f4f6; color:#111827; max-height:120px; overflow-y:auto; word-break:break-all;">
                ${escapeHTML(message)}
            </div>
            <div style="color:#9b1c1c; font-size:0.85rem; margin-top:16px; line-height:1.6;">
                <strong>Troubleshooting Guide:</strong>
                <ol style="margin-left: 20px; margin-top: 4px;">
                    <li>Ensure you have edited the <code>.env</code> file in the project folder to add your MongoDB connection string.</li>
                    <li>Verify that you have replaced the placeholders <code>&lt;db_username&gt;</code> and <code>&lt;db_password&gt;</code> (including the <code>&lt;</code> and <code>&gt;</code> brackets) with your actual database user credentials.</li>
                    <li><strong>IP Whitelist:</strong> In MongoDB Atlas, verify that your current IP address is whitelisted under <strong>Network Access</strong>. (To test, you can add <code>0.0.0.0/0</code> which allows connection from anywhere).</li>
                </ol>
            </div>
        </div>
    `;
}

async function createNewForm() {
    const newForm = {
        title: "Untitled Form",
        description: "Form description",
        branding: {
            themeColor: "#673ab7",
            backgroundColor: "#f0ebf8",
            textColor: "#202124",
            buttonColor: "#673ab7",
            fontFamily: "Inter",
            logoUrl: "",
            bannerUrl: "",
            cardStyle: "elevated"
        },
        questions: [
            {
                id: generateRandomId(8),
                type: "text",
                label: "Untitled Question",
                required: false,
                placeholder: "Type your answer here",
                options: [],
                page: 1,
                order: 0,
                validations: []
            }
        ],
        acceptingResponses: true,
        confirmationMessage: "Your response has been recorded.",
        showSubmitAnother: true,
        customRedirectUrl: "",
        customRedirectLabel: "",
        successIcon: "checkmark",
        successLayout: "classic",
        successDescription: "",
        successButtons: [],
        successSteps: [],
        showSocialShare: false
    };

    activeForm = newForm;
    isEditing = false;
    setupBuilderWorkspace();
    switchTab("builder");
}

async function loadFormToEdit(formId, btn) {
    let originalHtml = "";
    if (btn) {
        btn.disabled = true;
        originalHtml = btn.innerHTML;
        btn.innerHTML = `<span class="btn-spinner"></span> Loading...`;
    }
    try {
        const response = await fetch(`/api/forms/${formId}`);
        if (!response.ok) throw new Error("Failed to load form definition");
        
        activeForm = await response.json();
        isEditing = true;
        
        setupBuilderWorkspace();
        switchTab("builder");
    } catch (err) {
        console.error(err);
        alert("Error loading form: " + err.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
        }
    }
}

async function saveActiveForm() {
    if (!activeForm) return;
    
    // Normalize and sort questions before saving
    normalizeQuestionsOrder();
    
    const saveBtn = document.getElementById("btn-save-form");
    const originalHtml = saveBtn.innerHTML;
    
    // Gather form-level data
    activeForm.title = document.getElementById("form-title-input").value;
    const descEditor = document.getElementById("form-desc-editor");
    activeForm.description = descEditor ? descEditor.innerHTML : "";
    activeForm.acceptingResponses = document.getElementById("form-accepting-input").checked;
    activeForm.confirmationMessage = document.getElementById("form-confirmation-input").value.trim() || "Your response has been recorded.";
    activeForm.showSubmitAnother = document.getElementById("form-submit-another-input").checked;
    activeForm.successLayout = document.getElementById("form-success-layout-select").value;
    activeForm.successIcon = document.getElementById("form-success-icon-select").value;
    const successDescEditor = document.getElementById("form-success-desc-editor");
    activeForm.successDescription = successDescEditor ? successDescEditor.innerHTML : "";
    activeForm.showSocialShare = document.getElementById("form-social-share-input").checked;
    activeForm.collectEmailAddresses = document.getElementById("setting-collect-emails").value;
    activeForm.sendResponseCopy = document.getElementById("setting-send-response-copy").value;
    activeForm.allowResponseEditing = document.getElementById("setting-allow-editing").checked;
    activeForm.limitToOneResponse = document.getElementById("setting-limit-one").checked;
    
    const method = isEditing ? "PUT" : "POST";
    const url = isEditing ? `/api/forms/${activeForm.id}` : "/api/forms";
    
    try {
        saveBtn.disabled = true;
        saveBtn.innerHTML = `<span class="btn-spinner"></span> Saving...`;
        
        const response = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(activeForm)
        });
        
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText || "Failed to save form configuration");
        }
        
        const savedForm = await response.json();
        activeForm = savedForm;
        isEditing = true;
        
        alert("Form saved successfully!");
        switchTab("forms");
    } catch (err) {
        console.error("Error saving form:", err);
        alert("Error saving form configuration: " + err.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalHtml;
    }
}

async function deleteForm(formId, btn) {
    if (!await showConfirm({
        title: "Delete Form",
        message: "Are you sure you want to delete this form and all its responses?\nThis action cannot be undone.",
        confirmText: "Delete Form",
        icon: "🗑️"
    })) return;
    
    let originalHtml = "";
    if (btn) {
        btn.disabled = true;
        originalHtml = btn.innerHTML;
        btn.innerHTML = `<span class="btn-spinner"></span>...`;
    }
    try {
        const response = await fetch(`/api/forms/${formId}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Delete request failed");
        
        if (activeForm && activeForm.id === formId) {
            activeForm = null;
        }
        
        await loadForms();
    } catch (err) {
        console.error(err);
        alert("Failed to delete form: " + err.message);
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
        }
    }
}

async function loadResponses(formId) {
    const tbody = document.getElementById("responses-table-body");
    const chartsContainer = document.getElementById("analytics-charts-container");
    const exportBtn = document.getElementById("menu-download-csv");
    
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="100" style="text-align:center; padding: 32px;"><span class="btn-spinner spinner-dark" style="width: 24px; height: 24px; border-width: 2.5px;"></span> Loading submissions...</td></tr>`;
    }
    if (chartsContainer) {
        chartsContainer.innerHTML = `<div style="text-align:center; padding:48px; color:var(--text-color-muted); grid-column: 1/-1;"><span class="btn-spinner spinner-dark" style="width: 28px; height: 28px; border-width: 2.5px; margin-bottom: 8px;"></span><br>Loading analytics breakdown...</div>`;
    }
    if (exportBtn) {
        exportBtn.disabled = true;
    }
    
    // Sync the sheets state for UI controls
    updateSheetsUIState();
    
    try {
        const response = await fetch(`/api/forms/${formId}/responses`);
        if (!response.ok) throw new Error("Failed to fetch form responses");
        activeFormResponses = await response.json();
        
        // Render statistics cards
        const countEl = document.getElementById("total-responses-count");
        if (countEl) countEl.innerText = activeFormResponses.length;
        
        renderResponsesTable();
        renderAnalyticsCharts();
    } catch (err) {
        console.error("Error loading responses:", err);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="100" style="text-align:center; padding: 24px; color:#c81e1e;">Failed to load submissions: ${escapeHTML(err.message)}</td></tr>`;
        }
        if (chartsContainer) {
            chartsContainer.innerHTML = `<div style="text-align:center; padding:24px; color:#c81e1e; grid-column: 1/-1;">Failed to load analytics: ${escapeHTML(err.message)}</div>`;
        }
    } finally {
        if (exportBtn) {
            exportBtn.disabled = false;
        }
    }
}

// =========================================================================
// RENDERERS
// =========================================================================
function renderFormsGrid() {
    const grid = document.getElementById("forms-grid-container");
    grid.innerHTML = "";
    
    // "Add New Form" Card
    const createCard = document.createElement("div");
    createCard.className = "create-card aura-glow-hover animate-fade-in";
    createCard.innerHTML = `
        <div class="create-card-icon">+</div>
        <div style="font-weight:600; font-family:'Outfit'">Blank Form</div>
        <div style="font-size:0.8rem; color:var(--text-color-secondary)">Start fresh builder</div>
    `;
    createCard.addEventListener("click", createNewForm);
    grid.appendChild(createCard);
    
    if (formsList.length === 0) {
        return;
    }
    
    formsList.forEach(form => {
        const card = document.createElement("div");
        card.className = "form-card aura-glow-hover animate-fade-in";
        card.style.setProperty("--card-theme-color", form.branding.themeColor);
        
        const cardUrl = `${window.location.origin}/form/${form.id}`;
        
        card.innerHTML = `
            <div class="form-card-header">
                <div class="form-card-title">${escapeHTML(form.title)}</div>
                <div class="form-card-desc">${escapeHTML(form.description || "No description")}</div>
            </div>
            <div>
                <div class="form-card-meta">
                    <span>${form.questions.length} questions</span>
                    <span>Created ${new Date(form.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="form-card-actions">
                    <button class="btn btn-secondary btn-edit" data-id="${form.id}">Edit</button>
                    <button class="btn btn-secondary btn-analytics" data-id="${form.id}">Data</button>
                    <button class="btn btn-primary btn-share" data-url="${cardUrl}">Share</button>
                    <button class="btn btn-danger btn-delete" data-id="${form.id}">Delete</button>
                </div>
            </div>
        `;
        
        // Attach card events
        card.querySelector(".btn-edit").addEventListener("click", (e) => loadFormToEdit(form.id, e.currentTarget));
        card.querySelector(".btn-share").addEventListener("click", () => openGoogleShareModal(form.id));
        card.querySelector(".btn-analytics").addEventListener("click", () => {
            activeForm = form;
            setupBuilderWorkspace(); // Prepare structures
            switchTab("responses");
        });
        card.querySelector(".btn-delete").addEventListener("click", (e) => deleteForm(form.id, e.currentTarget));
        
        grid.appendChild(card);
    });
}

// =========================================================================
// BUILDER LOGIC
// =========================================================================
function setupBuilderWorkspace() {
    // Normalize page and order for legacy compatibility
    activeForm.questions.forEach((q, idx) => {
        if (q.page === undefined || q.page === null) q.page = 1;
        if (q.order === undefined || q.order === null) q.order = idx;
    });
    
    activePage = 1;
    totalPages = activeForm.questions.reduce((max, q) => Math.max(max, q.page || 1), 1);
    
    renderPagesTabs();

    // Populate Title and description inputs
    document.getElementById("form-title-input").value = activeForm.title;
    const descEditor = document.getElementById("form-desc-editor");
    if (descEditor) {
        descEditor.innerHTML = activeForm.description || "";
    }
    
    // Load Advanced Settings inputs
    document.getElementById("form-accepting-input").checked = activeForm.acceptingResponses !== false;
    document.getElementById("form-confirmation-input").value = activeForm.confirmationMessage || "Your response has been recorded.";
    document.getElementById("form-submit-another-input").checked = activeForm.showSubmitAnother !== false;
    document.getElementById("form-success-layout-select").value = activeForm.successLayout || "classic";
    document.getElementById("form-success-icon-select").value = activeForm.successIcon || "checkmark";
    const successDescEditor = document.getElementById("form-success-desc-editor");
    if (successDescEditor) {
        successDescEditor.innerHTML = activeForm.successDescription || "";
    }
    document.getElementById("form-social-share-input").checked = activeForm.showSocialShare === true;
    document.getElementById("setting-collect-emails").value = activeForm.collectEmailAddresses || "do_not_collect";
    document.getElementById("setting-send-response-copy").value = activeForm.sendResponseCopy || "off";
    document.getElementById("setting-allow-editing").checked = activeForm.allowResponseEditing === true;
    document.getElementById("setting-limit-one").checked = activeForm.limitToOneResponse === true;

    // Initialize lists if undefined
    if (!activeForm.successButtons) activeForm.successButtons = [];
    if (!activeForm.successSteps) activeForm.successSteps = [];

    // Render CTA and Steps editors
    renderSuccessButtonsEditor();
    renderSuccessStepsEditor();
    
    // Toggle builder share button
    const builderShareBtn = document.getElementById("btn-share-builder");
    if (isEditing) {
        builderShareBtn.style.display = "inline-flex";
    } else {
        builderShareBtn.style.display = "none";
    }
    
    // Load Branding config inputs
    document.getElementById("theme-color-input").value = activeForm.branding.themeColor;
    document.getElementById("bg-color-input").value = activeForm.branding.backgroundColor;
    document.getElementById("text-color-input").value = activeForm.branding.textColor;
    document.getElementById("btn-color-input").value = activeForm.branding.buttonColor;
    document.getElementById("font-select").value = activeForm.branding.fontFamily;
    document.getElementById("logo-url-input").value = activeForm.branding.logoUrl || "";
    document.getElementById("banner-url-input").value = activeForm.branding.bannerUrl || "";
    document.getElementById("card-style-select").value = activeForm.branding.cardStyle || "elevated";
    
    renderQuestionsEditorList();
    updateLivePreview();
}

function renderSuccessButtonsEditor() {
    const container = document.getElementById("success-buttons-container");
    if (!container) return;
    container.innerHTML = "";
    
    if (!activeForm.successButtons) activeForm.successButtons = [];
    
    activeForm.successButtons.forEach((btn, idx) => {
        const row = document.createElement("div");
        row.className = "success-btn-editor-row";
        row.style = "display: flex; gap: 6px; align-items: center; margin-bottom: 6px;";
        row.innerHTML = `
            <input type="text" class="input-text btn-label-input" placeholder="Label" value="${escapeHTML(btn.label)}" style="flex: 1; font-size: 0.85rem; padding: 6px 8px;">
            <input type="text" class="input-text btn-url-input" placeholder="https://..." value="${escapeHTML(btn.url)}" style="flex: 2; font-size: 0.85rem; padding: 6px 8px;">
            <select class="q-type-select btn-style-select" style="font-size: 0.85rem; padding: 6px 8px; width: 100px; margin: 0; height: 32px;">
                <option value="primary" ${btn.style === 'primary' ? 'selected' : ''}>Solid</option>
                <option value="outline" ${btn.style === 'outline' ? 'selected' : ''}>Outline</option>
            </select>
            <button type="button" class="btn btn-secondary delete-btn-row" style="padding: 6px 10px; margin: 0; color: var(--error-color); border-color: rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.05); font-weight: bold; border-radius: 4px; cursor: pointer;">&times;</button>
        `;
        
        row.querySelector(".btn-label-input").addEventListener("input", (e) => {
            activeForm.successButtons[idx].label = e.target.value;
            updateLivePreview();
        });
        row.querySelector(".btn-url-input").addEventListener("input", (e) => {
            activeForm.successButtons[idx].url = e.target.value;
            updateLivePreview();
        });
        row.querySelector(".btn-style-select").addEventListener("change", (e) => {
            activeForm.successButtons[idx].style = e.target.value;
            updateLivePreview();
        });
        row.querySelector(".delete-btn-row").addEventListener("click", () => {
            activeForm.successButtons.splice(idx, 1);
            renderSuccessButtonsEditor();
            updateLivePreview();
        });
        
        container.appendChild(row);
    });
}

function renderSuccessStepsEditor() {
    const container = document.getElementById("success-steps-container");
    if (!container) return;
    container.innerHTML = "";
    
    if (!activeForm.successSteps) activeForm.successSteps = [];
    
    activeForm.successSteps.forEach((step, idx) => {
        const row = document.createElement("div");
        row.className = "success-step-editor-row";
        row.style = "display: flex; gap: 6px; align-items: center; margin-bottom: 6px;";
        row.innerHTML = `
            <span style="font-size: 0.85rem; font-weight: bold; color: var(--text-color-secondary); min-width: 50px;">Step ${idx + 1}:</span>
            <input type="text" class="input-text step-text-input" placeholder="Check email, Join Discord..." value="${escapeHTML(step)}" style="flex: 1; font-size: 0.85rem; padding: 6px 8px;">
            <button type="button" class="btn btn-secondary delete-step-row" style="padding: 6px 10px; margin: 0; color: var(--error-color); border-color: rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.05); font-weight: bold; border-radius: 4px; cursor: pointer;">&times;</button>
        `;
        
        row.querySelector(".step-text-input").addEventListener("input", (e) => {
            activeForm.successSteps[idx] = e.target.value;
            updateLivePreview();
        });
        
        row.querySelector(".delete-step-row").addEventListener("click", () => {
            activeForm.successSteps.splice(idx, 1);
            renderSuccessStepsEditor();
            updateLivePreview();
        });
        
        container.appendChild(row);
    });
}

function convertToCaseInsensitiveRegex(str) {
    let escaped = "";
    for (let i = 0; i < str.length; i++) {
        let char = str[i];
        if (/[a-zA-Z]/.test(char)) {
            escaped += `[${char.toLowerCase()}${char.toUpperCase()}]`;
        } else if (/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/.test(char)) {
            escaped += "\\" + char;
        } else {
            escaped += char;
        }
    }
    return escaped;
}

function compileValidationPattern(type, value) {
    if (type === "phone") {
        return "^(\\+91)?[0-9]{10}$";
    }
    if (type === "admission") {
        return "^(u25ev|U25EV)[a-zA-Z0-9-]{3,12}$";
    }
    if (type === "email") {
        return "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";
    }
    if (type === "starts_with") {
        if (!value) return "^.*$";
        return "^" + convertToCaseInsensitiveRegex(value) + ".*$";
    }
    if (type === "ends_with") {
        if (!value) return "^.*$";
        return "^.*" + convertToCaseInsensitiveRegex(value) + "$";
    }
    if (type === "length") {
        if (!value) return "^.*$";
        const parts = value.split(",");
        const min = parts[0] || "0";
        const max = parts[1] || "";
        return `^.{${min},${max}}$`;
    }
    return "";
}

function getDefaultErrorText(type, value) {
    if (type === "unique") {
        return "This value has already been submitted. Please enter a unique response.";
    }
    if (type === "phone") {
        return "Please enter a valid 10-digit mobile number, optionally starting with country code +91.";
    }
    if (type === "admission") {
        return "Admission number must start with U25EV (e.g. U25EV123456).";
    }
    if (type === "email") {
        return "Please enter a valid email address.";
    }
    if (type === "starts_with") {
        return value ? `Must start with "${value}" (case-insensitive).` : "Must start with the specified value.";
    }
    if (type === "ends_with") {
        return value ? `Must end with "${value}" (case-insensitive).` : "Must end with the specified value.";
    }
    if (type === "length") {
        if (!value) return "Invalid length.";
        const parts = value.split(",");
        const min = parts[0] || "0";
        const max = parts[1] || "";
        if (min && max) return `Must be between ${min} and ${max} characters long.`;
        if (min) return `Must be at least ${min} characters long.`;
        if (max) return `Must be at most ${max} characters long.`;
        return "Invalid length.";
    }
    return "Please check your response format.";
}

function renderQuestionsEditorList() {
    const list = document.getElementById("questions-editor-list");
    list.innerHTML = "";
    
    // Sort and filter questions for the current page
    const pageQuestions = activeForm.questions
        .filter(q => (q.page || 1) === activePage)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
        
    if (pageQuestions.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-color-muted);">No questions on this page. Drag elements from the left sidebar or click "+ Add Question Element" below.</div>`;
        return;
    }
    
    pageQuestions.forEach((question, pageIdx) => {
        const index = activeForm.questions.indexOf(question);
        
        const card = document.createElement("div");
        card.className = "question-edit-card aura-glow-hover animate-fade-in";
        card.dataset.index = index;
        card.dataset.id = question.id;
        card.setAttribute("draggable", "true");
        
        let optionsHtml = "";
        
        // Choices logic
        if (["radio", "checkbox", "select"].includes(question.type)) {
            let optionsRows = "";
            question.options.forEach((opt, optIndex) => {
                optionsRows += `
                    <div class="option-edit-row">
                        <span style="font-size:0.8rem">${optIndex + 1}.</span>
                        <input type="text" class="input-text option-val-input" style="padding:4px 8px; font-size:0.85rem;" value="${escapeHTML(opt)}" data-opt-idx="${optIndex}">
                        <button class="option-remove-btn" data-opt-idx="${optIndex}">&times;</button>
                    </div>
                `;
            });
            
            optionsHtml = `
                <div class="options-editor">
                    <span class="form-label" style="font-size:0.75rem;">Question Choices:</span>
                    ${optionsRows}
                    <button class="add-option-btn">+ Add Choice</button>
                </div>
            `;
        } else if (question.type === "file") {
            const allowedTypesList = [
                { id: 'document', label: 'Document' },
                { id: 'presentation', label: 'Presentation' },
                { id: 'spreadsheet', label: 'Spreadsheet' },
                { id: 'drawing', label: 'Drawing' },
                { id: 'pdf', label: 'PDF' },
                { id: 'image', label: 'Image' },
                { id: 'video', label: 'Video' },
                { id: 'audio', label: 'Audio' }
            ];

            optionsHtml = `
                <div class="file-upload-settings-editor" style="margin-top: 10px; margin-bottom: 12px; padding: 14px; background: var(--bg-color-secondary); border-radius: 8px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 12px;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-color);">Allow only specific file types</span>
                        <label class="q-toggle-switch">
                            <input type="checkbox" class="q-file-allowed-toggle" ${question.allowedFileTypesOnly ? "checked" : ""}>
                            <span class="q-toggle-slider"></span>
                        </label>
                    </div>
                    
                    <div class="q-file-types-grid" style="display: ${question.allowedFileTypesOnly ? 'grid' : 'none'}; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 8px; padding-top: 4px;">
                        ${allowedTypesList.map(ft => `
                            <label style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text-color-secondary); cursor: pointer;">
                                <input type="checkbox" class="q-file-type-check" value="${ft.id}" ${(question.allowedFileTypes || []).includes(ft.id) ? "checked" : ""}>
                                ${ft.label}
                            </label>
                        `).join('')}
                    </div>
                    
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                        <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-color);">Maximum number of files</span>
                        <select class="q-max-files-select" style="padding: 6px 10px; font-size: 0.85rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-color);">
                            <option value="1" ${(question.maxFiles || 1) == 1 ? "selected" : ""}>1</option>
                            <option value="5" ${(question.maxFiles || 1) == 5 ? "selected" : ""}>5</option>
                            <option value="10" ${(question.maxFiles || 1) == 10 ? "selected" : ""}>10</option>
                        </select>
                    </div>
                    
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                        <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-color);">Maximum file size</span>
                        <select class="q-max-file-size-select" style="padding: 6px 10px; font-size: 0.85rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-color);">
                            <option value="1MB" ${question.maxFileSize === "1MB" ? "selected" : ""}>1 MB</option>
                            <option value="5MB" ${question.maxFileSize === "5MB" ? "selected" : ""}>5 MB</option>
                            <option value="10MB" ${(question.maxFileSize || "10MB") === "10MB" ? "selected" : ""}>10 MB</option>
                            <option value="100MB" ${question.maxFileSize === "100MB" ? "selected" : ""}>100 MB</option>
                            <option value="1GB" ${question.maxFileSize === "1GB" ? "selected" : ""}>1 GB</option>
                        </select>
                    </div>
                    
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 6px; padding-top: 8px; border-top: 1px dashed var(--border-color); font-size: 0.75rem; color: var(--text-color-muted);">
                        <span style="display: flex; align-items: center; gap: 6px;">
                            <span>This form can accept up to 1 GB of files in <strong>Google Drive</strong>.</span>
                            <a href="https://drive.google.com" target="_blank" style="color: var(--primary-color); text-decoration: underline;">Change</a>
                        </span>
                        <a href="https://drive.google.com" target="_blank" style="display: flex; align-items: center; gap: 6px; color: #1a73e8; font-weight: 600; text-decoration: none; padding: 4px 8px; border-radius: 4px; background: rgba(26,115,232,0.06);" title="Open Google Drive Cloud Storage Folder">
                            <svg width="18" height="18" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.5l5.85 10.15z" fill="#ea4335"/>
                              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.45-1.2h-18.6c-1.55 0-3.1.4-4.45 1.2z" fill="#00832d"/>
                              <path d="m57.4 1.2-13.75 23.8 13.75 23.8h27.5c0-1.55-.4-3.1-1.2-4.5l-21.85-37.85c-.8-1.4-1.95-2.5-3.3-3.3z" fill="#ffba00"/>
                              <path d="m27.5 53-13.75 23.8c1.35.8 2.9 1.2 4.45 1.2h50.9c1.55 0 3.1-.4 4.45-1.2l-13.75-23.8z" fill="#2684fc"/>
                            </svg>
                            View folder
                        </a>
                    </div>
                </div>
            `;
        } else if (question.type === "rating") {
            const scaleVal = question.ratingScale || 5;
            const iconVal = question.ratingIcon || "star";
            const sym = getRatingSymbolChar(iconVal);

            optionsHtml = `
                <div class="rating-settings-editor" style="margin-top: 10px; margin-bottom: 12px; padding: 14px; background: var(--bg-color-secondary); border-radius: 8px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-color-secondary);">Scale:</label>
                            <select class="q-rating-scale-select" style="padding: 6px 12px; font-size: 0.85rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-color);">
                                ${[3, 4, 5, 6, 7, 8, 9, 10].map(n => `<option value="${n}" ${scaleVal === n ? "selected" : ""}>${n}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-color-secondary);">Icon:</label>
                            <select class="q-rating-icon-select" style="padding: 6px 12px; font-size: 0.85rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-color);">
                                <option value="star" ${iconVal === "star" ? "selected" : ""}>⭐ Star</option>
                                <option value="heart" ${iconVal === "heart" ? "selected" : ""}>❤️ Heart</option>
                                <option value="thumb" ${iconVal === "thumb" ? "selected" : ""}>👍 Thumb</option>
                                <option value="smile" ${iconVal === "smile" ? "selected" : ""}>😊 Smile</option>
                                <option value="circle" ${iconVal === "circle" ? "selected" : ""}>🔴 Circle</option>
                            </select>
                        </div>
                    </div>
                    
                    <div style="padding: 12px; background: var(--bg-color); border-radius: 6px; border: 1px dashed var(--border-color); display: flex; flex-direction: column; gap: 8px;">
                        <div style="font-size: 0.72rem; font-weight: 600; color: var(--text-color-secondary); text-transform: uppercase; letter-spacing: 0.5px;">Scale Preview</div>
                        <div style="display: flex; align-items: center; gap: 16px; justify-content: flex-start; overflow-x: auto; padding: 4px 0;">
                            ${Array.from({ length: scaleVal }, (_, i) => i + 1).map(num => `
                                <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 24px;">
                                    <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-color-secondary);">${num}</span>
                                    <span style="font-size: 1.4rem; color: #f59e0b;">${sym}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        
        // On-the-fly migration to new multiple validation schema
        if ((!question.validations || question.validations.length === 0) && question.validationType && question.validationType !== "none") {
            question.validations = [{
                type: question.validationType,
                value: question.validationValue || "",
                pattern: question.validationPattern || "",
                errorText: question.validationErrorText || "",
                hasCustomSettings: question.validationType === "custom" || (question.validationErrorText && question.validationErrorText !== getDefaultErrorText(question.validationType, question.validationValue || ""))
            }];
        }

        // Validation logic
        let validationHtml = "";
        if (["text", "paragraph", "number"].includes(question.type)) {
            const hasValidation = question.validations && question.validations.length > 0;
            
            let rulesListHtml = "";
            if (hasValidation) {
                question.validations.forEach((rule, ruleIndex) => {
                    const isLength = rule.type === "length";
                    const isStartsWith = rule.type === "starts_with";
                    const isEndsWith = rule.type === "ends_with";
                    const hasArgInput = isStartsWith || isEndsWith || isLength;
                    const showAdvanced = rule.type === "custom" || rule.hasCustomSettings;
                    
                    rulesListHtml += `
                        <div class="validation-rule-row" data-rule-idx="${ruleIndex}" style="background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px;">
                            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
                                <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 180px;">
                                    <span style="font-size: 0.75rem; font-weight: 600; color: var(--text-color-secondary);">Rule ${ruleIndex + 1}:</span>
                                    <select class="q-rule-type-select" data-rule-idx="${ruleIndex}" style="padding: 6px; font-size: 0.8rem; border-radius: 6px; border: 1px solid var(--border-color); outline: none; flex: 1; background: var(--bg-color-secondary); color: var(--text-color);">
                                        <option value="phone" ${rule.type === "phone" ? "selected" : ""}>Phone Number</option>
                                        <option value="admission" ${rule.type === "admission" ? "selected" : ""}>Admission Code</option>
                                        <option value="email" ${rule.type === "email" ? "selected" : ""}>Email Address</option>
                                        <option value="starts_with" ${rule.type === "starts_with" ? "selected" : ""}>Starts with...</option>
                                        <option value="ends_with" ${rule.type === "ends_with" ? "selected" : ""}>Ends with...</option>
                                        <option value="length" ${rule.type === "length" ? "selected" : ""}>Length between...</option>
                                        <option value="unique" ${rule.type === "unique" ? "selected" : ""}>Unique Answer (No Duplicates)</option>
                                        <option value="custom" ${rule.type === "custom" ? "selected" : ""}>Custom Regex Pattern</option>
                                    </select>
                                </div>
                                
                                <!-- Parameter argument inputs -->
                                <div class="q-rule-arg-group" style="display: ${hasArgInput ? 'block' : 'none'}; min-width: 140px; flex: 1;">
                                    ${isStartsWith ? `
                                        <input type="text" class="input-text q-rule-val-input" data-rule-idx="${ruleIndex}" style="padding: 6px; font-size: 0.8rem; border-radius: 6px; width: 100%;" value="${escapeHTML(rule.value || '')}" placeholder="e.g. U25EV">
                                    ` : ""}
                                    ${isEndsWith ? `
                                        <input type="text" class="input-text q-rule-val-input" data-rule-idx="${ruleIndex}" style="padding: 6px; font-size: 0.8rem; border-radius: 6px; width: 100%;" value="${escapeHTML(rule.value || '')}" placeholder="e.g. 2026">
                                    ` : ""}
                                    ${isLength ? `
                                        <div style="display: flex; gap: 6px; align-items: center; justify-content: flex-end;">
                                            <input type="number" class="input-text q-rule-min-input" data-rule-idx="${ruleIndex}" style="padding: 6px; font-size: 0.8rem; border-radius: 6px; width: 60px;" value="${(rule.value || '').split(',')[0] || ''}" placeholder="Min">
                                            <span style="font-size: 0.75rem;">to</span>
                                            <input type="number" class="input-text q-rule-max-input" data-rule-idx="${ruleIndex}" style="padding: 6px; font-size: 0.8rem; border-radius: 6px; width: 60px;" value="${(rule.value || '').split(',')[1] || ''}" placeholder="Max">
                                        </div>
                                    ` : ""}
                                </div>
                                
                                <button type="button" class="q-rule-delete-btn" data-rule-idx="${ruleIndex}" style="background: none; border: none; color: var(--error-color); cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center;" title="Remove Rule">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                </button>
                            </div>
                            
                            <!-- Advanced Toggle -->
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <input type="checkbox" class="q-rule-adv-check" id="q-rule-adv-${index}-${ruleIndex}" data-rule-idx="${ruleIndex}" ${showAdvanced ? "checked" : ""}>
                                <label for="q-rule-adv-${index}-${ruleIndex}" style="font-size: 0.7rem; color: var(--text-color-secondary); cursor: pointer; user-select: none;">Advanced: Customize pattern & error message</label>
                            </div>
                            
                            <!-- Advanced panel -->
                            <div class="q-rule-advanced-panel" style="display: ${showAdvanced ? 'flex' : 'none'}; flex-direction: column; gap: 6px; background: var(--bg-color-secondary); padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);">
                                <div style="display: flex; flex-direction: column; gap: 2px;">
                                    <label style="font-size: 0.65rem; font-weight: 600; color: var(--text-color-secondary);">Compiled Regex Pattern</label>
                                    <input type="text" class="input-text q-rule-pattern-input" data-rule-idx="${ruleIndex}" style="padding: 6px; font-size: 0.8rem; border-radius: 4px; width: 100%;" value="${escapeHTML(rule.pattern || '')}" ${rule.type !== "custom" ? "readonly style='background-color:var(--bg-color); cursor:not-allowed; opacity:0.8;'" : ""} placeholder="e.g. ^[0-9]{5}$">
                                </div>
                                <div style="display: flex; flex-direction: column; gap: 2px;">
                                    <label style="font-size: 0.65rem; font-weight: 600; color: var(--text-color-secondary);">Custom Error Message</label>
                                    <input type="text" class="input-text q-rule-error-input" data-rule-idx="${ruleIndex}" style="padding: 6px; font-size: 0.8rem; border-radius: 4px; width: 100%;" value="${escapeHTML(rule.errorText || '')}" placeholder="Please check your response format.">
                                </div>
                            </div>
                        </div>
                    `;
                });
            } else {
                rulesListHtml = `<div style="text-align:center; font-size:0.8rem; color:var(--text-color-muted); padding: 8px 0;">No validation rules added. Click "+ Add Validation Rule" below.</div>`;
            }
            
            validationHtml = `
                <div class="validation-editor" style="margin-top: 12px; border-top: 1px dashed var(--border-color); padding-top: 12px; display:${hasValidation ? 'flex' : 'none'}; flex-direction:column; gap:10px;">
                    <span class="form-label" style="font-size:0.75rem; font-weight: 600;">Validation Rules:</span>
                    
                    <div class="validation-rules-list-container" style="display: flex; flex-direction: column; gap: 4px;">
                        ${rulesListHtml}
                    </div>
                    
                    <button class="add-validation-rule-btn btn-secondary" style="align-self: flex-start; font-size: 0.75rem; padding: 4px 8px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px; background: var(--bg-color-secondary); color: var(--theme-color); border: 1px solid var(--border-color);" type="button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Add Validation Rule
                    </button>
                </div>
            `;
        }
        
        card.innerHTML = `
            <!-- Top Center Drag Handle -->
            <div class="q-card-drag-handle-center" title="Drag to reorder card">
                <div class="q-drag-dots-grid">
                    <div class="q-drag-dot"></div>
                    <div class="q-drag-dot"></div>
                    <div class="q-drag-dot"></div>
                    <div class="q-drag-dot"></div>
                    <div class="q-drag-dot"></div>
                    <div class="q-drag-dot"></div>
                </div>
            </div>

            <div class="q-reorder-strip">
                <div class="q-reorder-strip-left">
                    <span class="q-number-badge">${question.type === "header" ? "Header Element" : `Question ${pageIdx + 1}`}</span>
                </div>
                <div class="q-reorder-actions">
                    <button class="q-reorder-btn q-move-up-btn" title="Move Up" type="button" ${pageIdx === 0 ? "disabled" : ""}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                    </button>
                    <button class="q-reorder-btn q-move-down-btn" title="Move Down" type="button" ${pageIdx === pageQuestions.length - 1 ? "disabled" : ""}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                </div>
            </div>
            
            <div class="q-header-row">
                <div class="form-group q-label-input">
                    <label class="form-label">${question.type === "header" ? "Header Text" : "Question Label"}</label>
                    <input type="text" class="input-text q-label-input-field" value="${escapeHTML(question.label)}">
                </div>
                <div class="form-group">
                    <label class="form-label">Type</label>
                    <select class="q-type-select">
                        <option value="text" ${question.type === "text" ? "selected" : ""}>Short Text</option>
                        <option value="paragraph" ${question.type === "paragraph" ? "selected" : ""}>Paragraph</option>
                        <option value="number" ${question.type === "number" ? "selected" : ""}>Number</option>
                        <option value="radio" ${question.type === "radio" ? "selected" : ""}>Multiple Choice</option>
                        <option value="checkbox" ${question.type === "checkbox" ? "selected" : ""}>Checkboxes</option>
                        <option value="select" ${question.type === "select" ? "selected" : ""}>Dropdown</option>
                        <option value="date" ${question.type === "date" ? "selected" : ""}>Date</option>
                        <option value="rating" ${question.type === "rating" ? "selected" : ""}>⭐ Rating</option>
                        <option value="header" ${question.type === "header" ? "selected" : ""}>Header / Section Title</option>
                        <option value="file" ${question.type === "file" ? "selected" : ""}>File Upload</option>
                    </select>
                </div>
            </div>
            
            ${["text", "paragraph", "number", "header"].includes(question.type) ? `
            <div class="q-placeholder-row" style="margin-bottom: 12px; margin-top: -4px;">
                <div class="form-group">
                    <label class="form-label" style="font-size:0.75rem;">${question.type === "header" ? "Subtitle / Description" : "Placeholder Text"}</label>
                    <input type="text" class="input-text q-placeholder-input-field" style="padding: 6px 12px; font-size: 0.85rem;" value="${escapeHTML(question.placeholder || '')}" placeholder="${question.type === "header" ? "e.g. Please fill out details below" : "e.g. Enter your answer here"}">
                </div>
            </div>
            ` : ""}
            
            ${optionsHtml}
            ${validationHtml}
            
            <div class="q-footer-row" style="display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:12px;">
                    ${question.type !== "header" ? `
                    <button class="q-required-toggle-btn icon-btn" title="Toggle Required Field" type="button">
                        ${question.required ? 
                          `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 20px; height: 20px; color: var(--primary-color); display:block;"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>` : 
                          `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 20px; height: 20px; color: var(--text-color-muted); display:block;"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>`
                        }
                    </button>
                    ` : ""}
                    ${["text", "paragraph", "number"].includes(question.type) ? `
                    <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:0.8rem; color:var(--text-color-secondary);">
                        <input type="checkbox" class="q-val-opt-check" ${(question.validations && question.validations.length > 0) ? "checked" : ""}> Response Validation
                    </label>
                    ` : ""}
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <button class="q-duplicate-btn icon-btn" title="Duplicate Card" type="button">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 20px; height: 20px; display:block;">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                    <button class="q-delete-btn icon-btn" title="Delete Card" type="button">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 20px; height: 20px; display:block;">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2-2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        // Card activation highlight on click
        card.addEventListener("click", (e) => {
            if (["INPUT", "SELECT", "BUTTON", "LABEL", "OPTION", "TEXTAREA"].includes(e.target.tagName)) return;
            document.querySelectorAll(".question-edit-card").forEach(c => c.classList.remove("active"));
            card.classList.add("active");
        });
        
        // Drag events for cards inside rendering
        card.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", "reorder-element");
            e.dataTransfer.setData("card-id", question.id);
            e.dataTransfer.effectAllowed = "move";
            setTimeout(() => {
                card.style.opacity = "0.4";
            }, 0);
        });
        
        card.addEventListener("dragend", () => {
            card.style.opacity = "";
            removeDragPlaceholders();
            const canvas = document.getElementById("questions-editor-list");
            if (canvas) canvas.classList.remove("drag-over-active");
        });
        
        // Listeners for Question fields
        card.querySelector(".q-label-input-field").addEventListener("input", (e) => {
            activeForm.questions[index].label = e.target.value;
            updateLivePreview();
        });
        
        const placeholderInp = card.querySelector(".q-placeholder-input-field");
        if (placeholderInp) {
            placeholderInp.addEventListener("input", (e) => {
                activeForm.questions[index].placeholder = e.target.value;
                updateLivePreview();
            });
        }
        
        card.querySelector(".q-type-select").addEventListener("change", (e) => {
            const newType = e.target.value;
            activeForm.questions[index].type = newType;
            if (["radio", "checkbox", "select"].includes(newType) && (!activeForm.questions[index].options || activeForm.questions[index].options.length === 0)) {
                activeForm.questions[index].options = ["Option 1", "Option 2"];
            }
            renderQuestionsEditorList();
            updateLivePreview();
        });
        
        // Listeners for File Upload Settings
        const fileAllowedToggle = card.querySelector(".q-file-allowed-toggle");
        if (fileAllowedToggle) {
            fileAllowedToggle.addEventListener("change", (e) => {
                activeForm.questions[index].allowedFileTypesOnly = e.target.checked;
                const grid = card.querySelector(".q-file-types-grid");
                if (grid) grid.style.display = e.target.checked ? "grid" : "none";
                updateLivePreview();
            });
        }
        
        card.querySelectorAll(".q-file-type-check").forEach(cb => {
            cb.addEventListener("change", () => {
                const checkedTypes = [];
                card.querySelectorAll(".q-file-type-check:checked").forEach(c => checkedTypes.push(c.value));
                activeForm.questions[index].allowedFileTypes = checkedTypes;
                updateLivePreview();
            });
        });
        
        const maxFilesSelect = card.querySelector(".q-max-files-select");
        if (maxFilesSelect) {
            maxFilesSelect.addEventListener("change", (e) => {
                activeForm.questions[index].maxFiles = parseInt(e.target.value);
                updateLivePreview();
            });
        }
        
        const maxFileSizeSelect = card.querySelector(".q-max-file-size-select");
        if (maxFileSizeSelect) {
            maxFileSizeSelect.addEventListener("change", (e) => {
                activeForm.questions[index].maxFileSize = e.target.value;
                updateLivePreview();
            });
        }

        // Listeners for Rating Settings
        const ratingScaleSelect = card.querySelector(".q-rating-scale-select");
        if (ratingScaleSelect) {
            ratingScaleSelect.addEventListener("change", (e) => {
                activeForm.questions[index].ratingScale = parseInt(e.target.value);
                renderQuestionsEditorList();
                updateLivePreview();
            });
        }
        
        const ratingIconSelect = card.querySelector(".q-rating-icon-select");
        if (ratingIconSelect) {
            ratingIconSelect.addEventListener("change", (e) => {
                activeForm.questions[index].ratingIcon = e.target.value;
                renderQuestionsEditorList();
                updateLivePreview();
            });
        }

        
        const reqToggle = card.querySelector(".q-required-toggle-btn");
        if (reqToggle) {
            reqToggle.addEventListener("click", (e) => {
                e.stopPropagation();
                activeForm.questions[index].required = !activeForm.questions[index].required;
                renderQuestionsEditorList();
                updateLivePreview();
            });
        }
        
        const dupBtn = card.querySelector(".q-duplicate-btn");
        if (dupBtn) {
            dupBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                duplicateQuestion(index);
            });
        }
        
        card.querySelector(".q-delete-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            activeForm.questions.splice(index, 1);
            normalizeQuestionsOrder();
            renderQuestionsEditorList();
            updateLivePreview();
        });
 
        // Up / Down reordering buttons listeners
        const moveUpBtn = card.querySelector(".q-move-up-btn");
        if (moveUpBtn && pageIdx > 0) {
            moveUpBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (window.isSwapping) return;
                window.isSwapping = true;
                
                const editorList = document.getElementById("questions-editor-list");
                const cards = editorList.querySelectorAll(".question-edit-card");
                const targetCard = cards[pageIdx];
                const siblingCard = cards[pageIdx - 1];
                
                if (targetCard && siblingCard) {
                    const targetRect = targetCard.getBoundingClientRect();
                    const siblingRect = siblingCard.getBoundingClientRect();
                    const targetOffset = siblingRect.top - targetRect.top;
                    const siblingOffset = targetRect.top - siblingRect.top;
                    
                    targetCard.classList.add("q-swapping");
                    siblingCard.classList.add("q-swapping");
                    
                    targetCard.style.transition = 'transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.24s ease, box-shadow 0.24s ease';
                    siblingCard.style.transition = 'transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.24s ease, box-shadow 0.24s ease';
                    
                    targetCard.style.transform = `translateY(${targetOffset}px) scale(0.97) rotate(-2deg)`;
                    targetCard.style.boxShadow = '0 20px 32px -6px rgba(99, 102, 241, 0.2), 0 0 0 1px rgba(99, 102, 241, 0.1)';
                    targetCard.style.opacity = '0.85';
                    siblingCard.style.transform = `translateY(${siblingOffset}px) scale(0.97) rotate(2deg)`;
                    siblingCard.style.boxShadow = '0 20px 32px -6px rgba(99, 102, 241, 0.2), 0 0 0 1px rgba(99, 102, 241, 0.1)';
                    siblingCard.style.opacity = '0.85';
                    
                    setTimeout(() => {
                        targetCard.style.transition = '';
                        targetCard.style.transform = '';
                        targetCard.style.opacity = '';
                        targetCard.style.boxShadow = '';
                        siblingCard.style.transition = '';
                        siblingCard.style.transform = '';
                        siblingCard.style.opacity = '';
                        siblingCard.style.boxShadow = '';
                        
                        targetCard.classList.remove("q-swapping");
                        siblingCard.classList.remove("q-swapping");
                        
                        const temp = pageQuestions[pageIdx];
                        pageQuestions[pageIdx] = pageQuestions[pageIdx - 1];
                        pageQuestions[pageIdx - 1] = temp;
                        
                        pageQuestions.forEach((q, idx) => {
                            q.order = idx;
                        });
                        
                        normalizeQuestionsOrder();
                        renderQuestionsEditorList();
                        updateLivePreview();
                        
                        const newCards = document.getElementById("questions-editor-list").querySelectorAll(".question-edit-card");
                        const swappedCard = newCards[pageIdx - 1];
                        if (swappedCard) {
                            swappedCard.classList.add("active");
                            swappedCard.classList.add("q-swap-pulse");
                            setTimeout(() => {
                                swappedCard.classList.remove("q-swap-pulse");
                            }, 500);
                        }
                        
                        window.isSwapping = false;
                    }, 240);
                } else {
                    window.isSwapping = false;
                }
            });
        }
        
        const moveDownBtn = card.querySelector(".q-move-down-btn");
        if (moveDownBtn && pageIdx < pageQuestions.length - 1) {
            moveDownBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (window.isSwapping) return;
                window.isSwapping = true;
                
                const editorList = document.getElementById("questions-editor-list");
                const cards = editorList.querySelectorAll(".question-edit-card");
                const targetCard = cards[pageIdx];
                const siblingCard = cards[pageIdx + 1];
                
                if (targetCard && siblingCard) {
                    const targetRect = targetCard.getBoundingClientRect();
                    const siblingRect = siblingCard.getBoundingClientRect();
                    const targetOffset = siblingRect.top - targetRect.top;
                    const siblingOffset = targetRect.top - siblingRect.top;
                    
                    targetCard.classList.add("q-swapping");
                    siblingCard.classList.add("q-swapping");
                    
                    targetCard.style.transition = 'transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.24s ease, box-shadow 0.24s ease';
                    siblingCard.style.transition = 'transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.24s ease, box-shadow 0.24s ease';
                    
                    targetCard.style.transform = `translateY(${targetOffset}px) scale(0.97) rotate(2deg)`;
                    targetCard.style.boxShadow = '0 20px 32px -6px rgba(99, 102, 241, 0.2), 0 0 0 1px rgba(99, 102, 241, 0.1)';
                    targetCard.style.opacity = '0.85';
                    siblingCard.style.transform = `translateY(${siblingOffset}px) scale(0.97) rotate(-2deg)`;
                    siblingCard.style.boxShadow = '0 20px 32px -6px rgba(99, 102, 241, 0.2), 0 0 0 1px rgba(99, 102, 241, 0.1)';
                    siblingCard.style.opacity = '0.85';
                    
                    setTimeout(() => {
                        targetCard.style.transition = '';
                        targetCard.style.transform = '';
                        targetCard.style.opacity = '';
                        targetCard.style.boxShadow = '';
                        siblingCard.style.transition = '';
                        siblingCard.style.transform = '';
                        siblingCard.style.opacity = '';
                        siblingCard.style.boxShadow = '';
                        
                        targetCard.classList.remove("q-swapping");
                        siblingCard.classList.remove("q-swapping");
                        
                        const temp = pageQuestions[pageIdx];
                        pageQuestions[pageIdx] = pageQuestions[pageIdx + 1];
                        pageQuestions[pageIdx + 1] = temp;
                        
                        pageQuestions.forEach((q, idx) => {
                            q.order = idx;
                        });
                        
                        normalizeQuestionsOrder();
                        renderQuestionsEditorList();
                        updateLivePreview();
                        
                        const newCards = document.getElementById("questions-editor-list").querySelectorAll(".question-edit-card");
                        const swappedCard = newCards[pageIdx + 1];
                        if (swappedCard) {
                            swappedCard.classList.add("active");
                            swappedCard.classList.add("q-swap-pulse");
                            setTimeout(() => {
                                swappedCard.classList.remove("q-swap-pulse");
                            }, 500);
                        }
                        
                        window.isSwapping = false;
                    }, 240);
                } else {
                    window.isSwapping = false;
                }
            });
        }
        
        // Attach Option event listeners if visible
        if (["radio", "checkbox", "select"].includes(question.type)) {
            card.querySelectorAll(".option-val-input").forEach(optInp => {
                optInp.addEventListener("input", (e) => {
                    const optIdx = parseInt(e.target.dataset.optIdx);
                    activeForm.questions[index].options[optIdx] = e.target.value;
                    updateLivePreview();
                });
            });
            
            card.querySelectorAll(".option-remove-btn").forEach(remBtn => {
                remBtn.addEventListener("click", (e) => {
                    const optIdx = parseInt(e.target.dataset.optIdx);
                    activeForm.questions[index].options.splice(optIdx, 1);
                    renderQuestionsEditorList();
                    updateLivePreview();
                });
            });
            
            card.querySelector(".add-option-btn").addEventListener("click", () => {
                const totalOptions = activeForm.questions[index].options.length;
                activeForm.questions[index].options.push(`Option ${totalOptions + 1}`);
                renderQuestionsEditorList();
                updateLivePreview();
            });
        }
        
        // Bind validation events if text/paragraph/number
        if (["text", "paragraph", "number"].includes(question.type)) {
            const hasValidation = question.validations && question.validations.length > 0;
            
            const valOptCheck = card.querySelector(".q-val-opt-check");
            if (valOptCheck) {
                valOptCheck.addEventListener("change", (e) => {
                    if (e.target.checked) {
                        activeForm.questions[index].validations = [{
                            type: "phone",
                            value: "",
                            pattern: compileValidationPattern("phone", ""),
                            errorText: getDefaultErrorText("phone", ""),
                            hasCustomSettings: false
                        }];
                        activeForm.questions[index].validationType = "phone";
                        activeForm.questions[index].validationValue = "";
                        activeForm.questions[index].validationPattern = compileValidationPattern("phone", "");
                        activeForm.questions[index].validationErrorText = getDefaultErrorText("phone", "");
                    } else {
                        activeForm.questions[index].validations = [];
                        activeForm.questions[index].validationType = "none";
                        activeForm.questions[index].validationValue = "";
                        activeForm.questions[index].validationPattern = "";
                        activeForm.questions[index].validationErrorText = "";
                    }
                    renderQuestionsEditorList();
                    updateLivePreview();
                });
            }
            
            if (hasValidation) {
                const addRuleBtn = card.querySelector(".add-validation-rule-btn");
                if (addRuleBtn) {
                    addRuleBtn.addEventListener("click", () => {
                        activeForm.questions[index].validations.push({
                            type: "phone",
                            value: "",
                            pattern: compileValidationPattern("phone", ""),
                            errorText: getDefaultErrorText("phone", ""),
                            hasCustomSettings: false
                        });
                        const first = activeForm.questions[index].validations[0];
                        activeForm.questions[index].validationType = first.type;
                        activeForm.questions[index].validationValue = first.value;
                        activeForm.questions[index].validationPattern = first.pattern;
                        activeForm.questions[index].validationErrorText = first.errorText;

                        renderQuestionsEditorList();
                        updateLivePreview();
                    });
                }
                
                card.querySelectorAll(".q-rule-type-select").forEach(sel => {
                    sel.addEventListener("change", (e) => {
                        const ruleIdx = parseInt(e.target.dataset.ruleIdx);
                        const type = e.target.value;
                        const rule = activeForm.questions[index].validations[ruleIdx];
                        if (rule) {
                            rule.type = type;
                            let defaultValue = "";
                            if (type === "length") {
                                defaultValue = "5,10";
                            }
                            rule.value = defaultValue;
                            rule.pattern = compileValidationPattern(type, defaultValue);
                            rule.errorText = getDefaultErrorText(type, defaultValue);
                            rule.hasCustomSettings = false;
                            
                            if (ruleIdx === 0) {
                                activeForm.questions[index].validationType = rule.type;
                                activeForm.questions[index].validationValue = rule.value;
                                activeForm.questions[index].validationPattern = rule.pattern;
                                activeForm.questions[index].validationErrorText = rule.errorText;
                            }
                            
                            renderQuestionsEditorList();
                            updateLivePreview();
                        }
                    });
                });
                
                card.querySelectorAll(".q-rule-delete-btn").forEach(btn => {
                    btn.addEventListener("click", (e) => {
                        const btnEl = e.target.closest(".q-rule-delete-btn");
                        const ruleIdx = parseInt(btnEl.dataset.ruleIdx);
                        activeForm.questions[index].validations.splice(ruleIdx, 1);
                        
                        if (activeForm.questions[index].validations.length > 0) {
                            const first = activeForm.questions[index].validations[0];
                            activeForm.questions[index].validationType = first.type;
                            activeForm.questions[index].validationValue = first.value;
                            activeForm.questions[index].validationPattern = first.pattern;
                            activeForm.questions[index].validationErrorText = first.errorText;
                        } else {
                            activeForm.questions[index].validationType = "none";
                            activeForm.questions[index].validationValue = "";
                            activeForm.questions[index].validationPattern = "";
                            activeForm.questions[index].validationErrorText = "";
                        }
                        
                        renderQuestionsEditorList();
                        updateLivePreview();
                    });
                });
                
                card.querySelectorAll(".q-rule-adv-check").forEach(chk => {
                    chk.addEventListener("change", (e) => {
                        const ruleIdx = parseInt(chk.dataset.ruleIdx);
                        const rule = activeForm.questions[index].validations[ruleIdx];
                        if (rule) {
                            rule.hasCustomSettings = e.target.checked;
                            if (!e.target.checked) {
                                if (rule.type !== "custom") {
                                    const standardPattern = compileValidationPattern(rule.type, rule.value || "");
                                    const standardError = getDefaultErrorText(rule.type, rule.value || "");
                                    rule.pattern = standardPattern;
                                    rule.errorText = standardError;
                                    
                                    if (ruleIdx === 0) {
                                        activeForm.questions[index].validationPattern = rule.pattern;
                                        activeForm.questions[index].validationErrorText = rule.errorText;
                                    }
                                }
                            }
                            renderQuestionsEditorList();
                            updateLivePreview();
                        }
                    });
                });
                
                card.querySelectorAll(".q-rule-val-input").forEach(inp => {
                    inp.addEventListener("input", (e) => {
                        const ruleIdx = parseInt(e.target.dataset.ruleIdx);
                        const rule = activeForm.questions[index].validations[ruleIdx];
                        if (rule) {
                            rule.value = e.target.value;
                            
                            if (rule.type !== "custom" && !rule.hasCustomSettings) {
                                rule.pattern = compileValidationPattern(rule.type, rule.value);
                                rule.errorText = getDefaultErrorText(rule.type, rule.value);
                            }
                            
                            if (ruleIdx === 0) {
                                activeForm.questions[index].validationValue = rule.value;
                                activeForm.questions[index].validationPattern = rule.pattern;
                                activeForm.questions[index].validationErrorText = rule.errorText;
                            }
                            
                            const ruleCard = inp.closest(".validation-rule-row");
                            const patternInp = ruleCard.querySelector(".q-rule-pattern-input");
                            const errorInp = ruleCard.querySelector(".q-rule-error-input");
                            if (patternInp) patternInp.value = rule.pattern;
                            if (errorInp) errorInp.value = rule.errorText;
                            
                            updateLivePreview();
                        }
                    });
                });
                
                card.querySelectorAll(".q-rule-min-input, .q-rule-max-input").forEach(inp => {
                    inp.addEventListener("input", (e) => {
                        const ruleIdx = parseInt(e.target.dataset.ruleIdx);
                        const rule = activeForm.questions[index].validations[ruleIdx];
                        if (rule) {
                            const ruleCard = inp.closest(".validation-rule-row");
                            const minVal = ruleCard.querySelector(".q-rule-min-input").value;
                            const maxVal = ruleCard.querySelector(".q-rule-max-input").value;
                            rule.value = `${minVal},${maxVal}`;
                            
                            if (rule.type !== "custom" && !rule.hasCustomSettings) {
                                rule.pattern = compileValidationPattern(rule.type, rule.value);
                                rule.errorText = getDefaultErrorText(rule.type, rule.value);
                            }
                            
                            if (ruleIdx === 0) {
                                activeForm.questions[index].validationValue = rule.value;
                                activeForm.questions[index].validationPattern = rule.pattern;
                                activeForm.questions[index].validationErrorText = rule.errorText;
                            }
                            
                            const patternInp = ruleCard.querySelector(".q-rule-pattern-input");
                            const errorInp = ruleCard.querySelector(".q-rule-error-input");
                            if (patternInp) patternInp.value = rule.pattern;
                            if (errorInp) errorInp.value = rule.errorText;
                            
                            updateLivePreview();
                        }
                    });
                });
                
                card.querySelectorAll(".q-rule-pattern-input").forEach(inp => {
                    inp.addEventListener("input", (e) => {
                        const ruleIdx = parseInt(e.target.dataset.ruleIdx);
                        const rule = activeForm.questions[index].validations[ruleIdx];
                        if (rule && (rule.type === "custom" || rule.hasCustomSettings)) {
                            rule.pattern = e.target.value;
                            if (ruleIdx === 0) {
                                activeForm.questions[index].validationPattern = rule.pattern;
                            }
                            updateLivePreview();
                        }
                    });
                });
                
                card.querySelectorAll(".q-rule-error-input").forEach(inp => {
                    inp.addEventListener("input", (e) => {
                        const ruleIdx = parseInt(e.target.dataset.ruleIdx);
                        const rule = activeForm.questions[index].validations[ruleIdx];
                        if (rule) {
                            rule.errorText = e.target.value;
                            if (ruleIdx === 0) {
                                activeForm.questions[index].validationErrorText = rule.errorText;
                            }
                            updateLivePreview();
                        }
                    });
                });
            }
        }
        
        list.appendChild(card);
    });
}

function addQuestion(type = "text", label = "New Question") {
    if (!activeForm) return;
    
    // If first arg is an Event object, default to 'text'
    if (type instanceof Event || (type && typeof type === "object" && type.type)) {
        type = "text";
        label = "New Question";
    }
    
    // Find the highest order on the active page
    const samePageQuestions = activeForm.questions.filter(q => (q.page || 1) === activePage);
    const maxOrder = samePageQuestions.reduce((max, q) => Math.max(max, q.order || 0), -1);
    const newOrder = maxOrder + 1;
    
    const newQuestion = {
        id: generateRandomId(8),
        type: type,
        label: label,
        required: false,
        placeholder: ["text", "paragraph", "number", "header"].includes(type) ? "Type subtitle or placeholder here" : "",
        options: ["radio", "checkbox", "select"].includes(type) ? ["Option 1", "Option 2"] : [],
        page: activePage,
        order: newOrder,
        validations: [],
        allowedFileTypesOnly: false,
        allowedFileTypes: [],
        maxFiles: 1,
        maxFileSize: "10MB",
        ratingScale: 5,
        ratingIcon: "star"
    };
    
    activeForm.questions.push(newQuestion);
    
    renderQuestionsEditorList();
    updateLivePreview();
    
    // Scroll editor to bottom
    const container = document.getElementById("questions-editor-list");
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
}

// =========================================================================
// BRANDING CONFIG CONTROLS
// =========================================================================
function setupBrandingListeners() {
    const inputs = [
        "theme-color-input", "bg-color-input", "text-color-input", 
        "btn-color-input", "font-select", "logo-url-input", 
        "banner-url-input", "card-style-select"
    ];
    
    inputs.forEach(id => {
        const elem = document.getElementById(id);
        if (elem) {
            elem.addEventListener("input", (e) => {
                updateBrandingState();
            });
            
            if (elem.tagName === "SELECT") {
                elem.addEventListener("change", (e) => {
                    updateBrandingState();
                });
            }
        }
    });

    const handleImageUpload = async (fileInp, textInp) => {
        const file = fileInp.files[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
            alert("Image size must be less than 5MB");
            fileInp.value = "";
            return;
        }
        
        const parentLabel = fileInp.closest("label");
        const textNode = Array.from(parentLabel.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
        
        try {
            if (textNode) textNode.nodeValue = "Uploading... ";
            
            const formData = new FormData();
            formData.append("file", file);
            
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData
            });
            
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.detail || "Upload failed");
            }
            
            textInp.value = data.url;
            updateBrandingState();
            if (textNode) textNode.nodeValue = "Upload ";
            fileInp.value = "";
            
        } catch (err) {
            console.error("Image upload error:", err);
            alert("Error uploading file: " + err.message);
            if (textNode) textNode.nodeValue = "Upload ";
            fileInp.value = "";
        }
    };

    const logoFileInp = document.getElementById("logo-file-input");
    const logoUrlInp = document.getElementById("logo-url-input");
    if (logoFileInp && logoUrlInp) {
        logoFileInp.addEventListener("change", () => handleImageUpload(logoFileInp, logoUrlInp));
    }

    const bannerFileInp = document.getElementById("banner-file-input");
    const bannerUrlInp = document.getElementById("banner-url-input");
    if (bannerFileInp && bannerUrlInp) {
        bannerFileInp.addEventListener("change", () => handleImageUpload(bannerFileInp, bannerUrlInp));
    }
}

function setupColorPresets() {
    const container = document.getElementById("theme-presets-container");
    container.innerHTML = "";
    
    PRESET_COLORS.forEach(color => {
        const dot = document.createElement("div");
        dot.className = "color-dot";
        dot.style.backgroundColor = color;
        dot.addEventListener("click", () => {
            document.getElementById("theme-color-input").value = color;
            document.getElementById("btn-color-input").value = color;
            updateBrandingState();
        });
        container.appendChild(dot);
    });
}

function updateBrandingState() {
    if (!activeForm) return;
    
    activeForm.branding = {
        themeColor: document.getElementById("theme-color-input").value,
        backgroundColor: document.getElementById("bg-color-input").value,
        textColor: document.getElementById("text-color-input").value,
        buttonColor: document.getElementById("btn-color-input").value,
        fontFamily: document.getElementById("font-select").value,
        logoUrl: document.getElementById("logo-url-input").value.trim(),
        bannerUrl: document.getElementById("banner-url-input").value.trim(),
        cardStyle: document.getElementById("card-style-select").value
    };
    
    updateLivePreview();
}

// =========================================================================
// LIVE PREVIEW SYNC
// =========================================================================
function updateLivePreview() {
    const previewWrapper = document.getElementById("preview-wrapper");
    if (!activeForm) {
        previewWrapper.innerHTML = "";
        return;
    }
    
    // Get live values
    const title = document.getElementById("form-title-input").value || "Untitled Form";
    const desc = activeForm.description || "";
    const branding = activeForm.branding;
    
    // Dynamically load Google Font if not already loaded in the document
    const font = branding.fontFamily;
    if (["Inter", "Outfit", "Roboto"].includes(font)) {
        const fontId = `google-font-${font.toLowerCase()}`;
        if (!document.getElementById(fontId)) {
            const link = document.createElement("link");
            link.id = fontId;
            link.rel = "stylesheet";
            link.href = `https://fonts.googleapis.com/css2?family=${font}:wght@300;400;500;600;700&display=swap`;
            document.head.appendChild(link);
        }
    }

    // Set dynamic CSS properties on the preview container
    previewWrapper.style.setProperty("--theme-color", branding.themeColor);
    previewWrapper.style.setProperty("--bg-color", branding.backgroundColor);
    previewWrapper.style.setProperty("--text-color", branding.textColor);
    previewWrapper.style.setProperty("--button-color", branding.buttonColor);
    previewWrapper.style.setProperty("--font-family", `'${branding.fontFamily}', sans-serif`);
    
    // Style the previewWrapper as a viewport container representing the page background
    previewWrapper.style.backgroundColor = branding.backgroundColor;
    previewWrapper.style.color = branding.textColor;
    previewWrapper.style.fontFamily = `'${branding.fontFamily}', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    previewWrapper.style.padding = "24px 16px";
    previewWrapper.style.transition = "all var(--transition-normal)";
    
    // Live Success View Mode Preview overlay
    if (currentPreviewMode === "success") {
        const successLayout = document.getElementById("form-success-layout-select")?.value || activeForm.successLayout || "classic";
        const successIcon = document.getElementById("form-success-icon-select")?.value || activeForm.successIcon || "checkmark";
        const confirmationMsg = document.getElementById("form-confirmation-input")?.value.trim() || "Your response has been recorded.";
        const successDescription = activeForm.successDescription || "";
        const showSubmitAnother = document.getElementById("form-submit-another-input")?.checked;
        const showShare = document.getElementById("form-social-share-input")?.checked;
        
        // Render Steps List
        let stepsHtml = "";
        let stepsHtmlSplash = "";
        const steps = activeForm.successSteps || [];
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
        const ctaBtns = activeForm.successButtons || [];
        ctaBtns.forEach((btn) => {
            if (btn.label.trim()) {
                if (btn.style === "primary") {
                    buttonsHtml += `
                        <a href="#" class="branded-submit-btn" style="text-decoration:none; display:inline-flex; align-items:center; justify-content:center; margin-bottom:10px; background-color: var(--button-color); color: #ffffff; padding: 11px 22px; border-radius: var(--border-radius-sm); font-size: 0.95rem; font-weight: 600; width: 100%; box-sizing: border-box; pointer-events: none; text-align: center; border: 1px solid var(--button-color);">
                            ${escapeHTML(btn.label)}
                        </a>
                    `;
                    buttonsHtmlSplash += `
                        <a href="#" class="branded-submit-btn splash-primary-btn" style="text-decoration:none; display:inline-flex; align-items:center; justify-content:center; margin-bottom:10px; background-color: #ffffff; color: var(--theme-color); padding: 12px 24px; border-radius: 30px; font-size: 0.95rem; font-weight: 600; width: 100%; box-sizing: border-box; box-shadow: 0 4px 12px rgba(0,0,0,0.1); pointer-events: none; text-align: center; border: 1px solid #ffffff;">
                            ${escapeHTML(btn.label)}
                        </a>
                    `;
                } else {
                    buttonsHtml += `
                        <a href="#" class="branded-submit-btn" style="text-decoration:none; display:inline-flex; align-items:center; justify-content:center; margin-bottom:10px; background-color: transparent; color: var(--theme-color); padding: 11px 22px; border-radius: var(--border-radius-sm); font-size: 0.95rem; font-weight: 600; width: 100%; box-sizing: border-box; pointer-events: none; text-align: center; border: 1.5px solid var(--theme-color);">
                            ${escapeHTML(btn.label)}
                        </a>
                    `;
                    buttonsHtmlSplash += `
                        <a href="#" class="branded-submit-btn splash-outline-btn" style="text-decoration:none; display:inline-flex; align-items:center; justify-content:center; margin-bottom:10px; background-color: transparent; color: #ffffff; padding: 12px 24px; border-radius: 30px; font-size: 0.95rem; font-weight: 600; width: 100%; box-sizing: border-box; pointer-events: none; text-align: center; border: 1.5px solid rgba(255,255,255,0.6);">
                            ${escapeHTML(btn.label)}
                        </a>
                    `;
                }
            }
        });
        
        if (showSubmitAnother) {
            buttonsHtml += `
                <button class="form-clear-btn" style="pointer-events: none; font-weight:500; font-size:0.9rem; margin-top:6px;">
                    Submit another response
                </button>
            `;
            buttonsHtmlSplash += `
                <button class="form-clear-btn splash-secondary-btn" style="pointer-events: none; font-weight:500; font-size:0.9rem; margin-top:6px; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.06); color: #ffffff; padding: 10px 20px; border-radius: 30px; width: 100%;">
                    Submit another response
                </button>
            `;
        }

        // Render Sharing Block with brand icons SVG (WhatsApp, Instagram, Twitter X, LinkedIn)
        let shareHtml = "";
        let shareHtmlSplash = "";
        if (showShare) {
            const shareButtonsMarkup = `
                <div class="social-share-btn-wrap">
                    <a href="#" class="share-btn share-btn-whatsapp" title="WhatsApp" style="pointer-events: none;">
                        <svg viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.457L0 24zm6.59-4.846c1.6.95 3.498 1.45 5.42 1.451 5.485 0 9.948-4.47 9.952-9.953.002-2.652-1.03-5.145-2.906-7.022C17.237 1.751 14.745.72 12.09.72c-5.49 0-9.957 4.47-9.961 9.954-.001 1.93.504 3.818 1.461 5.418L2.49 20.466l4.157-1.312zm11.233-5.32c-.3-.149-1.772-.874-2.047-.975-.276-.101-.476-.149-.676.15-.199.299-.773.975-.948 1.173-.175.199-.35.224-.65.075-1.04-.52-1.826-.855-2.547-1.48-1.012-.876-1.442-1.25-1.92-1.867-.29-.497-.03-.767.22-1.016.224-.224.499-.574.748-.873.1-.12.18-.249.25-.399.075-.149.037-.28-.019-.38-.056-.1-.476-1.146-.652-1.569-.172-.411-.36-.356-.499-.364-.128-.007-.275-.008-.423-.008s-.387.056-.59.276c-.202.221-.774.757-.774 1.848 0 1.09.795 2.146.907 2.296.113.15 1.565 2.39 3.791 3.352 1.636.706 2.274.749 3.091.628.528-.078 1.62-.662 1.848-1.27.228-.607.228-1.127.16-1.227-.068-.1-.248-.149-.548-.298z"/></svg>
                    </a>
                    <a href="#" class="share-btn share-btn-instagram" title="Instagram" style="pointer-events: none;">
                        <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                    </a>
                    <a href="#" class="share-btn share-btn-twitter" title="Twitter (X)" style="pointer-events: none;">
                        <svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                    <a href="#" class="share-btn share-btn-linkedin" title="LinkedIn" style="pointer-events: none;">
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
        
        let successContentHtml = "";
        if (successLayout === "classic") {
            successContentHtml = `
                <div class="form-card-base card-style-${branding.cardStyle} success-card animate-fade-in success-layout-classic" style="text-align: center; padding: 48px 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; margin-top: 16px;">
                    <div class="success-icon-container" style="width: 80px; height: 80px; border-radius: 50%; background-color: rgba(76, 175, 80, 0.1); border: 2px solid var(--theme-color); display: flex; align-items: center; justify-content: center; margin-bottom: 24px;">
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
            `;
        } else if (successLayout === "minimal") {
            successContentHtml = `
                <div class="success-layout-minimal animate-fade-in" style="text-align: center; padding: 48px 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: transparent; border: none; box-shadow: none; margin-top: 16px;">
                    <div class="success-icon-container-minimal" style="color: var(--theme-color);">
                        ${getSuccessSVG(successIcon)}
                    </div>
                    <h2 style="font-family:'Outfit'; font-size:1.8rem; font-weight: 600; margin-top: 16px; margin-bottom: 8px; color: var(--text-color);">Done!</h2>
                    <p style="color:var(--text-color-secondary); font-size:0.95rem; margin-bottom:16px;">${escapeHTML(confirmationMsg)}</p>
                    
                    ${successDescription ? `<p style="color:var(--text-color-secondary); font-size:0.9rem; line-height:1.5; margin-bottom:20px; opacity:0.85; max-width:480px; text-align:center;">${successDescription}</p>` : ''}
                    
                    ${stepsHtml}
                    
                    <div class="success-actions" style="display:flex; flex-direction:column; align-items:center; width:100%; max-width:280px; margin-top: 12px;">
                        ${buttonsHtml}
                    </div>
                    
                    ${shareHtml}
                </div>
            `;
        } else if (successLayout === "splash") {
            successContentHtml = `
                <div class="success-layout-splash animate-fade-in" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; min-height: 100%; background: linear-gradient(135deg, var(--theme-color) 0%, var(--button-color) 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10; color: #ffffff; padding: 48px 24px 24px; box-sizing: border-box; overflow-y: auto; border-radius: 26px;">
                    <div class="success-icon-container-splash" style="width: 90px; height: 90px; border-radius: 50%; background-color: rgba(255, 255, 255, 0.15); display: flex; align-items: center; justify-content: center; margin-bottom: 24px; border: 1px solid rgba(255, 255, 255, 0.25); box-shadow: 0 8px 32px rgba(0,0,0,0.1); color: #ffffff;">
                        ${getSuccessSVG(successIcon)}
                    </div>
                    <h2 style="font-family:'Outfit'; font-size:2.2rem; font-weight: 800; margin-bottom:12px; text-shadow: 0 2px 10px rgba(0,0,0,0.15);">Thank You!</h2>
                    <p style="font-size:1.1rem; line-height: 1.6; margin-bottom:16px; text-align: center; max-width: 500px; color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 4px rgba(0,0,0,0.15); white-space: pre-wrap;">${escapeHTML(confirmationMsg)}</p>
                    
                    ${successDescription ? `<p style="font-size:0.95rem; line-height:1.5; margin-bottom:20px; text-align:center; max-width:500px; color:rgba(255,255,255,0.75); z-index:2;">${successDescription}</p>` : ''}
                    
                    ${stepsHtmlSplash}
                    
                    <div class="splash-actions" style="display:flex; flex-direction:column; align-items:center; width: 100%; max-width: 320px; z-index: 10; margin-top: 12px;">
                        ${buttonsHtmlSplash}
                    </div>
                    
                    ${shareHtmlSplash}
                </div>
            `;
        }
        
        previewWrapper.innerHTML = `
            <div class="form-wrapper ${branding.bannerUrl && successLayout !== 'splash' ? 'has-banner' : ''}">
                ${branding.bannerUrl && successLayout !== 'splash' ? `<img src="${escapeHTML(branding.bannerUrl)}" class="form-banner-img" onerror="this.style.display='none'">` : ''}
                ${successContentHtml}
                ${successLayout !== 'splash' ? `
                <div class="branding-credit">
                    Made By <a href="https://prince-sanchela.vercel.app" target="_blank" style="color:var(--theme-color); text-decoration:none; font-weight:600;">Prince Sanchela</a> Custom Branded Forms
                </div>
                ` : ''}
            </div>
        `;
        return;
    }

    // Banner markup
    let bannerHtml = "";
    if (branding.bannerUrl) {
        bannerHtml = `<img src="${escapeHTML(branding.bannerUrl)}" class="form-banner-img" onerror="this.style.display='none'">`;
    }
    
    // Logo markup
    let logoHtml = "";
    if (branding.logoUrl) {
        logoHtml = `<img src="${escapeHTML(branding.logoUrl)}" class="form-logo-img" onerror="this.style.display='none'">`;
    }
    
    // Render Questions HTML
    let questionsHtml = "";
    const pageQuestions = activeForm.questions
        .filter(q => (q.page || 1) === activePage)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    pageQuestions.forEach((q) => {
        if (q.type === "header") {
            questionsHtml += `
                <div class="form-card-base card-style-${branding.cardStyle} section-header-card" style="border-top: 4px solid var(--theme-color); margin-bottom:12px; padding: 18px 20px;">
                    <h3 style="font-family:'Outfit'; font-size:1.1rem; font-weight:700; margin:0; color:var(--text-color);">${escapeHTML(q.label || "Section Header")}</h3>
                    ${q.placeholder ? `<p style="font-size:0.8rem; color:var(--text-color-secondary); margin: 4px 0 0 0;">${escapeHTML(q.placeholder)}</p>` : ''}
                </div>
            `;
            return;
        }

        let inputFieldHtml = "";
        switch (q.type) {
            case "text":
                inputFieldHtml = `<input type="text" class="branded-input" placeholder="${escapeHTML(q.placeholder || 'Your answer')}" disabled>`;
                break;
            case "paragraph":
                inputFieldHtml = `<textarea class="branded-input" placeholder="${escapeHTML(q.placeholder || 'Long response')}" disabled style="resize:none; height:60px;"></textarea>`;
                break;
            case "number":
                inputFieldHtml = `<input type="number" class="branded-input" placeholder="${escapeHTML(q.placeholder || 'Number response')}" disabled>`;
                break;
            case "radio":
                let rOpts = "";
                q.options.forEach((opt, idx) => {
                    rOpts += `
                        <label class="choice-option">
                            <input type="radio" name="preview_q_${q.id}" class="choice-input" disabled>
                            <span>${escapeHTML(opt)}</span>
                        </label>
                    `;
                });
                inputFieldHtml = `<div class="choices-container">${rOpts}</div>`;
                break;
            case "checkbox":
                let cOpts = "";
                q.options.forEach((opt, idx) => {
                    cOpts += `
                        <label class="choice-option">
                            <input type="checkbox" class="choice-input" disabled>
                            <span>${escapeHTML(opt)}</span>
                        </label>
                    `;
                });
                inputFieldHtml = `<div class="choices-container">${cOpts}</div>`;
                break;
            case "select":
                let sOpts = `<option value="">Choose</option>`;
                q.options.forEach(opt => {
                    sOpts += `<option value="${escapeHTML(opt)}">${escapeHTML(opt)}</option>`;
                });
                inputFieldHtml = `<select class="branded-select" disabled>${sOpts}</select>`;
                break;
            case "date":
                inputFieldHtml = `<input type="date" class="branded-date" disabled>`;
                break;
            case "file":
                const allowedText = q.allowedFileTypesOnly && q.allowedFileTypes && q.allowedFileTypes.length > 0
                    ? `Allowed: ${q.allowedFileTypes.join(', ')} • `
                    : '';
                inputFieldHtml = `
                    <div style="border: 1.5px dashed var(--border-color); padding: 14px; border-radius: var(--border-radius-sm); text-align: center; background: rgba(0,0,0,0.01);">
                        <span style="font-size: 1.4rem; display: block; margin-bottom: 4px;">📁</span>
                        <span style="font-size: 0.8rem; color: var(--text-color-secondary); font-weight: 500; display: block;">Select file to upload</span>
                        <span style="font-size: 0.72rem; color: var(--text-color-muted); display: block; margin-top: 2px;">${allowedText}Max ${q.maxFiles || 1} file(s), up to ${q.maxFileSize || '10MB'}</span>
                    </div>
                `;
                break;
            case "rating":
                const rScale = q.ratingScale || 5;
                const rSym = getRatingSymbolChar(q.ratingIcon || "star");
                let ratingItemsHtml = "";
                for (let i = 1; i <= rScale; i++) {
                    ratingItemsHtml += `
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                            <span style="font-size: 0.75rem; font-weight: 600; color: var(--text-color-secondary);">${i}</span>
                            <span style="font-size: 1.3rem; opacity: 0.7; color: #f59e0b;">${rSym}</span>
                        </div>
                    `;
                }
                inputFieldHtml = `
                    <div style="display: flex; align-items: center; gap: 14px; justify-content: flex-start; overflow-x: auto; padding: 6px 0;">
                        ${ratingItemsHtml}
                    </div>
                `;
                break;
        }
        
        questionsHtml += `
            <div class="form-card-base card-style-${branding.cardStyle} question-card">
                <div class="question-label">
                    ${escapeHTML(q.label || "Question")}
                    ${q.required ? '<span class="required-badge">*</span>' : ''}
                </div>
                <div>${inputFieldHtml}</div>
            </div>
        `;
    });
    
    // Form accepting responses live state preview banner
    let inactiveBanner = "";
    const formAcceptingElem = document.getElementById("form-accepting-input");
    const isAccepting = formAcceptingElem ? formAcceptingElem.checked : (activeForm.acceptingResponses !== false);
    if (!isAccepting) {
        inactiveBanner = `
            <div style="background-color:var(--error-color); color:#ffffff; padding:10px 16px; border-radius:var(--border-radius-sm); font-size:0.85rem; font-weight:600; text-align:center; margin-bottom:12px;" class="animate-fade-in">
                ⚠️ Form Inactive - Closed for Submissions
            </div>
        `;
    }

    // Header card rendering based on active page
    let headerCardHtml = "";
    if (activePage === 1) {
        headerCardHtml = `
            <div class="form-card-base card-style-${branding.cardStyle} form-header-card">
                ${logoHtml}
                <div class="form-title">${escapeHTML(title)}</div>
                <div class="form-description">${desc}</div>
            </div>
        `;
    } else {
        headerCardHtml = `
            <div class="form-card-base card-style-${branding.cardStyle} form-header-card" style="padding: 12px 20px; border-top: 3px solid var(--theme-color);">
                <div style="font-weight: 700; font-size: 0.95rem; color: var(--theme-color);">Page ${activePage} of ${totalPages}</div>
            </div>
        `;
    }

    // Footer buttons rendering based on page count
    let footerHtml = "";
    if (totalPages > 1) {
        footerHtml = `
            <div class="form-footer" style="margin-top:8px; display:flex; justify-content:space-between; align-items:center; gap:8px;">
                ${activePage > 1 ? `<button class="form-clear-btn" style="flex:1; margin:0; padding:8px;" disabled>Back</button>` : ''}
                <div style="font-size:0.75rem; font-weight:600; color:var(--text-color-secondary); white-space:nowrap;">Page ${activePage} of ${totalPages}</div>
                <button class="branded-submit-btn" style="background-color: var(--button-color); flex:2; margin:0; padding:8px;" disabled>
                    ${activePage === totalPages ? 'Submit' : 'Next'}
                </button>
            </div>
        `;
    } else {
        footerHtml = `
            <div class="form-footer" style="margin-top:8px;">
                <button class="branded-submit-btn" style="background-color: var(--button-color)" disabled>Submit</button>
                <button class="form-clear-btn" disabled>Clear Form</button>
            </div>
        `;
    }

    // Assemble layout
    previewWrapper.innerHTML = `
        <div class="form-wrapper ${branding.bannerUrl ? 'has-banner' : ''}">
            ${inactiveBanner}
            ${bannerHtml}
            ${headerCardHtml}
            
            ${questionsHtml}
            
            ${footerHtml}
            
            <div class="branding-credit">
                Made By <a href="https://prince-sanchela.vercel.app" target="_blank" style="color:var(--theme-color); text-decoration:none; font-weight:600;">Prince Sanchela</a> Custom Branded Forms
            </div>
        </div>
    `;
}

// =========================================================================
// ANALYTICS & RESPONSES VISUALIZATION
// =========================================================================
function renderResponsesTable() {
    const theadRow = document.getElementById("table-header-row");
    const tbody = document.getElementById("responses-table-body");
    
    theadRow.innerHTML = "";
    tbody.innerHTML = "";
    
    if (activeFormResponses.length === 0) {
        theadRow.innerHTML = "<th>Timestamp</th><th>Message</th>";
        tbody.innerHTML = "<tr><td colspan='2' style='text-align:center;'>No submissions yet.</td></tr>";
        return;
    }
    
    // Headers: Timestamp + Question Labels + Actions
    const timeHeader = document.createElement("th");
    timeHeader.innerText = "Submitted At";
    theadRow.appendChild(timeHeader);
    
    activeForm.questions.forEach(q => {
        const th = document.createElement("th");
        th.innerText = q.label;
        theadRow.appendChild(th);
    });
    
    const actionHeader = document.createElement("th");
    actionHeader.innerText = "Actions";
    actionHeader.style.textAlign = "center";
    actionHeader.style.width = "70px";
    theadRow.appendChild(actionHeader);
    
    // Rows
    const totalRespCount = activeFormResponses.length;
    activeFormResponses.forEach((resp, respIdx) => {
        const tr = document.createElement("tr");
        
        // Timestamp cell
        const timeCell = document.createElement("td");
        timeCell.innerText = new Date(resp.submittedAt).toLocaleString();
        tr.appendChild(timeCell);
        
        // Answers cell
        activeForm.questions.forEach(q => {
            const td = document.createElement("td");
            const answer = resp.answers[q.id];
            
            if (answer === undefined || answer === null) {
                td.innerHTML = `<span style="color:var(--text-color-muted); font-style:italic;">N/A</span>`;
            } else if (q.type === "rating") {
                const sym = getRatingSymbolChar(q.ratingIcon || "star");
                td.innerHTML = `<span style="font-weight:600; color:var(--text-color);">${answer} / ${q.ratingScale || 5} ${sym}</span>`;
            } else if (q.type === "file") {
                const files = parseFileAnswer(answer, q.label);
                if (files.length === 0) {
                    td.innerHTML = `<span style="color:var(--text-color-muted); font-style:italic;">No files</span>`;
                } else {
                    const btn = document.createElement("button");
                    btn.type = "button";
                    btn.className = "btn-view-file-attachments";
                    btn.style.cssText = "display:inline-flex; align-items:center; gap:6px; background:rgba(26,115,232,0.08); border:1px solid rgba(26,115,232,0.25); color:#1a73e8; padding:5px 10px; border-radius:8px; font-size:0.78rem; font-weight:600; cursor:pointer; transition:all 0.2s;";
                    btn.innerHTML = `
                        <svg width="14" height="14" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                          <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                          <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                          <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.5l5.85 10.15z" fill="#ea4335"/>
                          <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.45-1.2h-18.6c-1.55 0-3.1.4-4.45 1.2z" fill="#00832d"/>
                          <path d="m57.4 1.2-13.75 23.8 13.75 23.8h27.5c0-1.55-.4-3.1-1.2-4.5l-21.85-37.85c-.8-1.4-1.95-2.5-3.3-3.3z" fill="#ffba00"/>
                          <path d="m27.5 53-13.75 23.8c1.35.8 2.9 1.2 4.45 1.2h50.9c1.55 0 3.1-.4 4.45-1.2l-13.75-23.8z" fill="#2684fc"/>
                        </svg>
                        <span>View Attachment (${files.length})</span>
                    `;
                    btn.addEventListener("mouseover", () => btn.style.background = "rgba(26,115,232,0.14)");
                    btn.addEventListener("mouseout", () => btn.style.background = "rgba(26,115,232,0.08)");
                    btn.addEventListener("click", () => {
                        openSecureFileViewerModal(files, q.label, resp.submittedAt);
                    });
                    td.appendChild(btn);
                }
            } else if (Array.isArray(answer)) {
                td.innerText = answer.join(", ");
            } else {
                td.innerText = answer;
            }
            tr.appendChild(td);
        });
        
        // Actions cell
        const actionTd = document.createElement("td");
        actionTd.style.textAlign = "center";
        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.style.cssText = "background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); color: #ef4444; width: 30px; height: 30px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; font-size: 0.95rem; transition: all 0.2s;";
        delBtn.title = `Delete Submission #${totalRespCount - respIdx}`;
        delBtn.innerHTML = "🗑️";
        delBtn.addEventListener("mouseover", () => delBtn.style.background = "rgba(239,68,68,0.18)");
        delBtn.addEventListener("mouseout", () => delBtn.style.background = "rgba(239,68,68,0.08)");
        delBtn.addEventListener("click", () => deleteSingleResponse(resp.id, totalRespCount - respIdx));
        actionTd.appendChild(delBtn);
        tr.appendChild(actionTd);
        
        tbody.appendChild(tr);
    });
}

async function deleteSingleResponse(responseId, displayNum) {
    if (!activeForm || !activeForm.id) return;
    
    const confirmDel = await showConfirm({
        title: `Delete Submission #${displayNum}`,
        message: "Are you sure you want to permanently delete this response submission? This action cannot be undone.",
        confirmText: "Delete Submission",
        icon: "🗑️",
        isDanger: true
    });
    if (!confirmDel) return;
    
    try {
        const res = await fetch(`/api/forms/${activeForm.id}/responses/${responseId}`, {
            method: "DELETE"
        });
        if (!res.ok) throw new Error("Failed to delete submission record");
        
        showToast(`Submission #${displayNum} deleted successfully.`, "success");
        await loadResponses(activeForm.id);
    } catch(err) {
        console.error(err);
        showToast("Error deleting response: " + err.message, "error");
    }
}

function parseFileAnswer(answer, qLabel = "Attachment") {
    if (!answer) return [];

    function cleanFileName(rawName, idx = 1, mime = "") {
        if (!rawName || rawName.startsWith("data:") || rawName.includes("base64") || rawName.length > 80) {
            let ext = "file";
            const str = (rawName + " " + mime).toLowerCase();
            if (str.includes("png")) ext = "png";
            else if (str.includes("jpeg") || str.includes("jpg")) ext = "jpg";
            else if (str.includes("pdf")) ext = "pdf";
            else if (str.includes("webp")) ext = "webp";
            else if (str.includes("gif")) ext = "gif";
            else if (str.includes("audio") || str.includes("mp3")) ext = "mp3";
            else if (str.includes("video") || str.includes("mp4")) ext = "mp4";
            else if (str.includes("sheet") || str.includes("excel") || str.includes("csv")) ext = "xlsx";
            else if (str.includes("word") || str.includes("document")) ext = "docx";

            const tag = (qLabel || "File_Attachment").replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "") || "Attachment";
            return `${tag}_${idx}.${ext}`;
        }
        return rawName;
    }

    if (Array.isArray(answer)) {
        return answer.map((f, idx) => {
            if (typeof f === "string") {
                const mimeMatch = f.match(/^data:(.*?);/);
                const mime = mimeMatch ? mimeMatch[1] : "";
                const cleanName = cleanFileName(f, idx + 1, mime);
                return { name: cleanName, size: Math.round(f.length * 0.75), type: mime || "file", base64: f };
            } else if (typeof f === "object" && f !== null) {
                const cleanName = cleanFileName(f.name, idx + 1, f.type);
                return { ...f, name: cleanName };
            }
            return { name: cleanFileName(String(f), idx + 1), size: 0, type: "file", base64: "" };
        });
    }

    if (typeof answer === "object" && answer !== null && answer.base64) {
        const cleanName = cleanFileName(answer.name, 1, answer.type);
        return [{ ...answer, name: cleanName }];
    }

    if (typeof answer === "string" && answer.startsWith("data:")) {
        const mimeMatch = answer.match(/^data:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : "";
        const cleanName = cleanFileName(answer, 1, mime);
        return [{ name: cleanName, size: Math.round(answer.length * 0.75), type: mime, base64: answer }];
    }

    return [{ name: cleanFileName(String(answer), 1), size: 0, type: "file", base64: "" }];
}

function openSecureFileViewerModal(files, label, submittedAt) {
    const modal = document.getElementById("secure-file-modal");
    const titleEl = document.getElementById("modal-file-title");
    const bodyEl = document.getElementById("modal-file-body");
    if (!modal || !bodyEl) return;
    
    titleEl.innerText = label ? `Attachments: ${label}` : "Secure File Attachments";
    bodyEl.innerHTML = "";
    
    if (!files || files.length === 0) {
        bodyEl.innerHTML = `<div style="text-align:center; color:var(--text-color-muted); padding:30px;">No files found for this response.</div>`;
    } else {
        files.forEach((file, idx) => {
            const card = document.createElement("div");
            card.style.cssText = "background: var(--bg-color-secondary); border: 1px solid var(--border-color); border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 14px; box-shadow: var(--shadow-sm);";
            
            const isImage = (file.type && file.type.startsWith("image/")) || (file.base64 && file.base64.startsWith("data:image/"));
            const isAudio = (file.type && file.type.startsWith("audio/")) || (file.base64 && file.base64.startsWith("data:audio/"));
            const isVideo = (file.type && file.type.startsWith("video/")) || (file.base64 && file.base64.startsWith("data:video/"));
            const isPdf = (file.name && file.name.toLowerCase().endsWith(".pdf")) || (file.type && file.type.includes("pdf")) || (file.base64 && file.base64.startsWith("data:application/pdf"));
            
            const formatSize = (bytes) => {
                if (!bytes) return "Cloud Verified";
                if (bytes < 1024) return bytes + " B";
                if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
                return (bytes / (1024 * 1024)).toFixed(1) + " MB";
            };
            
            let previewAreaHtml = "";
            if (isImage && file.base64) {
                previewAreaHtml = `
                    <div style="background: rgba(0,0,0,0.03); border-radius: 10px; padding: 10px; text-align: center; max-height: 320px; overflow: hidden; border: 1px solid var(--border-color);">
                        <img src="${file.base64}" alt="${escapeHTML(file.name || 'Image')}" style="max-height: 300px; max-width: 100%; object-fit: contain; border-radius: 8px; cursor: zoom-in; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" onclick="window.open('${file.base64}', '_blank')">
                    </div>
                `;
            } else if (isAudio && file.base64) {
                previewAreaHtml = `
                    <div style="padding: 14px; background: rgba(0,0,0,0.02); border-radius: 10px; border: 1px solid var(--border-color);">
                        <audio controls style="width: 100%;">
                            <source src="${file.base64}" type="${file.type || 'audio/mpeg'}">
                            Your browser does not support audio playback.
                        </audio>
                    </div>
                `;
            } else if (isVideo && file.base64) {
                previewAreaHtml = `
                    <div style="background: #000; border-radius: 10px; overflow: hidden; text-align: center;">
                        <video controls style="max-height: 300px; max-width: 100%;">
                            <source src="${file.base64}" type="${file.type || 'video/mp4'}">
                            Your browser does not support video playback.
                        </video>
                    </div>
                `;
            } else if (isPdf && file.base64) {
                previewAreaHtml = `
                    <div style="background: rgba(239,68,68,0.05); border: 1px solid rgba(239,68,68,0.25); border-radius: 10px; padding: 16px; display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="font-size: 1.8rem;">📄</span>
                            <div>
                                <div style="font-weight: 700; color: var(--text-color); font-size: 0.92rem;">PDF Document</div>
                                <div style="font-size: 0.76rem; color: var(--text-color-secondary); margin-top: 2px;">Protected Sandbox View</div>
                            </div>
                        </div>
                        <a href="${file.base64}" download="${escapeHTML(file.name || 'document.pdf')}" target="_blank" class="btn btn-secondary" style="font-size: 0.8rem; padding: 6px 14px; text-decoration: none;">Open PDF</a>
                    </div>
                `;
            }

            card.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 200px;">
                        <div style="width: 38px; height: 38px; border-radius: 8px; background: rgba(99, 102, 241, 0.08); display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">
                            ${isImage ? '🖼️' : isPdf ? '📄' : isAudio ? '🎵' : isVideo ? '🎬' : '📁'}
                        </div>
                        <div>
                            <div style="font-weight: 700; color: var(--text-color); font-size: 0.92rem; word-break: break-word;">${escapeHTML(file.name || 'Attached File')}</div>
                            <div style="font-size: 0.76rem; color: var(--text-color-muted); margin-top: 2px;">
                                ${formatSize(file.size)} • <span style="color: #10b981; font-weight: 600;">✓ Encrypted & Cloud Vault Verified</span>
                            </div>
                        </div>
                    </div>
                    ${file.base64 ? `
                        <a href="${file.base64}" download="${escapeHTML(file.name || 'file')}" target="_blank" style="display: inline-flex; align-items: center; gap: 6px; background: #1a73e8; color: #fff; text-decoration: none; padding: 7px 16px; border-radius: 8px; font-size: 0.82rem; font-weight: 600; box-shadow: 0 1px 3px rgba(26,115,232,0.3); transition: opacity 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Secure Download
                        </a>
                    ` : ''}
                </div>
                ${previewAreaHtml}
            `;
            bodyEl.appendChild(card);
        });
    }
    
    modal.style.display = "flex";
}

function setupFileModalHandlers() {
    const modal = document.getElementById("secure-file-modal");
    const closeBtn = document.getElementById("close-file-modal-btn");
    const closeBottomBtn = document.getElementById("close-file-modal-bottom-btn");
    if (closeBtn) closeBtn.addEventListener("click", () => modal.style.display = "none");
    if (closeBottomBtn) closeBottomBtn.addEventListener("click", () => modal.style.display = "none");
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target.id === "secure-file-modal") modal.style.display = "none";
        });
    }
}
function getAvatarColor(idx) {
    const hues = [220, 262, 325, 185, 142, 32]; // blue, purple, magenta, cyan, green, orange
    const hue = hues[idx % hues.length];
    return `hsl(${hue}, 85%, 96%)`;
}
function getAvatarTextColor(idx) {
    const hues = [220, 262, 325, 185, 142, 32];
    const hue = hues[idx % hues.length];
    return `hsl(${hue}, 85%, 45%)`;
}

function renderAnalyticsCharts() {
    const chartsContainer = document.getElementById("analytics-charts-container");
    chartsContainer.innerHTML = "";
    
    // Update overview stats cards if they exist
    const sheetsStatusEl = document.getElementById("sheets-sync-status");
    const sheetsIconBgEl = document.getElementById("sheets-sync-status-icon-bg");
    if (sheetsStatusEl && sheetsIconBgEl) {
        if (activeForm && activeForm.isLinkedToSheets) {
            sheetsStatusEl.innerText = "Linked";
            sheetsStatusEl.style.color = "#10b981";
            sheetsIconBgEl.style.background = "rgba(16, 185, 129, 0.1)";
            sheetsIconBgEl.style.color = "#10b981";
        } else {
            sheetsStatusEl.innerText = "Not Linked";
            sheetsStatusEl.style.color = "#ef4444";
            sheetsIconBgEl.style.background = "rgba(239, 68, 68, 0.1)";
            sheetsIconBgEl.style.color = "#ef4444";
        }
    }

    const formStatusEl = document.getElementById("form-active-status");
    const formIconBgEl = document.getElementById("form-active-status-icon-bg");
    if (formStatusEl && formIconBgEl) {
        if (activeForm && activeForm.acceptingResponses !== false) {
            formStatusEl.innerText = "Active";
            formStatusEl.style.color = "#10b981";
            formIconBgEl.style.background = "rgba(16, 185, 129, 0.1)";
            formIconBgEl.style.color = "#10b981";
        } else {
            formStatusEl.innerText = "Suspended";
            formStatusEl.style.color = "#f59e0b";
            formIconBgEl.style.background = "rgba(245, 158, 11, 0.1)";
            formIconBgEl.style.color = "#f59e0b";
        }
    }
    
    if (activeFormResponses.length === 0) {
        chartsContainer.innerHTML = `<div style="text-align:center; padding:32px; color:var(--text-color-muted); grid-column: 1/-1; background:rgba(255,255,255,0.4); border-radius:12px; border:1px dashed var(--border-color);">No data available to chart.</div>`;
        return;
    }
    
    activeForm.questions.forEach(q => {
        const chartCard = document.createElement("div");
        chartCard.className = "chart-card animate-fade-in";
        if (activeForm.branding && activeForm.branding.themeColor) {
            chartCard.style.setProperty("--primary-color", activeForm.branding.themeColor);
        }
        
        const title = document.createElement("div");
        title.className = "chart-title";
        
        // Smart type detection
        const labelText = (q.label || "").toLowerCase();
        const qType = (q.type || "").toLowerCase();
        const valType = (q.validationType || "").toLowerCase();
        
        let detected = "text";
        if (qType === "file") {
            detected = "file";
        } else if (["radio", "checkbox", "select"].includes(qType)) {
            detected = "choices";
        } else if (qType === "textarea" || qType === "paragraph") {
            detected = "paragraph";
        } else if (qType === "email" || valType === "email" || labelText.includes("email")) {
            detected = "email";
        } else if (qType === "phone" || qType === "tel" || valType === "phone" || valType === "tel" || labelText.includes("phone") || labelText.includes("mobile") || labelText.includes("whatsapp") || labelText.includes("contact")) {
            detected = "phone";
        } else if (qType === "date" || valType === "date" || labelText.includes("date") || labelText.includes("dob") || labelText.includes("birth")) {
            detected = "date";
        } else if (qType === "number" || valType === "number" || labelText.includes("number") || labelText.includes("roll") || labelText.includes("amount") || labelText.includes("marks")) {
            detected = "number";
        }
        
        let typeBadgeText = "Text Field";
        let typeBadgeColor = "rgba(6, 182, 212, 0.08)";
        let typeBadgeTextColor = "#0891b2";
        
        if (detected === "file") {
            typeBadgeText = "File Upload";
            typeBadgeColor = "rgba(26, 115, 232, 0.08)";
            typeBadgeTextColor = "#1a73e8";
        } else if (detected === "choices") {
            typeBadgeText = "Choices";
            typeBadgeColor = "rgba(99, 102, 241, 0.08)";
            typeBadgeTextColor = activeForm.branding.themeColor || "var(--primary-color)";
        } else if (detected === "paragraph") {
            typeBadgeText = "Paragraph";
            typeBadgeColor = "rgba(217, 70, 239, 0.08)";
            typeBadgeTextColor = "#d946ef";
        } else if (detected === "phone") {
            typeBadgeText = "Phone Number";
            typeBadgeColor = "rgba(16, 185, 129, 0.08)";
            typeBadgeTextColor = "#10b981";
        } else if (detected === "email") {
            typeBadgeText = "Email Address";
            typeBadgeColor = "rgba(245, 158, 11, 0.08)";
            typeBadgeTextColor = "#f59e0b";
        } else if (detected === "date") {
            typeBadgeText = "Date Field";
            typeBadgeColor = "rgba(139, 92, 246, 0.08)";
            typeBadgeTextColor = "#8b5cf6";
        } else if (detected === "number") {
            typeBadgeText = "Number Field";
            typeBadgeColor = "rgba(236, 72, 153, 0.08)";
            typeBadgeTextColor = "#ec4899";
        }
        
        title.innerHTML = `
            <span style="font-weight: 700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHTML(q.label)}">${escapeHTML(q.label)}</span>
            <span style="font-size:0.65rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; background:${typeBadgeColor}; color:${typeBadgeTextColor}; padding:3px 8px; border-radius:6px; font-family:sans-serif; flex-shrink:0;">${typeBadgeText}</span>
        `;
        chartCard.appendChild(title);
        
        // Process data
        if (["radio", "checkbox", "select"].includes(q.type)) {
            // Count option frequencies
            const counts = {};
            q.options.forEach(opt => counts[opt] = 0);
            
            let totalAnswers = 0;
            activeFormResponses.forEach(resp => {
                const ans = resp.answers[q.id];
                if (ans !== undefined && ans !== null) {
                    if (Array.isArray(ans)) {
                        ans.forEach(val => {
                            if (counts[val] !== undefined) counts[val]++;
                            else counts[val] = 1;
                            totalAnswers++;
                        });
                    } else {
                        if (counts[ans] !== undefined) counts[ans]++;
                        else counts[ans] = 1;
                        totalAnswers++;
                    }
                }
            });
            
            // Render a custom CSS bar chart
            const chartDiv = document.createElement("div");
            chartDiv.className = "bar-chart";
            
            Object.keys(counts).forEach(opt => {
                const val = counts[opt];
                const pct = totalAnswers > 0 ? Math.round((val / totalAnswers) * 100) : 0;
                
                const barRow = document.createElement("div");
                barRow.className = "bar-row";
                barRow.innerHTML = `
                    <div class="bar-label-row">
                        <span style="font-weight:500; color:var(--text-color-primary);">${escapeHTML(opt)}</span>
                        <span>${val} <span style="color:var(--text-color-muted); font-weight:500; font-size:0.8rem; margin-left:2px;">(${pct}%)</span></span>
                    </div>
                    <div class="bar-track">
                        <div class="bar-fill" style="width: ${pct}%; --primary-color: ${activeForm.branding.themeColor};"></div>
                    </div>
                `;
                chartDiv.appendChild(barRow);
            });
            
            chartCard.appendChild(chartDiv);
        } else {
            // Text values list
            const listDiv = document.createElement("div");
            listDiv.className = "text-list-responses";
            
            // Choose SVGs based on question type
            let typeIcon = '';
            const themeCol = activeForm.branding.themeColor || 'var(--primary-color)';
            if (detected === 'email') {
                typeIcon = `<svg class="chart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px; height:14px; color:${themeCol}; margin-right:6px; display:inline-block; vertical-align:middle; flex-shrink:0;"><path d="M4 4h16c1.1 0 2-.9 2-2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`;
            } else if (detected === 'phone') {
                typeIcon = `<svg class="chart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px; height:14px; color:${themeCol}; margin-right:6px; display:inline-block; vertical-align:middle; flex-shrink:0;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
            } else if (detected === 'date') {
                typeIcon = `<svg class="chart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px; height:14px; color:${themeCol}; margin-right:6px; display:inline-block; vertical-align:middle; flex-shrink:0;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
            } else if (detected === 'number') {
                typeIcon = `<svg class="chart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px; height:14px; color:${themeCol}; margin-right:6px; display:inline-block; vertical-align:middle; flex-shrink:0;"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>`;
            } else {
                typeIcon = `<svg class="chart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px; height:14px; color:${themeCol}; margin-right:6px; display:inline-block; vertical-align:middle; flex-shrink:0;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
            }

            const quoteSvg = `<svg viewBox="0 0 24 24" fill="currentColor" style="width:16px; height:16px; color:rgba(99,102,241,0.25); margin-right:8px; display:inline-block; vertical-align:top; flex-shrink:0;"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.154c-2.41 1.005-4 3.698-4 5.846h4v10h-10z"/></svg>`;

            // Gather all responses
            const answers = [];
            activeFormResponses.forEach((resp, idx) => {
                const ans = resp.answers[q.id];
                if (ans !== undefined && ans !== null && ans !== "") {
                    answers.push({ val: ans, respIdx: idx + 1 });
                }
            });

            if (answers.length === 0) {
                listDiv.innerHTML = `<span style="color:var(--text-color-muted); font-style:italic; font-size:0.85rem;">No answers filled in.</span>`;
            } else if (q.type === "file" || detected === "file") {
                // File upload response cards gallery view
                answers.forEach(item => {
                    const files = parseFileAnswer(item.val, q.label);
                    if (files.length === 0) return;
                    
                    files.forEach(f => {
                        const fileCard = document.createElement("div");
                        fileCard.className = "text-response-item file-response-item";
                        fileCard.style.cssText = "display: flex; align-items: center; justify-content: space-between; gap: 12px; background: var(--bg-color-secondary); border: 1px solid var(--border-color); border-radius: 10px; padding: 10px 14px; margin-bottom: 8px;";
                        
                        const isImg = (f.type && f.type.startsWith("image/")) || (f.base64 && f.base64.startsWith("data:image/"));
                        const isPdf = (f.name && f.name.toLowerCase().endsWith(".pdf")) || (f.type && f.type.includes("pdf"));
                        const avatarColor = getAvatarColor(item.respIdx);
                        const avatarTextColor = getAvatarTextColor(item.respIdx);

                        let thumbMarkup = isImg && f.base64 ? `
                            <img src="${f.base64}" alt="Thumb" style="width:34px; height:34px; object-fit:cover; border-radius:6px; border:1px solid var(--border-color); flex-shrink:0; cursor:zoom-in;" onclick="window.open('${f.base64}', '_blank')">
                        ` : `
                            <div style="width:34px; height:34px; border-radius:6px; background:rgba(26,115,232,0.08); display:flex; align-items:center; justify-content:center; font-size:1.1rem; flex-shrink:0;">
                                ${isImg ? '🖼️' : isPdf ? '📄' : '📁'}
                            </div>
                        `;

                        fileCard.innerHTML = `
                            <div style="display:flex; align-items:center; gap:10px; flex:1; overflow:hidden;">
                                <div style="width:24px; height:24px; border-radius:50%; background:${avatarColor}; color:${avatarTextColor}; display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:700; flex-shrink:0; font-family:'Outfit';">
                                    #${item.respIdx}
                                </div>
                                ${thumbMarkup}
                                <div style="overflow:hidden; flex:1;">
                                    <div style="font-weight:600; font-size:0.85rem; color:var(--text-color); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;" title="${escapeHTML(f.name)}">${escapeHTML(f.name)}</div>
                                    <div style="font-size:0.72rem; color:#10b981; font-weight:600; margin-top:1px;">Cloud Vault Verified</div>
                                </div>
                            </div>
                            <button type="button" class="btn btn-secondary" style="font-size:0.75rem; padding:4px 10px; border-radius:6px; flex-shrink:0;" onclick="openSecureFileViewerModal(${escapeHTML(JSON.stringify(files))}, '${escapeHTML(q.label)}')">View File</button>
                        `;
                        listDiv.appendChild(fileCard);
                    });
                });
            } else if (q.type === "textarea") {
                // Render as testimonial cards/quote bubbles
                answers.forEach(item => {
                    const bubble = document.createElement("div");
                    bubble.className = "text-response-item paragraph-response-item";
                    bubble.style.borderLeft = `4px solid ${activeForm.branding.themeColor || 'var(--primary-color)'}`;
                    bubble.style.background = `rgba(99, 102, 241, 0.015)`;
                    bubble.style.display = "flex";
                    bubble.style.flexDirection = "column";
                    bubble.style.gap = "8px";
                    
                    const avatarColor = getAvatarColor(item.respIdx);
                    const avatarTextColor = getAvatarTextColor(item.respIdx);
                    
                    bubble.innerHTML = `
                        <div style="display:flex; align-items:flex-start; gap:10px;">
                            <div style="width:26px; height:26px; border-radius:50%; background:${avatarColor}; color:${avatarTextColor}; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:700; flex-shrink:0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); font-family:'Outfit', sans-serif;">
                                #${item.respIdx}
                            </div>
                            <div style="flex:1;">
                                <div style="display:flex; align-items:flex-start; gap:4px;">
                                    ${quoteSvg}
                                    <div style="flex:1; font-style:italic; color:var(--text-color-primary); line-height:1.45; word-break:break-word; font-size:0.85rem;">
                                        "${escapeHTML(item.val)}"
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    listDiv.appendChild(bubble);
                });
            } else {
                // Short answers: Check for duplicates to group them
                const counts = {};
                answers.forEach(item => {
                    counts[item.val] = (counts[item.val] || 0) + 1;
                });

                const uniqueVals = Object.keys(counts);
                const hasDuplicates = uniqueVals.some(v => counts[v] > 1);

                if (hasDuplicates) {
                    // Grouped view
                    const sortedVals = uniqueVals.sort((a, b) => counts[b] - counts[a]);
                    sortedVals.forEach((val, idx) => {
                        const item = document.createElement("div");
                        item.className = "text-response-item";
                        item.style.display = "flex";
                        item.style.justifyContent = "space-between";
                        item.style.alignItems = "center";
                        item.style.borderLeft = `3px solid ${activeForm.branding.themeColor || 'var(--primary-color)'}`;
                        
                        item.innerHTML = `
                            <div style="display:flex; align-items:center; gap:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                                ${typeIcon}
                                <span style="font-weight:500; color:var(--text-color-primary); font-size:0.85rem;">${escapeHTML(val)}</span>
                            </div>
                            <span style="font-size:0.7rem; font-weight:600; background:rgba(99,102,241,0.1); color:${activeForm.branding.themeColor || 'var(--theme-color)'}; padding:2px 8px; border-radius:12px; white-space:nowrap;">
                                ${counts[val]} ${counts[val] > 1 ? 'replies' : 'reply'}
                            </span>
                        `;
                        listDiv.appendChild(item);
                    });
                } else {
                    // Unique values: Show list with submission index
                    answers.forEach(item => {
                        const div = document.createElement("div");
                        div.className = "text-response-item";
                        div.style.display = "flex";
                        div.style.alignItems = "center";
                        div.style.gap = "10px";
                        div.style.borderLeft = `3px solid ${activeForm.branding.themeColor || 'var(--primary-color)'}`;
                        
                        const avatarColor = getAvatarColor(item.respIdx);
                        const avatarTextColor = getAvatarTextColor(item.respIdx);
                        
                        div.innerHTML = `
                            <div style="width:24px; height:24px; border-radius:50%; background:${avatarColor}; color:${avatarTextColor}; display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:700; flex-shrink:0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); font-family:'Outfit', sans-serif;">
                                ${item.respIdx}
                            </div>
                            <div style="display:flex; align-items:center; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                                ${typeIcon}
                                <span style="font-weight:500; color:var(--text-color-primary); font-size:0.85rem;">${escapeHTML(item.val)}</span>
                            </div>
                        `;
                        listDiv.appendChild(div);
                    });
                }
            }
            
            chartCard.appendChild(listDiv);
        }
        
        chartsContainer.appendChild(chartCard);
    });
}

function exportResponsesToCSV() {
    if (activeFormResponses.length === 0) {
        alert("No submissions to export!");
        return;
    }
    
    // Headers
    const headers = ["Submitted At"];
    activeForm.questions.forEach(q => headers.push(q.label));
    
    // Rows
    const rows = [headers];
    activeFormResponses.forEach(resp => {
        const row = ["\u200B" + new Date(resp.submittedAt).toLocaleString()];
        activeForm.questions.forEach(q => {
            const ans = resp.answers[q.id];
            if (ans === undefined || ans === null) {
                row.push("");
            } else if (Array.isArray(ans)) {
                row.push(ans.join("; "));
            } else {
                const valStr = ans.toString();
                if (/^\+?\d{8,}$/.test(valStr) || /^0\d+$/.test(valStr)) {
                    row.push("\u200B" + valStr);
                } else {
                    row.push(valStr);
                }
            }
        });
        rows.push(row);
    });
    
    // Format CSV content
    const csvString = rows.map(r => r.map(cell => {
        const strCell = cell === null || cell === undefined ? "" : String(cell);
        // Double-quote cells containing quotes, commas, or newlines, and escape internal quotes
        if (strCell.includes('"') || strCell.includes(',') || strCell.includes('\n') || strCell.includes('\r')) {
            return `"${strCell.replace(/"/g, '""')}"`;
        }
        return strCell;
    }).join(",")).join("\r\n");
    
    // Create Blob with UTF-8 Byte Order Mark (BOM) to ensure correct character encoding in Excel & Sheets
    const blob = new Blob(["\ufeff" + csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    const safeTitle = (activeForm.title || "untitled_form").toLowerCase().replace(/[^a-z0-9]/g, "_");
    
    link.setAttribute("href", url);
    link.setAttribute("download", `${safeTitle}_responses.csv`);
    document.body.appendChild(link);
    
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// =========================================================================
// HELPERS
// =========================================================================
function generateRandomId(len) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let id = "";
    for (let i = 0; i < len; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

function escapeHTML(str) {
    if (str === undefined || str === null || str === "") return "";
    const s = String(str);
    return s.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
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

// =========================================================================
// SHARE FORM MODAL CONTROLS
// =========================================================================
function openShareModal(url) {
    const modal = document.getElementById("share-modal");
    const urlInput = document.getElementById("share-url-input");
    const qrImg = document.getElementById("share-qr-img");
    
    urlInput.value = url;
    // Generate QR Code via free API
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
    
    // Reset copy button styling
    const copyBtn = document.getElementById("btn-copy-url");
    copyBtn.innerText = "Copy Link";
    copyBtn.style.backgroundColor = "";
    copyBtn.style.borderColor = "";
    
    modal.style.display = "flex";
    
    const cardContent = modal.querySelector(".form-card-base");
    if (cardContent) {
        cardContent.classList.remove("modal-card-active");
        setTimeout(() => {
            cardContent.classList.add("modal-card-active");
        }, 20);
    }
}

function closeShareModal() {
    const modal = document.getElementById("share-modal");
    const cardContent = modal.querySelector(".form-card-base");
    if (cardContent) {
        cardContent.classList.remove("modal-card-active");
    }
    modal.style.display = "none";
}

async function copyShareUrlToClipboard() {
    const urlInput = document.getElementById("share-url-input");
    const copyBtn = document.getElementById("btn-copy-url");
    
    try {
        await navigator.clipboard.writeText(urlInput.value);
        copyBtn.innerText = "Copied!";
        copyBtn.style.backgroundColor = "var(--success-color)";
        copyBtn.style.borderColor = "var(--success-color)";
        
        setTimeout(() => {
            copyBtn.innerText = "Copy Link";
            copyBtn.style.backgroundColor = "";
            copyBtn.style.borderColor = "";
        }, 2000);
    } catch (err) {
        console.error("Clipboard API failed, falling back to selection copy:", err);
        urlInput.select();
        document.execCommand("copy");
        copyBtn.innerText = "Copied!";
        setTimeout(() => {
            copyBtn.innerText = "Copy Link";
        }, 2000);
    }
}

// =========================================================================
// PAGINATION & DRAG-AND-DROP WORKSPACE HELPERS
// =========================================================================

function normalizeQuestionsOrder() {
    if (!activeForm || !activeForm.questions) return;
    
    // Default any missing page/order parameters
    activeForm.questions.forEach((q, idx) => {
        if (q.page === undefined || q.page === null) q.page = 1;
        if (q.order === undefined || q.order === null) q.order = idx;
    });
    
    // Sort questions list globally by page and order
    activeForm.questions.sort((a, b) => {
        if (a.page !== b.page) {
            return (a.page || 1) - (b.page || 1);
        }
        return (a.order || 0) - (b.order || 0);
    });
    
    // Re-assign contiguous orders within each page
    let pageOrders = {};
    activeForm.questions.forEach(q => {
        const p = q.page || 1;
        if (pageOrders[p] === undefined) {
            pageOrders[p] = 0;
        }
        q.order = pageOrders[p]++;
    });
}

function duplicateQuestion(idx) {
    if (!activeForm || !activeForm.questions) return;
    const original = activeForm.questions[idx];
    if (!original) return;
    
    // Deep clone the question object
    const copy = JSON.parse(JSON.stringify(original));
    copy.id = generateRandomId(8);
    
    // Position the copy right after the original
    const pageVal = original.page || 1;
    activeForm.questions.forEach(q => {
        if ((q.page || 1) === pageVal && (q.order || 0) > (original.order || 0)) {
            q.order = (q.order || 0) + 1;
        }
    });
    copy.order = (original.order || 0) + 1;
    
    activeForm.questions.push(copy);
    normalizeQuestionsOrder();
    renderQuestionsEditorList();
    updateLivePreview();
}

function renderPagesTabs() {
    const container = document.getElementById("builder-pages-tabs");
    if (!container) return;
    container.innerHTML = "";
    
    if (totalPages < 1) totalPages = 1;
    
    for (let p = 1; p <= totalPages; p++) {
        const tab = document.createElement("button");
        tab.type = "button";
        tab.className = `page-tab-btn ${p === activePage ? 'active' : ''}`;
        
        const label = document.createElement("span");
        label.innerText = `Page ${p}`;
        tab.appendChild(label);
        
        if (totalPages > 1) {
            const deleteIcon = document.createElement("span");
            deleteIcon.className = "delete-page-icon";
            deleteIcon.innerHTML = "&times;";
            deleteIcon.title = "Delete this page";
            deleteIcon.addEventListener("click", (e) => {
                e.stopPropagation();
                deletePage(p);
            });
            tab.appendChild(deleteIcon);
        }
        
        tab.addEventListener("click", () => {
            activePage = p;
            renderPagesTabs();
            renderQuestionsEditorList();
            updateLivePreview();
        });
        
        container.appendChild(tab);
    }
}

async function deletePage(pageNum) {
    if (!await showConfirm({
        title: `Delete Page ${pageNum}`,
        message: `Are you sure you want to delete Page ${pageNum}?\nAll questions on this page will be deleted permanently.`,
        confirmText: "Delete Page",
        icon: "🗑️"
    })) return;
    
    // Remove all questions on pageNum
    activeForm.questions = activeForm.questions.filter(q => (q.page || 1) !== pageNum);
    
    // For questions on pages > pageNum, shift page number down by 1
    activeForm.questions.forEach(q => {
        const qPage = q.page || 1;
        if (qPage > pageNum) {
            q.page = qPage - 1;
        }
    });
    
    totalPages = Math.max(1, totalPages - 1);
    
    if (activePage > totalPages) {
        activePage = totalPages;
    } else if (activePage === pageNum) {
        activePage = Math.min(pageNum, totalPages);
    }
    
    renderPagesTabs();
    renderQuestionsEditorList();
    updateLivePreview();
}

function initDragAndDrop() {
    const canvas = document.getElementById("questions-editor-list");
    if (!canvas) return;
    
    const toolboxItems = document.querySelectorAll(".toolbox-item");
    toolboxItems.forEach(item => {
        // Drag start from toolbox
        item.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", "new-element");
            e.dataTransfer.setData("element-type", item.dataset.type);
            e.dataTransfer.effectAllowed = "copy";
        });
        
        // Mobile fallback / quick click
        item.addEventListener("click", () => {
            const type = item.dataset.type;
            let label = "New Question";
            switch (type) {
                case "header": label = "Header / Section Title"; break;
                case "text": label = "Text Box"; break;
                case "paragraph": label = "Text Area"; break;
                case "select": label = "Dropdown Select"; break;
                case "radio": label = "Single Choice"; break;
                case "checkbox": label = "Multiple Choice"; break;
                case "date": label = "Date Selection"; break;
                case "file": label = "File Upload"; break;
                case "rating": label = "Rating"; break;
            }
            addQuestion(type, label);
        });
    });
    
    canvas.addEventListener("dragover", (e) => {
        e.preventDefault();
        const isNewElement = e.dataTransfer.types.includes("element-type");
        e.dataTransfer.dropEffect = isNewElement ? "copy" : "move";
        canvas.classList.add("drag-over-active");
        
        const dragOverCard = e.target.closest(".question-edit-card");
        removeDragPlaceholders();
        
        if (dragOverCard) {
            const rect = dragOverCard.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            
            const placeholder = document.createElement("div");
            placeholder.className = "drag-placeholder";
            
            if (e.clientY < midpoint) {
                dragOverCard.before(placeholder);
            } else {
                dragOverCard.after(placeholder);
            }
        }
    });
    
    canvas.addEventListener("dragleave", (e) => {
        if (!canvas.contains(e.relatedTarget)) {
            canvas.classList.remove("drag-over-active");
            removeDragPlaceholders();
        }
    });
    
    canvas.addEventListener("drop", (e) => {
        e.preventDefault();
        canvas.classList.remove("drag-over-active");
        
        const dragType = e.dataTransfer.getData("text/plain");
        const elementType = e.dataTransfer.getData("element-type");
        
        const placeholder = document.querySelector(".drag-placeholder");
        let dropIndex = -1;
        
        const pageQuestions = activeForm.questions
            .filter(q => (q.page || 1) === activePage)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
            
        if (placeholder) {
            const nextCard = placeholder.nextElementSibling;
            if (nextCard && nextCard.classList.contains("question-edit-card")) {
                const nextId = nextCard.dataset.id;
                dropIndex = pageQuestions.findIndex(q => q.id === nextId);
            } else {
                dropIndex = pageQuestions.length;
            }
            placeholder.remove();
        } else {
            dropIndex = pageQuestions.length;
        }
        
        if (dragType === "new-element") {
            insertNewQuestionAt(elementType, dropIndex);
        } else if (dragType === "reorder-element") {
            const dragCardId = e.dataTransfer.getData("card-id");
            reorderQuestionTo(dragCardId, dropIndex);
        }
    });
}

function removeDragPlaceholders() {
    document.querySelectorAll(".drag-placeholder").forEach(el => el.remove());
}

function insertNewQuestionAt(type, pageDropIndex) {
    if (!activeForm) return;
    
    const pageQuestions = activeForm.questions
        .filter(q => (q.page || 1) === activePage)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
        
    let label = "New Question";
    switch (type) {
        case "header": label = "Header / Section Title"; break;
        case "text": label = "Text Box"; break;
        case "paragraph": label = "Text Area"; break;
        case "select": label = "Dropdown Select"; break;
        case "radio": label = "Single Choice"; break;
        case "checkbox": label = "Multiple Choice"; break;
        case "date": label = "Date Selection"; break;
        case "file": label = "File Upload"; break;
        case "rating": label = "Rating"; break;
    }
    
    const newQuestion = {
        id: generateRandomId(8),
        type: type,
        label: label,
        required: false,
        placeholder: ["text", "paragraph", "number", "header"].includes(type) ? "Type subtitle or placeholder here" : "",
        options: ["radio", "checkbox", "select"].includes(type) ? ["Option 1", "Option 2"] : [],
        page: activePage,
        order: 0,
        validations: [],
        allowedFileTypesOnly: false,
        allowedFileTypes: [],
        maxFiles: 1,
        maxFileSize: "10MB",
        ratingScale: 5,
        ratingIcon: "star"
    };
    
    pageQuestions.splice(pageDropIndex, 0, newQuestion);
    
    pageQuestions.forEach((q, idx) => {
        q.order = idx;
    });
    
    activeForm.questions.push(newQuestion);
    
    normalizeQuestionsOrder();
    renderQuestionsEditorList();
    updateLivePreview();
}

function reorderQuestionTo(cardId, pageDropIndex) {
    if (!activeForm) return;
    
    const dragQuestion = activeForm.questions.find(q => q.id === cardId);
    if (!dragQuestion) return;
    
    const pageQuestions = activeForm.questions
        .filter(q => (q.page || 1) === activePage && q.id !== cardId)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
        
    pageQuestions.splice(pageDropIndex, 0, dragQuestion);
    
    pageQuestions.forEach((q, idx) => {
        q.order = idx;
    });
    
    normalizeQuestionsOrder();
    renderQuestionsEditorList();
    updateLivePreview();
}

function checkFirstTimeVisit() {
    const visited = localStorage.getItem("princeform_visited");
    const wrapper = document.querySelector(".dashboard-wrapper-split");
    
    if (visited === "true") {
        if (wrapper) wrapper.classList.add("hide-marketing");
    } else {
        if (wrapper) wrapper.classList.remove("hide-marketing");
    }
}

function loadDemoForm() {
    const demoForm = {
        title: "Demo Contact & Survey Form",
        description: "Explore the advanced drag-and-drop elements and rules of PrinceForm.",
        branding: {
            themeColor: "#2563eb",
            backgroundColor: "#f0f4f8",
            textColor: "#1e293b",
            buttonColor: "#2563eb",
            fontFamily: "Outfit",
            logoUrl: "",
            bannerUrl: "",
            cardStyle: "elevated"
        },
        questions: [
            {
                id: generateRandomId(8),
                type: "header",
                label: "Personal Information",
                placeholder: "Let's start with your details.",
                required: false,
                options: [],
                page: 1,
                order: 0,
                validations: []
            },
            {
                id: generateRandomId(8),
                type: "text",
                label: "What is your full name?",
                placeholder: "Enter your first and last name",
                required: true,
                options: [],
                page: 1,
                order: 1,
                validations: []
            },
            {
                id: generateRandomId(8),
                type: "radio",
                label: "How did you hear about us?",
                placeholder: "",
                required: false,
                options: ["Social Media", "Search Engine", "Friend Referral", "Other"],
                page: 1,
                order: 2,
                validations: []
            },
            {
                id: generateRandomId(8),
                type: "header",
                label: "Feedback details",
                placeholder: "Next, tell us about your experience.",
                required: false,
                options: [],
                page: 2,
                order: 0,
                validations: []
            },
            {
                id: generateRandomId(8),
                type: "file",
                label: "Upload your logo or resume",
                placeholder: "",
                required: false,
                options: [],
                page: 2,
                order: 1,
                validations: []
            }
        ],
        acceptingResponses: true,
        confirmationMessage: "Thank you! Your demo submission was simulated successfully.",
        showSubmitAnother: true,
        customRedirectUrl: "",
        customRedirectLabel: "",
        successIcon: "star",
        successLayout: "splash",
        successDescription: "You've successfully explored the PrinceForm dynamic multi-page preview!",
        successButtons: [],
        successSteps: [],
        showSocialShare: true
    };

    activeForm = demoForm;
    isEditing = false;
    totalPages = 2;
    activePage = 1;
    setupBuilderWorkspace();
    switchTab("builder");
}

// =========================================================================
// GOOGLE SHEETS & RESPONSES MORE ACTIONS
// =========================================================================
function setupResponsesActionsListeners() {
    const btnMore = document.getElementById("btn-responses-more");
    const dropdownMenu = document.getElementById("responses-menu-dropdown");
    
    if (btnMore && dropdownMenu) {
        btnMore.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = dropdownMenu.style.display === "block";
            dropdownMenu.style.display = isOpen ? "none" : "block";
        });
        
        document.addEventListener("click", () => {
            dropdownMenu.style.display = "none";
        });
    }
    
    // Bind Sheets connection modal events
    const btnLinkSheets = document.getElementById("btn-link-sheets");
    const menuLinkSheets = document.getElementById("menu-link-sheets");
    if (btnLinkSheets) btnLinkSheets.addEventListener("click", openSheetsModal);
    if (menuLinkSheets) menuLinkSheets.addEventListener("click", openSheetsModal);
    
    const closeSheetsBtn = document.getElementById("close-sheets-modal");
    if (closeSheetsBtn) closeSheetsBtn.addEventListener("click", closeSheetsModal);
    
    const modalLinkBtn = document.getElementById("btn-modal-link-sheets");
    if (modalLinkBtn) modalLinkBtn.addEventListener("click", linkFormToSheets);
    
    const modalUnlinkBtn = document.getElementById("btn-modal-unlink-sheets");
    if (modalUnlinkBtn) modalUnlinkBtn.addEventListener("click", unlinkFormFromSheets);
    
    const menuUnlinkSheets = document.getElementById("menu-unlink-sheets");
    if (menuUnlinkSheets) menuUnlinkSheets.addEventListener("click", unlinkFormFromSheets);
    
    // Copy formula helper
    const btnCopyFormula = document.getElementById("btn-copy-formula");
    if (btnCopyFormula) {
        btnCopyFormula.addEventListener("click", () => {
            const formulaInput = document.getElementById("sheets-formula-input");
            formulaInput.select();
            
            if (navigator.clipboard) {
                navigator.clipboard.writeText(formulaInput.value)
                    .then(() => { updateCopyUI(btnCopyFormula); })
                    .catch(() => { fallbackCopy(formulaInput.value, btnCopyFormula); });
            } else {
                fallbackCopy(formulaInput.value, btnCopyFormula);
            }
        });
    }
    
    const btnCopyFormulaInstant = document.getElementById("btn-copy-formula-instant");
    if (btnCopyFormulaInstant) {
        btnCopyFormulaInstant.addEventListener("click", () => {
            const formulaInputInstant = document.getElementById("sheets-formula-input-instant");
            formulaInputInstant.select();
            
            if (navigator.clipboard) {
                navigator.clipboard.writeText(formulaInputInstant.value)
                    .then(() => { updateCopyUI(btnCopyFormulaInstant); })
                    .catch(() => { fallbackCopy(formulaInputInstant.value, btnCopyFormulaInstant); });
            } else {
                fallbackCopy(formulaInputInstant.value, btnCopyFormulaInstant);
            }
        });
    }
    
    function fallbackCopy(text, btn) {
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            const successful = document.execCommand("copy");
            document.body.removeChild(textArea);
            if (successful) updateCopyUI(btn);
        } catch (err) {
            console.error("Fallback copy failed:", err);
        }
    }
    
    function updateCopyUI(btn) {
        const originalText = btn.innerText;
        btn.innerText = "Copied!";
        btn.style.background = "#e6f4ea";
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.background = "";
        }, 2000);
    }
    
    // Other actions
    const menuDownloadCsv = document.getElementById("menu-download-csv");
    if (menuDownloadCsv) menuDownloadCsv.addEventListener("click", exportResponsesToCSV);
    
    const menuDownloadZip = document.getElementById("menu-download-files-zip");
    if (menuDownloadZip) menuDownloadZip.addEventListener("click", downloadAllFilesZip);
    
    const menuPrintResponses = document.getElementById("menu-print-responses");
    if (menuPrintResponses) menuPrintResponses.addEventListener("click", printResponses);
    
    const menuDeleteResponses = document.getElementById("menu-delete-responses");
    if (menuDeleteResponses) menuDeleteResponses.addEventListener("click", deleteResponses);
    
    // Close sheets modal on overlay backdrop click
    const sheetsModal = document.getElementById("sheets-modal");
    if (sheetsModal) {
        sheetsModal.addEventListener("click", (e) => {
            if (e.target.id === "sheets-modal") closeSheetsModal();
        });
    }
}

async function openSheetsModal() {
    if (!activeForm || !activeForm.id) return;
    
    const modal = document.getElementById("sheets-modal");
    const formulaInput = document.getElementById("sheets-formula-input");
    const formulaInputInstant = document.getElementById("sheets-formula-input-instant");
    const linkBtn = document.getElementById("btn-modal-link-sheets");
    const unlinkBtn = document.getElementById("btn-modal-unlink-sheets");
    
    // Close dropdown menu if open
    const dropdownMenu = document.getElementById("responses-menu-dropdown");
    if (dropdownMenu) dropdownMenu.style.display = "none";
    
    // Update modal state based on whether the form is currently linked
    if (activeForm.isLinkedToSheets && activeForm.responseShareToken) {
        const importUrl = `${window.location.origin}/api/forms/${activeForm.id}/export/csv?secret=${activeForm.responseShareToken}`;
        formulaInput.value = `=IMPORTDATA(CONCATENATE("${importUrl}&t=", INT(NOW()*24*60)))`;
        formulaInputInstant.value = `=IMPORTDATA(CONCATENATE("${importUrl}&t=", A1))`;
        linkBtn.style.display = "none";
        unlinkBtn.style.display = "block";
    } else {
        const placeholder = "Form not linked. Click 'Link Sheet' to generate formula.";
        formulaInput.value = placeholder;
        formulaInputInstant.value = placeholder;
        linkBtn.style.display = "block";
        unlinkBtn.style.display = "none";
    }
    
    modal.style.display = "flex";
}

function closeSheetsModal() {
    document.getElementById("sheets-modal").style.display = "none";
}

async function linkFormToSheets() {
    if (!activeForm || !activeForm.id) return;
    
    const linkBtn = document.getElementById("btn-modal-link-sheets");
    const originalText = linkBtn.innerText;
    linkBtn.disabled = true;
    linkBtn.innerText = "Linking...";
    
    try {
        const res = await fetch(`/api/forms/${activeForm.id}/link-sheets`, {
            method: "POST"
        });
        if (!res.ok) throw new Error("Failed to link form to Google Sheets");
        
        const data = await res.json();
        
        // Update activeForm in memory
        activeForm.isLinkedToSheets = true;
        activeForm.responseShareToken = data.responseShareToken;
        
        // Update inside formsList list as well
        const fIdx = formsList.findIndex(f => f.id === activeForm.id);
        if (fIdx !== -1) {
            formsList[fIdx].isLinkedToSheets = true;
            formsList[fIdx].responseShareToken = data.responseShareToken;
        }
        
        // Update UI states
        updateSheetsUIState();
        
        // Refresh modal view
        openSheetsModal();
        
        alert("Google Sheets connection generated successfully! Copy the formula below and paste it into A1 of your Google Sheet.");
    } catch (err) {
        console.error(err);
        alert("Error linking Google Sheet: " + err.message);
    } finally {
        linkBtn.disabled = false;
        linkBtn.innerText = originalText;
    }
}

async function unlinkFormFromSheets() {
    if (!activeForm || !activeForm.id) return;
    
    const confirmUnlink = await showConfirm({
        title: "Unlink Google Sheets",
        message: "Are you sure you want to unlink this form?\n\nExisting Google Sheets using the sync formula will no longer receive new responses.",
        confirmText: "Unlink Sheet",
        icon: "⚠️",
        isDanger: true
    });
    if (!confirmUnlink) return;
    
    const unlinkBtn = document.getElementById("btn-modal-unlink-sheets");
    const originalText = unlinkBtn.innerText;
    unlinkBtn.disabled = true;
    unlinkBtn.innerText = "Unlinking...";
    
    try {
        const res = await fetch(`/api/forms/${activeForm.id}/unlink-sheets`, {
            method: "POST"
        });
        if (!res.ok) throw new Error("Failed to unlink form");
        
        // Update activeForm in memory
        activeForm.isLinkedToSheets = false;
        activeForm.responseShareToken = null;
        
        const fIdx = formsList.findIndex(f => f.id === activeForm.id);
        if (fIdx !== -1) {
            formsList[fIdx].isLinkedToSheets = false;
            formsList[fIdx].responseShareToken = null;
        }
        
        updateSheetsUIState();
        closeSheetsModal();
        
        alert("Form unlinked from Google Sheets successfully.");
    } catch (err) {
        console.error(err);
        alert("Error unlinking: " + err.message);
    } finally {
        unlinkBtn.disabled = false;
        unlinkBtn.innerText = originalText;
    }
}

function updateSheetsUIState() {
    const mainBtnText = document.getElementById("sheets-btn-text");
    const unlinkMenuItem = document.getElementById("menu-unlink-sheets");
    const linkSheetsBtn = document.getElementById("btn-link-sheets");
    
    if (!activeForm || !activeForm.id) {
        if (mainBtnText) mainBtnText.innerText = "Link Sheets";
        if (linkSheetsBtn) {
            linkSheetsBtn.disabled = true;
            linkSheetsBtn.style.opacity = "0.5";
            linkSheetsBtn.style.cursor = "not-allowed";
        }
        if (unlinkMenuItem) {
            unlinkMenuItem.disabled = true;
            unlinkMenuItem.classList.add("disabled");
            unlinkMenuItem.style.cursor = "not-allowed";
            unlinkMenuItem.style.color = "var(--text-color-muted)";
        }
        return;
    }
    
    if (linkSheetsBtn) {
        linkSheetsBtn.disabled = false;
        linkSheetsBtn.style.opacity = "1";
        linkSheetsBtn.style.cursor = "pointer";
    }
    
    if (activeForm.isLinkedToSheets) {
        if (mainBtnText) mainBtnText.innerText = "Linked";
        if (linkSheetsBtn) {
            linkSheetsBtn.style.background = "#0b8043"; // darker green for active
        }
        if (unlinkMenuItem) {
            unlinkMenuItem.disabled = false;
            unlinkMenuItem.classList.remove("disabled");
            unlinkMenuItem.style.cursor = "pointer";
            unlinkMenuItem.style.color = "var(--text-color-primary)";
        }
    } else {
        if (mainBtnText) mainBtnText.innerText = "Link Sheets";
        if (linkSheetsBtn) {
            linkSheetsBtn.style.background = "#0f9d58"; // standard sheet green
        }
        if (unlinkMenuItem) {
            unlinkMenuItem.disabled = true;
            unlinkMenuItem.classList.add("disabled");
            unlinkMenuItem.style.cursor = "not-allowed";
            unlinkMenuItem.style.color = "var(--text-color-muted)";
        }
    }
}

function printResponses() {
    const printTitle = document.getElementById("print-form-title");
    if (printTitle && activeForm) {
        printTitle.innerText = "Form: " + (activeForm.title || "Untitled Form");
    }
    window.print();
}

async function deleteResponses() {
    if (!activeForm || !activeForm.id) return;
    const count = activeFormResponses.length;
    if (count === 0) {
        alert("There are no responses to delete.");
        return;
    }
    
    const confirmDelete = await showConfirm({
        title: "Delete All Submissions",
        message: `Are you sure you want to permanently delete all ${count} response(s)?\n\nThis action is irreversible and will permanently delete all submission data from the database.`,
        confirmText: `Delete ${count} Response(s)`,
        icon: "🗑️",
        isDanger: true
    });
    if (!confirmDelete) return;
    
    try {
        const res = await fetch(`/api/forms/${activeForm.id}/responses`, {
            method: "DELETE"
        });
        if (!res.ok) throw new Error("Failed to delete responses");
        
        alert("All responses successfully deleted.");
        // Reload responses
        await loadResponses(activeForm.id);
    } catch (err) {
        console.error(err);
        alert("Error deleting responses: " + err.message);
    }
}

async function downloadAllFilesZip() {
    if (!activeForm || !activeForm.id) return;
    if (activeFormResponses.length === 0) {
        showToast("No response submissions available to package attachments.", "warning");
        return;
    }
    
    showToast("Packaging all attachments into .zip archive...", "info");
    window.location.href = `/api/forms/${activeForm.id}/export/files-zip`;
}

async function openGoogleShareModal(targetFormId) {
    if (targetFormId) {
        try {
            const res = await fetch(`/api/forms/${targetFormId}`);
            if (res.ok) {
                activeForm = await res.json();
            }
        } catch(e) {}
    } else if (activeForm && activeForm.id) {
        try {
            const res = await fetch(`/api/forms/${activeForm.id}`);
            if (res.ok) {
                activeForm = await res.json();
            }
        } catch(e) {}
    }

    let modal = document.getElementById("google-share-form-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "google-share-form-modal";
        modal.style.cssText = "position: fixed; inset: 0; z-index: 99999; background: rgba(0,0,0,0.55); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s ease;";
        document.body.appendChild(modal);
    }

    let userEmail = "contact.princeform@gmail.com";
    let userName = "PrinceForm";

    try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
            const data = await res.json();
            if (data) {
                userName = data.username || "PrinceForm";
                userEmail = data.email || (data.username ? `${data.username.toLowerCase()}@gmail.com` : "contact.princeform@gmail.com");
            }
        }
    } catch (e) {}

    const formTitle = document.getElementById("form-title-input") ? document.getElementById("form-title-input").value : (activeForm ? activeForm.title : "Untitled form");
    const initialChar = userName.charAt(0).toUpperCase() || "P";

    const currentEditorAccess = (activeForm && activeForm.settings && activeForm.settings.editorAccess) || "restricted";
    const currentResponderAccess = (activeForm && activeForm.settings && activeForm.settings.responderAccess) || (activeForm && activeForm.collectEmailAddresses === "verified" ? "verified" : "anyone");
    const isCurrentlyPublished = activeForm ? (activeForm.isPublished !== false && activeForm.acceptingResponses !== false) : true;
    const collaborators = (activeForm && activeForm.settings && activeForm.settings.collaborators) || [];

    let collaboratorsHtml = "";
    collaborators.forEach(email => {
        if (!email) return;
        const initial = email.charAt(0).toUpperCase();
        const namePart = email.split('@')[0];
        collaboratorsHtml += `
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; width: 100%; box-sizing: border-box; margin-top: 10px; padding-top: 10px; border-top: 1px dashed #e8eaed;">
                <div style="display: flex; align-items: center; gap: 12px; min-width: 200px; flex: 1;">
                    <div style="width: 38px; height: 38px; border-radius: 50%; background: #e8f0fe; color: #1a73e8; display: flex; align-items: center; justify-content: center; font-size: 1.05rem; font-weight: 700; flex-shrink: 0;">
                        ${escapeHTML(initial)}
                    </div>
                    <div style="overflow: hidden; text-overflow: ellipsis;">
                        <div style="font-weight: 600; font-size: 0.9rem; color: #202124;">${escapeHTML(namePart)}</div>
                        <div style="font-size: 0.81rem; color: #5f6368; word-break: break-all;">${escapeHTML(email)}</div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                    <span style="font-size: 0.86rem; color: #5f6368; font-weight: 500;">Editor</span>
                    <button type="button" onclick="removeCollaboratorEmail('${escapeHTML(email)}')" style="background: none; border: none; color: #d93025; font-size: 1.25rem; cursor: pointer; padding: 2px 6px; line-height: 1; transition: color 0.2s;" title="Remove access">&times;</button>
                </div>
            </div>
        `;
    });

    modal.innerHTML = `
        <div style="background: #ffffff; border-radius: 24px; max-width: 540px; width: calc(100vw - 24px); max-height: 90vh; overflow-y: auto; overflow-x: hidden; box-sizing: border-box; padding: 24px 20px; box-shadow: 0 24px 60px rgba(0,0,0,0.22); font-family: 'Outfit', 'Roboto', sans-serif; color: #202124; display: flex; flex-direction: column; gap: 20px; animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);">
            
            <!-- Modal Header matching Official Google Forms -->
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                <h2 style="margin: 0; font-size: clamp(1.1rem, 4vw, 1.45rem); font-weight: 500; color: #202124; letter-spacing: -0.3px; word-break: break-word; flex: 1; min-width: 180px;">Share ‘${escapeHTML(formTitle || 'Untitled form')}’</h2>
                <div style="display: flex; align-items: center; gap: 6px; color: #5f6368; flex-shrink: 0;">
                    <button type="button" onclick="openShareHelpGuideModal()" style="background: none; border: none; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #5f6368; transition: background 0.2s;" onmouseover="this.style.background='#f1f3f4'" onmouseout="this.style.background='none'" title="Help & Sharing Guide">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 16h-2v-2h2v2zm1.07-7.75l-.9.92C12.45 11.9 12 12.5 12 14h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/>
                        </svg>
                    </button>
                    <button type="button" onclick="openShareSettingsModal()" style="background: none; border: none; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #5f6368; transition: background 0.2s;" onmouseover="this.style.background='#f1f3f4'" onmouseout="this.style.background='none'" title="Sharing Settings">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Add People Search Box -->
            <div style="position: relative; width: 100%; box-sizing: border-box;">
                <div id="share-people-input-box" style="border: 2px solid #1a73e8; border-radius: 12px; padding: 10px 14px; background: #ffffff; transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box; width: 100%;">
                    <div style="font-size: 0.76rem; color: #1a73e8; font-weight: 600; margin-bottom: 2px;">Add people, groups and calendar events</div>
                    <input type="text" id="share-modal-input-people" placeholder="Type email and press Enter..." style="border: none; outline: none; width: 100%; font-size: 0.92rem; background: transparent; color: #202124; font-family: inherit; box-sizing: border-box;">
                </div>
            </div>

            <!-- People with Access Section -->
            <div style="width: 100%; box-sizing: border-box;">
                <div style="font-weight: 600; font-size: 0.95rem; color: #202124; margin-bottom: 12px;">People with access</div>
                <!-- Owner Row -->
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; width: 100%; box-sizing: border-box;">
                    <div style="display: flex; align-items: center; gap: 12px; min-width: 200px; flex: 1;">
                        <div style="width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg, #1a73e8, #0d47a1); color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 1.15rem; font-weight: 700; box-shadow: 0 2px 8px rgba(26,115,232,0.3); flex-shrink: 0;">
                            ${escapeHTML(initialChar)}
                        </div>
                        <div style="overflow: hidden; text-overflow: ellipsis;">
                            <div style="font-weight: 600; font-size: 0.92rem; color: #202124;">${escapeHTML(userName)} <span style="font-weight:400; color:#5f6368;">(you)</span></div>
                            <div style="font-size: 0.81rem; color: #5f6368; word-break: break-all;">${escapeHTML(userEmail)}</div>
                        </div>
                    </div>
                    <span style="font-size: 0.88rem; color: #5f6368; font-weight: 500; flex-shrink: 0;">Owner</span>
                </div>
                <!-- Dynamic Collaborators List -->
                ${collaboratorsHtml}
            </div>

            <!-- General Access Section -->
            <div style="display: flex; flex-direction: column; gap: 18px; width: 100%; box-sizing: border-box;">
                <div style="font-weight: 600; font-size: 0.95rem; color: #202124;">General access</div>
                
                <!-- Editor View -->
                <div style="display: flex; align-items: flex-start; gap: 12px; flex-wrap: wrap; width: 100%; box-sizing: border-box;">
                    <div style="width: 38px; height: 38px; border-radius: 50%; background: #f1f3f4; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #5f6368;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                        </svg>
                    </div>
                    <div style="flex: 1; min-width: 220px; box-sizing: border-box;">
                        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; font-size: 0.94rem; color: #202124; font-weight: 600;">
                            <span>Editor view</span>
                            <select id="share-editor-access-select" style="border: 1px solid #dadce0; border-radius: 8px; background: #ffffff; font-weight: 500; color: #202124; cursor: pointer; font-size: 0.86rem; outline: none; padding: 5px 8px; font-family: inherit; max-width: 100%; box-sizing: border-box;">
                                <option value="restricted" ${currentEditorAccess === "restricted" ? "selected" : ""}>Restricted</option>
                                <option value="anyone" ${currentEditorAccess === "anyone" ? "selected" : ""}>Anyone with the link</option>
                            </select>
                        </div>
                        <div style="font-size: 0.81rem; color: #5f6368; margin-top: 3px;">Only people with access can open with the link</div>
                    </div>
                </div>

                <!-- Responder View -->
                <div style="display: flex; align-items: flex-start; gap: 12px; flex-wrap: wrap; width: 100%; box-sizing: border-box;">
                    <div style="width: 38px; height: 38px; border-radius: 50%; background: #ceead6; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #137333;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                        </svg>
                    </div>
                    <div style="flex: 1; min-width: 220px; box-sizing: border-box;">
                        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; font-size: 0.94rem; color: #202124; font-weight: 600;">
                            <span>Responder view</span>
                            <select id="share-responder-access-select" style="border: 1px solid #dadce0; border-radius: 8px; background: #ffffff; font-weight: 500; color: #202124; cursor: pointer; font-size: 0.86rem; outline: none; padding: 5px 8px; font-family: inherit; max-width: 100%; box-sizing: border-box;">
                                <option value="anyone" ${currentResponderAccess === "anyone" ? "selected" : ""}>Anyone with the link</option>
                                <option value="verified" ${currentResponderAccess === "verified" ? "selected" : ""}>Verified Users Only</option>
                                <option value="restricted" ${currentResponderAccess === "restricted" ? "selected" : ""}>Restricted</option>
                            </select>
                        </div>
                        <div style="font-size: 0.81rem; color: #5f6368; margin-top: 3px;">Anyone on the Internet with the link can respond</div>
                    </div>
                </div>
            </div>

            <!-- Publish Notice Callout -->
            <div style="background: #e8f0fe; border-radius: 14px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; color: #1a73e8; width: 100%; box-sizing: border-box;">
                <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 180px;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink: 0;">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                    </svg>
                    <div style="font-size: 0.86rem; font-weight: 600; color: #1a73e8;">Publish the form to accept responses</div>
                </div>
                <button type="button" onclick="togglePublishStatusState()" id="btn-toggle-publish-status" class="btn btn-primary" style="font-size: 0.82rem; padding: 6px 14px; border-radius: 16px; background: ${isCurrentlyPublished ? '#1a73e8' : '#5f6368'}; color: #ffffff; border: none; font-weight: 600; cursor: pointer; box-shadow: 0 2px 6px rgba(26,115,232,0.25); flex-shrink: 0;">${isCurrentlyPublished ? 'Published ✓' : 'Draft'}</button>
            </div>

            <!-- Modal Footer -->
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-top: 4px; width: 100%; box-sizing: border-box;">
                <button type="button" onclick="copyFormShareLink()" class="btn btn-secondary" style="border-radius: 20px; font-size: 0.84rem; padding: 8px 14px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid #dadce0; color: #1a73e8; background: #ffffff; font-weight: 600; cursor: pointer; transition: background 0.2s; flex: 1; min-width: 120px;" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='#ffffff'" title="Copy public responder link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
                    </svg>
                    <span>Responder link</span>
                </button>
                <button type="button" onclick="copyFormEditorLink()" class="btn btn-secondary" style="border-radius: 20px; font-size: 0.84rem; padding: 8px 14px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid #dadce0; color: #137333; background: #ffffff; font-weight: 600; cursor: pointer; transition: background 0.2s; flex: 1; min-width: 120px;" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='#ffffff'" title="Copy editor collaboration link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                    <span>Editor link</span>
                </button>
                <button type="button" onclick="closeGoogleShareModal()" style="background: #1a73e8; color: #ffffff; border: none; border-radius: 20px; padding: 8px 22px; font-size: 0.88rem; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(26,115,232,0.35); transition: background 0.2s; flex: 1; min-width: 80px;" onmouseover="this.style.background='#1557b0';" onmouseout="this.style.background='#1a73e8';">
                    Done
                </button>
            </div>
        </div>
    `;
    modal.style.display = "flex";

    // Bind Change listener to Editor Access select
    const editorSelect = document.getElementById("share-editor-access-select");
    if (editorSelect) {
        editorSelect.addEventListener("change", async (e) => {
            if (activeForm) {
                if (!activeForm.settings) activeForm.settings = {};
                activeForm.settings.editorAccess = e.target.value;
                await saveActiveFormSilent();
                showToast(`Editor access set to ${e.target.value === "anyone" ? "Anyone with link" : "Restricted"} ✓`, "success");
            }
        });
    }

    // Bind Change listener to Responder Access select
    const responderSelect = document.getElementById("share-responder-access-select");
    if (responderSelect) {
        responderSelect.addEventListener("change", async (e) => {
            if (activeForm) {
                if (!activeForm.settings) activeForm.settings = {};
                activeForm.settings.responderAccess = e.target.value;
                if (e.target.value === "anyone") {
                    activeForm.collectEmailAddresses = "do_not_collect";
                } else {
                    activeForm.collectEmailAddresses = "verified";
                }
                await saveActiveFormSilent();
                const textLabel = e.target.options[e.target.selectedIndex].text;
                showToast(`Responder access set to ${textLabel} ✓`, "success");
            }
        });
    }

    // Bind Enter key on add people input
    const peopleInput = document.getElementById("share-modal-input-people");
    if (peopleInput) {
        peopleInput.addEventListener("keydown", async (e) => {
            if (e.key === "Enter" && peopleInput.value.trim()) {
                const addedEmail = peopleInput.value.trim();
                if (addedEmail.includes("@")) {
                    if (!activeForm.settings) activeForm.settings = {};
                    if (!activeForm.settings.collaborators) activeForm.settings.collaborators = [];
                    if (!activeForm.settings.collaborators.includes(addedEmail)) {
                        activeForm.settings.collaborators.push(addedEmail);
                        await saveActiveFormSilent();
                    }
                    showToast(`Added ${addedEmail} as form collaborator ✓`, "success");
                    peopleInput.value = "";
                    openGoogleShareModal();
                } else {
                    showToast("Please enter a valid email address.", "warning");
                }
            }
        });
    }
}

async function removeCollaboratorEmail(email) {
    if (!activeForm || !activeForm.settings || !activeForm.settings.collaborators) return;
    activeForm.settings.collaborators = activeForm.settings.collaborators.filter(e => e !== email);
    await saveActiveFormSilent();
    showToast(`Removed ${email} from form collaborators ✓`, "info");
    openGoogleShareModal();
}

function closeGoogleShareModal() {
    const modal = document.getElementById("google-share-form-modal");
    if (modal) modal.style.display = "none";
}

function copyFormShareLink() {
    if (activeForm && activeForm.id) {
        const link = `${window.location.origin}/form/${activeForm.id}`;
        navigator.clipboard.writeText(link);
        showToast("Public Responder link copied to clipboard! 🌐", "success");
    } else {
        showToast("Save the form first to copy share link.", "warning");
    }
}

function copyFormEditorLink() {
    if (activeForm && activeForm.id) {
        const link = `${window.location.origin}/edit/${activeForm.id}`;
        navigator.clipboard.writeText(link);
        showToast("Form Editor collaboration link copied to clipboard! ✏️", "success");
    } else {
        showToast("Save the form first to copy editor link.", "warning");
    }
}

async function saveActiveFormSilent() {
    if (!activeForm || !activeForm.id) return;
    try {
        const res = await fetch(`/api/forms/${activeForm.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(activeForm)
        });
        if (res.ok) {
            const data = await res.json();
            activeForm = data;
        }
    } catch(e) {}
}

async function togglePublishStatusState() {
    const btn = document.getElementById("btn-toggle-publish-status");
    if (!btn || !activeForm) return;
    const currentlyPublished = activeForm.isPublished !== false && activeForm.acceptingResponses !== false;
    if (currentlyPublished) {
        activeForm.isPublished = false;
        activeForm.acceptingResponses = false;
        btn.innerText = "Draft";
        btn.style.background = "#5f6368";
        showToast("Form is now in Draft mode (Submissions Blocked) ⏸️", "info");
    } else {
        activeForm.isPublished = true;
        activeForm.acceptingResponses = true;
        btn.innerText = "Published ✓";
        btn.style.background = "#1a73e8";
        showToast("Form is now Live and accepting responses! 🚀", "success");
    }
    await saveActiveFormSilent();
}

function openShareHelpGuideModal() {
    let modal = document.getElementById("share-help-guide-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "share-help-guide-modal";
        modal.style.cssText = "position: fixed; inset: 0; z-index: 100000; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s ease;";
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div style="background: #ffffff; border-radius: 20px; max-width: 520px; width: 100%; padding: 28px; box-shadow: 0 24px 60px rgba(0,0,0,0.25); font-family: 'Outfit', 'Roboto', sans-serif; color: #202124; display: flex; flex-direction: column; gap: 18px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 36px; height: 36px; border-radius: 50%; background: #e8f0fe; color: #1a73e8; display: flex; align-items: center; justify-content: center;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 16h-2v-2h2v2zm1.07-7.75l-.9.92C12.45 11.9 12 12.5 12 14h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/>
                        </svg>
                    </div>
                    <h3 style="margin: 0; font-size: 1.25rem; font-weight: 600; color: #202124;">Sharing & Permissions Guide</h3>
                </div>
                <button type="button" onclick="document.getElementById('share-help-guide-modal').style.display='none'" style="background: none; border: none; font-size: 1.4rem; cursor: pointer; color: #5f6368;">&times;</button>
            </div>

            <div style="display: flex; flex-direction: column; gap: 14px; font-size: 0.88rem; color: #3c4043; line-height: 1.55;">
                <div style="background: #f8f9fa; border-radius: 12px; padding: 14px 16px; border: 1px solid #e8eaed;">
                    <strong style="color: #1a73e8; display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                        <span>🔒 Editor View Access</span>
                    </strong>
                    <span>Editors can build questions, customize branding, view incoming responses, and export data. Set to <strong>Restricted</strong> to keep editing private to you.</span>
                </div>

                <div style="background: #f8f9fa; border-radius: 12px; padding: 14px 16px; border: 1px solid #e8eaed;">
                    <strong style="color: #137333; display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                        <span>🌐 Responder View Access</span>
                    </strong>
                    <span>Controls who can fill out and submit form responses. Select <strong>Anyone with link</strong> for public surveys, or <strong>Verified Users Only</strong> to require Google Sign-In verification.</span>
                </div>

                <div style="background: #f8f9fa; border-radius: 12px; padding: 14px 16px; border: 1px solid #e8eaed;">
                    <strong style="color: #d93025; display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                        <span>🛡️ Response Security</span>
                    </strong>
                    <span>Forms automatically enforce single-submission rules per verified Google account and protect against automated bot submissions.</span>
                </div>
            </div>

            <div style="display: flex; justify-content: flex-end; margin-top: 6px;">
                <button type="button" onclick="document.getElementById('share-help-guide-modal').style.display='none'" style="background: #1a73e8; color: #fff; border: none; border-radius: 20px; padding: 8px 24px; font-size: 0.9rem; font-weight: 500; cursor: pointer;">
                    Got it
                </button>
            </div>
        </div>
    `;
    modal.style.display = "flex";
}

function openShareSettingsModal() {
    let modal = document.getElementById("share-settings-panel-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "share-settings-panel-modal";
        modal.style.cssText = "position: fixed; inset: 0; z-index: 100000; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s ease;";
        document.body.appendChild(modal);
    }

    const editorsCanShare = activeForm && activeForm.settings && activeForm.settings.editorsCanShare !== undefined ? activeForm.settings.editorsCanShare : true;
    const respondersSeeSummary = activeForm && activeForm.settings && activeForm.settings.respondersSeeSummary !== undefined ? activeForm.settings.respondersSeeSummary : false;
    const requireGoogleAuth = activeForm && activeForm.settings && activeForm.settings.requireGoogleAuth !== undefined ? activeForm.settings.requireGoogleAuth : true;
    const notifyCollaborators = activeForm && activeForm.settings && activeForm.settings.notifyCollaborators !== undefined ? activeForm.settings.notifyCollaborators : true;
    
    // Formatting helper for datetime-local input (YYYY-MM-DDTHH:mm)
    const formatForInput = (dtStr) => {
        if (!dtStr) return "";
        try {
            const d = new Date(dtStr);
            if (isNaN(d.getTime())) return "";
            return d.toISOString().slice(0, 16);
        } catch(e) { return ""; }
    };

    const activeFromVal = formatForInput(activeForm ? activeForm.scheduleActiveFrom : "");
    const expireAtVal = formatForInput(activeForm ? activeForm.scheduleExpireAt : "");
    const maxLimitVal = activeForm && activeForm.maxResponsesLimit ? activeForm.maxResponsesLimit : "";
    const closedMsgVal = activeForm && activeForm.scheduledClosedMessage ? activeForm.scheduledClosedMessage : "This form is currently closed or scheduled to open at a later date.";

    modal.innerHTML = `
        <div style="background: #ffffff; border-radius: 20px; max-width: 540px; width: calc(100vw - 24px); max-height: 90vh; overflow-y: auto; box-sizing: border-box; padding: 24px; box-shadow: 0 24px 60px rgba(0,0,0,0.25); font-family: 'Outfit', 'Roboto', sans-serif; color: #202124; display: flex; flex-direction: column; gap: 20px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 36px; height: 36px; border-radius: 50%; background: #f1f3f4; color: #5f6368; display: flex; align-items: center; justify-content: center;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
                        </svg>
                    </div>
                    <h3 style="margin: 0; font-size: 1.2rem; font-weight: 600; color: #202124;">Form Controls & Smart Schedule</h3>
                </div>
                <button type="button" onclick="document.getElementById('share-settings-panel-modal').style.display='none'" style="background: none; border: none; font-size: 1.4rem; cursor: pointer; color: #5f6368;">&times;</button>
            </div>

            <div style="display: flex; flex-direction: column; gap: 16px;">
                <!-- General Security Options -->
                <label style="display: flex; align-items: flex-start; gap: 12px; cursor: pointer; font-size: 0.88rem; color: #202124;">
                    <input type="checkbox" id="setting-editors-can-share" ${editorsCanShare ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #1a73e8; margin-top: 2px;">
                    <div>
                        <div style="font-weight: 600;">Editors can change permissions and share</div>
                        <div style="font-size: 0.78rem; color: #5f6368; margin-top: 2px;">Allow added collaborators to modify form permissions</div>
                    </div>
                </label>

                <label style="display: flex; align-items: flex-start; gap: 12px; cursor: pointer; font-size: 0.88rem; color: #202124;">
                    <input type="checkbox" id="setting-responders-see-summary" ${respondersSeeSummary ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #1a73e8; margin-top: 2px;">
                    <div>
                        <div style="font-weight: 600;">Responders can view response summary charts</div>
                        <div style="font-size: 0.78rem; color: #5f6368; margin-top: 2px;">Show response analytics after submission</div>
                    </div>
                </label>

                <label style="display: flex; align-items: flex-start; gap: 12px; cursor: pointer; font-size: 0.88rem; color: #202124;">
                    <input type="checkbox" id="setting-require-google-auth" ${requireGoogleAuth ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #1a73e8; margin-top: 2px;">
                    <div>
                        <div style="font-weight: 600;">Require Google Account verification for submission</div>
                        <div style="font-size: 0.78rem; color: #5f6368; margin-top: 2px;">Ensures authentic human user verification</div>
                    </div>
                </label>

                <label style="display: flex; align-items: flex-start; gap: 12px; cursor: pointer; font-size: 0.88rem; color: #202124;">
                    <input type="checkbox" id="setting-notify-collaborators" ${notifyCollaborators ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #1a73e8; margin-top: 2px;">
                    <div>
                        <div style="font-weight: 600;">Notify collaborators when added via email</div>
                        <div style="font-size: 0.78rem; color: #5f6368; margin-top: 2px;">Send an automated email notification</div>
                    </div>
                </label>

                <hr style="border: none; border-top: 1px solid #e8eaed; margin: 4px 0;">
                <div style="font-weight: 700; font-size: 0.92rem; color: #1a73e8; display: flex; align-items: center; gap: 6px;">
                    <span>⏱️ Smart Automation & Expiration Schedule</span>
                </div>

                <!-- Auto-Open Schedule -->
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <label style="font-size: 0.82rem; font-weight: 600; color: #202124;">📅 Auto-Open Form (Active From):</label>
                    <input type="datetime-local" id="setting-schedule-active-from" value="${activeFromVal}" style="padding: 8px 12px; border: 1px solid #dadce0; border-radius: 8px; font-size: 0.86rem; font-family: inherit; color: #202124;">
                    <div style="font-size: 0.76rem; color: #5f6368;">Leave blank for immediate activation. Form will automatically go live at this exact date & time.</div>
                </div>

                <!-- Auto-Expire Schedule -->
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <label style="font-size: 0.82rem; font-weight: 600; color: #202124;">⏳ Auto-Expire Form (Expire At):</label>
                    <input type="datetime-local" id="setting-schedule-expire-at" value="${expireAtVal}" style="padding: 8px 12px; border: 1px solid #dadce0; border-radius: 8px; font-size: 0.86rem; font-family: inherit; color: #202124;">
                    <div style="font-size: 0.76rem; color: #5f6368;">Leave blank for no expiration. Form will automatically close and stop accepting responses after this time.</div>
                </div>

                <!-- Maximum Response Submission Cap -->
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <label style="font-size: 0.82rem; font-weight: 600; color: #202124;">🔢 Max Response Submission Cap:</label>
                    <input type="number" id="setting-max-responses-limit" min="1" placeholder="e.g. 100 (Leave blank for unlimited)" value="${maxLimitVal}" style="padding: 8px 12px; border: 1px solid #dadce0; border-radius: 8px; font-size: 0.86rem; font-family: inherit; color: #202124;">
                    <div style="font-size: 0.76rem; color: #5f6368;">Form automatically closes once this number of total responses is reached.</div>
                </div>

                <!-- Custom Closed Message -->
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <label style="font-size: 0.82rem; font-weight: 600; color: #202124;">💬 Custom Closed / Scheduled Notice Message:</label>
                    <input type="text" id="setting-closed-message" placeholder="This form is currently closed or scheduled to open at a later date." value="${closedMsgVal}" style="padding: 8px 12px; border: 1px solid #dadce0; border-radius: 8px; font-size: 0.86rem; font-family: inherit; color: #202124;">
                </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 6px;">
                <button type="button" onclick="document.getElementById('share-settings-panel-modal').style.display='none'" style="background: none; border: 1px solid #dadce0; color: #3c4043; border-radius: 20px; padding: 8px 20px; font-size: 0.88rem; font-weight: 500; cursor: pointer;">
                    Cancel
                </button>
                <button type="button" onclick="saveShareSettingsState()" style="background: #1a73e8; color: #fff; border: none; border-radius: 20px; padding: 8px 24px; font-size: 0.88rem; font-weight: 500; cursor: pointer; box-shadow: 0 2px 6px rgba(26,115,232,0.3);">
                    Save Settings
                </button>
            </div>
        </div>
    `;
    modal.style.display = "flex";
}

async function saveShareSettingsState() {
    if (!activeForm) return;
    if (!activeForm.settings) activeForm.settings = {};

    const editorsCanShare = document.getElementById("setting-editors-can-share");
    const respondersSeeSummary = document.getElementById("setting-responders-see-summary");
    const requireGoogleAuth = document.getElementById("setting-require-google-auth");
    const notifyCollaborators = document.getElementById("setting-notify-collaborators");
    const activeFromInput = document.getElementById("setting-schedule-active-from");
    const expireAtInput = document.getElementById("setting-schedule-expire-at");
    const maxLimitInput = document.getElementById("setting-max-responses-limit");
    const closedMsgInput = document.getElementById("setting-closed-message");

    if (editorsCanShare) activeForm.settings.editorsCanShare = editorsCanShare.checked;
    if (respondersSeeSummary) activeForm.settings.respondersSeeSummary = respondersSeeSummary.checked;
    if (requireGoogleAuth) activeForm.settings.requireGoogleAuth = requireGoogleAuth.checked;
    if (notifyCollaborators) activeForm.settings.notifyCollaborators = notifyCollaborators.checked;

    if (activeFromInput && activeFromInput.value) {
        activeForm.scheduleActiveFrom = new Date(activeFromInput.value).toISOString();
    } else {
        activeForm.scheduleActiveFrom = null;
    }

    if (expireAtInput && expireAtInput.value) {
        activeForm.scheduleExpireAt = new Date(expireAtInput.value).toISOString();
    } else {
        activeForm.scheduleExpireAt = null;
    }

    if (maxLimitInput && maxLimitInput.value) {
        activeForm.maxResponsesLimit = parseInt(maxLimitInput.value, 10);
    } else {
        activeForm.maxResponsesLimit = null;
    }

    if (closedMsgInput && closedMsgInput.value.trim()) {
        activeForm.scheduledClosedMessage = closedMsgInput.value.trim();
    }

    await saveActiveFormSilent();
    document.getElementById("share-settings-panel-modal").style.display = "none";
    showToast("Smart scheduling and form settings saved! ⏱️", "success");
}
