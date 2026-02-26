/**
 * PRZ-OS v3.0 — PATH Finder Agent
 * Scans the system for installed tools, detects PATH misconfigurations,
 * locates missing executables, and auto-repairs PATH.
 *
 * Integrates into the Agent Mesh as the "pathfinder" role.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as child_process from 'node:child_process';

// ── Types ────────────────────────────────────────────────────────────

export interface FoundBinary {
    name: string;
    path: string;
    version?: string;
    inPath: boolean;
    source: 'scan' | 'registry' | 'known-location';
}

export interface PathDiagnostic {
    totalEntries: number;
    validEntries: number;
    invalidEntries: string[];
    duplicateEntries: string[];
    emptyEntries: number;
}

export interface PathFinderResult {
    timestamp: string;
    hostname: string;
    platform: string;
    diagnostic: PathDiagnostic;
    foundBinaries: FoundBinary[];
    missingFromPath: FoundBinary[];
    recommendations: PathRecommendation[];
    fixes: PathFix[];
}

export interface PathRecommendation {
    severity: 'critical' | 'warning' | 'info';
    message: string;
    action?: string;
}

export interface PathFix {
    description: string;
    directory: string;
    applied: boolean;
    error?: string;
}

// ── Known install locations (Windows) ────────────────────────────────

const KNOWN_LOCATIONS: Record<string, string[]> = {
    'docker': [
        'C:\\Program Files\\Docker\\Docker\\resources\\bin',
        'C:\\ProgramData\\DockerDesktop\\version-bin'
    ],
    'docker-compose': [
        'C:\\Program Files\\Docker\\Docker\\resources\\bin'
    ],
    'gh': [
        'C:\\Program Files\\GitHub CLI',
        'C:\\Program Files (x86)\\GitHub CLI'
    ],
    'code': [
        'C:\\Users\\*\\AppData\\Local\\Programs\\Microsoft VS Code\\bin',
        'C:\\Program Files\\Microsoft VS Code\\bin'
    ],
    'node': [
        'C:\\Program Files\\nodejs'
    ],
    'python': [
        'C:\\Python3*',
        'C:\\Users\\*\\AppData\\Local\\Programs\\Python\\Python3*',
        'C:\\Program Files\\Python3*'
    ],
    'git': [
        'C:\\Program Files\\Git\\cmd',
        'C:\\Program Files\\Git\\bin',
        'C:\\Program Files (x86)\\Git\\cmd'
    ],
    'kubectl': [
        'C:\\Program Files\\kubectl'
    ],
    'terraform': [
        'C:\\Program Files\\Terraform',
        'C:\\HashiCorp\\Terraform'
    ],
    'gcloud': [
        'C:\\Program Files (x86)\\Google\\Cloud SDK\\google-cloud-sdk\\bin',
        'C:\\Users\\*\\AppData\\Local\\Google\\Cloud SDK\\google-cloud-sdk\\bin'
    ],
    'az': [
        'C:\\Program Files (x86)\\Microsoft SDKs\\Azure\\CLI2\\wbin',
        'C:\\Program Files\\Microsoft SDKs\\Azure\\CLI2\\wbin'
    ],
    'cargo': [
        'C:\\Users\\*\\.cargo\\bin'
    ],
    'go': [
        'C:\\Program Files\\Go\\bin',
        'C:\\Go\\bin'
    ],
    'java': [
        'C:\\Program Files\\Java\\*\\bin',
        'C:\\Program Files\\Eclipse Adoptium\\*\\bin'
    ],
    'nvidia-smi': [
        'C:\\Windows\\System32',
        'C:\\Program Files\\NVIDIA Corporation\\NVSMI'
    ],
    'wsl': [
        'C:\\Windows\\System32'
    ],
    'winget': [
        'C:\\Users\\*\\AppData\\Local\\Microsoft\\WindowsApps'
    ],
    'ssh': [
        'C:\\Windows\\System32\\OpenSSH',
        'C:\\Program Files\\OpenSSH'
    ],
    'curl': [
        'C:\\Windows\\System32'
    ],
    'nvm': [
        'C:\\Users\\*\\AppData\\Roaming\\nvm'
    ],
    'pnpm': [
        'C:\\Users\\*\\AppData\\Local\\pnpm'
    ],
    'bun': [
        'C:\\Users\\*\\.bun\\bin'
    ],
    'deno': [
        'C:\\Users\\*\\.deno\\bin'
    ]
};

// ── Core Functions ───────────────────────────────────────────────────

function exec(cmd: string): string {
    try {
        return child_process.execSync(cmd, {
            encoding: 'utf-8',
            timeout: 5000,
            windowsHide: true,
            stdio: ['pipe', 'pipe', 'pipe']
        }).trim();
    } catch {
        return '';
    }
}

function getPathEntries(): string[] {
    const raw = process.env.PATH || process.env.Path || '';
    return raw.split(path.delimiter).filter(Boolean);
}

function isInPath(dir: string): boolean {
    const entries = getPathEntries().map(e => e.toLowerCase().replace(/[\\/]+$/, ''));
    return entries.includes(dir.toLowerCase().replace(/[\\/]+$/, ''));
}

function resolveGlob(pattern: string): string[] {
    // Simple glob resolution for Windows paths with *
    if (!pattern.includes('*')) {
        return fs.existsSync(pattern) ? [pattern] : [];
    }

    const parts = pattern.split(path.sep);
    let candidates = [''];

    for (const part of parts) {
        const nextCandidates: string[] = [];
        for (const candidate of candidates) {
            const base = candidate || (part.includes(':') ? '' : undefined);
            if (base === undefined) continue;

            if (part.includes('*')) {
                const dir = candidate || path.parse(pattern).root;
                try {
                    const entries = fs.readdirSync(dir, { withFileTypes: true });
                    const regex = new RegExp('^' + part.replace(/\*/g, '.*') + '$', 'i');
                    for (const entry of entries) {
                        if (regex.test(entry.name)) {
                            nextCandidates.push(path.join(dir, entry.name));
                        }
                    }
                } catch { /* skip inaccessible dirs */ }
            } else {
                const full = candidate ? path.join(candidate, part) : part;
                nextCandidates.push(full);
            }
        }
        candidates = nextCandidates;
    }

    return candidates.filter(c => {
        try { return fs.existsSync(c); } catch { return false; }
    });
}

