let editingRuleId = null;

function renderRuleSetsList() {
    const rules = getRuleSets();
    const container = document.getElementById('rules-list');
    container.innerHTML = '';

    rules.forEach(rule => {
        const div = document.createElement('div');
        div.className = 'rule-list-item';
        
        let compCount = 0;
        rule.items.forEach(i => {
            if (i.type === 'component') compCount++;
            else if (i.type === 'group' && i.children) compCount += i.children.length;
        });
        
        const validRes = validateRuleSet(rule);

        div.innerHTML = `
            <div>
                <h3>${escapeHtml(rule.name)}</h3>
                <p>${validRes.total}% | ${compCount} komponen</p>
            </div>
            <div class="actions">
                <button class="btn-sm btn-secondary" onclick="editRule('${rule.id}')">Edit</button>
                <button class="btn-sm btn-secondary" onclick="duplicateRule('${rule.id}')">Duplicate</button>
                <button class="btn-sm btn-danger" onclick="deleteRule('${rule.id}')">Delete</button>
            </div>
        `;
        container.appendChild(div);
    });
    
    updateRuleSelector();
}

function updateRuleSelector() {
    const rules = getRuleSets();
    const select = document.getElementById('rule-set-select');
    select.innerHTML = '';
    rules.forEach(rule => {
        const opt = document.createElement('option');
        opt.value = rule.id;
        opt.textContent = rule.name;
        select.appendChild(opt);
    });
    
    const activeId = getActiveRuleSetId();
    if (activeId && rules.find(r => r.id === activeId)) {
        select.value = activeId;
    } else if (rules.length > 0) {
        select.value = rules[0].id;
        saveActiveRuleSetId(rules[0].id);
    }
}

