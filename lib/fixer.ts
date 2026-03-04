/**
 * PRZ-OS v3.0 — Fixer Agent
 * Autonomous system repair agent. Takes diagnostics from pathfinder
 * and system audit, then applies fixes: PATH cleanup, tool installation,
 * config repairs, environment hygiene, and dependency resolution.
 *
 * Integrates into the Agent Mesh as the "fixer" role.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as child_process from 'node:child_process';

// ── Types ────────────────────────────────────────────────────────────

export type FixCategory =
    | 'path-cleanup'
    | 'path-add'
    | 'tool-install'
    | 'config-repair'
    | 'env-set'
    | 'env-remove'
    | 'service-start'
    | 'permission-fix'
    | 'cache-clean';

export type FixSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface FixAction {
    id: string;
    category: FixCategory;
    severity: FixSeverity;
    description: string;
    command?: string;
    target?: string;
    status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
    output?: string;
    error?: string;
    duration?: number;
    rollback?: string;       // command to undo the fix
}

export interface FixPlan {
    hostname: string;
    timestamp: string;
    totalActions: number;
    actions: FixAction[];
}

export interface FixResult {
    plan: FixPlan;
    succeeded: number;
    failed: number;
    skipped: number;
    duration: number;
    rollbackCommands: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────

function exec(cmd: string, timeout: number = 10000): { stdout: string; exitCode: number } {
    try {
        const stdout = child_process.execSync(cmd, {
            encoding: 'utf-8',
            timeout,
            windowsHide: true,
            stdio: ['pipe', 'pipe', 'pipe']
        }).trim();
        return { stdout, exitCode: 0 };
    } catch (err: any) {
        return { stdout: err.stdout?.trim() || '', exitCode: err.status || 1 };
    }
}

function psExec(script: string, timeout: number = 15000): { stdout: string; exitCode: number } {
    // Escape for powershell -Command
    const escaped = script.replace(/"/g, '\\"');
    return exec(`powershell -NoProfile -NonInteractive -Command "${escaped}"`, timeout);
}

function getHostname(): string {
    return exec('hostname').stdout || 'unknown';
}

function getUserPath(): string {
    return psExec("[System.Environment]::GetEnvironmentVariable('Path','User')").stdout;
}

function getMachinePath(): string {
    return psExec("[System.Environment]::GetEnvironmentVariable('Path','Machine')").stdout;
}

function setUserPath(newPath: string): { stdout: string; exitCode: number } {
    const escaped = newPath.replace(/'/g, "''");
    return psExec(`[System.Environment]::SetEnvironmentVariable('Path','${escaped}','User')`);
}

function setUserEnvVar(name: string, value: string): { stdout: string; exitCode: number } {
    const escapedVal = value.replace(/'/g, "''");
    return psExec(`[System.Environment]::SetEnvironmentVariable('${name}','${escapedVal}','User')`);
}

// ── Fix Generators ───────────────────────────────────────────────────

function generatePathCleanupActions(): FixAction[] {
    const actions: FixAction[] = [];
    const userPath = getUserPath();
    const entries = userPath.split(';').filter(Boolean);
    const cleaned: string[] = [];
    const seen = new Set<string>();
    let removedInvalid = 0;
    let removedDuplicates = 0;

    for (const entry of entries) {
        const normalized = entry.toLowerCase().replace(/[\\/]+$/, '');

        // Skip duplicates
        if (seen.has(normalized)) {
            removedDuplicates++;
            continue;
        }
        seen.add(normalized);

        // Skip non-existent directories
        try {
            if (!fs.existsSync(entry)) {
                removedInvalid++;
                continue;
            }
        } catch {
            removedInvalid++;
            continue;
        }

        cleaned.push(entry);
    }

    if (removedInvalid > 0 || removedDuplicates > 0) {
        actions.push({
            id: 'path-clean-user',
            category: 'path-cleanup',
            severity: 'medium',
            description: `Clean User PATH: remove ${removedInvalid} invalid + ${removedDuplicates} duplicate entries (${entries.length} → ${cleaned.length})`,
            target: cleaned.join(';'),
            rollback: userPath,
            status: 'pending'
        });
    }

    // Also check Machine PATH for invalid entries (report only, don't modify)
    const machinePath = getMachinePath();
    const machineEntries = machinePath.split(';').filter(Boolean);
    const machineInvalid = machineEntries.filter(e => {
        try { return !fs.existsSync(e); } catch { return true; }
    });

    if (machineInvalid.length > 0) {
        actions.push({
            id: 'path-machine-report',
            category: 'path-cleanup',
            severity: 'low',
            description: `Machine PATH has ${machineInvalid.length} invalid entries (requires admin to fix)`,
            status: 'skipped'
        });
    }

    return actions;
}

function generateToolInstallActions(): FixAction[] {
    const actions: FixAction[] = [];

    // Check for PRZ-required tools
    const toolChecks: { name: string; check: string; install: string; severity: FixSeverity }[] = [
        {
            name: 'gcloud',
            check: 'gcloud --version',
            install: 'winget install --id Google.CloudSDK --accept-source-agreements --accept-package-agreements',
            severity: 'high'
        },
        {
            name: 'kubectl',
            check: 'kubectl version --client',
            install: 'winget install --id Kubernetes.kubectl --accept-source-agreements --accept-package-agreements',
            severity: 'low'
        },
        {
            name: 'terraform',
            check: 'terraform --version',
            install: 'winget install --id Hashicorp.Terraform --accept-source-agreements --accept-package-agreements',
            severity: 'low'
        }
    ];

    for (const tool of toolChecks) {
        const result = exec(tool.check, 5000);
        if (result.exitCode !== 0 || result.stdout.includes('not recognized')) {
            actions.push({
                id: `install-${tool.name}`,
                category: 'tool-install',
                severity: tool.severity,
                description: `Install ${tool.name} (PRZ dependency)`,
                command: tool.install,
                status: 'pending'
            });
        }
    }

    return actions;
}

function generateConfigRepairActions(): FixAction[] {
    const actions: FixAction[] = [];

    // Git config checks
    const gitChecks: { key: string; expected: string; description: string }[] = [
        { key: 'core.autocrlf', expected: 'true', description: 'Git: line ending normalization' },
        { key: 'core.fscache', expected: 'true', description: 'Git: filesystem cache for performance' },
        { key: 'fetch.parallel', expected: '4', description: 'Git: parallel fetch for speed' },
        { key: 'init.defaultBranch', expected: 'main', description: 'Git: default branch name' },
    ];

    for (const check of gitChecks) {
        const result = exec(`git config --global --get ${check.key}`);
        if (result.stdout !== check.expected) {
            actions.push({
                id: `git-config-${check.key.replace(/\./g, '-')}`,
                category: 'config-repair',
                severity: 'low',
                description: `${check.description} (${result.stdout || 'unset'} → ${check.expected})`,
                command: `git config --global ${check.key} ${check.expected}`,
                rollback: result.stdout ? `git config --global ${check.key} ${result.stdout}` : `git config --global --unset ${check.key}`,
                status: 'pending'
            });
        }
    }

    // npm config checks
    const npmChecks: { key: string; expected: string; description: string }[] = [
        { key: 'fund', expected: 'false', description: 'npm: disable fund messages' },
        { key: 'audit', expected: 'false', description: 'npm: disable auto-audit on install' },
    ];

    for (const check of npmChecks) {
        const result = exec(`npm config get ${check.key}`);
        if (result.stdout !== check.expected) {
            actions.push({
                id: `npm-config-${check.key}`,
                category: 'config-repair',
                severity: 'low',
                description: `${check.description} (${result.stdout || 'unset'} → ${check.expected})`,
                command: `npm config set ${check.key} ${check.expected}`,
                rollback: `npm config delete ${check.key}`,
                status: 'pending'
            });
        }
    }

    return actions;
}

function generateEnvActions(): FixAction[] {
    const actions: FixAction[] = [];

    const envChecks: { name: string; value: string; description: string; severity: FixSeverity }[] = [
        { name: 'NODE_OPTIONS', value: '--max-old-space-size=8192', description: 'Node.js heap: 8 GB for mesh workloads', severity: 'medium' },
        { name: 'PRZ_COMPLIANCE_MODE', value: 'STRICT', description: 'PRZ compliance mode', severity: 'high' },
        { name: 'PRZ_REGION', value: 'northamerica-northeast1', description: 'PRZ deployment region', severity: 'high' },
        { name: 'PRZ_MESH_CONCURRENCY', value: '8', description: 'PRZ mesh concurrency limit', severity: 'medium' },
    ];

    for (const check of envChecks) {
        const result = psExec(`[System.Environment]::GetEnvironmentVariable('${check.name}','User')`);
        if (result.stdout !== check.value) {
            actions.push({
                id: `env-${check.name.toLowerCase()}`,
                category: 'env-set',
                severity: check.severity,
                description: `Set ${check.name}: ${check.description} (${result.stdout || 'unset'} → ${check.value})`,
                target: check.value,
                rollback: result.stdout
                    ? `powershell -Command "[System.Environment]::SetEnvironmentVariable('${check.name}','${result.stdout}','User')"`
                    : `powershell -Command "[System.Environment]::SetEnvironmentVariable('${check.name}','','User')"`,
                status: 'pending'
            });
        }
    }

    return actions;
}

function generateCacheCleanActions(): FixAction[] {
    const actions: FixAction[] = [];

    // npm cache
    const cacheResult = exec('npm cache verify --json 2>&1', 10000);
    if (cacheResult.stdout.includes('error') || cacheResult.exitCode !== 0) {
        actions.push({
            id: 'npm-cache-clean',
            category: 'cache-clean',
            severity: 'low',
            description: 'Clean npm cache (corrupted or oversized)',
            command: 'npm cache clean --force',
            status: 'pending'
        });
    }

    // Temp directory cleanup
    const tempDir = process.env.TEMP || process.env.TMP || '';
    if (tempDir) {
        try {
            const temps = fs.readdirSync(tempDir);
            const przTemps = temps.filter(f => f.startsWith('prz-') || f.startsWith('npm-') || f.startsWith('tsx-'));
            if (przTemps.length > 20) {
                actions.push({
                    id: 'temp-cleanup',
                    category: 'cache-clean',
                    severity: 'low',
                    description: `Clean ${przTemps.length} stale PRZ/npm/tsx temp files from ${tempDir}`,
                    status: 'pending'
                });
            }
        } catch { /* skip */ }
    }

    return actions;
}

