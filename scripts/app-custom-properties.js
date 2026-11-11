// Application property definitions and per-app values share stable property IDs.
const APP_CUSTOM_PROPERTIES_STORAGE_KEY = 'forguncy.appCustomProperties.v1';
let appCustomPropertyState = { fields: [], values: {} };
let editingAppCustomPropertyId = null;
let appCustomPropertyEditorOpener = null;

function initAppCustomProperties() {
    try {
        const saved = JSON.parse(localStorage.getItem(APP_CUSTOM_PROPERTIES_STORAGE_KEY));
        if (saved && Array.isArray(saved.fields) && saved.values && typeof saved.values === 'object' &&
            saved.fields.every(field => /^app-property-[a-z0-9-]+$/.test(field.id) &&
                typeof field.name === 'string' && typeof field.description === 'string')) {
            appCustomPropertyState = saved;
        }
    } catch (error) {
        console.warn('Could not load app custom properties.', error);
    }

    document.getElementById('appCustomPropertyForm').addEventListener('submit', event => {
        event.preventDefault();
        saveAppCustomProperty();
    });
    document.getElementById('appCustomPropertyName').addEventListener('input', event => {
        event.target.setCustomValidity('');
        document.getElementById('appCustomPropertyError').textContent = '';
    });
    ['appCustomPropertiesDialog', 'appCustomPropertyEditorDialog'].forEach(dialogId => {
        const dialog = document.getElementById(dialogId);
        const close = dialogId === 'appCustomPropertiesDialog'
            ? closeAppCustomPropertiesDialog : cancelAppCustomPropertyEdit;
        dialog.addEventListener('click', event => {
            if (event.target === dialog) close();
        });
        dialog.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                event.preventDefault();
                close();
            }
            if (event.key === 'Tab') {
                const controls = [...dialog.querySelectorAll('button, input, textarea')]
                    .filter(control => !control.disabled && control.getClientRects().length);
                const first = controls[0];
                const last = controls[controls.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        });
    });
    document.getElementById('appCustomPropertyInputs').addEventListener('input', () => {
        document.getElementById('appCustomPropertySaveStatus').textContent = '';
    });
    renderAppCustomPropertyColumns();
    renderAppCustomPropertyInputs();
}

function persistAppCustomProperties(nextState, statusElement) {
    try {
        localStorage.setItem(APP_CUSTOM_PROPERTIES_STORAGE_KEY, JSON.stringify(nextState));
        appCustomPropertyState = nextState;
        return true;
    } catch (error) {
        statusElement.textContent = 'Unable to save changes. Browser storage may be unavailable or full.';
        console.error('Could not save app custom properties.', error);
        return false;
    }
}

function openAppCustomPropertiesDialog() {
    cancelAppCustomPropertyEdit(false);
    document.getElementById('appCustomPropertiesStatus').textContent = '';
    renderAppCustomPropertiesTable();
    document.getElementById('appCustomPropertiesDialog').classList.add('active');
    document.getElementById('addAppPropertyButton').focus();
}

function closeAppCustomPropertiesDialog() {
    cancelAppCustomPropertyEdit(false);
    document.getElementById('appCustomPropertiesDialog').classList.remove('active');
    document.getElementById('appCustomPropertiesButton').focus();
}

function renderAppCustomPropertiesTable() {
    const body = document.getElementById('appCustomPropertiesTableBody');
    body.replaceChildren();
    if (!appCustomPropertyState.fields.length) {
        body.innerHTML = '<tr><td colspan="3" class="app-property-empty">No custom properties yet. Click Add Property to get started.</td></tr>';
        return;
    }
    appCustomPropertyState.fields.forEach(field => {
        const row = document.createElement('tr');
        const name = row.insertCell();
        name.textContent = field.name;
        const description = row.insertCell();
        description.textContent = field.description;
        const actions = row.insertCell();
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.className = 'app-property-edit';
        edit.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 4l4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15l-1 6z"/></svg>';
        edit.title = 'Edit';
        edit.setAttribute('aria-label', `Edit ${field.name}`);
        edit.addEventListener('click', () => editAppCustomProperty(field.id));
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'app-property-delete';
        remove.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg>';
        remove.title = 'Delete';
        remove.setAttribute('aria-label', `Delete ${field.name}`);
        remove.addEventListener('click', () => deleteAppCustomProperty(field.id));
        actions.className = 'app-property-actions';
        actions.append(edit, remove);
        body.appendChild(row);
    });
}

