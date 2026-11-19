import { THEME } from '../theme.js';
import { ElementLinks } from './ElementLinks.js';
import { ThreatChip } from './ThreatChip.js';
import { statusLabel, threatChipColours } from './threatColours.js';
import { elementLabel, resolveMitigation, stringList, type MitigationLocation } from '../../../threat-model/threatModel.js';
import type { DecoratorOverlay, Threat, ThreatMitigation } from '../../../contracts/contracts.js';

const GAP = { text: THEME.colors.errorText, accent: THEME.colors.error, fill: `${THEME.colors.error}18` };

function locationText(location: MitigationLocation, architecture: unknown): string {
    switch (location.kind) {
        case 'element': return `on ${elementLabel(architecture, location.id)}`;
        case 'flow': return 'on the flow';
        case 'architecture': return 'on the architecture';
        case 'gap': return '';
    }
}

function MitigationLine({ mitigation, location, architecture }: { mitigation: ThreatMitigation; location: MitigationLocation; architecture: unknown }) {
    const attachedTo = typeof mitigation['attached-to'] === 'string' ? mitigation['attached-to'] : undefined;
    const notAttached = attachedTo !== undefined && !(location.kind === 'element' && location.id === attachedTo);
    return (
        <li data-testid="threat-mitigation" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
            <code style={{ color: THEME.colors.foreground }}>{String(mitigation.control ?? '')}</code>
            <span style={{ color: THEME.colors.muted }}>{String(mitigation.state ?? '')}</span>
            {location.kind === 'gap'
                ? <ThreatChip label="Gap" colours={GAP} testId="mitigation-gap" />
                : <span style={{ color: THEME.colors.muted }}>{locationText(location, architecture)}</span>}
            {notAttached && (
                <span data-testid="mitigation-not-attached" style={{ color: THEME.colors.muted }}>
                    (not on {elementLabel(architecture, attachedTo)})
                </span>
            )}
            {typeof mitigation.note === 'string' && <span style={{ color: THEME.colors.foreground }}>{mitigation.note}</span>}
        </li>
    );
}

interface ThreatRowProps {
    threat: Threat;
    flowId: unknown;
    architecture: unknown;
    overlay?: DecoratorOverlay;
    onElementClick?: (id: string) => void;
}

export function ThreatRow({ threat, flowId, architecture, overlay, onElementClick }: ThreatRowProps) {
    const colours = threatChipColours(overlay, threat.status);
    const classification = Array.isArray(threat.classification) ? threat.classification : [];
    const mitigations = (Array.isArray(threat.mitigations) ? threat.mitigations : []).filter(
        (m): m is ThreatMitigation => !!m && typeof m === 'object' && !Array.isArray(m),
    );
    const rating = [threat.likelihood && `likelihood ${threat.likelihood}`, threat.impact && `impact ${threat.impact}`].filter(Boolean).join(' · ');
    const residual = threat['residual-risk'];
    return (
        <div
            data-testid="threat-row"
            style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '10px 12px', borderBottom: `1px solid ${THEME.colors.border}`, borderLeft: `3px solid ${colours.accent}` }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <ThreatChip label={statusLabel(threat.status)} colours={colours} testId="threat-status" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: THEME.colors.foreground }}>{String(threat.name ?? threat['unique-id'] ?? '')}</span>
                {classification.map((c, i) => (
                    <span key={i} style={{ fontSize: '11px', color: THEME.colors.muted, border: `1px solid ${THEME.colors.border}`, borderRadius: '4px', padding: '0 4px' }}>
                        {`${String(c?.scheme ?? '')}: ${String(c?.value ?? '')}`}
                    </span>
                ))}
                {rating && <span style={{ fontSize: '12px', color: THEME.colors.muted, marginLeft: 'auto' }}>{rating}</span>}
            </div>
            {typeof threat.description === 'string' && <div style={{ fontSize: '13px', color: THEME.colors.foreground }}>{threat.description}</div>}
            <div style={{ fontSize: '12px', color: THEME.colors.muted, display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                Applies to: <ElementLinks ids={stringList(threat['applies-to'])} architecture={architecture} onElementClick={onElementClick} />
            </div>
            {mitigations.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {mitigations.map((m, i) => (
                        <MitigationLine key={i} mitigation={m} location={resolveMitigation(architecture, flowId, threat, m)} architecture={architecture} />
                    ))}
                </ul>
            )}
            {typeof threat.justification === 'string' && <div style={{ fontSize: '12px', color: THEME.colors.muted }}>Justification: {threat.justification}</div>}
            {residual && typeof residual === 'object' && (
                <div style={{ fontSize: '12px', color: THEME.colors.muted }}>
                    Residual risk {String(residual.rating ?? '')}
                    {residual['accepted-by'] && `, accepted by ${residual['accepted-by']}`}
                    {residual['review-by'] && `, review by ${residual['review-by']}`}
                </div>
            )}
        </div>
    );
}