// ── Fix Executor ─────────────────────────────────────────────────────

function executeAction(action: FixAction): void {
    const start = Date.now();
    action.status = 'running';

    try {
        switch (action.category) {
            case 'path-cleanup': {
                if (action.target) {
                    const result = setUserPath(action.target);
                    action.output = result.stdout;
                    action.status = result.exitCode === 0 ? 'success' : 'failed';
                    if (result.exitCode !== 0) action.error = 'Failed to update User PATH';
                }
                break;
            }

            case 'tool-install': {
                if (action.command) {
                    const result = exec(action.command, 120000); // 2 min timeout for installs
                    action.output = result.stdout;
                    action.status = result.exitCode === 0 ? 'success' : 'failed';
                    if (result.exitCode !== 0) action.error = `Install failed (exit ${result.exitCode})`;
                }
                break;
            }

            case 'config-repair': {
                if (action.command) {
                    const result = exec(action.command);
                    action.output = result.stdout;
                    action.status = result.exitCode === 0 ? 'success' : 'failed';
                    if (result.exitCode !== 0) action.error = `Config command failed`;
                }
                break;
            }

            case 'env-set': {
                if (action.target) {
                    const name = action.id.replace('env-', '').toUpperCase().replace(/-/g, '_');
                    // Extract the env var name from the description
                    const match = action.description.match(/Set (\w+):/);
                    const envName = match ? match[1] : name;
                    const result = setUserEnvVar(envName, action.target);
                    action.output = result.stdout;
                    action.status = result.exitCode === 0 ? 'success' : 'failed';
                    if (result.exitCode !== 0) action.error = 'Failed to set environment variable';
                }
                break;
            }

            case 'cache-clean': {
                if (action.command) {
                    const result = exec(action.command, 30000);
                    action.output = result.stdout;
                    action.status = result.exitCode === 0 ? 'success' : 'failed';
                } else if (action.id === 'temp-cleanup') {
                    const tempDir = process.env.TEMP || process.env.TMP || '';
                    let cleaned = 0;
                    try {
                        const temps = fs.readdirSync(tempDir);
                        const stale = temps.filter(f => f.startsWith('prz-') || f.startsWith('npm-') || f.startsWith('tsx-'));
                        for (const f of stale) {
                            try { fs.rmSync(path.join(tempDir, f), { recursive: true, force: true }); cleaned++; } catch { /* skip locked */ }
                        }
                        action.output = `Cleaned ${cleaned} temp entries`;
                        action.status = 'success';
                    } catch (err: any) {
                        action.error = err.message;
                        action.status = 'failed';
                    }
                }
                break;
            }

            default:
                action.status = 'skipped';
                action.output = 'No executor for this category';
        }
    } catch (err: any) {
        action.status = 'failed';
        action.error = err.message;
    }

    action.duration = Date.now() - start;
}

