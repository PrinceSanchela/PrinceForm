// =========================================================================
// Prince Form Builder - Responder Client Javascript
// =========================================================================

document.addEventListener("DOMContentLoaded", () => {
    initFormResponder();
});

function initFormResponder() {
    const formElement = document.getElementById("responder-form-element");
    if (!formElement) return;
    
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
    e.preventDefault();
    
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
    const responsePayload = {
        formId: formId,
        answers: answers
    };
    
    try {
        const submitBtn = document.getElementById("btn-submit-form");
        submitBtn.disabled = true;
        submitBtn.innerText = "Submitting...";
        
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
        
        renderSuccessView();
    } catch (err) {
        console.error(err);
        alert(err.message || "An error occurred during submission. Please try again.");
        const submitBtn = document.getElementById("btn-submit-form");
        submitBtn.disabled = false;
        submitBtn.innerText = "Submit";
    }
}

function resetFormInputs() {
    if (!confirm("Are you sure you want to clear all inputs?")) return;
    
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
        if (btnsJson) ctaBtns = JSON.parse(btnsJson.textContent.trim());
    } catch(err) {
        console.error("Error parsing CTA buttons JSON:", err);
    }
    
    let steps = [];
    try {
        const stepsJson = document.getElementById("form-success-steps-json");
        if (stepsJson) steps = JSON.parse(stepsJson.textContent.trim());
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
