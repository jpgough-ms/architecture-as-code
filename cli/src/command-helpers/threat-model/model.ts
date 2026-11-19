import questionBank from './stride-questions.json';

export const STRIDE_CATEGORIES = ['spoofing', 'tampering', 'repudiation', 'information-disclosure', 'denial-of-service', 'elevation-of-privilege'] as const;
export const RATINGS = ['low', 'medium', 'high', 'critical'] as const;
export const STATUSES = ['identified', 'mitigated', 'partially-mitigated', 'accepted', 'transferred', 'not-applicable'] as const;
export const MITIGATION_STATES = ['planned', 'implemented', 'verified'] as const;
export const STANDARD_ID = 'https://calm.finos.org/standards/threat-model/1.0/stride.threat-model.decorator.standard.json';

type Json = Record<string, unknown>;

export interface Architecture {
    nodes?: Array<{ 'unique-id': string; 'node-type'?: string; name?: string; controls?: Json }>;
    relationships?: Array<{ 'unique-id': string; 'relationship-type': Json; protocol?: string; controls?: Json }>;
    flows?: Flow[];
    controls?: Json;
}

export interface Flow {
    'unique-id': string;
    name?: string;
    transitions: Array<{ 'relationship-unique-id': string; 'sequence-number': number; description?: string; direction?: string }>;
    controls?: Json;
}

export interface Question {
    id: string;
    category: typeof STRIDE_CATEGORIES[number];
    when?: { 'destination-node-types'?: string[] };
    text: string;
    'default-elements': Array<'relationship' | 'source' | 'destination'>;
    threat: { name: string; description: string };
    'control-keywords': string[];
}

export const QUESTIONS = questionBank.questions as Question[];
export const QUESTION_BANK_VERSION = questionBank.version;

export interface TrustBoundary {
    'unique-id': string;
    name: string;
    description?: string;
    elements: string[];
}

export interface ProposedBoundary extends TrustBoundary {
    reasons: string[];
}

export interface Mitigation {
    control: string;
    'attached-to'?: string;
    state: typeof MITIGATION_STATES[number];
    note?: string;
    evidence?: string[];
}

/** One threat that the assessor confirmed, as recorded in the session file. */
export interface ThreatAnswer {
    question: string;
    relationship: string;
    'unique-id': string;
    name?: string;
    description?: string;
    'applies-to'?: string[];
    'sequence-numbers'?: number[];
    classification?: Array<{ scheme: string; value: string; reference?: string }>;
    likelihood?: typeof RATINGS[number];
    impact?: typeof RATINGS[number];
    status: typeof STATUSES[number];
    justification?: string;
    mitigations?: Mitigation[];
    'residual-risk'?: { rating: string; 'accepted-by'?: string; 'review-by'?: string };
}

/** The answers of one walk. The same session and architecture always give the same decorator. */
export interface Session {
    'question-bank': string;
    flow: string;
    'decorator-id'?: string;
    'assessed-on': string;
    assessor?: string;
    'trust-boundaries': TrustBoundary[];
    threats: ThreatAnswer[];
}

export interface Endpoints {
    source: string;
    destinations: string[];
}

export function relationshipEndpoints(relationshipType: Json): Endpoints | undefined {
    const connects = relationshipType.connects as { source: { node: string }; destination: { node: string } } | undefined;
    if (connects) return { source: connects.source.node, destinations: [connects.destination.node] };
    const interacts = relationshipType.interacts as { actor: string; nodes: string[] } | undefined;
    if (interacts) return { source: interacts.actor, destinations: interacts.nodes };
    return undefined;
}

export class ArchitectureIndex {
    readonly nodes = new Map<string, NonNullable<Architecture['nodes']>[number]>();
    readonly relationships = new Map<string, NonNullable<Architecture['relationships']>[number]>();
    private readonly parents = new Map<string, string>();

