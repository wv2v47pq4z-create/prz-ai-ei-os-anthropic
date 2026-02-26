/**
 * PRZ-OS v3.0 — Agent Mesh
 * Multi-agent coordination network using Resonance-based routing.
 *
 * Architecture:
 *   MeshCoordinator
 *     ├── MeshAgent("architect")   — designs systems, plans work
 *     ├── MeshAgent("builder")     — writes code, creates artifacts
 *     ├── MeshAgent("auditor")     — security audits, code review
 *     ├── MeshAgent("ops")         — deployment, monitoring, infra
 *     ├── MeshAgent("analyst")     — data analysis, reporting
 *     └── MeshAgent("pathfinder")  — PATH diagnostics, tool discovery
 *
 * Routing is done via Harmonic Field matching — the request is vectorized
 * and routed to the agent with the highest resonance score.
 */

import { PrzAgent, createPrzAgent, AgentRunResult } from './agent';
import { EmotionalIntelligence } from '../src/emotional-intelligence';
import { calculatePatternMatchConfidence } from './harmonic-field';
import { UserFeedback } from './prz/user-feedback';

// ── Types ────────────────────────────────────────────────────────────

export type AgentRole = 'architect' | 'builder' | 'auditor' | 'ops' | 'analyst' | 'pathfinder';

export interface MeshMessage {
    id: string;
    from: AgentRole | 'coordinator';
    to: AgentRole | 'broadcast';
    intent: string;
    payload: any;
    timestamp: number;
    parentId?: string;          // for chained messages
    resonanceScore?: number;    // routing confidence
}

export interface MeshAgentConfig {
    role: AgentRole;
    description: string;
    patterns: string[];         // intent patterns this agent handles
    capabilities: string[];
    maxConcurrent: number;
}

export interface MeshRoutingResult {
    targetAgent: AgentRole;
    confidence: number;
    allScores: Record<AgentRole, number>;
    reasoning: string;
}

export interface MeshResult {
    originAgent: AgentRole;
    agentResult: AgentRunResult;
    routing: MeshRoutingResult;
    delegations: MeshDelegation[];
    meshState: MeshState;
}

export interface MeshDelegation {
    from: AgentRole;
    to: AgentRole;
    intent: string;
    result?: AgentRunResult;
    status: 'pending' | 'complete' | 'failed';
}

export interface MeshState {
    activeAgents: AgentRole[];
    totalMessages: number;
    routingHistory: MeshRoutingResult[];
    agentStates: Record<AgentRole, 'idle' | 'busy' | 'blocked'>;
    meshResonance: number;     // aggregate health of the mesh
}

// ── Agent Registry ───────────────────────────────────────────────────

const AGENT_CONFIGS: MeshAgentConfig[] = [
    {
        role: 'architect',
        description: 'System design, architecture planning, technical specifications',
        patterns: [
            'design system architecture',
            'plan technical implementation',
            'create specification document',
            'evaluate technology stack',
            'define API contracts',
            'model data relationships',
            'architect microservices'
        ],
        capabilities: ['system-design', 'api-design', 'data-modeling', 'tech-evaluation'],
        maxConcurrent: 2
    },
    {
        role: 'builder',
        description: 'Code generation, component building, feature implementation',
        patterns: [
            'create React component',
            'build API endpoint',
            'implement feature',
            'write function',
            'generate code',
            'develop module',
            'build application',
            'create database schema'
        ],
        capabilities: ['code-generation', 'component-building', 'feature-implementation'],
        maxConcurrent: 4
    },
    {
        role: 'auditor',
        description: 'Security auditing, code review, compliance verification',
        patterns: [
            'perform security audit',
            'review code quality',
            'check compliance',
            'identify vulnerabilities',
            'verify AIDA compliance',
            'scan for injection risks',
            'audit access controls'
        ],
        capabilities: ['security-audit', 'code-review', 'compliance-check', 'vulnerability-scan'],
        maxConcurrent: 2
    },
    {
        role: 'ops',
        description: 'Deployment, monitoring, infrastructure management',
        patterns: [
            'deploy to cloud',
            'monitor service health',
            'configure infrastructure',
            'set up CI/CD pipeline',
            'manage containers',
            'scale resources',
            'check deployment status'
        ],
        capabilities: ['deployment', 'monitoring', 'infrastructure', 'ci-cd'],
        maxConcurrent: 3
    },
    {
        role: 'analyst',
        description: 'Data analysis, reporting, metrics, insights',
        patterns: [
            'analyze data',
            'create report',
            'generate metrics',
            'extract insights',
            'summarize findings',
            'trend analysis',
            'performance benchmarking'
        ],
        capabilities: ['data-analysis', 'reporting', 'metrics', 'insights'],
        maxConcurrent: 2
    },
    {
        role: 'pathfinder',
        description: 'PATH diagnostics, tool discovery, environment scanning, system configuration',
        patterns: [
            'find tool path',
            'scan system path',
            'discover installed tools',
            'fix path configuration',
            'check environment',
            'locate binary',
            'audit system path',
            'find missing tools',
            'configure environment variables',
            'resolve command not found'
        ],
        capabilities: ['path-diagnostics', 'tool-discovery', 'env-scanning', 'auto-fix'],
        maxConcurrent: 1
    }
];

