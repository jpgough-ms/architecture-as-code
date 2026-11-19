import { newestPerKey } from '../overlay/overlayEngine.js';
import { resolvePointer } from '../overlay/jsonPointer.js';
import type { DecoratorOverlay, Threat, ThreatMitigation, ThreatModelDecorator } from '../contracts/contracts.js';

/** Where a mitigation's control is declared. A control that is declared nowhere is a gap: a finding, not an error. */
export type MitigationLocation =
    | { kind: 'element'; id: string }
    | { kind: 'flow' }
    | { kind: 'architecture' }
    | { kind: 'gap' };

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json => !!value && typeof value === 'object' && !Array.isArray(value);
const listOf = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const strings = (value: unknown): string[] => listOf(value).filter((s): s is string => typeof s === 'string');
const declares = (holder: unknown, control: string) => isObject(holder) && isObject(holder.controls) && Object.hasOwn(holder.controls, control);

/** The nodes and relationships of an architecture, by unique-id. */
function elementsById(architecture: unknown): Map<string, Json> {
    const byId = new Map<string, Json>();
    if (!isObject(architecture)) return byId;
    for (const element of [...listOf(architecture.nodes), ...listOf(architecture.relationships)]) {
        if (isObject(element) && typeof element['unique-id'] === 'string') byId.set(element['unique-id'], element);
    }
    return byId;
}

/**
 * The source and destination nodes of a relationship: the two ends of `connects`, or the actor and the nodes of
 * `interacts`. A `deployed-in` or `composed-of` container is not an end, so its controls do not count.
 */
function nodesOf(relationship: Json): string[] {
    const type = relationship['relationship-type'];
    if (!isObject(type)) return [];
    const nodes: string[] = [];
    if (isObject(type.connects)) {
        for (const end of [type.connects.source, type.connects.destination]) if (isObject(end) && typeof end.node === 'string') nodes.push(end.node);
    }
    if (isObject(type.interacts)) {
        if (typeof type.interacts.actor === 'string') nodes.push(type.interacts.actor);
        nodes.push(...strings(type.interacts.nodes));
    }
    return nodes;
}

/**
 * Finds the control of a mitigation in the order of the threat-model standard: the element in `attached-to`; the
 * threat's nodes and relationships; the nodes of those relationships; the flow; the architecture.
 */
export function resolveMitigation(architecture: unknown, flowId: unknown, threat: Threat, mitigation: ThreatMitigation): MitigationLocation {
    const control = mitigation?.control;
    if (typeof control !== 'string' || !isObject(architecture)) return { kind: 'gap' };
    const elements = elementsById(architecture);
    const appliesTo = strings(threat?.['applies-to']);
    const joined = appliesTo.flatMap((id) => {
        const element = elements.get(id);
        return element && isObject(element['relationship-type']) ? nodesOf(element) : [];
    });
    const candidates = [...(typeof mitigation['attached-to'] === 'string' ? [mitigation['attached-to']] : []), ...appliesTo, ...joined];
    const found = candidates.find((id) => declares(elements.get(id), control));
    if (found) return { kind: 'element', id: found };
    const flow = listOf(architecture.flows).find((f) => isObject(f) && f['unique-id'] === flowId);
    if (declares(flow, control)) return { kind: 'flow' };
    if (declares(architecture, control)) return { kind: 'architecture' };
    return { kind: 'gap' };
}

/** A node's name or a relationship's description, else its unique-id. */
export function elementLabel(architecture: unknown, id: string): string {
    const element = elementsById(architecture).get(id);
    const label = element?.name ?? element?.description;
    return typeof label === 'string' && label ? label : id;
}

/** The flow's name, else the id the threat model gives. */
export function flowLabel(architecture: unknown, flowId: unknown): string {
    const flow = isObject(architecture) ? listOf(architecture.flows).find((f) => isObject(f) && f['unique-id'] === flowId) : undefined;
    if (isObject(flow) && typeof flow.name === 'string' && flow.name) return flow.name;
    return typeof flowId === 'string' ? flowId : '(no flow)';
}

/** How many threats have each status, in the order the threats first use them. */
export function threatCounts(threats: unknown): [string, number][] {
    const counts = new Map<string, number>();
    for (const threat of listOf(threats)) {
        const status = isObject(threat) && typeof threat.status === 'string' ? threat.status : 'unknown';
        counts.set(status, (counts.get(status) ?? 0) + 1);
    }
    return [...counts];
}

export const threatsOf = (data: unknown): Threat[] => (isObject(data) ? listOf(data.threats).filter(isObject) as unknown as Threat[] : []);
export const stringList = strings;

/**
 * The models that the view draws, and the earlier assessments of the same flows, newest first. A model the view
 * cannot key, such as one with no flow or date, stays with the current ones, so the panel still shows it.
 */
export function splitAssessments(models: ThreatModelDecorator[], overlay?: DecoratorOverlay): { current: ThreatModelDecorator[]; earlier: ThreatModelDecorator[] } {
    if (!overlay) return { current: models, earlier: [] };
    const newest = newestPerKey(overlay, models);
    const keyOf = (model: ThreatModelDecorator) => (overlay.key === undefined ? '' : resolvePointer(model.data, overlay.key));
    const currentKeys = new Set([...newest].map(keyOf));
    const isEarlier = (model: ThreatModelDecorator) => !newest.has(model) && currentKeys.has(keyOf(model));
    const assessedOn = (model: ThreatModelDecorator) => String(isObject(model.data) ? model.data['assessed-on'] ?? '' : '');
    return {
        current: models.filter((model) => !isEarlier(model)),
        earlier: models.filter(isEarlier).sort((a, b) => assessedOn(b).localeCompare(assessedOn(a))),
    };
}

/** How many threats the models hold. */
export const threatTotal = (models: ThreatModelDecorator[]) => models.reduce((n, model) => n + threatsOf(model.data).length, 0);
