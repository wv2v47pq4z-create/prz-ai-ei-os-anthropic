/**
 * PRZ-OS v3.0 — Agent Mesh Runner
 * Interactive REPL for the multi-agent mesh network.
 *
 * Usage:
 *   npx tsx mesh-runner.ts
 *
 * Commands:
 *   <any text>           — Auto-route to best agent via Harmonic Field
 *   /broadcast <text>    — Send to ALL agents simultaneously
 *   /route <text>        — Show routing scores without executing
 *   /mesh                — Show full mesh state
 *   /agents              — List all agents and their status
 *   /history             — Show routing history
 *   /reset               — Clear all agent history
 *   /exit                — Quit
 */

import * as readline from 'node:readline';
import { createMesh, MeshCoordinator, AgentRole, MeshResult } from './dist/lib/mesh';

// ── Styling ──────────────────────────────────────────────────────────
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const MAGENTA = '\x1b[35m';
const BLUE = '\x1b[34m';
const WHITE = '\x1b[37m';

const ROLE_COLORS: Record<AgentRole, string> = {
    architect: MAGENTA,
    builder: CYAN,
    auditor: RED,
    ops: GREEN,
    analyst: YELLOW
};

const ROLE_ICONS: Record<AgentRole, string> = {
    architect: '🏗',
    builder: '🔨',
    auditor: '🛡',
    ops: '⚙️',
    analyst: '📊'
};

function roleTag(role: AgentRole): string {
    return `${ROLE_COLORS[role]}${BOLD}${ROLE_ICONS[role]} ${role.toUpperCase()}${RESET}`;
}

function bar(value: number, max: number = 1, width: number = 20): string {
    const filled = Math.round((value / max) * width);
    const empty = width - filled;
    const color = value >= 0.7 ? GREEN : value >= 0.4 ? YELLOW : RED;
    return `${color}${'█'.repeat(filled)}${DIM}${'░'.repeat(empty)}${RESET} ${(value * 100).toFixed(0)}%`;
}

// ── Banner ───────────────────────────────────────────────────────────
function printBanner(): void {
    console.log(`
${BOLD}${BLUE}╔══════════════════════════════════════════════════════════════╗${RESET}
${BOLD}${BLUE}║${RESET}   ${BOLD}${MAGENTA}🌀  PRZ-OS v3.0 — Agent Mesh${RESET}                               ${BOLD}${BLUE}║${RESET}
${BOLD}${BLUE}║${RESET}   ${DIM}Multi-Agent Coordination via Resonance Routing${RESET}             ${BOLD}${BLUE}║${RESET}
${BOLD}${BLUE}╠══════════════════════════════════════════════════════════════╣${RESET}
${BOLD}${BLUE}║${RESET}   ${roleTag('architect')}  System design, architecture            ${BOLD}${BLUE}║${RESET}
${BOLD}${BLUE}║${RESET}   ${roleTag('builder')}    Code generation, implementation        ${BOLD}${BLUE}║${RESET}
${BOLD}${BLUE}║${RESET}   ${roleTag('auditor')}    Security, compliance, review           ${BOLD}${BLUE}║${RESET}
${BOLD}${BLUE}║${RESET}   ${roleTag('ops')}        Deployment, monitoring, infra          ${BOLD}${BLUE}║${RESET}
${BOLD}${BLUE}║${RESET}   ${roleTag('analyst')}    Data analysis, reporting               ${BOLD}${BLUE}║${RESET}
${BOLD}${BLUE}╠══════════════════════════════════════════════════════════════╣${RESET}
${BOLD}${BLUE}║${RESET}   ${DIM}Routing: Harmonic Field │ Delegations: Auto-Audit${RESET}        ${BOLD}${BLUE}║${RESET}
${BOLD}${BLUE}║${RESET}   ${DIM}Region:  northamerica-northeast1 │ AIDA-2026 Strict${RESET}      ${BOLD}${BLUE}║${RESET}
${BOLD}${BLUE}╚══════════════════════════════════════════════════════════════╝${RESET}
`);
    console.log(`${DIM}  Commands: /broadcast /route /mesh /agents /history /reset /exit${RESET}\n`);
}

