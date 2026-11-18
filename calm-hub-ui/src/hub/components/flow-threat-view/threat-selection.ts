export type ThreatSelection = { kind: 'arrow'; id: string } | { kind: 'boundary'; id: string };

export function isSameSelection(a: ThreatSelection | null, b: ThreatSelection | null): boolean {
    return a !== null && b !== null && a.kind === b.kind && a.id === b.id;
}