// ── MeshAgent ────────────────────────────────────────────────────────

export class MeshAgent {
    readonly config: MeshAgentConfig;
    readonly prz: PrzAgent;
    private status: 'idle' | 'busy' | 'blocked' = 'idle';
    private messageLog: MeshMessage[] = [];
    private taskCount = 0;

    constructor(config: MeshAgentConfig) {
        this.config = config;
        this.prz = createPrzAgent(new EmotionalIntelligence());
    }

    get role(): AgentRole { return this.config.role; }
    get state(): 'idle' | 'busy' | 'blocked' { return this.status; }
    get processed(): number { return this.taskCount; }

    /**
     * Calculate how well this agent matches a given intent.
     */
    scoreIntent(intent: string): number {
        let bestScore = 0;
        for (const pattern of this.config.patterns) {
            const score = calculatePatternMatchConfidence(intent, pattern);
            if (score > bestScore) bestScore = score;
        }
        return bestScore;
    }

    /**
     * Execute a task through this agent's PRZ pipeline.
     */
    async execute(intent: string, feedback?: UserFeedback): Promise<AgentRunResult> {
        this.status = 'busy';
        try {
            const result = await this.prz.run(intent, { feedback });
            this.taskCount++;
            return result;
        } finally {
            this.status = 'idle';
        }
    }

    logMessage(msg: MeshMessage): void {
        this.messageLog.push(msg);
    }

    getLog(): MeshMessage[] {
        return [...this.messageLog];
    }

    reset(): void {
        this.prz.reset();
        this.messageLog = [];
        this.taskCount = 0;
        this.status = 'idle';
    }
}

// ── MeshCoordinator ──────────────────────────────────────────────────

export class MeshCoordinator {
    private agents: Map<AgentRole, MeshAgent> = new Map();
    private messageCounter = 0;
    private routingHistory: MeshRoutingResult[] = [];
    private messageLog: MeshMessage[] = [];

    constructor() {
        for (const config of AGENT_CONFIGS) {
            this.agents.set(config.role, new MeshAgent(config));
        }
    }

    /**
     * Route an intent to the best-matched agent and execute it.
     */
    async dispatch(intent: string, feedback?: UserFeedback): Promise<MeshResult> {
        const routing = this.route(intent);
        this.routingHistory.push(routing);

        const agent = this.agents.get(routing.targetAgent)!;

        // Create mesh message
        const msg: MeshMessage = {
            id: `mesh-${++this.messageCounter}`,
            from: 'coordinator',
            to: routing.targetAgent,
            intent,
            payload: { feedback },
            timestamp: Date.now(),
            resonanceScore: routing.confidence
        };
        agent.logMessage(msg);
        this.messageLog.push(msg);

        // Execute on the target agent
        const agentResult = await agent.execute(intent, feedback);

        // Check if delegations are needed
        const delegations = await this.checkDelegations(intent, routing.targetAgent, agentResult);

        return {
            originAgent: routing.targetAgent,
            agentResult,
            routing,
            delegations,
            meshState: this.getMeshState()
        };
    }

    /**
     * Broadcast an intent to ALL agents and collect results.
     */
    async broadcast(intent: string): Promise<Map<AgentRole, AgentRunResult>> {
        const results = new Map<AgentRole, AgentRunResult>();

        const msg: MeshMessage = {
            id: `mesh-${++this.messageCounter}`,
            from: 'coordinator',
            to: 'broadcast',
            intent,
            payload: {},
            timestamp: Date.now()
        };
        this.messageLog.push(msg);

        const executions = Array.from(this.agents.entries()).map(async ([role, agent]) => {
            agent.logMessage({ ...msg, to: role });
            const result = await agent.execute(intent);
            results.set(role, result);
        });

        await Promise.all(executions);
        return results;
    }