function escapeHtml(unsafe) {
    return (unsafe || '').toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

window.deleteRule = function(id) {
    if (confirm('Yakin ingin menghapus rule set ini?')) {
        let rules = getRuleSets();
        rules = rules.filter(r => r.id !== id);
        if (rules.length === 0) {
            alert('Tidak bisa menghapus semua rule set.');
            return;
        }
        saveRuleSets(rules);
        renderRuleSetsList();
        if (window.renderCalculator) window.renderCalculator();
    }
};

window.duplicateRule = function(id) {
    const rules = getRuleSets();
    const ruleToCopy = rules.find(r => r.id === id);
    if (ruleToCopy) {
        const copy = JSON.parse(JSON.stringify(ruleToCopy));
        copy.id = generateId();
        copy.name = copy.name + ' Copy';
        
        copy.items.forEach(item => {
            item.id = generateId();
            if (item.children) {
                item.children.forEach(c => c.id = generateId());
            }
        });

        rules.push(copy);
        saveRuleSets(rules);
        renderRuleSetsList();
    }
};

let currentEditState = { name: '', items: [] };

window.editRule = function(id) {
    const rules = getRuleSets();
    const rule = rules.find(r => r.id === id);
    if (!rule) return;
    
    editingRuleId = id;
    currentEditState = JSON.parse(JSON.stringify(rule));
    
    document.getElementById('rule-name').value = currentEditState.name;
    document.getElementById('view-rules').classList.add('hidden');
    document.getElementById('view-calculator').classList.add('hidden');
    document.getElementById('view-edit-rule').classList.remove('hidden');
    
    renderEditForm();
};

document.getElementById('btn-create-rule').addEventListener('click', () => {
    editingRuleId = null;
    currentEditState = { name: 'Rule Set Baru', items: [] };
    document.getElementById('rule-name').value = currentEditState.name;
    document.getElementById('view-rules').classList.add('hidden');
    document.getElementById('view-calculator').classList.add('hidden');
    document.getElementById('view-edit-rule').classList.remove('hidden');
    renderEditForm();
});

document.getElementById('btn-cancel-edit').addEventListener('click', () => {
    document.getElementById('view-edit-rule').classList.add('hidden');
    document.getElementById('view-rules').classList.remove('hidden');
});

document.getElementById('btn-add-group').addEventListener('click', () => {
    currentEditState.items.push({ id: generateId(), type: 'group', name: 'Group Baru', children: [] });
    renderEditForm();
});

document.getElementById('btn-add-component').addEventListener('click', () => {
    currentEditState.items.push({ id: generateId(), type: 'component', name: 'Komponen Baru', weight: 10 });
    renderEditForm();
});

function renderEditForm() {
    const container = document.getElementById('edit-rule-items');
    container.innerHTML = '';
    
    currentEditState.items.forEach((item, index) => {
        const div = document.createElement('div');
        if (item.type === 'component') {
            div.className = 'edit-component';
            div.innerHTML = `
                <div class="edit-row">
                    <input type="text" value="${escapeHtml(item.name)}" onchange="updateItemName(${index}, null, this.value)" placeholder="Nama Komponen">
                    <input type="number" value="${item.weight}" onchange="updateItemWeight(${index}, null, this.value)" placeholder="Bobot">
                    <span>%</span>
                    <button class="btn-sm btn-danger" onclick="deleteItem(${index}, null)">Hapus</button>
                    <button class="btn-sm btn-secondary" onclick="moveItemUp(${index}, null)">↑</button>
                    <button class="btn-sm btn-secondary" onclick="moveItemDown(${index}, null)">↓</button>
                </div>
            `;
        } else {
            div.className = 'edit-group';
            let childrenHTML = '';
            item.children.forEach((child, cIndex) => {
                childrenHTML += `
                    <div class="edit-row">
                        <input type="text" value="${escapeHtml(child.name)}" onchange="updateItemName(${index}, ${cIndex}, this.value)" placeholder="Nama Child">
                        <input type="number" value="${child.weight}" onchange="updateItemWeight(${index}, ${cIndex}, this.value)" placeholder="Bobot">
                        <span>%</span>
                        <button class="btn-sm btn-danger" onclick="deleteItem(${index}, ${cIndex})">Hapus</button>
                        <button class="btn-sm btn-secondary" onclick="moveItemUp(${index}, ${cIndex})">↑</button>
                        <button class="btn-sm btn-secondary" onclick="moveItemDown(${index}, ${cIndex})">↓</button>
                    </div>
                `;
            });
            
            div.innerHTML = `
                <div class="edit-row">
                    <strong>Group:</strong>
                    <input type="text" value="${escapeHtml(item.name)}" onchange="updateItemName(${index}, null, this.value)" placeholder="Nama Group">
                    <button class="btn-sm btn-danger" onclick="deleteItem(${index}, null)">Hapus</button>
                    <button class="btn-sm btn-secondary" onclick="moveItemUp(${index}, null)">↑</button>
                    <button class="btn-sm btn-secondary" onclick="moveItemDown(${index}, null)">↓</button>
                </div>
                <div class="children-container">
                    ${childrenHTML}
                    <button class="btn-sm btn-secondary" onclick="addChild(${index})">+ Tambah Child</button>
                </div>
            `;
        }
        container.appendChild(div);
    });
    
    validateCurrentEditState();
}

window.updateItemName = function(idx, childIdx, val) {
    if (childIdx === null) currentEditState.items[idx].name = val;
    else currentEditState.items[idx].children[childIdx].name = val;
};

window.updateItemWeight = function(idx, childIdx, val) {
    if (childIdx === null) currentEditState.items[idx].weight = Number(val) || 0;
    else currentEditState.items[idx].children[childIdx].weight = Number(val) || 0;
    validateCurrentEditState();
};

window.deleteItem = function(idx, childIdx) {
    if (childIdx === null) currentEditState.items.splice(idx, 1);
    else currentEditState.items[idx].children.splice(childIdx, 1);
    renderEditForm();
};

window.addChild = function(idx) {
    currentEditState.items[idx].children.push({ id: generateId(), type: 'component', name: 'Child Baru', weight: 10 });
    renderEditForm();
};

window.moveItemUp = function(idx, childIdx) {
    if (childIdx === null) {
        if (idx > 0) {
            const temp = currentEditState.items[idx-1];
            currentEditState.items[idx-1] = currentEditState.items[idx];
            currentEditState.items[idx] = temp;
        }
    } else {
        if (childIdx > 0) {
            const arr = currentEditState.items[idx].children;
            const temp = arr[childIdx-1];
            arr[childIdx-1] = arr[childIdx];
            arr[childIdx] = temp;
        }
    }
    renderEditForm();
};

window.moveItemDown = function(idx, childIdx) {
    if (childIdx === null) {
        if (idx < currentEditState.items.length - 1) {
            const temp = currentEditState.items[idx+1];
            currentEditState.items[idx+1] = currentEditState.items[idx];
            currentEditState.items[idx] = temp;
        }
    } else {
        const arr = currentEditState.items[idx].children;
        if (childIdx < arr.length - 1) {
            const temp = arr[childIdx+1];
            arr[childIdx+1] = arr[childIdx];
            arr[childIdx] = temp;
        }
    }
    renderEditForm();
};

function validateCurrentEditState() {
    const res = validateRuleSet(currentEditState);
    const panel = document.getElementById('rule-validation');
    const saveBtn = document.getElementById('btn-save-rule');
    
    if (res.valid) {
        panel.className = 'validation-panel validation-success';
        panel.textContent = `✓ Bobot valid: ${res.total}%`;
        saveBtn.disabled = false;
        saveBtn.style.opacity = 1;
    } else {
        panel.className = 'validation-panel validation-error';
        panel.textContent = `⚠ Total bobot harus 100%. (Saat ini: ${res.total}%)`;
        saveBtn.disabled = true;
        saveBtn.style.opacity = 0.5;
    }
}

document.getElementById('rule-name').addEventListener('input', (e) => {
    currentEditState.name = e.target.value;
});

document.getElementById('btn-save-rule').addEventListener('click', () => {
    const res = validateRuleSet(currentEditState);
    if (!res.valid) {
        alert('Total bobot harus 100%.');
        return;
    }
    if (!currentEditState.name.trim()) {
        alert('Nama Rule Set tidak boleh kosong.');
        return;
    }
    
    let rules = getRuleSets();
    if (editingRuleId) {
        const idx = rules.findIndex(r => r.id === editingRuleId);
        if (idx !== -1) rules[idx] = currentEditState;
    } else {
        currentEditState.id = generateId();
        rules.push(currentEditState);
        saveActiveRuleSetId(currentEditState.id);
    }
    
    saveRuleSets(rules);
    renderRuleSetsList();
    
    document.getElementById('view-edit-rule').classList.add('hidden');
    document.getElementById('view-rules').classList.add('hidden');
    document.getElementById('view-calculator').classList.remove('hidden');
    
    if (window.renderCalculator) window.renderCalculator();
});
