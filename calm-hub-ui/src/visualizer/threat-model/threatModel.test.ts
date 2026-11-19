import { describe, expect, it } from 'vitest';
import { elementLabel, flowLabel, resolveMitigation, threatCounts } from './threatModel.js';
import type { Threat, ThreatMitigation } from '../contracts/contracts.js';

const control = (description: string) => ({ description, requirements: [] });

const architecture = {
    nodes: [
        { 'unique-id': 'app', name: 'Mobile App', controls: { pinning: control('pin') } },
        { 'unique-id': 'gw', name: 'API Gateway', controls: { oauth: control('oauth'), shared: control('on gw') } },
        { 'unique-id': 'api', name: 'Payments API', controls: { shared: control('on api') } },
        { 'unique-id': 'db', name: 'Payments DB' },
    ],
    relationships: [
        {
            'unique-id': 'app-to-gw',
            description: 'App calls gateway',
            'relationship-type': { connects: { source: { node: 'app' }, destination: { node: 'gw' } } },
            controls: { tls: control('tls') },
        },
        { 'unique-id': 'gw-to-api', 'relationship-type': { connects: { source: { node: 'gw' }, destination: { node: 'api' } } } },
        { 'unique-id': 'customer-uses-app', 'relationship-type': { interacts: { actor: 'customer', nodes: ['app'] } } },
        { 'unique-id': 'gw-in-api', 'relationship-type': { 'deployed-in': { container: 'api', nodes: ['gw'] } } },
    ],
    flows: [{ 'unique-id': 'flow-1', name: 'Submit Payment', transitions: [], controls: { 'flow-audit': control('flow') } }],
    controls: { audit: control('arch') },
};

const threat = (appliesTo: string[]): Threat => ({ 'unique-id': 't', name: 'T', status: 'identified', 'applies-to': appliesTo });
const resolve = (appliesTo: string[], mitigation: Partial<ThreatMitigation>) =>
    resolveMitigation(architecture, 'flow-1', threat(appliesTo), { state: 'implemented', ...mitigation } as ThreatMitigation);

describe('resolveMitigation', () => {
    it('takes attached-to before the elements of the threat', () => {
        expect(resolve(['gw'], { control: 'shared', 'attached-to': 'api' })).toEqual({ kind: 'element', id: 'api' });
        expect(resolve(['gw', 'api'], { control: 'shared' })).toEqual({ kind: 'element', id: 'gw' });
    });

    it('searches on when attached-to does not declare the control', () => {
        expect(resolve(['app-to-gw'], { control: 'tls', 'attached-to': 'db' })).toEqual({ kind: 'element', id: 'app-to-gw' });
    });

    it('finds a control on a node that a relationship of the threat joins', () => {
        expect(resolve(['gw-to-api'], { control: 'oauth' })).toEqual({ kind: 'element', id: 'gw' });
        expect(resolve(['app-to-gw'], { control: 'pinning' })).toEqual({ kind: 'element', id: 'app' });
    });

    it('takes the actor and nodes of interacts, but never the container or children of deployed-in', () => {
        expect(resolve(['customer-uses-app'], { control: 'pinning' })).toEqual({ kind: 'element', id: 'app' });
        expect(resolve(['gw-in-api'], { control: 'shared' })).toEqual({ kind: 'gap' });
        expect(resolve(['gw-in-api'], { control: 'oauth' })).toEqual({ kind: 'gap' });
    });

    it('does not take a node that the threat does not reach', () => {
        expect(resolve(['db'], { control: 'oauth' })).toEqual({ kind: 'gap' });
    });

    it('falls back to the flow, then the architecture, then a gap', () => {
        expect(resolve(['db'], { control: 'flow-audit' })).toEqual({ kind: 'flow' });
        expect(resolve(['db'], { control: 'audit' })).toEqual({ kind: 'architecture' });
        expect(resolve(['gw'], { control: 'rate-limiting' })).toEqual({ kind: 'gap' });
    });

    it('does not take flow controls from another flow', () => {
        expect(resolveMitigation(architecture, 'flow-2', threat(['db']), { control: 'flow-audit', state: 'planned' })).toEqual({ kind: 'gap' });
    });

    it('shows a gap for malformed input instead of throwing', () => {
        expect(resolveMitigation(undefined, 'flow-1', threat(['gw']), { control: 'oauth', state: 'planned' })).toEqual({ kind: 'gap' });
        expect(resolveMitigation(architecture, 'flow-1', {} as Threat, { control: 'audit' } as ThreatMitigation)).toEqual({ kind: 'architecture' });
        expect(resolveMitigation(architecture, 'flow-1', threat(['gw']), {} as ThreatMitigation)).toEqual({ kind: 'gap' });
    });
});

describe('labels and counts', () => {
    it('names elements and flows, else shows the id', () => {
        expect(elementLabel(architecture, 'gw')).toBe('API Gateway');
        expect(elementLabel(architecture, 'app-to-gw')).toBe('App calls gateway');
        expect(elementLabel(architecture, 'gw-to-api')).toBe('gw-to-api');
        expect(flowLabel(architecture, 'flow-1')).toBe('Submit Payment');
        expect(flowLabel(architecture, 'flow-9')).toBe('flow-9');
    });

    it('counts threats by status', () => {
        expect(threatCounts([{ status: 'mitigated' }, { status: 'identified' }, { status: 'mitigated' }, {}])).toEqual([
            ['mitigated', 2],
            ['identified', 1],
            ['unknown', 1],
        ]);
        expect(threatCounts('nope')).toEqual([]);
    });
});
