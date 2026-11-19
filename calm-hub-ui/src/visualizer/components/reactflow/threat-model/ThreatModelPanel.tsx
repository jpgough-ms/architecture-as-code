import { THEME } from '../theme.js';
import { ThreatModelSection } from './ThreatModelSection.js';
import { splitAssessments } from '../../../threat-model/threatModel.js';
import type { DecoratorOverlay, ThreatModelDecorator } from '../../../contracts/contracts.js';

interface ThreatModelPanelProps {
    models: ThreatModelDecorator[];
    /** The architecture version, to name elements and find the controls of each mitigation. */
    architecture: unknown;
    /** The built-in threat-model view's overlay, so the chips match the badges and only its newest models count. */
    overlay?: DecoratorOverlay;
    onElementClick?: (id: string) => void;
}

/** The newest assessment of each flow, then the earlier ones, collapsed, so a superseded threat never looks current. */
export function ThreatModelPanel({ models, architecture, overlay, onElementClick }: ThreatModelPanelProps) {
    const { current, earlier } = splitAssessments(models, overlay);
    return (
        <div style={{ height: '100%', overflow: 'auto', border: `1px solid ${THEME.colors.border}`, borderRadius: '8px', background: THEME.colors.card }}>
            {current.map((model, i) => (
                <ThreatModelSection key={`${model.uniqueId ?? ''}-${i}`} model={model} architecture={architecture} overlay={overlay} onElementClick={onElementClick} />
            ))}
            {earlier.length > 0 && (
                <details data-testid="earlier-assessments">
                    <summary style={{ cursor: 'pointer', padding: '10px 12px', fontSize: '12px', fontWeight: 600, color: THEME.colors.muted, borderTop: `1px solid ${THEME.colors.border}` }}>
                        Earlier assessments ({earlier.length})
                    </summary>
                    {earlier.map((model, i) => (
                        <ThreatModelSection key={`${model.uniqueId ?? ''}-${i}`} model={model} architecture={architecture} overlay={overlay} onElementClick={onElementClick} superseded />
                    ))}
                </details>
            )}
        </div>
    );
}
