import { describe, expect, it } from 'vitest';
import architecture from '../../../test_fixtures/threat-model/payments-api.architecture.json';
import example from '../../../test_fixtures/threat-model/submit-payment.stride.threat-model.decorator.json';
import { Architecture } from './model';
import { validateThreatModel } from './validate';

const payments = architecture as Architecture;
const copy = () => structuredClone(example) as typeof example & Record<string, unknown>;

describe('validateThreatModel', () => {
    it('accepts the example of the standard', () => {
        expect(validateThreatModel(example, payments)).toEqual([]);
    });

    it('rejects a STRIDE category in the wrong case', () => {
        const decorator = copy();
        decorator.data.threats[0].classification[0].value = 'Spoofing';
        expect(validateThreatModel(decorator).map(p => p.path)).toContain('/data/threats/0/classification/0/value');
    });

    it('rejects an accepted threat with no owner for the risk', () => {
        const decorator = copy();
        delete (decorator.data.threats[5]['residual-risk'] as Record<string, unknown>)['accepted-by'];
        expect(validateThreatModel(decorator)).toContainEqual({ path: '/data/threats/5/residual-risk', message: 'must have required property \'accepted-by\'' });
    });

    it('rejects a mitigated threat whose controls are only planned', () => {
        const decorator = copy();
        decorator.data.threats[0].mitigations[0].state = 'planned';
        expect(validateThreatModel(decorator).map(p => p.path)).toContain('/data/threats/0/mitigations');
    });

    it('checks the rules that JSON Schema cannot check', () => {
        const decorator = copy();
        decorator.data.threats[1]['unique-id'] = 't-token-replay';
        decorator.data.threats[0]['sequence-numbers'] = [9];
        decorator.data.threats[2]['applies-to'] = ['mobile-app-to-api-gateway', 'mobile-app'];
        decorator.data['trust-boundaries'][0].elements = ['no-such-element'];
        decorator.data.flow = 'flow-other';
        expect(validateThreatModel(decorator, payments)).toEqual([
            { path: '/data/flow', message: 'flow \'flow-other\' is not in the flows of the target' },
            { path: '/data/trust-boundaries/0/elements/0', message: '\'no-such-element\' is not a node or relationship of the target' },
            { path: '/data/threats/1/unique-id', message: 'threat id \'t-token-replay\' is not unique' },
            { path: '/applies-to', message: '\'flow-other\' is missing from applies-to' },
            { path: '/applies-to', message: '\'no-such-element\' is missing from applies-to' },
            { path: '/applies-to', message: '\'mobile-app\' is missing from applies-to' }
        ]);
    });

    it('rejects a sequence number that is not a transition of the flow', () => {
        const decorator = copy();
        decorator.data.threats[0]['sequence-numbers'] = [6];
        expect(validateThreatModel(decorator, payments)).toEqual([{ path: '/data/threats/0/sequence-numbers/0', message: '6 is not a transition of flow \'flow-submit-payment\'' }]);
    });
});