    /**
     * Route an intent to the best agent using Harmonic Field scoring.
     */
    route(intent: string): MeshRoutingResult {
        const scores: Record<string, number> = {};
        let bestRole: AgentRole = 'builder';
        let bestScore = 0;

        for (const [role, agent] of this.agents) {
            const score = agent.scoreIntent(intent);
            scores[role] = score;

            // Bias toward idle agents (avoid overloading)
            const availabilityBonus = agent.state === 'idle' ? 0.05 : 0;
            const adjustedScore = score + availabilityBonus;

            if (adjustedScore > bestScore) {
                bestScore = adjustedScore;
                bestRole = role;
            }
        }

        return {
            targetAgent: bestRole,
            confidence: bestScore,
            allScores: scores as Record<AgentRole, number>,
            reasoning: `Routed to "${bestRole}" with confidence ${bestScore.toFixed(3)} via Harmonic Field matching`
        };
    }

    /**
     * Check if the primary agent's result should trigger delegations to other agents.
     */
    private async checkDelegations(
        intent: string,
        primaryAgent: AgentRole,
        primaryResult: AgentRunResult
    ): Promise<MeshDelegation[]> {
        const delegations: MeshDelegation[] = [];

        // Security-sensitive intents always get an auditor pass
        const securityKeywords = ['deploy', 'publish', 'production', 'credentials', 'auth', 'access'];
        const needsAudit = securityKeywords.some(kw => intent.toLowerCase().includes(kw));

        if (needsAudit && primaryAgent !== 'auditor') {
            const auditor = this.agents.get('auditor')!;
            const auditIntent = `Security review: ${intent}`;
            const delegation: MeshDelegation = {
                from: primaryAgent,
                to: 'auditor',
                intent: auditIntent,
                status: 'pending'
            };

            try {
                delegation.result = await auditor.execute(auditIntent);
                delegation.status = 'complete';
            } catch {
                delegation.status = 'failed';
            }

            delegations.push(delegation);
        }

        // Build intents get an ops follow-up if they mention deployment
        const opsKeywords = ['deploy', 'ship', 'release', 'publish', 'cloud run'];
        const needsOps = opsKeywords.some(kw => intent.toLowerCase().includes(kw));

        if (needsOps && primaryAgent !== 'ops') {
            const ops = this.agents.get('ops')!;
            const opsIntent = `Deployment preparation: ${intent}`;
            const delegation: MeshDelegation = {
                from: primaryAgent,
                to: 'ops',
                intent: opsIntent,
                status: 'pending'
            };

            try {
                delegation.result = await ops.execute(opsIntent);
                delegation.status = 'complete';
            } catch {
                delegation.status = 'failed';
            }

            delegations.push(delegation);
        }

        // Infrastructure/tool intents get a pathfinder pass to verify tools exist
        const pathKeywords = ['install', 'configure', 'setup', 'environment', 'tool', 'path', 'binary'];
        const needsPathfinder = pathKeywords.some(kw => intent.toLowerCase().includes(kw));

        if (needsPathfinder && primaryAgent !== 'pathfinder') {
            const pathfinder = this.agents.get('pathfinder')!;
            const pfIntent = `Verify tool availability: ${intent}`;
            const delegation: MeshDelegation = {
                from: primaryAgent,
                to: 'pathfinder',
                intent: pfIntent,
                status: 'pending'
            };

            try {
                delegation.result = await pathfinder.execute(pfIntent);
                delegation.status = 'complete';
            } catch {
                delegation.status = 'failed';
            }

            delegations.push(delegation);
        }

        return delegations;
    }

    /**
     * Get the current state of the entire mesh.
     */
    getMeshState(): MeshState {
        const agentStates: Record<string, 'idle' | 'busy' | 'blocked'> = {};
        const activeAgents: AgentRole[] = [];

        for (const [role, agent] of this.agents) {
            agentStates[role] = agent.state;
            if (agent.processed > 0) activeAgents.push(role);
        }

        // Mesh resonance = average of all agent resonance histories
        let totalResonance = 0;
        let resonanceCount = 0;
        for (const agent of this.agents.values()) {
            const status = agent.prz.getStatus();
            if (status.resonanceHistory.length > 0) {
                totalResonance += status.resonanceHistory[status.resonanceHistory.length - 1];
                resonanceCount++;
            }
        }

        return {
            activeAgents,
            totalMessages: this.messageCounter,
            routingHistory: [...this.routingHistory],
            agentStates: agentStates as Record<AgentRole, 'idle' | 'busy' | 'blocked'>,
            meshResonance: resonanceCount > 0 ? totalResonance / resonanceCount : 0
        };
    }

    getAgent(role: AgentRole): MeshAgent | undefined {
        return this.agents.get(role);
    }

    getAllAgents(): Map<AgentRole, MeshAgent> {
        return new Map(this.agents);
    }

    reset(): void {
        for (const agent of this.agents.values()) agent.reset();
        this.routingHistory = [];
        this.messageLog = [];
        this.messageCounter = 0;
    }
}

// ── Factory ──────────────────────────────────────────────────────────

export function createMesh(): MeshCoordinator {
    return new MeshCoordinator();
}