// ── Public API ───────────────────────────────────────────────────────

export function buildFixPlan(): FixPlan {
    const actions: FixAction[] = [
        ...generatePathCleanupActions(),
        ...generateToolInstallActions(),
        ...generateConfigRepairActions(),
        ...generateEnvActions(),
        ...generateCacheCleanActions()
    ];

    // Sort by severity
    const severityOrder: Record<FixSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    actions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return {
        hostname: getHostname(),
        timestamp: new Date().toISOString(),
        totalActions: actions.length,
        actions
    };
}

export function executePlan(plan: FixPlan, options: { dryRun?: boolean; skipInstalls?: boolean } = {}): FixResult {
    const start = Date.now();
    let succeeded = 0;
    let failed = 0;
    let skipped = 0;
    const rollbackCommands: string[] = [];

    for (const action of plan.actions) {
        if (action.status === 'skipped') { skipped++; continue; }

        if (options.dryRun) {
            action.status = 'skipped';
            action.output = 'Dry run — no changes applied';
            skipped++;
            continue;
        }

        if (options.skipInstalls && action.category === 'tool-install') {
            action.status = 'skipped';
            action.output = 'Skipped: tool installs disabled';
            skipped++;
            continue;
        }

        executeAction(action);

        if (action.status === 'success') {
            succeeded++;
            if (action.rollback) rollbackCommands.push(action.rollback);
        } else if (action.status === 'failed') {
            failed++;
        } else {
            skipped++;
        }
    }

    return {
        plan,
        succeeded,
        failed,
        skipped,
        duration: Date.now() - start,
        rollbackCommands
    };
}