    constructor(readonly architecture: Architecture) {
        for (const node of architecture.nodes ?? []) this.nodes.set(node['unique-id'], node);
        for (const relationship of architecture.relationships ?? []) {
            this.relationships.set(relationship['unique-id'], relationship);
            const type = relationship['relationship-type'];
            const container = (type['deployed-in'] ?? type['composed-of']) as { container: string; nodes: string[] } | undefined;
            for (const child of container?.nodes ?? []) this.parents.set(child, container!.container);
        }
    }

    flow(flowId: string): Flow {
        const flow = this.architecture.flows?.find(f => f['unique-id'] === flowId);
        if (!flow) {
            const known = (this.architecture.flows ?? []).map(f => f['unique-id']).join(', ') || 'none';
            throw new Error(`Flow '${flowId}' is not in the flows of the architecture (flows: ${known})`);
        }
        return flow;
    }

    endpoints(relationshipId: string): Endpoints | undefined {
        const relationship = this.relationships.get(relationshipId);
        return relationship && relationshipEndpoints(relationship['relationship-type']);
    }

    parent(nodeId: string): string | undefined {
        return this.parents.get(nodeId);
    }

    /** The node itself and every node it holds through deployed-in and composed-of. */
    within(nodeId: string): Set<string> {
        const members = new Set([nodeId]);
        let grew = true;
        while (grew) {
            grew = false;
            for (const [child, parent] of this.parents) {
                if (members.has(parent) && !members.has(child)) {
                    members.add(child);
                    grew = true;
                }
            }
        }
        return members;
    }

    name(id: string): string {
        return this.nodes.get(id)?.name ?? id;
    }
}

const CLIENT_NODE_TYPES = ['actor', 'webclient'];
const EXTERNAL_NODE_TYPES = ['ecosystem'];

/**
 * Proposes one boundary for each relationship of the flow where trust can change:
 * an actor or client source, a change of deployed-in/composed-of parent,
 * a protocol change along the flow, or an external node.
 */
export function proposeTrustBoundaries(index: ArchitectureIndex, flowId: string): ProposedBoundary[] {
    const flow = index.flow(flowId);
    const proposals = new Map<string, ProposedBoundary>();
    const transitions = [...flow.transitions].sort((a, b) => a['sequence-number'] - b['sequence-number']);
    const seen = new Set<string>();
    let previousProtocol: string | undefined;

    for (const transition of transitions) {
        const relationshipId = transition['relationship-unique-id'];
        const relationship = index.relationships.get(relationshipId);
        const endpoints = index.endpoints(relationshipId);
        // A relationship is judged where the flow first uses it, so a return path is not a protocol change.
        if (!relationship || !endpoints || seen.has(relationshipId)) continue;
        seen.add(relationshipId);
        const reasons: string[] = [];
        const { source } = endpoints;
        const destination = endpoints.destinations[0];
        const sourceType = index.nodes.get(source)?.['node-type'] ?? '';
        const destinationType = index.nodes.get(destination)?.['node-type'] ?? '';

        if (CLIENT_NODE_TYPES.includes(sourceType)) reasons.push(`the source ${source} is a ${sourceType}`);
        if (index.parent(source) !== index.parent(destination)) reasons.push(`${source} and ${destination} have different parents`);
        if (relationship.protocol && previousProtocol && relationship.protocol !== previousProtocol) {
            reasons.push(`the protocol changes from ${previousProtocol} to ${relationship.protocol}`);
        }
        if (EXTERNAL_NODE_TYPES.includes(sourceType) || EXTERNAL_NODE_TYPES.includes(destinationType)) reasons.push('an external node takes part');
        if (relationship.protocol) previousProtocol = relationship.protocol;

        if (reasons.length === 0) continue;
        proposals.set(relationshipId, {
            'unique-id': `tb-${relationshipId}`,
            name: `${index.name(source)} to ${index.name(destination)}`,
            elements: [relationshipId],
            reasons
        });
    }
    return [...proposals.values()];
}

