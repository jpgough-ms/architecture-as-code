import type { Architecture } from '@finos/calm-models/model';
import type { CalmCoreSchema, CalmFlowSchema } from '@finos/calm-models/types';
import type {
    Decorator,
    Threat,
    ThreatMitigation,
    ThreatModelDecorator,
    ThreatStatus,
    TrustBoundary,
} from '../../../visualizer/contracts/decorator-contracts.js';
import { FlowSequenceHelper } from '../flow-sequence-diagram/flow-sequence-helper.js';

export type ControlResolution =
    | { kind: 'node'; nodeId: string; nodeName: string }
    | { kind: 'relationship' }
    | { kind: 'architecture' }
    | { kind: 'missing' };

export interface ResolvedMitigation extends ThreatMitigation {
    resolution: ControlResolution;
}

export interface ResolvedThreat extends Omit<Threat, 'mitigations'> {
    mitigations: ResolvedMitigation[];
}

export interface LaneControl {
    key: string;
    name: string;
}

export interface Lane {
    nodeId: string;
    name: string;
    nodeType: string;
    controls: LaneControl[];
}

export interface ArrowStep {
    sequenceNumber: number;
    isReturn: boolean;
    description: string;
}

export interface Arrow {
    relationshipId: string;
    description?: string;
    protocol?: string;
    fromLane: number;
    toLane: number;
    steps: ArrowStep[];
    controls: LaneControl[];
    threats: ResolvedThreat[];
    /** Position among arrows that join the same two lanes. Spaces them vertically. */
    offset: number;
}

export interface Boundary {
    id: string;
    name: string;
    description?: string;
    /** The lane to the left of the boundary. */
    leftLane: number;
    /** The lane to the right of the boundary. For a non-adjacent crossing this is not leftLane + 1. */
    rightLane: number;
    relationshipIds: string[];
    threats: ResolvedThreat[];
}

export type ThreatSummary = Record<ThreatStatus, number> & { total: number };

export interface ThreatViewModel {
    lanes: Lane[];
    arrows: Arrow[];
    boundaries: Boundary[];
    threats: ResolvedThreat[];
    summary: ThreatSummary;
}

export interface ThreatViewInput {
    decorator: ThreatModelDecorator;
    flowJson: Partial<CalmFlowSchema>;
    architecture: Architecture;
    architectureJson: CalmCoreSchema;
}

interface RawControl {
    description?: string;
    requirements?: { config?: { name?: string } }[];
}

type RawControls = Record<string, RawControl> | undefined;

const STATUSES: ThreatStatus[] = ['identified', 'partially-mitigated', 'mitigated', 'accepted'];

/** The first threat-model decorator that applies to the flow. */
export function selectThreatModelForFlow(decorators: Decorator[], flowId: string | undefined): ThreatModelDecorator | null {
    if (!flowId) return null;
    const match = decorators.find(d => d.type === 'threat-model' && d.appliesTo?.includes(flowId));
    return (match as ThreatModelDecorator | undefined) ?? null;
}

function controlsOf(owner: { controls?: unknown } | undefined): RawControls {
    return owner?.controls as RawControls;
}

function listControls(controls: RawControls): LaneControl[] {
    return Object.entries(controls ?? {}).map(([key, control]) => ({
        key,
        name: control?.requirements?.[0]?.config?.name ?? key,
    }));
}

function emptySummary(): ThreatSummary {
    return { identified: 0, 'partially-mitigated': 0, mitigated: 0, accepted: 0, total: 0 };
}

