import {
    Architecture, ArchitectureIndex, Mitigation, MITIGATION_STATES, QUESTION_BANK_VERSION, RATINGS, Session, STATUSES, ThreatAnswer, TrustBoundary,
    crossingRelationships, declaredControls, defaultAppliesTo, fillTemplate, keywordScore, proposeTrustBoundaries, questionsFor
} from './model';

export interface Choice<T> {
    name: string;
    value: T;
    checked?: boolean;
}

/** Each prompt has a stable key, so a test can answer it without matching on wording. */
export interface Prompter {
    confirm(key: string, message: string, defaultValue: boolean): Promise<boolean>;
    input(key: string, message: string, defaultValue?: string): Promise<string>;
    select<T>(key: string, message: string, choices: Choice<T>[], defaultValue?: T): Promise<T>;
    checkbox<T>(key: string, message: string, choices: Choice<T>[]): Promise<T[]>;
    say(message: string): void;
}

export interface CatalogueControl {
    name: string;
    description?: string;
}

export interface WalkOptions {
    flow: string;
    assessedOn: string;
    assessor?: string;
    catalogue?: CatalogueControl[];
}

const optional = (value: string) => value.trim() === '' ? undefined : value.trim();

async function confirmBoundaries(index: ArchitectureIndex, flowId: string, prompt: Prompter): Promise<TrustBoundary[]> {
    const boundaries: TrustBoundary[] = [];
    for (const proposal of proposeTrustBoundaries(index, flowId)) {
        prompt.say(`Proposed trust boundary on ${proposal.elements.join(', ')}: ${proposal.reasons.join('; ')}.`);
        if (!await prompt.confirm(`boundary.${proposal['unique-id']}.keep`, 'Keep this boundary?', true)) continue;
        boundaries.push({
            'unique-id': await prompt.input(`boundary.${proposal['unique-id']}.id`, 'Boundary id', proposal['unique-id']),
            name: await prompt.input(`boundary.${proposal['unique-id']}.name`, 'Boundary name', proposal.name),
            description: optional(await prompt.input(`boundary.${proposal['unique-id']}.description`, 'What changes in trust here? (optional)', '')),
            elements: proposal.elements
        });
    }
    const flow = index.flow(flowId);
    const unmarked = [...new Set(flow.transitions.map(t => t['relationship-unique-id']))]
        .filter(id => !boundaries.some(b => b.elements.includes(id)));
    while (unmarked.length > 0 && await prompt.confirm('boundary.add', 'Add another trust boundary?', false)) {
        const element = await prompt.select('boundary.add.element', 'Which relationship crosses it?', unmarked.map(id => ({ name: id, value: id })));
        unmarked.splice(unmarked.indexOf(element), 1);
        boundaries.push({
            'unique-id': await prompt.input('boundary.add.id', 'Boundary id', `tb-${element}`),
            name: await prompt.input('boundary.add.name', 'Boundary name'),
            description: optional(await prompt.input('boundary.add.description', 'What changes in trust here? (optional)', '')),
            elements: [element]
        });
    }
    return boundaries;
}

async function chooseMitigations(index: ArchitectureIndex, flowId: string, appliesTo: string[], keywordsFrom: Parameters<typeof keywordScore>[0], options: WalkOptions, prompt: Prompter, key: string): Promise<Mitigation[]> {
    const flow = index.flow(flowId);
    const declared = declaredControls(index, flow, appliesTo)
        .map(control => ({ control, score: keywordScore(keywordsFrom, `${control.key} ${control.description ?? ''}`) }))
        .sort((a, b) => b.score - a.score);
    const where = (c: (typeof declared)[number]['control']) => c.location.level === 'element' ? c.location.id : c.location.level;
    const picked = await prompt.checkbox(`${key}.declared`, 'Which declared controls mitigate this threat?',
        declared.map(({ control, score }) => ({ name: `${control.key} (${where(control)})${control.description ? ` - ${control.description}` : ''}`, value: control.key, checked: score > 0 })));

    const declaredKeys = new Set(declared.map(d => d.control.key));
    const suggestions = (options.catalogue ?? [])
        .filter(c => !declaredKeys.has(c.name))
        .map(c => ({ control: c, score: keywordScore(keywordsFrom, `${c.name} ${c.description ?? ''}`) }))
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score);
    const adopted = suggestions.length === 0 ? [] : await prompt.checkbox(`${key}.catalogue`, 'The catalogue has these controls that the architecture does not declare. Plan any?',
        suggestions.map(({ control }) => ({ name: `${control.name}${control.description ? ` - ${control.description}` : ''}`, value: control.name })));

    const mitigations: Mitigation[] = [];
    for (const control of picked) {
        const state = await prompt.select(`${key}.${control}.state`, `State of ${control}`, MITIGATION_STATES.map(s => ({ name: s, value: s })), 'implemented');
        mitigations.push({ control, state, note: optional(await prompt.input(`${key}.${control}.note`, 'Note (optional)', '')) });
    }
    for (const control of adopted) {
        mitigations.push({ control, 'attached-to': appliesTo[appliesTo.length - 1], state: 'planned', note: 'Suggested from the control catalogue. The architecture does not declare this control.' });
    }
    let other = optional(await prompt.input(`${key}.other`, 'Another control key to plan (blank for none)', ''));
    while (other) {
        mitigations.push({ control: other, 'attached-to': await prompt.select(`${key}.${other}.attached-to`, `Which element would carry ${other}?`, appliesTo.map(id => ({ name: id, value: id })), appliesTo[appliesTo.length - 1]), state: 'planned' });
        other = optional(await prompt.input(`${key}.other`, 'Another control key to plan (blank for none)', ''));
    }
    return mitigations;
}

