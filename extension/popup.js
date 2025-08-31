document.addEventListener('DOMContentLoaded', () => {
    // --- State and Configuration ---
    const API_URL = 'http://127.0.0.1:5000/api';
    let currentStep = 1;
    const totalSteps = 4;
    let allContacts = [];
    let allTemplates = [];

    // --- DOM Element Selection ---
    const steps = document.querySelectorAll('.wizard-step');
    const dotsContainer = document.getElementById('dotsContainer');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const applyBtn = document.getElementById('applyBtn');
    const modalOverlay = document.getElementById('modal');
    const contactForm = document.getElementById('addContactForm');
    const templateForm = document.getElementById('addTemplateForm');
    const templatePreviewTooltip = document.getElementById('templatePreview');

    const deleteIconSVG = `<svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:#999;"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" /></svg>`;

    // --- Core Functions ---

    const updateWizardUI = () => {
        steps.forEach(step => step.classList.remove('active'));
        document.querySelector(`.wizard-step[data-step="${currentStep}"]`).classList.add('active');
        document.querySelectorAll('.dot').forEach((dot, i) => dot.classList.toggle('active', i + 1 === currentStep));

        prevBtn.style.visibility = (currentStep === 1) ? 'hidden' : 'visible';
        nextBtn.style.display = (currentStep === totalSteps) ? 'none' : 'block';
        applyBtn.style.display = (currentStep === totalSteps) ? 'block' : 'none';
    };

    const openModal = (formType) => {
        contactForm.classList.toggle('active', formType === 'contact');
        templateForm.classList.toggle('active', formType === 'template');
        modalOverlay.classList.add('active');
    };

    const closeModal = () => {
        modalOverlay.classList.remove('active');
        // Clear form fields
        contactForm.querySelector('input').value = '';
        contactForm.querySelector('input[type="email"]').value = '';
        templateForm.querySelectorAll('input, textarea').forEach(el => el.value = '');
    };

    const renderContacts = () => {
        ['toList', 'ccList', 'bccList'].forEach(listId => {
            const listDiv = document.getElementById(listId);
            listDiv.innerHTML = '';
            if (allContacts.length === 0) {
                listDiv.innerHTML = '<div class="list-item-no-data">No contacts saved.</div>';
                return;
            }
            allContacts.forEach(contact => {
                const item = document.createElement('div');
                item.className = 'list-item';
                // Use checkbox for multiple selections
                item.innerHTML = `
                    <input type="checkbox" id="${listId}-${contact.id}" data-email="${contact.email}">
                    <label for="${listId}-${contact.id}">${contact.name}</label>
                    <button class="delete-btn" data-id="${contact.id}" data-type="contact">${deleteIconSVG}</button>
                `;
                listDiv.appendChild(item);
            });
        });
    };
    
    const renderTemplates = () => {
        const templateListDiv = document.getElementById('templateList');
        templateListDiv.innerHTML = '';
        if (allTemplates.length === 0) {
            templateListDiv.innerHTML = '<div class="list-item-no-data">No templates saved.</div>';
            return;
        }
        allTemplates.forEach(template => {
            const item = document.createElement('div');
            item.className = 'list-item';
            // Use radio button for single selection
            item.innerHTML = `
                <input type="radio" name="template" id="template-${template.id}" data-subject="${template.subject}" data-body="${template.body}">
                <label for="template-${template.id}">${template.title}</label>
                <button class="delete-btn" data-id="${template.id}" data-type="template">${deleteIconSVG}</button>
            `;
            templateListDiv.appendChild(item);
        });
    };

    const loadData = async () => {
        try {
            const [contactsRes, templatesRes] = await Promise.all([
                fetch(`${API_URL}/contacts`),
                fetch(`${API_URL}/templates`)
            ]);
            if (!contactsRes.ok || !templatesRes.ok) throw new Error('Network response was not ok.');
            allContacts = await contactsRes.json();
            allTemplates = await templatesRes.json();
            renderContacts();
            renderTemplates();
        } catch (error) {
            console.error("Failed to fetch data:", error);
            document.querySelector('.main-content').innerHTML = `<p style="color:red;padding:20px;">Error: Could not connect to the backend server. Please make sure the Python Flask app is running.</p>`;
        }
    };

    // --- Event Listeners ---

    nextBtn.addEventListener('click', () => { if (currentStep < totalSteps) { currentStep++; updateWizardUI(); } });
    prevBtn.addEventListener('click', () => { if (currentStep > 1) { currentStep--; updateWizardUI(); } });
    
    document.querySelectorAll('.add-new-btn').forEach(btn => btn.addEventListener('click', e => openModal(e.target.dataset.target)));
    document.querySelectorAll('.close-btn').forEach(btn => btn.addEventListener('click', closeModal));
    modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

    document.getElementById('saveContactBtn').addEventListener('click', async () => {
        const name = document.getElementById('contactName').value.trim();
        const email = document.getElementById('contactEmail').value.trim();
        if (!name || !email) return;
        await fetch(`${API_URL}/contacts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email }) });
        closeModal();
        await loadData();
    });

    document.getElementById('saveTemplateBtn').addEventListener('click', async () => {
        const title = document.getElementById('templateTitle').value.trim();
        const subject = document.getElementById('templateSubject').value.trim();
        const body = document.getElementById('templateBody').value.trim();
        if (!title || !subject || !body) return;
        await fetch(`${API_URL}/templates`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, subject, body }) });
        closeModal();
        await loadData();
    });

    document.body.addEventListener('click', async (e) => {
        const deleteButton = e.target.closest('.delete-btn');
        if (deleteButton) {
            const { id, type } = deleteButton.dataset;
            if (confirm(`Are you sure you want to delete this ${type}?`)) {
                await fetch(`${API_URL}/${type}s/${id}`, { method: 'DELETE' });
                await loadData();
            }
        }
    });

    const templateListDiv = document.getElementById('templateList');
    templateListDiv.addEventListener('mouseover', e => {
        const item = e.target.closest('.list-item');
        if (item) {
            const radio = item.querySelector('input[type="radio"]');
            templatePreviewTooltip.innerHTML = `<h5>${radio.dataset.subject}</h5><p>${radio.dataset.body}</p>`;
            templatePreviewTooltip.style.display = 'block';
        }
    });
    templateListDiv.addEventListener('mousemove', e => {
        templatePreviewTooltip.style.left = (e.clientX + 15) + 'px';
        templatePreviewTooltip.style.top = (e.clientY) + 'px';
    });
    templateListDiv.addEventListener('mouseout', () => templatePreviewTooltip.style.display = 'none');

    applyBtn.addEventListener('click', async () => {
        const recipients = {
            to: Array.from(document.querySelectorAll('#toList input:checked')).map(cb => cb.dataset.email),
            cc: Array.from(document.querySelectorAll('#ccList input:checked')).map(cb => cb.dataset.email),
            bcc: Array.from(document.querySelectorAll('#bccList input:checked')).map(cb => cb.dataset.email)
        };
        const checkedTemplate = document.querySelector('#templateList input:checked');
        const template = checkedTemplate ? { subject: checkedTemplate.dataset.subject, body: checkedTemplate.dataset.body } : null;

        if (recipients.to.length === 0 && recipients.cc.length === 0 && recipients.bcc.length === 0) {
            return alert('You must select at least one recipient.');
        }

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab.url?.startsWith("https://mail.google.com/")) {
            chrome.scripting.executeScript({ target: { tabId: tab.id }, function: injectContent, args: [recipients, template] });
        } else {
            alert("Please navigate to your Gmail tab to apply.");
        }
    });

    const injectContent = (recipients, template) => {
        const fillRecipients = (type, emails) => {
            if (!emails || emails.length === 0) return;
            const input = document.querySelector(`input[name="${type}"]`);
            if (input) {
                const existing = input.value ? input.value + ', ' : '';
                input.value = existing + emails.join(', ');
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        };
        if (template) {
            const subjectField = document.querySelector('input[name="subjectbox"]');
            if (subjectField) subjectField.value = template.subject;
            const bodyField = document.querySelector('div[aria-label="Message Body"]');
            if (bodyField) bodyField.innerText = template.body;
        }
        fillRecipients('to', recipients.to);
        fillRecipients('cc', recipients.cc);
        fillRecipients('bcc', recipients.bcc);
    };

    // --- Initial Load ---
    for (let i = 0; i < totalSteps; i++) {
        dotsContainer.appendChild(document.createElement('div')).className = 'dot';
    }
    updateWizardUI();
    loadData();
});