export function buildThreatViewModel({ decorator, flowJson, architecture, architectureJson }: ThreatViewInput): ThreatViewModel {
    const helper = new FlowSequenceHelper();
    const rawNodes = architectureJson.nodes ?? [];
    const rawRelationships = architectureJson.relationships ?? [];
    const nodeById = new Map(rawNodes.map(n => [n['unique-id'], n]));
    const relationshipById = new Map(rawRelationships.map(r => [r['unique-id'], r]));

    const lanes: Lane[] = [];
    const laneIndex = new Map<string, number>();
    const laneFor = (nodeId: string): number => {
        const known = laneIndex.get(nodeId);
        if (known !== undefined) return known;
        const node = nodeById.get(nodeId);
        lanes.push({
            nodeId,
            name: node?.name ?? helper.getNodeNameById(nodeId, architecture) ?? nodeId,
            nodeType: String(node?.['node-type'] ?? ''),
            controls: listControls(controlsOf(node)),
        });
        laneIndex.set(nodeId, lanes.length - 1);
        return lanes.length - 1;
    };

    const arrowByRelationship = new Map<string, Arrow>();
    const pairCounts = new Map<string, number>();
    const transitions = flowJson.transitions ?? [];
    for (const transition of transitions) {
        const relationshipId = transition['relationship-unique-id'];
        const source = helper.getSourceNodeIdFromRelationship(relationshipId, architecture);
        const destination = helper.getTargetNodeIdFromRelationship(relationshipId, architecture);
        if (source === FlowSequenceHelper.UNKNOWN_NODE || destination === FlowSequenceHelper.UNKNOWN_NODE) continue;

        let arrow = arrowByRelationship.get(relationshipId);
        if (!arrow) {
            const fromLane = laneFor(source);
            const toLane = laneFor(destination);
            const pair = `${Math.min(fromLane, toLane)}:${Math.max(fromLane, toLane)}`;
            const offset = pairCounts.get(pair) ?? 0;
            pairCounts.set(pair, offset + 1);
            const raw = relationshipById.get(relationshipId);
            arrow = {
                relationshipId,
                description: raw?.description,
                protocol: typeof raw?.protocol === 'string' ? raw.protocol : undefined,
                fromLane,
                toLane,
                steps: [],
                controls: listControls(controlsOf(raw)),
                threats: [],
                offset,
            };
            arrowByRelationship.set(relationshipId, arrow);
        }
        arrow.steps.push({
            sequenceNumber: transition['sequence-number'],
            isReturn: transition.direction === 'destination-to-source',
            description: transition.description,
        });
    }
    const arrows = [...arrowByRelationship.values()];
    arrows.forEach(a => a.steps.sort((x, y) => x.sequenceNumber - y.sequenceNumber));

    const resolveControl = (key: string, relationshipId: string | undefined): ControlResolution => {
        const arrow = relationshipId ? arrowByRelationship.get(relationshipId) : undefined;
        if (arrow) {
            for (const laneNumber of [arrow.fromLane, arrow.toLane]) {
                const lane = lanes[laneNumber];
                if (lane.controls.some(c => c.key === key)) {
                    return { kind: 'node', nodeId: lane.nodeId, nodeName: lane.name };
                }
            }
            if (arrow.controls.some(c => c.key === key)) return { kind: 'relationship' };
        }
        if (controlsOf(architectureJson)?.[key]) return { kind: 'architecture' };
        return { kind: 'missing' };
    };

    const resolvedThreats: ResolvedThreat[] = (decorator.data.threats ?? []).map(threat => {
        const firstRelationship = threat['applies-to'].relationships.find(id => arrowByRelationship.has(id));
        return {
            ...threat,
            mitigations: (threat.mitigations ?? []).map(m => ({
                ...m,
                resolution: resolveControl(m.control, firstRelationship),
            })),
        };
    });

    for (const threat of resolvedThreats) {
        const narrowedTo = threat['applies-to']['sequence-numbers'];
        for (const relationshipId of threat['applies-to'].relationships) {
            const arrow = arrowByRelationship.get(relationshipId);
            if (!arrow) continue;
            if (narrowedTo && !arrow.steps.some(s => narrowedTo.includes(s.sequenceNumber))) continue;
            arrow.threats.push(threat);
        }
    }

    const boundaries: Boundary[] = [];
    for (const boundary of decorator.data['trust-boundaries'] ?? ([] as TrustBoundary[])) {
        const crossed = boundary.relationships
            .map(id => arrowByRelationship.get(id))
            .filter((a): a is Arrow => a !== undefined);
        if (crossed.length === 0) continue;
        const first = crossed[0];
        const threatIds = new Set<string>();
        const threats: ResolvedThreat[] = [];
        for (const arrow of crossed) {
            for (const threat of arrow.threats) {
                if (threatIds.has(threat['unique-id'])) continue;
                threatIds.add(threat['unique-id']);
                threats.push(threat);
            }
        }
        boundaries.push({
            id: boundary['unique-id'],
            name: boundary.name,
            description: boundary.description,
            leftLane: Math.min(first.fromLane, first.toLane),
            rightLane: Math.max(first.fromLane, first.toLane),
            relationshipIds: crossed.map(a => a.relationshipId),
            threats,
        });
    }

    const summary = emptySummary();
    for (const threat of resolvedThreats) {
        if (STATUSES.includes(threat.status)) summary[threat.status] += 1;
        summary.total += 1;
    }

    return { lanes, arrows, boundaries, threats: resolvedThreats, summary };
}

/** The status to show for a group of threats: the one that needs most attention. */
export function worstStatus(threats: Pick<Threat, 'status'>[]): ThreatStatus | null {
    for (const status of STATUSES) {
        if (threats.some(t => t.status === status)) return status;
    }
    return null;
}

/** First letter of the first classification, for example S for Spoofing. */
export function classificationInitial(threat: Pick<Threat, 'classification'>): string {
    const value = threat.classification?.[0]?.value;
    return value ? value.charAt(0).toUpperCase() : '•';
}

/** Key that ties a control to the node lane that declares it, for highlighting. */
export const controlHighlightKey = (nodeId: string, controlKey: string): string => `${nodeId}::${controlKey}`;

export function describeResolution(resolution: ControlResolution): string {
    switch (resolution.kind) {
    case 'node':
        return `declared on ${resolution.nodeName}`;
    case 'relationship':
        return 'declared on this connection';
    case 'architecture':
        return 'declared on the architecture';
    default:
        return 'not declared: gap';
    }
}
