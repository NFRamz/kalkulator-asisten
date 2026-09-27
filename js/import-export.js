document.getElementById('btn-export-rule').addEventListener('click', () => {
    const rules = getRuleSets();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(rules, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "grade-rules.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
});

document.getElementById('btn-import-rule').addEventListener('click', () => {
    document.getElementById('import-file').click();
});

document.getElementById('import-file').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (!Array.isArray(imported)) throw new Error('Format tidak valid');
            
            // Basic validation check
            let valid = true;
            imported.forEach(rule => {
                if (!rule.id || !rule.name || !rule.items) valid = false;
            });
            
            if (!valid) throw new Error('Struktur JSON tidak sesuai');
            
            // Merge with existing
            let existing = getRuleSets();
            // Optional: avoid duplicate IDs
            imported.forEach(rule => {
                rule.id = generateId();
                if (rule.items) {
                    rule.items.forEach(item => {
                        item.id = generateId();
                        if (item.children) {
                            item.children.forEach(c => c.id = generateId());
                        }
                    });
                }
                existing.push(rule);
            });
            
            saveRuleSets(existing);
            if (window.renderRuleSetsList) window.renderRuleSetsList();
            alert('Import berhasil!');
        } catch (err) {
            alert('Gagal mengimport file JSON: ' + err.message);
        }
        document.getElementById('import-file').value = '';
    };
    reader.readAsText(file);
});
