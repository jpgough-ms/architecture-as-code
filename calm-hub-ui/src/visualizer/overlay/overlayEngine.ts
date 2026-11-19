import type { CalmRelationshipSchema } from '@finos/calm-models/types';
import { resolvePointer } from './jsonPointer.js';
import type {
    Decorator,
    DecoratorOverlay,
    DecoratorView,
    ElementOverlay,
    OverlayDecoratorView,
    OverlayEntry,
    OverlayStatus,
} from '../contracts/contracts.js';

/** The scale, worst first. An element shows the worst status of its entries. */
export const OVERLAY_STATUSES: readonly OverlayStatus[] = ['error', 'warn', 'info', 'ok'];

const rank = (status: OverlayStatus) => OVERLAY_STATUSES.indexOf(status);

const isOverlayStatus = (value: unknown): value is OverlayStatus =>
    typeof value === 'string' && (OVERLAY_STATUSES as readonly string[]).includes(value);

export const hasOverlay = (view: DecoratorView): view is OverlayDecoratorView => !!view.overlay;

/**
 * Hub refuses a view id that two enabled extensions declare, but another extension can use it when the first is off.
 * So a view is keyed by its extension too, and a stored choice does not pass to the other extension.
 */
export const viewKey = (view: DecoratorView): string => (view.source ? `${view.source.id}/${view.id}` : view.id);

/** "Release risk · Release tracker"; a built-in view says "Built-in". */
export const viewTitle = (view: DecoratorView): string =>
    view.source ? `${view.label} · ${view.source.builtIn ? 'Built-in' : view.source.name}` : view.label;

export function matchesView(view: DecoratorView, decorator: Decorator): boolean {
    const { type, schema } = view.match;
    if (type === undefined && schema === undefined) return false;
    return (type === undefined || decorator.type === type) && (schema === undefined || decorator.schema === schema);
}

/** "not-met" reads as "Not met". */
export const statusText = (value: string) => {
    const text = value.replace(/[-_]+/g, ' ').trim();
    return text.charAt(0).toUpperCase() + text.slice(1);
};

/**
 * The decorator's raw status and its place on the scale: `null` for a hidden status. Undefined when the overlay does
 * not draw it: no string status, or a status that is neither mapped, hidden nor covered by a default.
 */
export function overlayStatus(
    overlay: DecoratorOverlay,
    decorator: Decorator,
): { value: string; status: OverlayStatus | null } | undefined {
    return mapStatus(overlay, resolvePointer(decorator.data, overlay.status));
}

/** {@link overlayStatus} for a raw status value, such as the status of one of the overlay's `items`. */
export function mapStatus(
    overlay: DecoratorOverlay,
    value: unknown,
): { value: string; status: OverlayStatus | null } | undefined {
    if (typeof value !== 'string') return undefined;
    if (overlay.hide?.includes(value)) return { value, status: null };
    const mapped = Object.hasOwn(overlay.map ?? {}, value) ? overlay.map[value] : overlay.default;
    return isOverlayStatus(mapped) ? { value, status: mapped } : undefined;
}

const stringAt = (data: unknown, pointer?: string) => {
    if (pointer === undefined) return undefined;
    const value = resolvePointer(data, pointer);
    return typeof value === 'string' ? value : undefined;
};

interface Counted {
    entry: OverlayEntry | null;
    decorator: Decorator;
    /** Hub does not require a uniqueId, so a decorator without one is told apart by its place in the list. */
    id: string;
    uniqueId: string;
    index: number;
    key?: string;
    time: number;
}

/**
 * Newest first by time (times that do not parse last), then the greater uniqueId. A tie that remains, such as two
 * decorators without a uniqueId, goes to the later one in the list.
 */
type Ordered = Pick<Counted, 'time' | 'uniqueId' | 'index'>;

