import { describe, expect, it } from 'vitest';
import architecture from '../../../test_fixtures/threat-model/payments-api.architecture.json';
import { Architecture, buildDecorator, findGaps } from './model';
import { validateThreatModel } from './validate';
import { Choice, Prompter, runWalk } from './walk';

const payments = architecture as Architecture;

/** Answers prompts by key; any other prompt takes its default, and a checkbox takes its pre-checked choices. */
function scriptedPrompter(answers: Record<string, unknown>) {
    const asked: string[] = [];
    const offered: Record<string, unknown[]> = {};
    const answer = <T>(key: string, fallback: T): T => {
        asked.push(key);
        return (key in answers ? answers[key] : fallback) as T;
    };
    const prompter: Prompter = {
        confirm: async (key, _m, d) => answer(key, d),
        input: async (key, _m, d) => answer(key, d ?? ''),
        select: async <T>(key: string, _m: string, choices: Choice<T>[], d?: T) => {
            offered[key] = choices.map(c => c.value);
            return answer(key, d ?? choices[0].value);
        },
        checkbox: async <T>(key: string, _m: string, choices: Choice<T>[]) => {
            offered[key] = choices.map(c => c.value);
            return answer(key, choices.filter(c => c.checked).map(c => c.value));
        },
        say: () => undefined
    };
    return { prompter, asked, offered };
}

describe('runWalk', () => {
    it('asks STRIDE questions per crossing and writes a decorator that conforms to the standard', async () => {
        const { prompter, asked, offered } = scriptedPrompter({
            'mobile-app-to-api-gateway.spoofing-caller-identity': true,
            'mobile-app-to-api-gateway.spoofing-caller-identity.id': 't-token-replay',
            'mobile-app-to-api-gateway.spoofing-caller-identity.sequence-numbers': [1],
            'mobile-app-to-api-gateway.spoofing-caller-identity.declared': ['oauth2-authentication'],
            'mobile-app-to-api-gateway.spoofing-caller-identity.oauth2-authentication.state': 'verified',
            'mobile-app-to-api-gateway.spoofing-caller-identity.status': 'mitigated',
            'mobile-app-to-api-gateway.denial-of-service-exhaustion': true,
            'mobile-app-to-api-gateway.denial-of-service-exhaustion.id': 't-flood',
            'mobile-app-to-api-gateway.denial-of-service-exhaustion.catalogue': ['rate-limiting'],
            'payments-api-to-payments-db.repudiation-untraced-action': true,
            'payments-api-to-payments-db.repudiation-untraced-action.id': 't-no-audit',
            'payments-api-to-payments-db.repudiation-untraced-action.declared': ['audit-logging'],
            'payments-api-to-payments-db.repudiation-untraced-action.audit-logging.state': 'planned',
            'payments-api-to-payments-db.repudiation-untraced-action.status': 'accepted',
            'payments-api-to-payments-db.repudiation-untraced-action.justification': 'Audit logging ships next release.',
            'payments-api-to-payments-db.repudiation-untraced-action.accepted-by': 'payments-security-lead'
        });

        const session = await runWalk(payments, {
            flow: 'flow-submit-payment',
            assessedOn: '2026-11-19',
            catalogue: [{ name: 'rate-limiting', description: 'Limit request rates per client' }, { name: 'oauth2-authentication' }, { name: 'backup-policy' }]
        }, prompter);

        expect(session['trust-boundaries'].map(b => b['unique-id'])).toEqual(['tb-mobile-app-to-api-gateway', 'tb-api-gateway-to-payments-api', 'tb-payments-api-to-payments-db']);
        const questionsAsked = asked.filter(k => /^[a-z-]+\.[a-z-]+$/.test(k) && !k.startsWith('boundary.'));
        expect(questionsAsked.filter(k => k.startsWith('payments-api-to-payments-db.'))).toHaveLength(8);
        expect(questionsAsked.filter(k => k.startsWith('api-gateway-to-payments-api.'))).toHaveLength(6);
        // The catalogue offers only controls that the architecture does not declare, and that match the question.
        expect(offered['mobile-app-to-api-gateway.denial-of-service-exhaustion.catalogue']).toEqual(['rate-limiting']);
        // Mitigated needs a control in place, so it is not offered for the threat whose only control is planned.
        expect(offered['payments-api-to-payments-db.repudiation-untraced-action.status']).not.toContain('mitigated');

        const decorator = buildDecorator(payments, session, 'payments-api.architecture.json');
        expect(validateThreatModel(decorator, payments)).toEqual([]);
        expect(decorator['applies-to']).toEqual(['flow-submit-payment', 'mobile-app-to-api-gateway', 'api-gateway-to-payments-api', 'payments-api-to-payments-db', 'api-gateway']);
        expect(findGaps(payments, decorator)).toEqual([{ threat: 't-flood', control: 'rate-limiting', state: 'planned' }]);
        const threats = (decorator.data as { threats: Array<Record<string, unknown>> }).threats;
        expect(threats.map(t => [t['unique-id'], t.status])).toEqual([['t-token-replay', 'mitigated'], ['t-flood', 'identified'], ['t-no-audit', 'accepted']]);
        expect(threats[0].mitigations).toEqual([{ control: 'oauth2-authentication', 'attached-to': 'api-gateway', state: 'verified' }]);
        expect(threats[2].mitigations).toEqual([{ control: 'audit-logging', state: 'planned' }]);
    });

    it('asks no STRIDE questions when every proposed boundary is rejected', async () => {
        const { prompter, asked } = scriptedPrompter({
            'boundary.tb-mobile-app-to-api-gateway.keep': false,
            'boundary.tb-api-gateway-to-payments-api.keep': false,
            'boundary.tb-payments-api-to-payments-db.keep': false
        });
        const session = await runWalk(payments, { flow: 'flow-submit-payment', assessedOn: '2026-11-19' }, prompter);
        expect(session.threats).toEqual([]);
        expect(asked.filter(k => k.includes('spoofing'))).toEqual([]);
        expect(validateThreatModel(buildDecorator(payments, session, 'a.json'), payments)).toEqual([]);
    });
});