function findBinary(name: string, locations: string[]): FoundBinary | null {
    for (const locPattern of locations) {
        const resolved = resolveGlob(locPattern);
        for (const dir of resolved) {
            const exePath = path.join(dir, `${name}.exe`);
            const cmdPath = path.join(dir, `${name}.cmd`);
            const batPath = path.join(dir, `${name}.bat`);
            const plainPath = path.join(dir, name);

            for (const p of [exePath, cmdPath, batPath, plainPath]) {
                try {
                    if (fs.existsSync(p)) {
                        return {
                            name,
                            path: dir,
                            inPath: isInPath(dir),
                            source: 'known-location'
                        };
                    }
                } catch { /* skip */ }
            }
        }
    }
    return null;
}

function getVersion(name: string): string {
    const versionFlags = ['--version', '-v', 'version'];
    for (const flag of versionFlags) {
        const result = exec(`${name} ${flag} 2>&1`);
        if (result && !result.toLowerCase().includes('not recognized') && result.length < 200) {
            // Extract first line only
            return result.split('\n')[0].trim();
        }
    }
    return '';
}

function diagnosePath(): PathDiagnostic {
    const entries = getPathEntries();
    const seen = new Set<string>();
    const duplicates: string[] = [];
    const invalid: string[] = [];
    let emptyCount = 0;

    for (const entry of entries) {
        if (!entry.trim()) { emptyCount++; continue; }

        const normalized = entry.toLowerCase().replace(/[\\/]+$/, '');
        if (seen.has(normalized)) {
            duplicates.push(entry);
        } else {
            seen.add(normalized);
        }

        try {
            if (!fs.existsSync(entry)) {
                invalid.push(entry);
            }
        } catch {
            invalid.push(entry);
        }
    }

    return {
        totalEntries: entries.length,
        validEntries: entries.length - invalid.length - emptyCount,
        invalidEntries: invalid,
        duplicateEntries: duplicates,
        emptyEntries: emptyCount
    };
}

// ── Main Scanner ─────────────────────────────────────────────────────