/** The relationships of the flow that cross a boundary, in the order the flow first uses them. */
export function crossingRelationships(index: ArchitectureIndex, flowId: string, boundaries: TrustBoundary[]): string[] {
    const crossing: string[] = [];
    for (const transition of index.flow(flowId).transitions) {
        const relationshipId = transition['relationship-unique-id'];
        if (crossing.includes(relationshipId)) continue;
        const endpoints = index.endpoints(relationshipId);
        const crosses = boundaries.some(boundary => {
            if (boundary.elements.includes(relationshipId)) return true;
            if (!endpoints) return false;
            const inside = new Set(boundary.elements.flatMap(id => [...index.within(id)]));
            const ends = [endpoints.source, ...endpoints.destinations];
            return ends.some(id => inside.has(id)) && ends.some(id => !inside.has(id));
        });
        if (crosses) crossing.push(relationshipId);
    }
    return crossing;
}

export function questionsFor(index: ArchitectureIndex, relationshipId: string): Question[] {
    const destination = index.endpoints(relationshipId)?.destinations[0];
    const destinationType = (destination && index.nodes.get(destination)?.['node-type']) ?? '';
    return QUESTIONS.filter(q => !q.when?.['destination-node-types'] || q.when['destination-node-types'].includes(destinationType));
}

export function questionById(id: string): Question {
    const question = QUESTIONS.find(q => q.id === id);
    if (!question) throw new Error(`Unknown question '${id}' (question bank ${QUESTION_BANK_VERSION})`);
    return question;
}

export function fillTemplate(template: string, index: ArchitectureIndex, relationshipId: string): string {
    const endpoints = index.endpoints(relationshipId);
    return template
        .replaceAll('{relationship}', relationshipId)
        .replaceAll('{source}', endpoints ? index.name(endpoints.source) : '?')
        .replaceAll('{destination}', endpoints ? index.name(endpoints.destinations[0]) : '?');
}

export function defaultAppliesTo(index: ArchitectureIndex, question: Question, relationshipId: string): string[] {
    const endpoints = index.endpoints(relationshipId);
    return question['default-elements'].map(element => {
        if (element === 'relationship') return relationshipId;
        if (element === 'source') return endpoints!.source;
        return endpoints!.destinations[0];
    });
}

export type ControlLocation = { level: 'element'; id: string } | { level: 'flow' } | { level: 'architecture' };

export interface DeclaredControl {
    key: string;
    description?: string;
    location: ControlLocation;
}

/**
 * The places a tool searches for the control of a mitigation, in the order of the standard:
 * the attached-to element; the threat's elements; the endpoints of its relationships; the flow; the architecture.
 */
function searchOrder(index: ArchitectureIndex, appliesTo: string[], attachedTo?: string): string[] {
    const elements = [...(attachedTo ? [attachedTo] : []), ...appliesTo];
    for (const id of appliesTo) {
        const endpoints = index.endpoints(id);
        if (endpoints) elements.push(endpoints.source, ...endpoints.destinations);
    }
    return [...new Set(elements)];
}

function elementControls(index: ArchitectureIndex, id: string): Json | undefined {
    return (index.nodes.get(id) ?? index.relationships.get(id))?.controls;
}

export function resolveControl(index: ArchitectureIndex, flow: Flow, key: string, appliesTo: string[], attachedTo?: string): ControlLocation | undefined {
    for (const id of searchOrder(index, appliesTo, attachedTo)) {
        if (elementControls(index, id)?.[key]) return { level: 'element', id };
    }
    if (flow.controls?.[key]) return { level: 'flow' };
    if (index.architecture.controls?.[key]) return { level: 'architecture' };
    return undefined;
}

/** Every control that the threat's elements can see, nearest first, each key once. */
export function declaredControls(index: ArchitectureIndex, flow: Flow, appliesTo: string[]): DeclaredControl[] {
    const found = new Map<string, DeclaredControl>();
    const add = (controls: Json | undefined, location: ControlLocation) => {
        for (const [key, value] of Object.entries(controls ?? {})) {
            if (!found.has(key)) found.set(key, { key, description: (value as Json)?.description as string | undefined, location });
        }
    };
    for (const id of searchOrder(index, appliesTo)) add(elementControls(index, id), { level: 'element', id });
    add(flow.controls, { level: 'flow' });
    add(index.architecture.controls, { level: 'architecture' });
    return [...found.values()];
}

