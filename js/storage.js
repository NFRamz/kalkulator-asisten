const STORAGE_KEY_RULES = 'grade_calc_rules';
const STORAGE_KEY_ACTIVE_RULE = 'grade_calc_active_rule';
const STORAGE_KEY_INPUTS = 'grade_calc_inputs';

const DEFAULT_RULE_SET = {
    id: 'default_1',
    name: 'MK Mobile (Contoh)',
    items: [
        {
            id: 'g1',
            type: 'component',
            name: 'CodeLab',
            weight: 40
        },
        {
            id: 'g2',
            type: 'group',
            name: 'Demo',
            children: [
                { id: 'c1', type: 'component', name: 'Pemahaman', weight: 10 },
                { id: 'c2', type: 'component', name: 'Kerapihan', weight: 10 },
                { id: 'c3', type: 'component', name: 'No Error', weight: 10 },
                { id: 'c4', type: 'component', name: 'Dokumentasi', weight: 15 },
                { id: 'c5', type: 'component', name: 'Penerapan Array', weight: 15 }
            ]
        }
    ]
};

function getRuleSets() {
    const data = localStorage.getItem(STORAGE_KEY_RULES);
    if (!data) {
        saveRuleSets([DEFAULT_RULE_SET]);
        return [DEFAULT_RULE_SET];
    }
    try {
        return JSON.parse(data);
    } catch {
        return [DEFAULT_RULE_SET];
    }
}

function saveRuleSets(ruleSets) {
    localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(ruleSets));
}

function getActiveRuleSetId() {
    const id = localStorage.getItem(STORAGE_KEY_ACTIVE_RULE);
    const rules = getRuleSets();
    if (id && rules.find(r => r.id === id)) {
        return id;
    }
    return rules.length > 0 ? rules[0].id : null;
}

function saveActiveRuleSetId(id) {
    localStorage.setItem(STORAGE_KEY_ACTIVE_RULE, id);
}

function getSavedInputs() {
    const data = localStorage.getItem(STORAGE_KEY_INPUTS);
    return data ? JSON.parse(data) : {};
}

function saveInputs(inputs) {
    localStorage.setItem(STORAGE_KEY_INPUTS, JSON.stringify(inputs));
}

function clearInputs() {
    localStorage.setItem(STORAGE_KEY_INPUTS, JSON.stringify({}));
}

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}
