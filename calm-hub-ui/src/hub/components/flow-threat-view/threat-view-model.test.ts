import { describe, expect, it } from 'vitest';
import { CalmCore } from '@finos/calm-models/model';
import type { CalmCoreSchema } from '@finos/calm-models/types';
import type { Decorator, ThreatModelDecorator } from '../../../visualizer/contracts/decorator-contracts.js';
import {
    buildThreatViewModel,
    classificationInitial,
    selectThreatModelForFlow,
    worstStatus,
} from './threat-view-model.js';
import { architecture, architectureJson, decorator, flowJson } from './payments-fixtures.js';

const build = (overrides?: Partial<ThreatModelDecorator['data']>) =>
    buildThreatViewModel({
        decorator: { ...decorator, data: { ...decorator.data, ...overrides } },
        flowJson,
        architecture,
        architectureJson,
    });

describe('selectThreatModelForFlow', () => {
    it('returns the threat model that applies to the flow', () => {
        expect(selectThreatModelForFlow([decorator], 'flow-submit-payment')).toBe(decorator);
    });

    it('ignores decorators of another type', () => {
        const deployment: Decorator = { ...decorator, type: 'deployment', data: {} };
        expect(selectThreatModelForFlow([deployment], 'flow-submit-payment')).toBeNull();
    });

    it('returns null when no decorator applies to the flow', () => {
        expect(selectThreatModelForFlow([decorator], 'another-flow')).toBeNull();
        expect(selectThreatModelForFlow([], 'flow-submit-payment')).toBeNull();
        expect(selectThreatModelForFlow([decorator], undefined)).toBeNull();
    });
});