const newerFirst = (a: Ordered, b: Ordered) => {
    const ta = Number.isNaN(a.time) ? -Infinity : a.time;
    const tb = Number.isNaN(b.time) ? -Infinity : b.time;
    if (ta !== tb) return tb - ta;
    if (a.uniqueId !== b.uniqueId) return a.uniqueId < b.uniqueId ? 1 : -1;
    return b.index - a.index;
};

/**
 * With `items` and `time`, the decorators that count: the newest of each `key`, chosen across all of them before
 * their items are expanded. So an element that a newer decorator no longer names shows nothing, not the stale items
 * of an older one. A decorator whose key or time is missing is left out, as the engine does. Without `items` and
 * `time`, every decorator counts.
 */
export function newestPerKey<T extends Decorator>(overlay: DecoratorOverlay, decorators: readonly T[]): Set<T> {
    if (overlay.items === undefined || overlay.time === undefined) return new Set(decorators);
    const newest = new Map<string, { decorator: T; time: number; uniqueId: string; index: number }>();
    for (const [index, decorator] of decorators.entries()) {
        const key = overlay.key === undefined ? '' : stringAt(decorator.data, overlay.key);
        if (key === undefined || (overlay.key !== undefined && !key)) continue;
        const time = Date.parse(stringAt(decorator.data, overlay.time) ?? '');
        if (Number.isNaN(time)) continue;
        const item = { decorator, time, uniqueId: typeof decorator.uniqueId === 'string' ? decorator.uniqueId : '', index };
        const current = newest.get(key);
        if (!current || newerFirst(item, current) < 0) newest.set(key, item);
    }
    return new Set([...newest.values()].map(({ decorator }) => decorator));
}

const stringsOf = (value: unknown): Set<string> =>
    new Set(Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []);

const elementsOf = (decorator: Decorator): Set<string> => stringsOf(decorator.appliesTo);

/** What a decorator draws: its `data`, or each element of the array at the overlay's `items`. */
interface Drawable {
    source: unknown;
    elements: Set<string>;
    /** Tells the items of one decorator apart. */
    suffix: string;
}

/**
 * An item draws on the elements of its own `applies-to` that the decorator's `appliesTo` also names, so each badge
 * has a decorator that the details drawer lists for that element.
 */
function drawablesOf(overlay: DecoratorOverlay, decorator: Decorator): Drawable[] {
    const elements = elementsOf(decorator);
    if (overlay.items === undefined) return [{ source: decorator.data, elements, suffix: '' }];
    const items = resolvePointer(decorator.data, overlay.items);
    const pointer = overlay['applies-to'];
    if (!Array.isArray(items) || pointer === undefined) return [];
    return items.map((item, index) => ({
        source: item,
        elements: new Set([...stringsOf(resolvePointer(item, pointer))].filter((id) => elements.has(id))),
        suffix: `#${index}`,
    }));
}

/**
 * The container each containment relationship (`deployed-in` or `composed-of`) is drawn as, by relationship unique-id.
 * The diagram draws such a relationship as its container holding the contained nodes, not as an edge. A malformed
 * entry is skipped, because Hub builds this for the whole view.
 */
export function containersOfContainment(relationships: unknown): Map<string, string> {
    const containers = new Map<string, string>();
    if (!Array.isArray(relationships)) return containers;
    for (const rel of relationships as (Partial<CalmRelationshipSchema> | null)[]) {
        if (!rel || typeof rel !== 'object') continue;
        const type = rel['relationship-type'];
        if (!type || typeof type !== 'object') continue;
        const container = type['deployed-in']?.container ?? type['composed-of']?.container;
        const id = rel['unique-id'];
        if (typeof id === 'string' && id && typeof container === 'string' && container) containers.set(id, container);
    }
    return containers;
}

