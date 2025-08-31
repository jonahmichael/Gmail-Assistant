document.addEventListener('DOMContentLoaded', () => {
    // --- State and Configuration ---
    const API_URL = 'http://127.0.0.1:5000/api';
    let allTemplates = [];

    // --- DOM Element Selection ---
    const modalOverlay = document.getElementById('modal');
    const templateListDiv = document.getElementById('templateList');
    const templatePreviewTooltip = document.getElementById('templatePreview');

    const deleteIconSVG = `<svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:#aaa;"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" /></svg>`;

    // --- Core UI & Data Functions ---

    const openModal = () => {
        modalOverlay.classList.add('active');
    };

    const closeModal = () => {
        modalOverlay.classList.remove('active');
        const form = document.getElementById('addTemplateForm');
        form.querySelectorAll('input, textarea').forEach(el => el.value = '');
    };
    
    const renderTemplates = () => {
        templateListDiv.innerHTML = '';
        if (allTemplates.length === 0) {
            templateListDiv.innerHTML = '<div class="list-item-no-data">No templates saved.</div>';
            return;
        }
        allTemplates.forEach(template => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.dataset.subject = template.subject;
            item.dataset.body = template.body;
            item.innerHTML = `
                <span class="list-item-label">${template.title}</span>
                <button class="delete-btn" data-id="${template.id}">${deleteIconSVG}</button>
            `;
            templateListDiv.appendChild(item);
        });
    };

    const loadData = async () => {
        try {
            const response = await fetch(`${API_URL}/templates`);
            if (!response.ok) throw new Error('Network response was not ok.');
            allTemplates = await response.json();
            renderTemplates();
        } catch (error) {
            console.error("Failed to fetch data:", error);
            document.querySelector('.main-content').innerHTML = `<p style="color:red;padding:20px;">Error: Could not connect to the backend server. Please ensure the Python Flask app is running.</p>`;
        }
    };

    // --- Event Listeners ---

    document.getElementById('addNewTemplateBtn').addEventListener('click', openModal);
    document.querySelector('.close-btn').addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

    document.getElementById('saveTemplateBtn').addEventListener('click', async () => {
        const title = document.getElementById('templateTitle').value.trim();
        const subject = document.getElementById('templateSubject').value.trim();
        const templateBody = document.getElementById('templateBody').value.trim();
        if (!title || !subject || !templateBody) return;

        await fetch(`${API_URL}/templates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, subject, body: templateBody })
        });
        closeModal();
        await loadData();
    });

    templateListDiv.addEventListener('click', async (e) => {
        const deleteButton = e.target.closest('.delete-btn');
        const listItem = e.target.closest('.list-item');

        if (deleteButton) {
            const id = deleteButton.dataset.id;
            if (confirm(`Are you sure you want to delete this template?`)) {
                await fetch(`${API_URL}/templates/${id}`, { method: 'DELETE' });
                await loadData();
            }
        } else if (listItem) {
            const template = { subject: listItem.dataset.subject, body: listItem.dataset.body };
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (tab.url?.startsWith("https://mail.google.com/")) {
                await chrome.scripting.executeScript({ target: { tabId: tab.id }, function: injectContent, args: [template] });
                window.close();
            } else {
                alert("Please navigate to your Gmail tab to apply a template.");
            }
        }
    });

    templateListDiv.addEventListener('mouseover', e => {
        const item = e.target.closest('.list-item');
        if (item) {
            templatePreviewTooltip.innerHTML = `<h5>${item.dataset.subject}</h5><p>${item.dataset.body}</p>`;
            templatePreviewTooltip.style.display = 'block';
        }
    });
    templateListDiv.addEventListener('mousemove', e => {
        templatePreviewTooltip.style.left = (e.clientX + 15) + 'px';
        templatePreviewTooltip.style.top = (e.clientY) + 'px';
    });
    templateListDiv.addEventListener('mouseout', () => {
        templatePreviewTooltip.style.display = 'none';
    });

    // =================================================================================================
    // START OF THE FINAL, FULLY CORRECTED INJECTION FUNCTION
    // =================================================================================================
    
    const injectContent = async (template) => {
        
        const delay = ms => new Promise(res => setTimeout(res, ms));

        // THE DEFINITIVE FIX: An intelligent function that waits for the compose window to be ready.
        const getComposeContainer = async () => {
            // Poll the document for up to 2 seconds
            for (let i = 0; i < 20; i++) {
                const dialogs = document.querySelectorAll('div[role="dialog"]');
                for (const dialog of dialogs) {
                    // Check for a unique and stable element inside the compose dialog: the "Send" button's tooltip.
                    if (dialog.querySelector('div[data-tooltip^="Send"]')) {
                        return dialog; // Found it! Return the container immediately.
                    }
                }
                await delay(100); // If not found, wait 100ms and try again.
            }
            return null; // If not found after 2 seconds, return null.
        };

        console.log("Gmail Assistant: Looking for compose window...");
        const composeContainer = await getComposeContainer();
        
        if (!composeContainer) {
            alert("Could not find an active Gmail compose window. Please ensure it is fully open and try again.");
            return;
        }
        console.log("Gmail Assistant: Compose window found. Injecting content...");

        const fillField = async (element, value) => {
            element.focus();
            element.value = value;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.blur();
            await delay(50);
        };
        
        if (template) {
            const subjectField = composeContainer.querySelector('input[name="subjectbox"]');
            if (subjectField) {
                await fillField(subjectField, template.subject);
            }

            const bodyField = composeContainer.querySelector('div[aria-label="Message Body"]');
            if (bodyField) {
                bodyField.focus();
                bodyField.innerText = template.body;
                bodyField.dispatchEvent(new Event('input', { bubbles: true }));
                bodyField.blur();
            }
        }
        console.log("Gmail Assistant: Injection complete.");
    };
    
    // =================================================================================================
    // END OF THE NEW INJECTION FUNCTION
    // =================================================================================================
    
    // --- Initial Load ---
    loadData();
});