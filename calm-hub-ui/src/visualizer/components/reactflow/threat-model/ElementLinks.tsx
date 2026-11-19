import { THEME } from '../theme.js';
import { elementLabel } from '../../../threat-model/threatModel.js';

/** The nodes and relationships a threat or boundary names. A click selects the element on the diagram. */
export function ElementLinks({ ids, architecture, onElementClick }: { ids: string[]; architecture: unknown; onElementClick?: (id: string) => void }) {
    return (
        <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '4px' }}>
            {ids.map((id, i) => (
                <button
                    key={`${id}-${i}`}
                    type="button"
                    title={id}
                    onClick={() => onElementClick?.(id)}
                    style={{
                        fontSize: '12px',
                        padding: '0 6px',
                        borderRadius: '4px',
                        border: `1px solid ${THEME.colors.border}`,
                        background: THEME.colors.backgroundSecondary,
                        color: THEME.colors.foreground,
                        cursor: onElementClick ? 'pointer' : 'default',
                    }}
                >
                    {elementLabel(architecture, id)}
                </button>
            ))}
        </span>
    );
}
