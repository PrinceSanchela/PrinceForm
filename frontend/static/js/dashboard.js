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

// Theme Colors Presets
const PRESET_COLORS = [
    "#673ab7", "#3f51b5", "#2196f3", "#00bcd4", 
    "#009688", "#4caf50", "#ff9800", "#ff5722", 
    "#795548", "#607d8b", "#e91e63", "#9c27b0"
];

// Document Elements
document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

function initApp() {
    checkFirstTimeVisit();
    setupTabNavigation();
    loadForms();
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
    document.getElementById("btn-export-csv").addEventListener("click", exportResponsesToCSV);
    
    // Share modal handlers
    document.getElementById("close-share-modal").addEventListener("click", closeShareModal);
    document.getElementById("share-modal").addEventListener("click", (e) => {
        if (e.target.id === "share-modal") closeShareModal();
    });
    document.getElementById("btn-copy-url").addEventListener("click", copyShareUrlToClipboard);
    document.getElementById("btn-share-builder").addEventListener("click", () => {
        if (activeForm && activeForm.id) {
            const formUrl = `${window.location.origin}/form/${activeForm.id}`;
            openShareModal(formUrl);
        }
    });

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
            const targetTab = e.target.dataset.tab;
            
            // Prevent entering builder or responses directly without a form
            if ((targetTab === "builder" || targetTab === "responses") && !activeForm) {
                alert("Please select or create a form first.");
                return;
            }
            
            switchTab(targetTab);
        });
    });
}

function switchTab(tabName) {
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
    if (!confirm("Are you sure you want to delete this form and all its responses?")) return;
    
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
    const exportBtn = document.getElementById("btn-export-csv");
    
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="100" style="text-align:center; padding: 32px;"><span class="btn-spinner spinner-dark" style="width: 24px; height: 24px; border-width: 2.5px;"></span> Loading submissions...</td></tr>`;
    }
    if (chartsContainer) {
        chartsContainer.innerHTML = `<div style="text-align:center; padding:48px; color:var(--text-color-muted); grid-column: 1/-1;"><span class="btn-spinner spinner-dark" style="width: 28px; height: 28px; border-width: 2.5px; margin-bottom: 8px;"></span><br>Loading analytics breakdown...</div>`;
    }
    if (exportBtn) {
        exportBtn.disabled = true;
    }
    
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
        card.querySelector(".btn-share").addEventListener("click", () => openShareModal(cardUrl));
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
        validations: []
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
    previewWrapper.style.borderRadius = "12px";
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
                <div class="success-layout-splash animate-fade-in" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; min-height: 100%; background: linear-gradient(135deg, var(--theme-color) 0%, var(--button-color) 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10; color: #ffffff; padding: 24px; box-sizing: border-box; overflow-y: auto; border-radius: 26px;">
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
                inputFieldHtml = `
                    <div style="border: 1.5px dashed var(--border-color); padding: 12px; border-radius: var(--border-radius-sm); text-align: center; background: rgba(0,0,0,0.01);">
                        <span style="font-size: 1.1rem; display: block; margin-bottom: 2px;">📁</span>
                        <span style="font-size: 0.75rem; color: var(--text-color-secondary);">Select file (Max 10MB)</span>
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
    
    // Headers: Timestamp + Question Labels
    const timeHeader = document.createElement("th");
    timeHeader.innerText = "Submitted At";
    theadRow.appendChild(timeHeader);
    
    activeForm.questions.forEach(q => {
        const th = document.createElement("th");
        th.innerText = q.label;
        theadRow.appendChild(th);
    });
    
    // Rows
    activeFormResponses.forEach(resp => {
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
            } else if (Array.isArray(answer)) {
                td.innerText = answer.join(", ");
            } else {
                td.innerText = answer;
            }
            tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
    });
}

function renderAnalyticsCharts() {
    const chartsContainer = document.getElementById("analytics-charts-container");
    chartsContainer.innerHTML = "";
    
    if (activeFormResponses.length === 0) {
        chartsContainer.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-color-muted); grid-column: 1/-1;">No data available to chart.</div>`;
        return;
    }
    
    activeForm.questions.forEach(q => {
        const chartCard = document.createElement("div");
        chartCard.className = "chart-card animate-fade-in";
        
        const title = document.createElement("div");
        title.className = "chart-title";
        title.innerText = q.label;
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
                const pct = totalAnswers > 0 ? Math.round((val / activeFormResponses.length) * 100) : 0;
                
                const barRow = document.createElement("div");
                barRow.className = "bar-row";
                barRow.innerHTML = `
                    <div class="bar-label-row">
                        <span>${escapeHTML(opt)}</span>
                        <span>${val} (${pct}%)</span>
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
            
            let responsesCount = 0;
            activeFormResponses.forEach(resp => {
                const ans = resp.answers[q.id];
                if (ans) {
                    responsesCount++;
                    const item = document.createElement("div");
                    item.className = "text-response-item";
                    item.innerText = ans;
                    listDiv.appendChild(item);
                }
            });
            
            if (responsesCount === 0) {
                listDiv.innerHTML = `<span style="color:var(--text-color-muted); font-style:italic; font-size:0.85rem;">No answers filled in.</span>`;
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
        const row = [new Date(resp.submittedAt).toISOString()];
        activeForm.questions.forEach(q => {
            const ans = resp.answers[q.id];
            if (ans === undefined || ans === null) {
                row.push("");
            } else if (Array.isArray(ans)) {
                row.push(ans.join("; "));
            } else {
                row.push(ans.toString());
            }
        });
        rows.push(row);
    });
    
    // Format csv
    const csvContent = "data:text/csv;charset=utf-8," 
        + rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeForm.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_responses.csv`);
    document.body.appendChild(link);
    
    link.click();
    document.body.removeChild(link);
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

function deletePage(pageNum) {
    if (!confirm(`Are you sure you want to delete Page ${pageNum}? All questions on this page will be deleted permanently.`)) return;
    
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
        validations: []
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