export function generateFixReport(result: FixResult): string {
    const lines: string[] = [];

    lines.push('# Fixer Agent — Repair Report');
    lines.push(`**Host**: ${result.plan.hostname} | **Date**: ${result.plan.timestamp}`);
    lines.push(`**Duration**: ${result.duration}ms | **Actions**: ${result.plan.totalActions}`);
    lines.push('');
    lines.push(`| Result | Count |`);
    lines.push(`|--------|-------|`);
    lines.push(`| ✅ Succeeded | ${result.succeeded} |`);
    lines.push(`| ❌ Failed | ${result.failed} |`);
    lines.push(`| ⏭ Skipped | ${result.skipped} |`);
    lines.push('');

    // Group by category
    const categories = new Map<string, FixAction[]>();
    for (const action of result.plan.actions) {
        const list = categories.get(action.category) || [];
        list.push(action);
        categories.set(action.category, list);
    }

    for (const [category, actions] of categories) {
        lines.push(`## ${categoryLabel(category)}`);
        lines.push('');
        for (const a of actions) {
            const icon = a.status === 'success' ? '✅' : a.status === 'failed' ? '❌' : '⏭';
            lines.push(`${icon} **${a.description}**`);
            if (a.command) lines.push(`  \`${a.command}\``);
            if (a.output) lines.push(`  → ${a.output}`);
            if (a.error) lines.push(`  ⚠️ ${a.error}`);
            if (a.duration) lines.push(`  ⏱ ${a.duration}ms`);
            lines.push('');
        }
    }

    if (result.rollbackCommands.length > 0) {
        lines.push('## Rollback Commands');
        lines.push('If anything went wrong, run these to revert:');
        lines.push('```');
        for (const cmd of result.rollbackCommands) {
            lines.push(cmd);
        }
        lines.push('```');
    }

    return lines.join('\n');
}

function categoryLabel(cat: string): string {
    const labels: Record<string, string> = {
        'path-cleanup': '🧹 PATH Cleanup',
        'path-add': '➕ PATH Additions',
        'tool-install': '📦 Tool Installation',
        'config-repair': '🔧 Config Repairs',
        'env-set': '🌍 Environment Variables',
        'env-remove': '🗑 Environment Removal',
        'cache-clean': '🧊 Cache Cleanup',
        'service-start': '▶️ Service Start',
        'permission-fix': '🔐 Permission Fix'
    };
    return labels[cat] || cat;
}