/**
 * What one view draws on each element, by unique-id.
 *
 * A decorator that the view does not match or draw is skipped first, as is one whose `key` is not a string or whose
 * `time` does not parse. So an unknown status never hides an older, valid result. With `time`, only the newest
 * decorator of each key counts for each element named in `appliesTo`; a hidden status can be that newest and then
 * shows nothing. Without `time`, every decorator counts.
 *
 * With `items`, each element of that array is one entry, with its own status and label (see {@link drawablesOf}).
 * With `items` and `time`, the newest decorator of each key is chosen first, and only its items count
 * (see {@link newestPerKey}).
 *
 * An element that is not drawn on its own counts for the element that draws it, given in `drawnAs` (see
 * {@link containersOfContainment}). The newest is chosen for each element first, and only then folded, so a newer
 * result on one element never hides a worse result on another. A decorator that names several of them counts once.
 */
export function overlayByElement(
    view: OverlayDecoratorView,
    decorators: Decorator[],
    drawnAs: Map<string, string> = new Map(),
): Map<string, ElementOverlay> {
    const { overlay } = view;
    const counted = new Map<string, Map<string, Counted>>();
    const expands = overlay.items !== undefined;
    const counts = newestPerKey(overlay, decorators.filter((d) => matchesView(view, d)));
    for (const [index, decorator] of decorators.entries()) {
        if (!matchesView(view, decorator) || !counts.has(decorator)) continue;
        const key = stringAt(decorator.data, overlay.key);
        if (overlay.key !== undefined && !key) continue;
        const time = overlay.time === undefined ? NaN : Date.parse(stringAt(decorator.data, overlay.time) ?? '');
        if (overlay.time !== undefined && Number.isNaN(time)) continue;
        const uniqueId = typeof decorator.uniqueId === 'string' ? decorator.uniqueId : '';
        for (const { source, elements, suffix } of drawablesOf(overlay, decorator)) {
            const status = mapStatus(overlay, resolvePointer(source, overlay.status));
            if (!status) continue;
            const item: Counted = {
                decorator,
                id: `${uniqueId ? `id:${uniqueId}` : `index:${index}`}${suffix}`,
                uniqueId,
                index,
                key,
                time,
                entry: status.status === null
                    ? null
                    : {
                        decorator,
                        value: status.value,
                        status: status.status,
                        label: stringAt(source, overlay.label),
                        time: stringAt(decorator.data, overlay.time),
                    },
            };
            // Items of the decorators that count are all drawn; the newest was already chosen per key.
            const group = overlay.time === undefined || expands ? `#${item.id}` : `=${key ?? ''}`;
            for (const element of elements) {
                const byGroup = counted.get(element) ?? new Map<string, Counted>();
                counted.set(element, byGroup);
                const current = byGroup.get(group);
                if (!current || newerFirst(item, current) < 0) byGroup.set(group, item);
            }
        }
    }

    const drawn = new Map<string, Map<string, Counted>>();
    for (const [element, byGroup] of counted) {
        const target = drawnAs.get(element) ?? element;
        const byId = drawn.get(target) ?? new Map<string, Counted>();
        drawn.set(target, byId);
        for (const item of byGroup.values()) byId.set(item.id, item);
    }

    const sortKey = (item: Counted) => (expands ? undefined : item.key) ?? item.entry?.label ?? '';
    const result = new Map<string, ElementOverlay>();
    for (const [element, byId] of drawn) {
        const entries = [...byId.values()]
            .filter((item) => item.entry)
            .sort((a, b) => rank(a.entry!.status) - rank(b.entry!.status)
                || sortKey(a).localeCompare(sortKey(b))
                || newerFirst(a, b))
            .map((item) => item.entry!);
        if (!entries.length) continue;
        result.set(element, { status: entries[0].status, value: entries[0].value, entries });
    }
    return result;
}

export function worstStatus(statuses: Iterable<OverlayStatus>): OverlayStatus | undefined {
    let worst: OverlayStatus | undefined;
    for (const status of statuses) {
        if (worst === undefined || rank(status) < rank(worst)) worst = status;
    }
    return worst;
}