function suggestedStatus(mitigations: Mitigation[]): ThreatAnswer['status'] {
    return mitigations.some(m => m.state !== 'planned') ? 'partially-mitigated' : 'identified';
}

/** Asks the fixed STRIDE questions for each relationship of the flow that crosses a confirmed boundary. */
export async function runWalk(architecture: Architecture, options: WalkOptions, prompt: Prompter): Promise<Session> {
    const index = new ArchitectureIndex(architecture);
    const flow = index.flow(options.flow);
    const boundaries = await confirmBoundaries(index, options.flow, prompt);
    const threats: ThreatAnswer[] = [];

    for (const relationshipId of crossingRelationships(index, options.flow, boundaries)) {
        const sequenceNumbers = flow.transitions.filter(t => t['relationship-unique-id'] === relationshipId).map(t => t['sequence-number']);
        prompt.say(`\n${relationshipId} (transitions ${sequenceNumbers.join(', ')})`);
        for (const question of questionsFor(index, relationshipId)) {
            const key = `${relationshipId}.${question.id}`;
            if (!await prompt.confirm(key, `[${question.category}] ${fillTemplate(question.text, index, relationshipId)}`, false)) continue;

            const appliesTo = defaultAppliesTo(index, question, relationshipId);
            const answer: ThreatAnswer = {
                question: question.id,
                relationship: relationshipId,
                'unique-id': await prompt.input(`${key}.id`, 'Threat id', `t-${question.category}-${relationshipId}`),
                name: await prompt.input(`${key}.name`, 'Threat name', fillTemplate(question.threat.name, index, relationshipId)),
                description: await prompt.input(`${key}.description`, 'Description', fillTemplate(question.threat.description, index, relationshipId)),
                status: 'identified'
            };
            if (sequenceNumbers.length > 1) {
                const chosen = await prompt.checkbox(`${key}.sequence-numbers`, 'Which transitions? (none for all)', sequenceNumbers.map(n => ({ name: String(n), value: n })));
                if (chosen.length > 0 && chosen.length < sequenceNumbers.length) answer['sequence-numbers'] = chosen;
            }
            answer.likelihood = await prompt.select(`${key}.likelihood`, 'Likelihood', RATINGS.map(r => ({ name: r, value: r })), 'medium');
            answer.impact = await prompt.select(`${key}.impact`, 'Impact', RATINGS.map(r => ({ name: r, value: r })), 'medium');
            const mitigations = await chooseMitigations(index, options.flow, appliesTo, question, options, prompt, key);
            if (mitigations.length > 0) answer.mitigations = mitigations;

            const allowed = STATUSES.filter(s => s !== 'mitigated' || mitigations.some(m => m.state !== 'planned'))
                .filter(s => s !== 'partially-mitigated' || mitigations.length > 0);
            answer.status = await prompt.select(`${key}.status`, 'Status', allowed.map(s => ({ name: s, value: s })), suggestedStatus(mitigations));
            if (['accepted', 'transferred', 'not-applicable'].includes(answer.status)) {
                answer.justification = await prompt.input(`${key}.justification`, 'Why is this status correct?');
            }
            if (answer.status === 'accepted' || answer.status === 'transferred') {
                answer['residual-risk'] = {
                    rating: await prompt.select(`${key}.residual-rating`, 'Residual risk', RATINGS.map(r => ({ name: r, value: r })), 'medium'),
                    'accepted-by': await prompt.input(`${key}.accepted-by`, 'Who owns the risk decision?'),
                    'review-by': optional(await prompt.input(`${key}.review-by`, 'Review by (YYYY-MM-DD, optional)', ''))
                };
            }
            threats.push(answer);
        }
    }

    return {
        'question-bank': QUESTION_BANK_VERSION,
        flow: options.flow,
        'assessed-on': options.assessedOn,
        assessor: options.assessor,
        'trust-boundaries': boundaries,
        threats
    };
}