describe('buildThreatViewModel', () => {
    it('lays out one lane per node in order of first appearance, with the node controls', () => {
        const { lanes } = build();

        expect(lanes.map(l => l.nodeId)).toEqual(['mobile-app', 'api-gateway', 'payments-api', 'payments-db']);
        expect(lanes[0].name).toBe('Mobile App');
        expect(lanes[1].controls).toEqual([
            { key: 'oauth2-authentication', name: 'OAuth 2.0 Authentication' },
            { key: 'request-validation', name: 'Request Validation' },
        ]);
    });

    it('draws one arrow per relationship and groups the request and return steps', () => {
        const { arrows } = build();

        expect(arrows.map(a => a.relationshipId)).toEqual([
            'mobile-app-to-api-gateway',
            'api-gateway-to-payments-api',
            'payments-api-to-payments-db',
        ]);
        const first = arrows[0];
        expect(first.steps.map(s => [s.sequenceNumber, s.isReturn])).toEqual([[1, false], [5, true]]);
        expect([first.fromLane, first.toLane]).toEqual([0, 1]);
        expect(first.protocol).toBe('HTTPS');
        expect(first.controls.map(c => c.key)).toEqual(['transport-security']);
    });

    it('places each trust boundary between the lanes of its relationship', () => {
        const { boundaries } = build();

        expect(boundaries.map(b => [b.id, b.leftLane, b.rightLane])).toEqual([
            ['tb-internet-dmz', 0, 1],
            ['tb-dmz-core', 1, 2],
            ['tb-core-data', 2, 3],
        ]);
    });

    it('attaches threats to the arrow and boundary that carry them', () => {
        const { arrows, boundaries } = build();

        expect(arrows[0].threats.map(t => t['unique-id'])).toEqual(['t-token-replay', 't-amount-tamper', 't-submit-flood']);
        expect(arrows[1].threats.map(t => t['unique-id'])).toEqual(['t-bola']);
        expect(arrows[2].threats.map(t => t['unique-id'])).toEqual(['t-pan-at-rest', 't-no-audit']);
        expect(boundaries[1].threats.map(t => t['unique-id'])).toEqual(['t-bola']);
    });

    it('counts threats by status', () => {
        expect(build().summary).toEqual({
            identified: 1,
            'partially-mitigated': 2,
            mitigated: 2,
            accepted: 1,
            total: 6,
        });
    });

    describe('control resolution', () => {
        const resolution = (threatId: string, control: string) => {
            const threat = build().threats.find(t => t['unique-id'] === threatId);
            return threat?.mitigations.find(m => m.control === control)?.resolution;
        };

        it('finds a control declared on a node', () => {
            expect(resolution('t-token-replay', 'oauth2-authentication'))
                .toEqual({ kind: 'node', nodeId: 'api-gateway', nodeName: 'API Gateway' });
            expect(resolution('t-bola', 'authorization-checks'))
                .toEqual({ kind: 'node', nodeId: 'payments-api', nodeName: 'Payments API' });
        });

        it('finds a control declared on the relationship', () => {
            expect(resolution('t-amount-tamper', 'transport-security')).toEqual({ kind: 'relationship' });
            expect(resolution('t-bola', 'mutual-tls')).toEqual({ kind: 'relationship' });
        });

        it('finds a control declared on the architecture', () => {
            expect(resolution('t-no-audit', 'audit-logging')).toEqual({ kind: 'architecture' });
        });

        it('reports a control that is declared nowhere as missing', () => {
            expect(resolution('t-submit-flood', 'rate-limiting')).toEqual({ kind: 'missing' });
        });
    });

    describe('sequence number narrowing', () => {
        it('keeps a threat on an arrow when one of its steps matches', () => {
            const threats = decorator.data.threats.map(t => t['unique-id'] === 't-token-replay'
                ? { ...t, 'applies-to': { ...t['applies-to'], 'sequence-numbers': [5] } }
                : t);
            expect(build({ threats }).arrows[0].threats.map(t => t['unique-id'])).toContain('t-token-replay');
        });

        it('drops a threat from an arrow when none of its steps match', () => {
            const threats = decorator.data.threats.map(t => t['unique-id'] === 't-token-replay'
                ? { ...t, 'applies-to': { ...t['applies-to'], 'sequence-numbers': [3] } }
                : t);
            expect(build({ threats }).arrows[0].threats.map(t => t['unique-id'])).not.toContain('t-token-replay');
        });
    });

    describe('tolerates data that does not match the flow', () => {
        it('skips a transition whose relationship is not in the architecture', () => {
            const model = buildThreatViewModel({
                decorator,
                flowJson: {
                    ...flowJson,
                    transitions: [
                        ...(flowJson.transitions ?? []),
                        { 'relationship-unique-id': 'no-such-relationship', 'sequence-number': 9, description: 'x' },
                    ],
                },
                architecture,
                architectureJson,
            });
            expect(model.arrows).toHaveLength(3);
        });

        it('ignores a trust boundary whose relationships are not in the flow', () => {
            const boundaries = [
                ...(decorator.data['trust-boundaries'] ?? []),
                { 'unique-id': 'tb-ghost', name: 'Ghost', relationships: ['no-such-relationship'] },
            ];
            expect(build({ 'trust-boundaries': boundaries }).boundaries).toHaveLength(3);
        });

        it('builds a model without trust boundaries or mitigations', () => {
            const threats = decorator.data.threats.map(t => ({ ...t, mitigations: undefined }));
            const model = build({ 'trust-boundaries': undefined, threats });
            expect(model.boundaries).toEqual([]);
            expect(model.threats.every(t => t.mitigations.length === 0)).toBe(true);
        });

        it('places a boundary over a relationship that joins lanes that are not neighbours', () => {
            const direct = {
                'unique-id': 'mobile-app-to-payments-db',
                description: 'Direct',
                'relationship-type': {
                    connects: { source: { node: 'mobile-app' }, destination: { node: 'payments-db' } },
                },
            };
            const model = buildThreatViewModel({
                decorator: {
                    ...decorator,
                    data: {
                        ...decorator.data,
                        'trust-boundaries': [
                            { 'unique-id': 'tb-direct', name: 'Direct', relationships: ['mobile-app-to-payments-db'] },
                        ],
                    },
                },
                flowJson: {
                    ...flowJson,
                    transitions: [
                        ...(flowJson.transitions ?? []),
                        { 'relationship-unique-id': 'mobile-app-to-payments-db', 'sequence-number': 6, description: 'd' },
                    ],
                },
                architecture: CalmCore.fromSchema({
                    ...architectureJson,
                    relationships: [...(architectureJson.relationships ?? []), direct],
                } as CalmCoreSchema),
                architectureJson: {
                    ...architectureJson,
                    relationships: [...(architectureJson.relationships ?? []), direct],
                } as CalmCoreSchema,
            });

            const arrow = model.arrows.find(a => a.relationshipId === 'mobile-app-to-payments-db');
            expect([arrow?.fromLane, arrow?.toLane]).toEqual([0, 3]);
            expect(model.boundaries.map(b => [b.id, b.leftLane, b.rightLane])).toEqual([['tb-direct', 0, 3]]);
        });

        it('spaces arrows that join the same two lanes', () => {
            const second = {
                'unique-id': 'mobile-app-to-api-gateway-2',
                description: 'Second connection',
                'relationship-type': {
                    connects: { source: { node: 'mobile-app' }, destination: { node: 'api-gateway' } },
                },
            };
            const schema = {
                ...architectureJson,
                relationships: [...(architectureJson.relationships ?? []), second],
            } as CalmCoreSchema;
            const model = buildThreatViewModel({
                decorator,
                flowJson: {
                    ...flowJson,
                    transitions: [
                        ...(flowJson.transitions ?? []),
                        { 'relationship-unique-id': 'mobile-app-to-api-gateway-2', 'sequence-number': 6, description: 'e' },
                    ],
                },
                architecture: CalmCore.fromSchema(schema),
                architectureJson: schema,
            });

            const offsets = model.arrows
                .filter(a => a.relationshipId.startsWith('mobile-app-to-api-gateway'))
                .map(a => [a.relationshipId, a.offset]);
            expect(offsets).toEqual([['mobile-app-to-api-gateway', 0], ['mobile-app-to-api-gateway-2', 1]]);
        });
    });
});

describe('worstStatus', () => {
    it('ranks identified above partially mitigated above mitigated above accepted', () => {
        expect(worstStatus([{ status: 'mitigated' }, { status: 'identified' }])).toBe('identified');
        expect(worstStatus([{ status: 'accepted' }, { status: 'partially-mitigated' }])).toBe('partially-mitigated');
        expect(worstStatus([{ status: 'accepted' }, { status: 'mitigated' }])).toBe('mitigated');
        expect(worstStatus([{ status: 'accepted' }])).toBe('accepted');
    });

    it('returns null when there are no threats', () => {
        expect(worstStatus([])).toBeNull();
    });
});

describe('classificationInitial', () => {
    it('uses the first letter of the first classification', () => {
        expect(classificationInitial({ classification: [{ scheme: 'STRIDE', value: 'Denial of service' }] })).toBe('D');
    });

    it('falls back to a bullet when the threat has no classification', () => {
        expect(classificationInitial({})).toBe('•');
    });
});
