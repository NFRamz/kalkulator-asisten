function calculateContribution(score, weight) {
    if (isNaN(score) || score < 0) score = 0;
    if (score > 100) score = 100;
    return (score / 100) * weight;
}

function calculateGroupScore(group, scores) {
    if (!group.children || group.children.length === 0) return 0;
    let groupScore = 0;
    for (const child of group.children) {
        const score = scores[child.id] || 0;
        groupScore += calculateContribution(score, child.weight);
    }
    return groupScore;
}

function calculateFinalScore(ruleSet, scores) {
    if (!ruleSet || !ruleSet.items) return 0;
    let finalScore = 0;
    for (const item of ruleSet.items) {
        if (item.type === 'component') {
            const score = scores[item.id] || 0;
            finalScore += calculateContribution(score, item.weight);
        } else if (item.type === 'group') {
            finalScore += calculateGroupScore(item, scores);
        }
    }
    return finalScore;
}

function validateRuleSet(ruleSet) {
    if (!ruleSet || !ruleSet.items) return { valid: false, total: 0 };
    let totalWeight = 0;
    for (const item of ruleSet.items) {
        if (item.type === 'component') {
            totalWeight += Number(item.weight) || 0;
        } else if (item.type === 'group') {
            if (item.children) {
                for (const child of item.children) {
                    totalWeight += Number(child.weight) || 0;
                }
            }
        }
    }
    return {
        valid: Math.abs(totalWeight - 100) < 0.01,
        total: totalWeight
    };
}