function editAppCustomProperty(fieldId) {
    const field = appCustomPropertyState.fields.find(item => item.id === fieldId);
    editingAppCustomPropertyId = field ? field.id : null;
    appCustomPropertyEditorOpener = document.activeElement;
    document.getElementById('appCustomPropertyFormTitle').textContent = field ? 'Edit Property' : 'Add Property';
    const name = document.getElementById('appCustomPropertyName');
    name.value = field ? field.name : '';
    name.setCustomValidity('');
    document.getElementById('appCustomPropertyDescription').value = field ? field.description : '';
    document.getElementById('appCustomPropertyError').textContent = '';
    document.getElementById('appCustomPropertiesStatus').textContent = '';
    document.getElementById('appCustomPropertyEditorDialog').classList.add('active');
    name.focus();
    const manager = document.getElementById('appCustomPropertiesDialog');
    manager.inert = true;
    manager.setAttribute('aria-hidden', 'true');
}

function cancelAppCustomPropertyEdit(restoreFocus = true) {
    editingAppCustomPropertyId = null;
    document.getElementById('appCustomPropertyEditorDialog').classList.remove('active');
    const manager = document.getElementById('appCustomPropertiesDialog');
    manager.inert = false;
    manager.removeAttribute('aria-hidden');
    document.getElementById('appCustomPropertyName').setCustomValidity('');
    if (restoreFocus) {
        const target = appCustomPropertyEditorOpener?.isConnected
            ? appCustomPropertyEditorOpener : document.getElementById('addAppPropertyButton');
        target.focus();
    }
    appCustomPropertyEditorOpener = null;
}

function saveAppCustomProperty() {
    const input = document.getElementById('appCustomPropertyName');
    const name = input.value.trim();
    const error = document.getElementById('appCustomPropertyError');
    const duplicate = appCustomPropertyState.fields.some(field =>
        field.id !== editingAppCustomPropertyId && field.name.toLowerCase() === name.toLowerCase());
    if (!name || duplicate) {
        error.textContent = !name ? 'Enter a property name.' : 'A property with this name already exists.';
        input.setCustomValidity(error.textContent);
        input.reportValidity();
        return;
    }
    const isEditing = editingAppCustomPropertyId !== null;
    const property = {
        id: editingAppCustomPropertyId || `app-property-${crypto.randomUUID()}`,
        name,
        description: document.getElementById('appCustomPropertyDescription').value.trim()
    };
    const fields = isEditing
        ? appCustomPropertyState.fields.map(field => field.id === property.id ? property : field)
        : [...appCustomPropertyState.fields, property];
    if (!persistAppCustomProperties({ ...appCustomPropertyState, fields }, error)) return;
    cancelAppCustomPropertyEdit();
    renderAppCustomPropertiesTable();
    document.getElementById('addAppPropertyButton').focus();
    renderAppCustomPropertyColumns();
    renderAppCustomPropertyInputs();
}

function deleteAppCustomProperty(fieldId) {
    document.getElementById('appCustomPropertiesStatus').textContent = '';
    const field = appCustomPropertyState.fields.find(item => item.id === fieldId);
    if (!field || !confirm(`Delete "${field.name}"? This will also delete its values from all apps.`)) return;
    const values = {};
    Object.entries(appCustomPropertyState.values).forEach(([appId, appValues]) => {
        values[appId] = { ...appValues };
        delete values[appId][fieldId];
    });
    const nextState = { fields: appCustomPropertyState.fields.filter(item => item.id !== fieldId), values };
    if (!persistAppCustomProperties(nextState, document.getElementById('appCustomPropertiesStatus'))) return;
    if (editingAppCustomPropertyId === fieldId) cancelAppCustomPropertyEdit();
    renderAppCustomPropertiesTable();
    renderAppCustomPropertyColumns();
    renderAppCustomPropertyInputs();
    document.getElementById('addAppPropertyButton').focus();
}

