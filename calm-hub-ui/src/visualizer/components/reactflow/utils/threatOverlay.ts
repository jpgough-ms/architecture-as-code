import type { Node, Edge } from 'reactflow';
import type { ThreatModelDecorator, Threat, TrustBoundary } from '../../../contracts/contracts.js';

export interface ThreatOverlayElements {
    boundaryEdges: Edge[];
    badgeNodes: Node[];
}

/** STRIDE category → emoji mapping */
const STRIDE_EMOJI: Record<string, string> = {
    spoofing: '🎭',
    tampering: '🔧',
    repudiation: '🙈',
    'information-disclosure': '📤',
    'denial-of-service': '🚫',
    'elevation-of-privilege': '⬆️',
};

/** Trust boundary criticality → color */
const CRITICALITY_COLORS: Record<string, string> = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#d97706',
    low: '#65a30d',
};

/**
 * Find the ReactFlow edge that connects two CALM node unique-ids.
 */
function findEdgeBetween(edges: Edge[], fromId: string, toId: string): Edge | undefined {
    return edges.find(
        (e) =>
            (e.source === fromId && e.target === toId) ||
            (e.source === toId && e.target === fromId)
    );
}

/**
 * Group threats by the node they affect (via trust-boundary from/to).
 * Returns a map: nodeId → Threat[]
 */
function groupThreatsByNode(
    threats: Threat[],
    trustBoundaries: TrustBoundary[]
): Map<string, Threat[]> {
    const tbMap = new Map(trustBoundaries.map((tb) => [tb.id, tb]));
    const nodeThreats = new Map<string, Threat[]>();

    for (const threat of threats) {
        const tb = threat['trust-boundary'] ? tbMap.get(threat['trust-boundary']) : undefined;
        if (!tb) continue;

        // Associate threat with both from/to nodes
        for (const nodeId of [tb.from, tb.to]) {
            if (!nodeId) continue;
            const list = nodeThreats.get(nodeId) ?? [];
            list.push(threat);
            nodeThreats.set(nodeId, list);
        }
    }
    return nodeThreats;
}

/**
 * Generate overlay elements for threat visualization on the architecture diagram.
 *
 * Creates:
 * 1. Dashed boundary edges for each trust boundary (from → to)
 * 2. Small badge nodes anchored next to architecture nodes showing STRIDE emoji counts
 */
export function createThreatOverlay(
    existingNodes: Node[],
    existingEdges: Edge[],
    decorators: ThreatModelDecorator[],
    onThreatSelect?: (threatId: string) => void
): ThreatOverlayElements {
    if (!decorators.length) return { boundaryEdges: [], badgeNodes: [] };

    const decorator = decorators[0];
    const threats = decorator.data.threats ?? [];
    const trustBoundaries = decorator.data['trust-boundaries'] ?? [];

    const nodeMap = new Map(existingNodes.map((n) => [n.id, n]));
    const boundaryEdges: Edge[] = [];
    const badgeNodes: Node[] = [];

    // 1. Create trust boundary overlay edges
    for (const tb of trustBoundaries) {
        if (!tb.from || !tb.to) continue;
        const fromNode = nodeMap.get(tb.from);
        const toNode = nodeMap.get(tb.to);
        if (!fromNode || !toNode) continue;

        // Only add boundary edge if there isn't already one between these nodes
        const existingEdge = findEdgeBetween(existingEdges, tb.from, tb.to);
        const color = CRITICALITY_COLORS[tb.criticality] ?? CRITICALITY_COLORS.medium;

        boundaryEdges.push({
            id: `tb-${tb.id}`,
            source: tb.from,
            target: tb.to,
            type: 'custom',
            style: {
                stroke: color,
                strokeWidth: 3,
                strokeDasharray: '8 4',
                opacity: existingEdge ? 0.7 : 1,
            },
            data: {
                description: `🔒 ${tb.name}`,
                protocol: tb.protocol ?? '',
                isTrustBoundary: true,
                criticality: tb.criticality,
            },
            zIndex: 0,
        });
    }

    // 2. Create STRIDE emoji badge nodes next to affected architecture nodes
    const nodeThreats = groupThreatsByNode(threats, trustBoundaries);

    for (const [nodeId, nodeThreatsArr] of nodeThreats) {
        const archNode = nodeMap.get(nodeId);
        if (!archNode) continue;

        // Group by STRIDE category and find worst mitigation status per category
        const categories = new Map<string, { count: number; worst: string; threats: Threat[] }>();
        for (const t of nodeThreatsArr) {
            const cat = t['stride-category'];
            const existing = categories.get(cat);
            if (existing) {
                existing.count++;
                existing.threats.push(t);
                if (t['mitigation-status'] === 'unmitigated' || (t['mitigation-status'] === 'partial' && existing.worst === 'mitigated')) {
                    existing.worst = t['mitigation-status'];
                }
            } else {
                categories.set(cat, { count: 1, worst: t['mitigation-status'], threats: [t] });
            }
        }

        // Position badges below the node, anchored as children so they move together
        const badgeStartY = (archNode.height ?? 60) + 12;
        let yOffset = 0;

        for (const [category, info] of categories) {
            const emoji = STRIDE_EMOJI[category] ?? '⚠️';
            const badgeId = `threat-badge-${nodeId}-${category}`;

            badgeNodes.push({
                id: badgeId,
                type: 'threatBadge',
                position: {
                    x: 0,
                    y: badgeStartY + yOffset,
                },
                parentNode: nodeId,
                data: {
                    emoji,
                    category,
                    count: info.count,
                    worstStatus: info.worst,
                    threats: info.threats,
                    onThreatSelect,
                },
                draggable: false,
                selectable: false,
                style: { zIndex: 1000 },
            });
            yOffset += 44;
        }
    }

    return { boundaryEdges, badgeNodes };
}