// ── Result Printer ───────────────────────────────────────────────────
function printMeshResult(result: MeshResult): void {
    const r = result.routing;
    const a = result.agentResult;

    console.log(`\n${BOLD}── Mesh Dispatch ──${RESET}`);
    console.log(`  ${BOLD}Routed to:${RESET}  ${roleTag(result.originAgent)}`);
    console.log(`  ${BOLD}Confidence:${RESET} ${bar(r.confidence)}`);
    console.log(`  ${BOLD}Scores:${RESET}`);

    // Sort scores descending
    const sorted = Object.entries(r.allScores).sort(([, a], [, b]) => b - a);
    for (const [role, score] of sorted) {
        const marker = role === result.originAgent ? ' ◄' : '';
        console.log(`    ${ROLE_COLORS[role as AgentRole]}${role.padEnd(10)}${RESET} ${bar(score)}${marker}`);
    }

    console.log(`\n${BOLD}── Agent Result ──${RESET}`);
    console.log(`  ${BOLD}Tier:${RESET}       ${a.tier === 'GREEN LANE' ? `${GREEN}${a.tier}${RESET}` : `${YELLOW}${a.tier}${RESET}`}`);
    console.log(`  ${BOLD}State:${RESET}      ${a.state === 'crystal' ? `${GREEN}CRYSTAL ✦${RESET}` : `${YELLOW}VAPOR${RESET}`}`);
    console.log(`  ${BOLD}Resonance:${RESET}  ${bar(a.resonance.score)}`);
    console.log(`  ${BOLD}Emotion:${RESET}    ${a.emotionalState.sentiment} (${(a.emotionalState.confidence * 100).toFixed(0)}% conf)`);

    // Delegations
    if (result.delegations.length > 0) {
        console.log(`\n${BOLD}── Auto-Delegations ──${RESET}`);
        for (const d of result.delegations) {
            const statusIcon = d.status === 'complete' ? `${GREEN}✓${RESET}` : d.status === 'failed' ? `${RED}✗${RESET}` : `${YELLOW}⏳${RESET}`;
            console.log(`  ${statusIcon} ${roleTag(d.from)} → ${roleTag(d.to)}`);
            console.log(`    ${DIM}${d.intent}${RESET}`);
            if (d.result) {
                console.log(`    ${DIM}Resonance: ${d.result.resonance.score.toFixed(3)} | State: ${d.result.state}${RESET}`);
            }
        }
    }

    // Mesh health
    const ms = result.meshState;
    console.log(`\n${BOLD}── Mesh Health ──${RESET}`);
    console.log(`  Active:     ${ms.activeAgents.map(r => `${ROLE_COLORS[r]}${r}${RESET}`).join(', ') || `${DIM}(none)${RESET}`}`);
    console.log(`  Messages:   ${ms.totalMessages}`);
    console.log(`  Resonance:  ${bar(ms.meshResonance)}`);
    console.log();
}

