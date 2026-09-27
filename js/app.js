document.addEventListener('DOMContentLoaded', () => {
    // Network status
    const updateNetworkStatus = () => {
        const statusEl = document.getElementById('network-status');
        if (navigator.onLine) {
            statusEl.textContent = '● Online';
            statusEl.className = 'status-online';
        } else {
            statusEl.textContent = '● Offline';
            statusEl.className = 'status-offline';
        }
    };
    
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    updateNetworkStatus();

    // Navigation
    document.getElementById('btn-manage-rules').addEventListener('click', () => {
        document.getElementById('view-calculator').classList.add('hidden');
        document.getElementById('view-rules').classList.remove('hidden');
        renderRuleSetsList();
    });

    document.getElementById('btn-back-calc').addEventListener('click', () => {
        document.getElementById('view-rules').classList.add('hidden');
        document.getElementById('view-calculator').classList.remove('hidden');
        if (window.renderCalculator) window.renderCalculator();
    });
    
    // Initial renders
    if (window.renderRuleSetsList) renderRuleSetsList();
    if (window.renderCalculator) renderCalculator();
});

document.getElementById('rule-set-select').addEventListener('change', (e) => {
    saveActiveRuleSetId(e.target.value);
    renderCalculator();
});

document.getElementById('btn-reset-scores').addEventListener('click', () => {
    if (confirm('Yakin ingin mereset semua nilai mahasiswa pada kalkulator ini?')) {
        clearInputs();
        renderCalculator();
    }
});

// Render Calculator
window.renderCalculator = function() {
    const rules = getRuleSets();
    const activeId = getActiveRuleSetId();
    const activeRule = rules.find(r => r.id === activeId);
    
    const container = document.getElementById('calculator-content');
    container.innerHTML = '';
    
    if (!activeRule) {
        container.innerHTML = '<p>Tidak ada Rule Set. Silakan buat atau pilih Rule Set terlebih dahulu.</p>';
        updateFinalScore(null);
        return;
    }
    
    const inputs = getSavedInputs();
    
    activeRule.items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'calc-group';
        
        if (item.type === 'component') {
            div.innerHTML = `
                <div class="calc-item">
                    <div class="item-info">
                        <div class="item-name">${escapeHtml(item.name)}</div>
                        <div class="item-weight">Bobot ${item.weight}%</div>
                    </div>
                    <div class="item-input">
                        <input type="number" min="0" max="100" step="any" placeholder="Nilai" 
                               value="${inputs[item.id] !== undefined ? inputs[item.id] : ''}" 
                               data-id="${item.id}">
                        <div class="item-contribution" id="contrib-${item.id}">
                            ${calculateContribution(inputs[item.id] || 0, item.weight).toFixed(2)}
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Group container
            const totalGroupWeight = item.children ? item.children.reduce((acc, c) => acc + Number(c.weight), 0) : 0;
            div.innerHTML = `
                <h3>${escapeHtml(item.name)}</h3>
                <div class="calc-group-weight">Total Bobot ${totalGroupWeight}%</div>
            `;
            
            if (item.children) {
                item.children.forEach(child => {
                    const childDiv = document.createElement('div');
                    childDiv.className = 'calc-item';
                    childDiv.innerHTML = `
                        <div class="item-info">
                            <div class="item-name">${escapeHtml(child.name)}</div>
                            <div class="item-weight">Bobot ${child.weight}%</div>
                        </div>
                        <div class="item-input">
                            <input type="number" min="0" max="100" step="any" placeholder="Nilai" 
                                   value="${inputs[child.id] !== undefined ? inputs[child.id] : ''}" 
                                   data-id="${child.id}">
                            <div class="item-contribution" id="contrib-${child.id}">
                                ${calculateContribution(inputs[child.id] || 0, child.weight).toFixed(2)}
                            </div>
                        </div>
                    `;
                    div.appendChild(childDiv);
                });
            }
        }
        
        container.appendChild(div);
    });
    
    updateFinalScore(activeRule);
    
    // Attach event listeners
    const inputsEls = container.querySelectorAll('input[type="number"]');
    inputsEls.forEach(input => {
        input.addEventListener('input', (e) => {
            let val = parseFloat(e.target.value);
            if (val > 100) { e.target.value = 100; val = 100; }
            if (val < 0) { e.target.value = 0; val = 0; }
            
            const saved = getSavedInputs();
            saved[e.target.dataset.id] = isNaN(val) ? 0 : val;
            saveInputs(saved);
            
            updateContributions(activeRule);
            updateFinalScore(activeRule);
        });
    });
};

function updateContributions(ruleSet) {
    const inputs = getSavedInputs();
    ruleSet.items.forEach(item => {
        if (item.type === 'component') {
            const el = document.getElementById(`contrib-${item.id}`);
            if (el) el.textContent = calculateContribution(inputs[item.id] || 0, item.weight).toFixed(2);
        } else if (item.children) {
            item.children.forEach(child => {
                const el = document.getElementById(`contrib-${child.id}`);
                if (el) el.textContent = calculateContribution(inputs[child.id] || 0, child.weight).toFixed(2);
            });
        }
    });
}

function updateFinalScore(ruleSet) {
    if (!ruleSet) {
        document.getElementById('final-score-display').textContent = '0.00';
        document.getElementById('total-weight-display').textContent = 'Total Bobot: 0%';
        return;
    }
    
    const inputs = getSavedInputs();
    const finalScore = calculateFinalScore(ruleSet, inputs);
    document.getElementById('final-score-display').textContent = finalScore.toFixed(2);
    
    const validation = validateRuleSet(ruleSet);
    document.getElementById('total-weight-display').textContent = `Total Bobot: ${validation.total}%`;
}
