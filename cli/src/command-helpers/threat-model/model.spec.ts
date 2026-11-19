import { describe, expect, it } from 'vitest';
import architecture from '../../../test_fixtures/threat-model/payments-api.architecture.json';
import expected from '../../../test_fixtures/threat-model/submit-payment.stride.threat-model.decorator.json';
import session from '../../../test_fixtures/threat-model/submit-payment.session.json';
import { Architecture, ArchitectureIndex, Session, buildDecorator, crossingRelationships, findGaps, proposeTrustBoundaries, resolveControl } from './model';

const payments = architecture as Architecture;

describe('buildDecorator', () => {
    it('reproduces the submit-payment example of the STRIDE standard from the session answers', () => {
        const decorator = buildDecorator(payments, session as Session, 'payments-api.architecture.json');
        expect(decorator).toEqual(expected);
        expect(JSON.stringify(decorator, null, 4)).toEqual(JSON.stringify(expected, null, 4));
    });

    it('fills threat text and applies-to from the question bank when the session leaves them out', () => {
        const minimal: Session = {
            'question-bank': '0.1.0', flow: 'flow-submit-payment', 'assessed-on': '2026-11-19', 'trust-boundaries': [],
            threats: [{ question: 'spoofing-caller-identity', relationship: 'api-gateway-to-payments-api', 'unique-id': 't-1', status: 'identified' }]
        };
        const decorator = buildDecorator(payments, minimal, 'a.json');
        expect(decorator['applies-to']).toEqual(['flow-submit-payment', 'api-gateway-to-payments-api', 'payments-api']);
        expect(decorator['unique-id']).toBe('submit-payment-stride-threat-model');
        expect((decorator.data as { threats: unknown[] }).threats[0]).toEqual({
            'unique-id': 't-1',
            name: 'Spoofed caller at Payments API',
            description: 'A caller on api-gateway-to-payments-api uses a stolen or forged identity to act as another user or service at Payments API.',
            classification: [{ scheme: 'STRIDE', value: 'spoofing' }],
            'applies-to': ['api-gateway-to-payments-api', 'payments-api'],
            status: 'identified'
        });
        expect((decorator.data as Record<string, unknown>)['trust-boundaries']).toBeUndefined();
    });
});

describe('proposeTrustBoundaries', () => {
    it('proposes the three boundaries of the example, once per relationship, with the reasons', () => {
        const proposals = proposeTrustBoundaries(new ArchitectureIndex(payments), 'flow-submit-payment');
        expect(proposals.map(p => p.elements)).toEqual([['mobile-app-to-api-gateway'], ['api-gateway-to-payments-api'], ['payments-api-to-payments-db']]);
        expect(proposals[0].reasons).toEqual(['the source mobile-app is a webclient']);
        expect(proposals[1].reasons).toEqual(['the protocol changes from HTTPS to mTLS']);
        expect(proposals[2].reasons).toEqual(['the protocol changes from mTLS to JDBC']);
    });

    it('proposes a boundary where the deployed-in parent changes, and none inside one parent', () => {
        const arch: Architecture = {
            nodes: [{ 'unique-id': 'a', 'node-type': 'service' }, { 'unique-id': 'b', 'node-type': 'service' }, { 'unique-id': 'c', 'node-type': 'service' }, { 'unique-id': 'zone', 'node-type': 'network' }],
            relationships: [
                { 'unique-id': 'a-b', 'relationship-type': { connects: { source: { node: 'a' }, destination: { node: 'b' } } }, protocol: 'HTTPS' },
                { 'unique-id': 'b-c', 'relationship-type': { connects: { source: { node: 'b' }, destination: { node: 'c' } } }, protocol: 'HTTPS' },
                { 'unique-id': 'zone-holds', 'relationship-type': { 'deployed-in': { container: 'zone', nodes: ['a', 'b'] } } }
            ],
            flows: [{ 'unique-id': 'f', transitions: [{ 'relationship-unique-id': 'a-b', 'sequence-number': 1 }, { 'relationship-unique-id': 'b-c', 'sequence-number': 2 }] }]
        };
        const index = new ArchitectureIndex(arch);
        expect(proposeTrustBoundaries(index, 'f').map(p => [p.elements, p.reasons])).toEqual([[['b-c'], ['b and c have different parents']]]);
        expect(crossingRelationships(index, 'f', [{ 'unique-id': 'tb', name: 'Zone', elements: ['zone'] }])).toEqual(['b-c']);
    });

    it('names the flows of the architecture when the flow is missing', () => {
        expect(() => proposeTrustBoundaries(new ArchitectureIndex(payments), 'nope')).toThrow('flows: flow-submit-payment');
    });
});

describe('resolveControl', () => {
    const index = new ArchitectureIndex(payments);
    const flow = index.flow('flow-submit-payment');

    it('finds a control on the endpoint of a relationship before the architecture', () => {
        expect(resolveControl(index, flow, 'oauth2-authentication', ['mobile-app-to-api-gateway'])).toEqual({ level: 'element', id: 'api-gateway' });
        expect(resolveControl(index, flow, 'audit-logging', ['payments-api-to-payments-db'])).toEqual({ level: 'architecture' });
    });

    it('does not search elements outside the threat', () => {
        expect(resolveControl(index, flow, 'encryption-at-rest', ['mobile-app-to-api-gateway'])).toBeUndefined();
    });

    it('reports a planned control that the architecture does not declare as a gap', () => {
        expect(findGaps(payments, expected)).toEqual([{ threat: 't-submit-flood', control: 'rate-limiting', state: 'planned' }]);
    });
});
