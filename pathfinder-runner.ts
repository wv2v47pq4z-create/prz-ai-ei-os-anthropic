/**
 * PRZ-OS v3.0 — PATH Finder Runner
 * Scans the system, diagnoses PATH, and auto-fixes issues.
 *
 * Usage: npx tsx pathfinder-runner.ts [--fix]
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

async function main() {
    const { runPathFinder, generatePathReport } = require('./dist/lib/pathfinder');
    const fs = require('fs');
    const path = require('path');

    const autoFix = process.argv.includes('--fix');

    console.log(`
${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════╗${RESET}
${BOLD}${CYAN}║${RESET}   ${BOLD}${MAGENTA}🔍  PRZ-OS v3.0 — PATH Finder Agent${RESET}                       ${BOLD}${CYAN}║${RESET}
${BOLD}${CYAN}║${RESET}   ${DIM}System scanner • Tool locator • Auto-fixer${RESET}                ${BOLD}${CYAN}║${RESET}
${BOLD}${CYAN}╠══════════════════════════════════════════════════════════════╣${RESET}
${BOLD}${CYAN}║${RESET}   Mode: ${autoFix ? `${GREEN}AUTO-FIX ENABLED${RESET}` : `${YELLOW}SCAN ONLY${RESET} (use --fix to repair)`}                     ${BOLD}${CYAN}║${RESET}
${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════╝${RESET}
`);

    console.log(`${DIM}  Scanning system for installed tools...${RESET}\n`);
    const startTime = Date.now();

    const result = runPathFinder(autoFix);
    const elapsed = Date.now() - startTime;

    // ── PATH Diagnostic ────────────────────────────────────────────────
    console.log(`${BOLD}── PATH Diagnostic ──${RESET}\n`);
    console.log(`  Total entries:   ${result.diagnostic.totalEntries}`);
    console.log(`  Valid entries:   ${GREEN}${result.diagnostic.validEntries}${RESET}`);
    if (result.diagnostic.invalidEntries.length > 0) {
        console.log(`  Invalid entries: ${RED}${result.diagnostic.invalidEntries.length}${RESET}`);
        for (const entry of result.diagnostic.invalidEntries) {
            console.log(`    ${RED}✗${RESET} ${DIM}${entry}${RESET}`);
        }
    }
    if (result.diagnostic.duplicateEntries.length > 0) {
        console.log(`  Duplicates:      ${YELLOW}${result.diagnostic.duplicateEntries.length}${RESET}`);
    }

    // ── Discovered Tools ───────────────────────────────────────────────
    console.log(`\n${BOLD}── Discovered Tools (${result.foundBinaries.length}) ──${RESET}\n`);

    const inPath = result.foundBinaries.filter((b: any) => b.inPath);
    const notInPath = result.foundBinaries.filter((b: any) => !b.inPath);

    for (const b of inPath) {
        console.log(`  ${GREEN}✓${RESET} ${BOLD}${b.name.padEnd(16)}${RESET} ${DIM}${b.path}${RESET}`);
        if (b.version) console.log(`    ${DIM}${b.version}${RESET}`);
    }

    if (notInPath.length > 0) {
        console.log(`\n${BOLD}── ${RED}Not in PATH${RESET} ${BOLD}(${notInPath.length}) ──${RESET}\n`);
        for (const b of notInPath) {
            console.log(`  ${RED}✗${RESET} ${BOLD}${b.name.padEnd(16)}${RESET} ${DIM}${b.path}${RESET}`);
        }
    }

    // ── Recommendations ────────────────────────────────────────────────
    if (result.recommendations.length > 0) {
        console.log(`\n${BOLD}── Recommendations ──${RESET}\n`);
        for (const r of result.recommendations) {
            const icon = r.severity === 'critical' ? `${RED}🔴` : r.severity === 'warning' ? `${YELLOW}🟡` : `${BLUE}🔵`;
            console.log(`  ${icon} ${r.message}${RESET}`);
            if (r.action) console.log(`     ${DIM}→ ${r.action}${RESET}`);
        }
    }

    // ── Fixes ──────────────────────────────────────────────────────────
    if (result.fixes.length > 0) {
        console.log(`\n${BOLD}── Fixes Applied ──${RESET}\n`);
        for (const f of result.fixes) {
            const icon = f.applied ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
            console.log(`  ${icon} ${f.description}`);
            if (f.error) console.log(`    ${RED}Error: ${f.error}${RESET}`);
        }
    }

    // ── Summary ────────────────────────────────────────────────────────
    console.log(`\n${BOLD}── Summary ──${RESET}\n`);
    console.log(`  Host:      ${result.hostname}`);
    console.log(`  Platform:  ${result.platform}`);
    console.log(`  Tools:     ${GREEN}${inPath.length} in PATH${RESET}, ${notInPath.length > 0 ? `${RED}${notInPath.length} missing${RESET}` : `${GREEN}0 missing${RESET}`}`);
    console.log(`  Duration:  ${elapsed}ms`);
    console.log();

    // Save report
    const reportDir = path.resolve(__dirname, 'mesh-output');
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
    const reportPath = path.join(reportDir, 'PATH_FINDER_REPORT.md');
    const report = generatePathReport(result);
    fs.writeFileSync(reportPath, report, 'utf-8');
    console.log(`  ${DIM}Report saved: ${reportPath}${RESET}\n`);
}

main().catch(err => {
    console.error('PATH Finder failed:', err.message);
    process.exit(1);
});
