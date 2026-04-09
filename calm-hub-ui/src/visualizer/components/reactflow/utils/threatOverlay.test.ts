import { describe, it, expect, vi } from 'vitest';
import type { Node, Edge } from 'reactflow';
import type { ThreatModelDecorator } from '../../../contracts/contracts.js';
import { createThreatOverlay } from './threatOverlay.js';

const mockNodes: Node[] = [
    { id: 'conference-website', type: 'custom', position: { x: 0, y: 0 }, data: { label: 'Conference Website' }, width: 220 },
    { id: 'load-balancer', type: 'custom', position: { x: 300, y: 0 }, data: { label: 'Load Balancer' }, width: 220 },
    { id: 'attendees', type: 'custom', position: { x: 600, y: 0 }, data: { label: 'Attendees Service' }, width: 220 },
];

const mockEdges: Edge[] = [
    { id: 'e1', source: 'conference-website', target: 'load-balancer', type: 'custom' },
    { id: 'e2', source: 'load-balancer', target: 'attendees', type: 'custom' },
];

const mockDecorator: ThreatModelDecorator = {
    schema: 'https://calm.finos.org/draft/2026-03/standards/threat-model/threat-model.decorator.standard.json',
    uniqueId: 'tm-1',
    type: 'threat-model',
    target: ['/calm/namespaces/workshop/architectures/1/versions/1-0-0'],
    data: {
        summary: {
            date: '2024-06-01',
            methodology: 'STRIDE',
            'overall-risk': 'high',
            'total-threats': 3,
        },
        'trust-boundaries': [
            { id: 'TB-1', name: 'Public to LB', from: 'conference-website', to: 'load-balancer', protocol: 'HTTPS', criticality: 'critical' },
            { id: 'TB-2', name: 'LB to API', from: 'load-balancer', to: 'attendees', protocol: 'HTTP', criticality: 'high' },
        ],
        threats: [
            { id: 'T-1', 'trust-boundary': 'TB-1', 'stride-category': 'spoofing', description: 'Spoofing attack', risk: 'high', 'mitigation-status': 'mitigated' },
            { id: 'T-2', 'trust-boundary': 'TB-1', 'stride-category': 'denial-of-service', description: 'DoS attack', risk: 'medium', 'mitigation-status': 'unmitigated' },
            { id: 'T-3', 'trust-boundary': 'TB-2', 'stride-category': 'tampering', description: 'Tampering', risk: 'high', 'mitigation-status': 'partial' },
        ],
    },
};

describe('createThreatOverlay', () => {
    it('returns empty when no decorators provided', () => {
        const result = createThreatOverlay(mockNodes, mockEdges, []);
        expect(result.boundaryEdges).toHaveLength(0);
        expect(result.badgeNodes).toHaveLength(0);
    });

    it('creates boundary edges for each trust boundary', () => {
        const result = createThreatOverlay(mockNodes, mockEdges, [mockDecorator]);
        expect(result.boundaryEdges).toHaveLength(2);

        const tb1Edge = result.boundaryEdges.find((e) => e.id === 'tb-TB-1');
        expect(tb1Edge).toBeDefined();
        expect(tb1Edge!.source).toBe('conference-website');
        expect(tb1Edge!.target).toBe('load-balancer');
        expect(tb1Edge!.style?.strokeDasharray).toBe('8 4');

        const tb2Edge = result.boundaryEdges.find((e) => e.id === 'tb-TB-2');
        expect(tb2Edge).toBeDefined();
        expect(tb2Edge!.source).toBe('load-balancer');
        expect(tb2Edge!.target).toBe('attendees');
    });

    it('uses criticality colors for boundary edges', () => {
        const result = createThreatOverlay(mockNodes, mockEdges, [mockDecorator]);

        const criticalEdge = result.boundaryEdges.find((e) => e.id === 'tb-TB-1');
        expect(criticalEdge!.style?.stroke).toBe('#dc2626'); // critical = red

        const highEdge = result.boundaryEdges.find((e) => e.id === 'tb-TB-2');
        expect(highEdge!.style?.stroke).toBe('#ea580c'); // high = orange
    });

    it('creates badge nodes for affected architecture nodes', () => {
        const result = createThreatOverlay(mockNodes, mockEdges, [mockDecorator]);
        expect(result.badgeNodes.length).toBeGreaterThan(0);

        // All badges should be threatBadge type
        result.badgeNodes.forEach((badge) => {
            expect(badge.type).toBe('threatBadge');
        });
    });

    it('groups threats by STRIDE category per node', () => {
        const result = createThreatOverlay(mockNodes, mockEdges, [mockDecorator]);

        // conference-website is in TB-1 with spoofing + DoS
        const cwBadges = result.badgeNodes.filter((b) => b.id.startsWith('threat-badge-conference-website'));
        expect(cwBadges).toHaveLength(2); // spoofing + denial-of-service

        const spoofingBadge = cwBadges.find((b) => b.data.category === 'spoofing');
        expect(spoofingBadge).toBeDefined();
        expect(spoofingBadge!.data.emoji).toBe('🎭');
        expect(spoofingBadge!.data.count).toBe(1);

        const dosBadge = cwBadges.find((b) => b.data.category === 'denial-of-service');
        expect(dosBadge).toBeDefined();
        expect(dosBadge!.data.emoji).toBe('🚫');
    });

    it('positions badges below the node in a vertical stack', () => {
        const result = createThreatOverlay(mockNodes, mockEdges, [mockDecorator]);

        const cwBadges = result.badgeNodes.filter((b) => b.id.startsWith('threat-badge-conference-website'));
        // x should match the node x position
        cwBadges.forEach((badge) => {
            expect(badge.position.x).toBe(0);
        });
        // Badges stack below node (y > 0 since nodeHeight + 12)
        expect(cwBadges[0]!.position.y).toBeGreaterThan(0);
        // Second badge is further down
        expect(cwBadges[1]!.position.y).toBeGreaterThan(cwBadges[0]!.position.y);
    });

    it('passes onThreatSelect callback to badge data', () => {
        const onSelect = vi.fn();
        const result = createThreatOverlay(mockNodes, mockEdges, [mockDecorator], onSelect);

        result.badgeNodes.forEach((badge) => {
            expect(badge.data.onThreatSelect).toBe(onSelect);
        });
    });

    it('skips boundary edges when from/to nodes not found', () => {
        const decorator: ThreatModelDecorator = {
            ...mockDecorator,
            data: {
                ...mockDecorator.data,
                'trust-boundaries': [
                    { id: 'TB-X', name: 'Missing', from: 'nonexistent', to: 'also-missing', criticality: 'low' },
                ],
            },
        };
        const result = createThreatOverlay(mockNodes, mockEdges, [decorator]);
        expect(result.boundaryEdges).toHaveLength(0);
    });

    it('tracks worst mitigation status per category', () => {
        const result = createThreatOverlay(mockNodes, mockEdges, [mockDecorator]);

        // load-balancer is in both TB-1 and TB-2, has spoofing(mitigated), DoS(unmitigated), tampering(partial)
        const lbBadges = result.badgeNodes.filter((b) => b.id.startsWith('threat-badge-load-balancer'));
        const dosBadge = lbBadges.find((b) => b.data.category === 'denial-of-service');
        expect(dosBadge!.data.worstStatus).toBe('unmitigated');

        const tamperBadge = lbBadges.find((b) => b.data.category === 'tampering');
        expect(tamperBadge!.data.worstStatus).toBe('partial');
    });
});