// ── Main REPL ────────────────────────────────────────────────────────
async function main(): Promise<void> {
    const mesh: MeshCoordinator = createMesh();
    printBanner();

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: `${BOLD}${BLUE}MESH ▸ ${RESET}`
    });

    rl.prompt();

    rl.on('line', async (line: string) => {
        const input = line.trim();
        if (!input) { rl.prompt(); return; }

        try {
            // ── Slash commands ─────────────────────────────────────────
            if (input === '/exit') {
                console.log(`\n${DIM}Mesh shutdown. All agents terminated.${RESET}\n`);
                process.exit(0);
            }

            if (input === '/reset') {
                mesh.reset();
                console.log(`${GREEN}✓${RESET} Mesh reset. All agents cleared.\n`);
                rl.prompt(); return;
            }

            if (input === '/mesh') {
                const state = mesh.getMeshState();
                console.log(`\n${BOLD}── Mesh State ──${RESET}`);
                console.log(`  Messages:    ${state.totalMessages}`);
                console.log(`  Resonance:   ${bar(state.meshResonance)}`);
                console.log(`  Agents:`);
                for (const [role, status] of Object.entries(state.agentStates)) {
                    const icon = status === 'idle' ? `${GREEN}●${RESET}` : status === 'busy' ? `${YELLOW}●${RESET}` : `${RED}●${RESET}`;
                    const agent = mesh.getAgent(role as AgentRole)!;
                    console.log(`    ${icon} ${roleTag(role as AgentRole)}  ${DIM}${status} | ${agent.processed} tasks${RESET}`);
                }
                console.log();
                rl.prompt(); return;
            }

            if (input === '/agents') {
                console.log(`\n${BOLD}── Agent Registry ──${RESET}`);
                for (const [role, agent] of mesh.getAllAgents()) {
                    console.log(`  ${roleTag(role)}`);
                    console.log(`    ${DIM}${agent.config.description}${RESET}`);
                    console.log(`    ${DIM}Capabilities: ${agent.config.capabilities.join(', ')}${RESET}`);
                    console.log(`    ${DIM}Patterns: ${agent.config.patterns.length} | Max Concurrent: ${agent.config.maxConcurrent}${RESET}`);
                    console.log();
                }
                rl.prompt(); return;
            }

            if (input === '/history') {
                const state = mesh.getMeshState();
                if (state.routingHistory.length === 0) {
                    console.log(`${DIM}  No routing history yet.${RESET}\n`);
                    rl.prompt(); return;
                }
                console.log(`\n${BOLD}── Routing History ──${RESET}`);
                for (let i = 0; i < state.routingHistory.length; i++) {
                    const r = state.routingHistory[i];
                    console.log(`  ${DIM}#${i + 1}${RESET} → ${roleTag(r.targetAgent)}  ${bar(r.confidence, 1, 10)}`);
                }
                console.log();
                rl.prompt(); return;
            }

            if (input.startsWith('/route ')) {
                const intent = input.slice(7);
                const routing = mesh.route(intent);
                console.log(`\n${BOLD}── Route Preview (dry run) ──${RESET}`);
                console.log(`  ${BOLD}Best match:${RESET} ${roleTag(routing.targetAgent)}`);
                console.log(`  ${BOLD}Scores:${RESET}`);
                const sorted = Object.entries(routing.allScores).sort(([, a], [, b]) => b - a);
                for (const [role, score] of sorted) {
                    const marker = role === routing.targetAgent ? ' ◄' : '';
                    console.log(`    ${ROLE_COLORS[role as AgentRole]}${role.padEnd(10)}${RESET} ${bar(score)}${marker}`);
                }
                console.log();
                rl.prompt(); return;
            }

            if (input.startsWith('/broadcast ')) {
                const intent = input.slice(11);
                console.log(`${DIM}  📡 Broadcasting to all agents...${RESET}`);
                const results = await mesh.broadcast(intent);
                console.log(`\n${BOLD}── Broadcast Results ──${RESET}`);
                for (const [role, result] of results) {
                    console.log(`  ${roleTag(role)}  R:${result.resonance.score.toFixed(3)} | ${result.state} | ${result.tier}`);
                }
                console.log();
                rl.prompt(); return;
            }

            // ── Standard dispatch ──────────────────────────────────────
            console.log(`${DIM}  ⏳ Routing through mesh...${RESET}`);
            const result = await mesh.dispatch(input);
            printMeshResult(result);

        } catch (err: any) {
            if (err.message?.includes('GOOSEGUARD')) {
                console.log(`\n${BOLD}${RED}🛡 GOOSEGUARD ACTIVATED${RESET}`);
                console.log(`  ${err.message}\n`);
            } else {
                console.log(`${RED}Error:${RESET} ${err.message}\n`);
            }
        }

        rl.prompt();
    });

    rl.on('close', () => {
        console.log(`\n${DIM}Mesh terminated.${RESET}`);
        process.exit(0);
    });
}

main().catch(console.error);