export function runPathFinder(autoFix: boolean = false): PathFinderResult {
    const hostname = exec('hostname') || 'unknown';
    const diagnostic = diagnosePath();
    const foundBinaries: FoundBinary[] = [];
    const missingFromPath: FoundBinary[] = [];
    const recommendations: PathRecommendation[] = [];
    const fixes: PathFix[] = [];

    // Scan all known locations
    for (const [name, locations] of Object.entries(KNOWN_LOCATIONS)) {
        const found = findBinary(name, locations);
        if (found) {
            // Try to get version if it's in PATH
            if (found.inPath) {
                found.version = getVersion(name);
            }
            foundBinaries.push(found);

            if (!found.inPath) {
                missingFromPath.push(found);
            }
        }
    }

    // Generate recommendations
    if (diagnostic.invalidEntries.length > 0) {
        recommendations.push({
            severity: 'warning',
            message: `${diagnostic.invalidEntries.length} PATH entries point to non-existent directories`,
            action: 'Remove invalid PATH entries to speed up command resolution'
        });
    }

    if (diagnostic.duplicateEntries.length > 0) {
        recommendations.push({
            severity: 'info',
            message: `${diagnostic.duplicateEntries.length} duplicate PATH entries found`,
            action: 'Deduplicate PATH for cleaner environment'
        });
    }

    if (missingFromPath.length > 0) {
        recommendations.push({
            severity: 'critical',
            message: `${missingFromPath.length} installed tool(s) not in PATH: ${missingFromPath.map(b => b.name).join(', ')}`,
            action: 'Add missing directories to PATH'
        });
    }

    // PRZ-specific checks
    const przTools = ['node', 'git', 'docker', 'gh', 'gcloud'];
    const missingPrz = przTools.filter(t => !foundBinaries.find(b => b.name === t));
    if (missingPrz.length > 0) {
        recommendations.push({
            severity: 'critical',
            message: `PRZ-required tools not found: ${missingPrz.join(', ')}`,
            action: 'Install missing tools for full PRZ-OS functionality'
        });
    }

    // Auto-fix: add missing directories to User PATH
    if (autoFix && missingFromPath.length > 0) {
        for (const binary of missingFromPath) {
            const fix: PathFix = {
                description: `Add ${binary.name} (${binary.path}) to User PATH`,
                directory: binary.path,
                applied: false
            };

            try {
                const currentUserPath = exec(
                    'powershell -Command "[System.Environment]::GetEnvironmentVariable(\'Path\',\'User\')"'
                );
                const entries = currentUserPath.split(';').filter(Boolean);
                const normalized = binary.path.toLowerCase().replace(/[\\/]+$/, '');

                if (!entries.some(e => e.toLowerCase().replace(/[\\/]+$/, '') === normalized)) {
                    const newPath = [...entries, binary.path].join(';');
                    exec(
                        `powershell -Command "[System.Environment]::SetEnvironmentVariable('Path','${newPath.replace(/'/g, "''")}','User')"`
                    );
                    fix.applied = true;
                } else {
                    fix.applied = true;
                    fix.description += ' (already present in User PATH)';
                }
            } catch (err: any) {
                fix.error = err.message;
            }

            fixes.push(fix);
        }
    }

    return {
        timestamp: new Date().toISOString(),
        hostname,
        platform: process.platform,
        diagnostic,
        foundBinaries,
        missingFromPath,
        recommendations,
        fixes
    };
}

// ── Report Generator ─────────────────────────────────────────────────

export function generatePathReport(result: PathFinderResult): string {
    const lines: string[] = [];

    lines.push('# PATH Finder Report');
    lines.push(`**Host**: ${result.hostname} | **Platform**: ${result.platform}`);
    lines.push(`**Scanned**: ${new Date(result.timestamp).toLocaleString()}`);
    lines.push('');

    // Diagnostic
    lines.push('## PATH Diagnostic');
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Total Entries | ${result.diagnostic.totalEntries} |`);
    lines.push(`| Valid Entries | ${result.diagnostic.validEntries} |`);
    lines.push(`| Invalid Entries | ${result.diagnostic.invalidEntries.length} |`);
    lines.push(`| Duplicates | ${result.diagnostic.duplicateEntries.length} |`);
    lines.push('');

    if (result.diagnostic.invalidEntries.length > 0) {
        lines.push('### Invalid PATH Entries');
        for (const entry of result.diagnostic.invalidEntries) {
            lines.push(`- \`${entry}\``);
        }
        lines.push('');
    }

    // Found Binaries
    lines.push('## Discovered Tools');
    lines.push('| Tool | Location | In PATH | Version |');
    lines.push('|------|----------|---------|---------|');
    for (const b of result.foundBinaries) {
        const pathStatus = b.inPath ? '✅' : '❌';
        lines.push(`| ${b.name} | \`${b.path}\` | ${pathStatus} | ${b.version || '—'} |`);
    }
    lines.push('');

    // Missing from PATH
    if (result.missingFromPath.length > 0) {
        lines.push('## ⚠️ Installed but NOT in PATH');
        for (const b of result.missingFromPath) {
            lines.push(`- **${b.name}** → \`${b.path}\``);
        }
        lines.push('');
    }

    // Recommendations
    if (result.recommendations.length > 0) {
        lines.push('## Recommendations');
        for (const r of result.recommendations) {
            const icon = r.severity === 'critical' ? '🔴' : r.severity === 'warning' ? '🟡' : '🔵';
            lines.push(`${icon} **${r.severity.toUpperCase()}**: ${r.message}`);
            if (r.action) lines.push(`   → ${r.action}`);
        }
        lines.push('');
    }

    // Fixes
    if (result.fixes.length > 0) {
        lines.push('## Fixes Applied');
        for (const f of result.fixes) {
            const status = f.applied ? '✅' : '❌';
            lines.push(`${status} ${f.description}`);
            if (f.error) lines.push(`   Error: ${f.error}`);
        }
    }

    return lines.join('\n');
}