function renderAppCustomPropertyColumns() {
    const table = document.querySelector('.all-apps-table');
    if (!table) return;
    // Keep View Settings choices when values or definitions change.
    const hiddenColumns = new Set([...table.querySelectorAll('th[data-app-property]')]
        .filter(header => header.style.display === 'none').map(header => header.dataset.column));
    table.querySelectorAll('[data-app-property]').forEach(cell => cell.remove());
    const columnList = document.querySelector('#viewSettingsDialog .column-list');
    columnList.querySelectorAll('[data-app-property]').forEach(item => item.remove());
    appCustomPropertyState.fields.forEach(field => {
        const visible = !hiddenColumns.has(field.id);
        const header = document.createElement('th');
        header.dataset.appProperty = field.id;
        header.dataset.column = field.id;
        header.scope = 'col';
        header.textContent = field.name;
        header.title = field.description;
        header.style.display = visible ? '' : 'none';
        table.tHead.rows[0].appendChild(header);
        table.querySelectorAll('tbody tr[data-app-id]').forEach(row => {
            const cell = row.insertCell();
            cell.dataset.appProperty = field.id;
            cell.dataset.column = field.id;
            cell.textContent = appCustomPropertyState.values[row.dataset.appId]?.[field.id] || '';
            cell.style.display = visible ? '' : 'none';
        });
        const item = document.createElement('div');
        item.className = 'column-item';
        item.dataset.appProperty = field.id;
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `col-${field.id}`;
        checkbox.className = 'column-checkbox';
        checkbox.dataset.column = field.id;
        checkbox.checked = visible;
        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.className = 'column-label';
        label.textContent = field.name;
        item.append(checkbox, label);
        columnList.appendChild(item);
    });
}

function renderAppCustomPropertyInputs() {
    const container = document.getElementById('appCustomPropertyInputs');
    if (!container) return;
    const appId = document.querySelector('.app-mgmt-item.active')?.dataset.id;
    container.replaceChildren();
    document.getElementById('appCustomPropertySaveStatus').textContent = '';
    if (!appCustomPropertyState.fields.length) {
        container.innerHTML = '<p class="app-property-empty">No custom properties have been added.</p>';
        return;
    }
    appCustomPropertyState.fields.forEach(field => {
        const group = document.createElement('div');
        group.className = 'app-property-value';
        const label = document.createElement('label');
        label.htmlFor = `value-${field.id}`;
        label.textContent = field.name;
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-input';
        input.id = label.htmlFor;
        input.dataset.appPropertyId = field.id;
        input.placeholder = 'Enter value';
        input.value = appCustomPropertyState.values[appId]?.[field.id] || '';
        group.append(label, input);
        if (field.description) {
            const help = document.createElement('p');
            help.id = `help-${field.id}`;
            help.className = 'app-property-help';
            help.textContent = field.description;
            input.setAttribute('aria-describedby', help.id);
            group.appendChild(help);
        }
        container.appendChild(group);
    });
}

function saveAppCustomPropertyValues() {
    const appId = document.querySelector('.app-mgmt-item.active:not([data-id="all-apps"])')?.dataset.id;
    if (!appId) return;
    const appValues = {};
    document.querySelectorAll('#appCustomPropertyInputs [data-app-property-id]').forEach(input => {
        appValues[input.dataset.appPropertyId] = input.value;
    });
    const nextState = { ...appCustomPropertyState, values: { ...appCustomPropertyState.values, [appId]: appValues } };
    const status = document.getElementById('appCustomPropertySaveStatus');
    if (!persistAppCustomProperties(nextState, status)) return;
    renderAppCustomPropertyColumns();
    status.textContent = 'Custom properties saved.';
}
