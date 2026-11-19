import { THEME } from '../theme.js';
import { ElementLinks } from './ElementLinks.js';
import { ThreatRow } from './ThreatRow.js';
import { ThreatChip } from './ThreatChip.js';
import { statusLabel, threatChipColours } from './threatColours.js';
import { flowLabel, stringList, threatCounts, threatsOf } from '../../../threat-model/threatModel.js';
import type { DecoratorOverlay, ThreatModelDecorator, TrustBoundary } from '../../../contracts/contracts.js';

interface ThreatModelSectionProps {
    model: ThreatModelDecorator;
    architecture: unknown;
    overlay?: DecoratorOverlay;
    onElementClick?: (id: string) => void;
    /** An earlier assessment of a flow that a newer one replaces: dimmed and marked. */
    superseded?: boolean;
}

const SUPERSEDED = { text: THEME.colors.muted, accent: THEME.colors.border, fill: THEME.colors.backgroundSecondary };

const heading = { fontSize: '11px', fontWeight: 600, color: THEME.colors.muted, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 12px 4px' } as const;

/** One threat model: its flow, method and date, its trust boundaries, then its threats. */
export function ThreatModelSection({ model, architecture, overlay, onElementClick, superseded }: ThreatModelSectionProps) {
    const data = (model.data ?? {}) as Partial<ThreatModelDecorator['data']>;
    const threats = threatsOf(data);
    const boundaries = (Array.isArray(data['trust-boundaries']) ? data['trust-boundaries'] : []) as TrustBoundary[];
    const meta = [data.methodology, data['assessed-on'] && `assessed ${data['assessed-on']}`, data.assessor && `by ${data.assessor}`]
        .filter((part): part is string => typeof part === 'string' && !!part)
        .join(' · ');
    return (
        <section
            data-testid="threat-model-section"
            aria-label={`${superseded ? 'Superseded threat model' : 'Threat model'} of ${flowLabel(architecture, data.flow)}`}
            style={superseded ? { opacity: 0.65 } : undefined}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', padding: '10px 12px', background: THEME.colors.backgroundSecondary, borderBottom: `1px solid ${THEME.colors.border}` }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: THEME.colors.foreground }}>{flowLabel(architecture, data.flow)}</span>
                {superseded && <ThreatChip label="Superseded" colours={SUPERSEDED} testId="superseded" />}
                <span style={{ fontSize: '12px', color: THEME.colors.muted }}>{meta}</span>
                <span style={{ display: 'inline-flex', gap: '4px', marginLeft: 'auto', flexWrap: 'wrap' }}>
                    {threatCounts(threats).map(([status, count]) => (
                        <ThreatChip key={status} label={`${count} ${statusLabel(status).toLowerCase()}`} colours={threatChipColours(overlay, status)} />
                    ))}
                </span>
            </div>
            {boundaries.length > 0 && (
                <>
                    <div style={heading}>Trust boundaries ({boundaries.length})</div>
                    <ul style={{ listStyle: 'none', margin: 0, padding: '0 12px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {boundaries.map((boundary, i) => (
                            <li key={`${boundary?.['unique-id'] ?? ''}-${i}`} data-testid="trust-boundary" style={{ fontSize: '12px', color: THEME.colors.muted, display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600, color: THEME.colors.foreground }}>{String(boundary?.name ?? boundary?.['unique-id'] ?? '')}</span>
                                <ElementLinks ids={stringList(boundary?.elements)} architecture={architecture} onElementClick={onElementClick} />
                                {typeof boundary?.description === 'string' && <span>{boundary.description}</span>}
                            </li>
                        ))}
                    </ul>
                </>
            )}
            <div style={heading}>Threats ({threats.length})</div>
            {threats.length === 0
                ? <div style={{ padding: '4px 12px 10px', fontSize: '12px', color: THEME.colors.muted }}>The flow was assessed and no threat was found.</div>
                : threats.map((threat, i) => (
                    <ThreatRow key={`${threat['unique-id'] ?? ''}-${i}`} threat={threat} flowId={data.flow} architecture={architecture} overlay={overlay} onElementClick={onElementClick} />
                ))}
        </section>
    );
}