export function keywordScore(question: Question, text: string): number {
    const lower = text.toLowerCase();
    return question['control-keywords'].filter(keyword => lower.includes(keyword)).length;
}

/** Elements first by kind (relationships, then nodes), each in architecture order, after the flow. */
function orderedAppliesTo(index: ArchitectureIndex, flowId: string, ids: Set<string>): string[] {
    return [
        flowId,
        ...[...index.relationships.keys()].filter(id => ids.has(id)),
        ...[...index.nodes.keys()].filter(id => ids.has(id)),
        ...[...ids].filter(id => !index.relationships.has(id) && !index.nodes.has(id))
    ];
}

function compact<T extends object>(value: T): T {
    return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}

export function buildThreat(index: ArchitectureIndex, flow: Flow, answer: ThreatAnswer): Json {
    const question = questionById(answer.question);
    const appliesTo = answer['applies-to'] ?? defaultAppliesTo(index, question, answer.relationship);
    const mitigations = answer.mitigations?.map(mitigation => {
        const location = resolveControl(index, flow, mitigation.control, appliesTo, mitigation['attached-to']);
        const attachedTo = mitigation['attached-to'] ?? (location?.level === 'element' ? location.id : undefined);
        return compact({ control: mitigation.control, 'attached-to': attachedTo, state: mitigation.state, note: mitigation.note, evidence: mitigation.evidence });
    });
    return compact({
        'unique-id': answer['unique-id'],
        name: answer.name ?? fillTemplate(question.threat.name, index, answer.relationship),
        description: answer.description ?? fillTemplate(question.threat.description, index, answer.relationship),
        classification: [{ scheme: 'STRIDE', value: question.category }, ...(answer.classification ?? [])],
        'applies-to': appliesTo,
        'sequence-numbers': answer['sequence-numbers'],
        likelihood: answer.likelihood,
        impact: answer.impact,
        status: answer.status,
        justification: answer.justification,
        mitigations,
        'residual-risk': answer['residual-risk']
    });
}

export function defaultDecoratorId(flowId: string): string {
    return `${flowId.replace(/^flow-/, '')}-stride-threat-model`;
}

export function buildDecorator(architecture: Architecture, session: Session, target: string): Json {
    const index = new ArchitectureIndex(architecture);
    const flow = index.flow(session.flow);
    const threats = session.threats.map(answer => buildThreat(index, flow, answer));
    const named = new Set<string>([
        ...session['trust-boundaries'].flatMap(b => b.elements),
        ...threats.flatMap(t => t['applies-to'] as string[])
    ]);
    return {
        $schema: STANDARD_ID,
        'unique-id': session['decorator-id'] ?? defaultDecoratorId(session.flow),
        type: 'threat-model',
        'target-type': ['architecture'],
        target: [target],
        'applies-to': orderedAppliesTo(index, session.flow, named),
        data: compact({
            flow: session.flow,
            methodology: 'STRIDE',
            'assessed-on': session['assessed-on'],
            assessor: session.assessor,
            'trust-boundaries': session['trust-boundaries'].length > 0 ? session['trust-boundaries'].map(b => compact({ ...b })) : undefined,
            threats
        })
    };
}

export interface Finding {
    threat: string;
    control: string;
    state: string;
}

/** Mitigations whose control the architecture declares nowhere the standard searches. */
export function findGaps(architecture: Architecture, decorator: Json): Finding[] {
    const index = new ArchitectureIndex(architecture);
    const data = decorator.data as { flow: string; threats: Array<{ 'unique-id': string; 'applies-to': string[]; mitigations?: Mitigation[] }> };
    const flow = index.flow(data.flow);
    return data.threats.flatMap(threat => (threat.mitigations ?? [])
        .filter(m => !resolveControl(index, flow, m.control, threat['applies-to'], m['attached-to']))
        .map(m => ({ threat: threat['unique-id'], control: m.control, state: m.state })));
}
