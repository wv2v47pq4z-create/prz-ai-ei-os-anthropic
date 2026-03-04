/**
 * PRZ-OS v3.0 — Mesh Workflow Runner
 * Executes the full agent mesh collaboration and produces code.
 *
 * Usage: npx tsx workflow-runner.ts
 */

import * as path from 'node:path';

// Build first, then import from dist
async function main() {
    const { createMesh } = require('./dist/lib/mesh');
    const { runMeshWorkflow } = require('./dist/lib/mesh-workflow');

    // ── Styling ──────────────────────────────────────────────────────
    const DIM = '\x1b[2m';
    const BOLD = '\x1b[1m';
    const RESET = '\x1b[0m';
    const GREEN = '\x1b[32m';
    const CYAN = '\x1b[36m';
    const YELLOW = '\x1b[33m';
    const RED = '\x1b[31m';
    const MAGENTA = '\x1b[35m';
    const BLUE = '\x1b[34m';

    const ROLE_ICONS: Record<string, string> = {
        architect: '🏗',
        builder: '🔨',
        auditor: '🛡',
        ops: '⚙️',
        analyst: '📊'
    };

    console.log(`
${BOLD}${BLUE}╔══════════════════════════════════════════════════════════════╗${RESET}
${BOLD}${BLUE}║${RESET}   ${BOLD}${MAGENTA}🌀  PRZ-OS v3.0 — Mesh Workflow Engine${RESET}                     ${BOLD}${BLUE}║${RESET}
${BOLD}${BLUE}║${RESET}   ${DIM}ARCHITECT → BUILDER → AUDITOR → OPS → ANALYST${RESET}             ${BOLD}${BLUE}║${RESET}
${BOLD}${BLUE}╚══════════════════════════════════════════════════════════════╝${RESET}
`);

    const mesh = createMesh();
    const outputDir = path.resolve(__dirname, 'mesh-output');

    console.log(`${DIM}  Output: ${outputDir}${RESET}`);
    console.log(`${DIM}  Task:   Build PRZ Health Service with Circuit Breaker${RESET}\n`);

    const task = 'PRZ Health Service with circuit breaker, priority queue, and AIDA-2026 compliance';

    // Run the workflow
    const steps = ['architect', 'builder', 'auditor', 'ops', 'analyst'];

    console.log(`${BOLD}── Workflow Execution ──${RESET}\n`);

    const startTime = Date.now();
    const result = await runMeshWorkflow(mesh, task, outputDir);
    const elapsed = Date.now() - startTime;

    // Print step results
    for (const step of result.plan.steps) {
        const icon = ROLE_ICONS[step.agent] || '?';
        const statusIcon = step.status === 'complete' ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
        const duration = step.startedAt && step.completedAt ? `${step.completedAt - step.startedAt}ms` : '?';
        const resonance = step.result?.resonance?.score?.toFixed(3) || '?';
        const state = step.result?.state || '?';

        console.log(`  ${statusIcon} ${icon} ${BOLD}${step.agent.toUpperCase().padEnd(10)}${RESET} ${DIM}${duration.padStart(6)}${RESET}  R:${CYAN}${resonance}${RESET}  ${state === 'crystal' ? `${GREEN}CRYSTAL${RESET}` : `${YELLOW}VAPOR${RESET}`}`);
        for (const artifact of step.artifacts) {
            console.log(`    ${DIM}└─ ${artifact.filename} (${artifact.type})${RESET}`);
        }
    }

    // Inter-agent messages
    console.log(`\n${BOLD}── Agent Messages ──${RESET}\n`);
    for (const msg of result.agentMessages) {
        const fromIcon = ROLE_ICONS[msg.from as string] || '📦';
        const toIcon = ROLE_ICONS[msg.to as string] || '📦';
        console.log(`  ${fromIcon} ${(msg.from as string).toUpperCase()} → ${toIcon} ${(msg.to as string).toUpperCase()}  ${DIM}${msg.intent}${RESET}`);
    }

    // Summary
    console.log(`\n${BOLD}── Summary ──${RESET}\n`);
    console.log(`  ${BOLD}Status:${RESET}    ${result.success ? `${GREEN}SUCCESS${RESET}` : `${RED}FAILED${RESET}`}`);
    console.log(`  ${BOLD}Files:${RESET}     ${result.totalArtifacts}`);
    console.log(`  ${BOLD}Messages:${RESET}  ${result.agentMessages.length}`);
    console.log(`  ${BOLD}Duration:${RESET}  ${elapsed}ms`);
    console.log(`  ${BOLD}Output:${RESET}    ${outputDir}`);

    // Mesh state
    const meshState = mesh.getMeshState();
    console.log(`\n${BOLD}── Mesh State ──${RESET}\n`);
    console.log(`  ${BOLD}Resonance:${RESET} ${meshState.meshResonance.toFixed(3)}`);
    console.log(`  ${BOLD}Active:${RESET}    ${meshState.activeAgents.join(', ')}`);
    console.log(`  ${BOLD}Total Msgs:${RESET} ${meshState.totalMessages}\n`);
}

main().catch(err => {
    console.error('Workflow failed:', err.message);
    process.exit(1);
});
