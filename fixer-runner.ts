/**
 * PRZ-OS v3.0 — Fixer Agent Runner
 * Scans system, builds repair plan, shows preview, then executes.
 *
 * Usage:
 *   npx tsx fixer-runner.ts            — Dry run (preview only)
 *   npx tsx fixer-runner.ts --apply    — Apply all fixes
 *   npx tsx fixer-runner.ts --skip-installs  — Apply fixes but skip tool installs
 */

const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const MAGENTA = '\x1b[35m';
const BLUE = '\x1b[34m';

const SEV_COLORS: Record<string, string> = {
    critical: RED,
    high: YELLOW,
    medium: CYAN,
    low: DIM
};

const CAT_ICONS: Record<string, string> = {
    'path-cleanup': '🧹',
    'path-add': '➕',
    'tool-install': '📦',
    'config-repair': '🔧',
    'env-set': '🌍',
    'env-remove': '🗑',
    'cache-clean': '🧊',
    'service-start': '▶️',
    'permission-fix': '🔐'
};

async function main() {
    const { buildFixPlan, executePlan, generateFixReport } = require('./dist/lib/fixer');
    const fs = require('fs');
    const path = require('path');

    const apply = process.argv.includes('--apply');
    const skipInstalls = process.argv.includes('--skip-installs');

    console.log(`
${BOLD}${RED}╔══════════════════════════════════════════════════════════════╗${RESET}
${BOLD}${RED}║${RESET}   ${BOLD}${MAGENTA}🔧  PRZ-OS v3.0 — Fixer Agent${RESET}                              ${BOLD}${RED}║${RESET}
${BOLD}${RED}║${RESET}   ${DIM}Autonomous system repair • Rollback-safe${RESET}                  ${BOLD}${RED}║${RESET}
${BOLD}${RED}╠══════════════════════════════════════════════════════════════╣${RESET}
${BOLD}${RED}║${RESET}   Mode: ${apply ? `${GREEN}${BOLD}APPLY — CHANGES WILL BE MADE${RESET}` : `${YELLOW}DRY RUN — preview only${RESET} (use --apply)`}          ${BOLD}${RED}║${RESET}
${BOLD}${RED}╚══════════════════════════════════════════════════════════════╝${RESET}
`);

    // ── Build Plan ─────────────────────────────────────────────────────
    console.log(`${DIM}  Scanning system and building repair plan...${RESET}\n`);
    const plan = buildFixPlan();

    if (plan.totalActions === 0) {
        console.log(`  ${GREEN}✅ System is clean — no fixes needed.${RESET}\n`);
        return;
    }

    // ── Preview Plan ───────────────────────────────────────────────────
    console.log(`${BOLD}── Repair Plan (${plan.totalActions} actions) ──${RESET}\n`);

    let currentCategory = '';
    for (const action of plan.actions) {
        if (action.category !== currentCategory) {
            currentCategory = action.category;
            const icon = CAT_ICONS[currentCategory] || '•';
            console.log(`  ${BOLD}${icon} ${currentCategory.toUpperCase().replace(/-/g, ' ')}${RESET}`);
        }

        const sevColor = SEV_COLORS[action.severity] || DIM;
        const sevTag = `${sevColor}[${action.severity.toUpperCase()}]${RESET}`;
        console.log(`    ${sevTag} ${action.description}`);
        if (action.command) console.log(`      ${DIM}$ ${action.command}${RESET}`);
        if (action.rollback) console.log(`      ${DIM}↩ rollback: ${action.rollback.substring(0, 80)}${action.rollback.length > 80 ? '...' : ''}${RESET}`);
    }

    // ── Execute ────────────────────────────────────────────────────────
    console.log(`\n${BOLD}── Executing ──${RESET}\n`);

    const result = executePlan(plan, {
        dryRun: !apply,
        skipInstalls: skipInstalls || !apply
    });

    // ── Results ────────────────────────────────────────────────────────
    for (const action of result.plan.actions) {
        const statusIcon = action.status === 'success' ? `${GREEN}✓${RESET}`
            : action.status === 'failed' ? `${RED}✗${RESET}`
                : `${YELLOW}⏭${RESET}`;
        const catIcon = CAT_ICONS[action.category] || '•';
        console.log(`  ${statusIcon} ${catIcon} ${action.description}`);
        if (action.output && action.status !== 'skipped') console.log(`    ${DIM}→ ${action.output}${RESET}`);
        if (action.error) console.log(`    ${RED}⚠ ${action.error}${RESET}`);
        if (action.duration) console.log(`    ${DIM}⏱ ${action.duration}ms${RESET}`);
    }

    // ── Summary ────────────────────────────────────────────────────────
    console.log(`\n${BOLD}── Summary ──${RESET}\n`);
    console.log(`  ${GREEN}✓ Succeeded:${RESET}  ${result.succeeded}`);
    console.log(`  ${RED}✗ Failed:${RESET}     ${result.failed}`);
    console.log(`  ${YELLOW}⏭ Skipped:${RESET}   ${result.skipped}`);
    console.log(`  ${DIM}⏱ Duration:${RESET}  ${result.duration}ms`);

    if (result.rollbackCommands.length > 0) {
        console.log(`\n  ${DIM}Rollback commands saved (${result.rollbackCommands.length} total)${RESET}`);
    }

    if (!apply) {
        console.log(`\n  ${YELLOW}This was a dry run. Use ${BOLD}--apply${RESET}${YELLOW} to execute fixes.${RESET}`);
        console.log(`  ${DIM}Add ${BOLD}--skip-installs${RESET}${DIM} to skip tool installations.${RESET}`);
    }

    // Save report
    const reportDir = path.resolve(__dirname, 'mesh-output');
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
    const reportPath = path.join(reportDir, 'FIXER_REPORT.md');
    fs.writeFileSync(reportPath, generateFixReport(result), 'utf-8');
    console.log(`\n  ${DIM}Report: ${reportPath}${RESET}\n`);
}

main().catch(err => {
    console.error('Fixer failed:', err);
    process.exit(1);
});
