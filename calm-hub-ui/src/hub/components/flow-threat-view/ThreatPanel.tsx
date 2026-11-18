import { IoCloseOutline } from 'react-icons/io5';
import type { Arrow, Boundary, ThreatViewModel } from './threat-view-model.js';
import { STATUS_ORDER, STATUS_STYLE } from './threat-status.js';
import type { ThreatSelection } from './threat-selection.js';
import { ThreatRow } from './ThreatRow.js';

interface ThreatPanelProps {
    model: ThreatViewModel;
    selection: ThreatSelection | null;
    pinnedThreatId: string | null;
    onHoverThreat: (threatId: string | null) => void;
    onPinThreat: (threatId: string) => void;
    /** Set on mobile, where the panel is a full-screen overlay with a close button. */
    onClose?: () => void;
}

function Summary({ model }: { model: ThreatViewModel }) {
    return (
        <div>
            <div className="text-sm font-semibold text-base-content">
                {model.summary.total} threat{model.summary.total === 1 ? '' : 's'} in this threat model
            </div>
            <div className="mt-2 flex flex-wrap gap-2" data-testid="threat-summary">
                {STATUS_ORDER.map(status => (
                    <span key={status} className={`${STATUS_STYLE[status].badge} gap-1`}>
                        {model.summary[status]} {STATUS_STYLE[status].label.toLowerCase()}
                    </span>
                ))}
            </div>
            <p className="mt-3 text-sm text-base-content/70">Click an arrow or a trust boundary to see its threats.</p>
        </div>
    );
}

function ArrowHeader({ arrow, model }: { arrow: Arrow; model: ThreatViewModel }) {
    const from = model.lanes[arrow.fromLane]?.name;
    const to = model.lanes[arrow.toLane]?.name;
    return (
        <div>
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-base-content">{from} → {to}</span>
                {arrow.protocol && <span className="badge badge-outline badge-sm">{arrow.protocol}</span>}
                <span className="text-xs text-base-content/60">
                    Step{arrow.steps.length === 1 ? '' : 's'} {arrow.steps.map(s => s.sequenceNumber).join(', ')}
                </span>
            </div>
            {arrow.description && <p className="mt-1 text-xs text-base-content/70">{arrow.description}</p>}
            <p className="mt-1 text-xs text-base-content/60">
                Controls on this connection: {arrow.controls.length === 0 ? 'none' : arrow.controls.map(c => c.name).join(', ')}
            </p>
        </div>
    );
}

function BoundaryHeader({ boundary, model }: { boundary: Boundary; model: ThreatViewModel }) {
    const crossed = boundary.relationshipIds
        .map(id => model.arrows.find(a => a.relationshipId === id))
        .filter((a): a is Arrow => a !== undefined)
        .map(a => `${model.lanes[a.fromLane]?.name} → ${model.lanes[a.toLane]?.name}`);
    return (
        <div>
            <div className="flex items-center gap-2">
                <span className="badge badge-error badge-sm">Trust boundary</span>
                <span className="text-sm font-semibold text-base-content">{boundary.name}</span>
            </div>
            {boundary.description && <p className="mt-1 text-xs text-base-content/70">{boundary.description}</p>}
            <p className="mt-1 text-xs text-base-content/60">Crossed by: {crossed.join(', ')}</p>
        </div>
    );
}

/** The panel under the lanes: a summary, or the threats of the selected arrow or boundary. */
export function ThreatPanel({ model, selection, pinnedThreatId, onHoverThreat, onPinThreat, onClose }: ThreatPanelProps) {
    const arrow = selection?.kind === 'arrow' ? model.arrows.find(a => a.relationshipId === selection.id) : undefined;
    const boundary = selection?.kind === 'boundary' ? model.boundaries.find(b => b.id === selection.id) : undefined;
    const threats = arrow?.threats ?? boundary?.threats ?? [];
    const hasSelection = Boolean(arrow || boundary);

    return (
        <section
            aria-label="Threats"
            data-testid="threat-panel"
            className="relative rounded-2xl border border-primary/30 bg-primary/10 p-4"
        >
            {onClose && (
                <button type="button" aria-label="Close threats" className="btn btn-ghost btn-sm btn-circle absolute right-2 top-2" onClick={onClose}>
                    <IoCloseOutline size={20} />
                </button>
            )}

            {!hasSelection ? (
                <Summary model={model} />
            ) : (
                <div className={onClose ? 'pr-8' : undefined}>
                    {arrow && <ArrowHeader arrow={arrow} model={model} />}
                    {boundary && <BoundaryHeader boundary={boundary} model={model} />}
                    {threats.length === 0 ? (
                        <p className="mt-3 text-sm text-base-content/70">No threats recorded here.</p>
                    ) : (
                        <ul className={`mt-3 space-y-2 ${onClose ? '' : 'max-h-72 overflow-y-auto'}`} aria-label="Threats">
                            {threats.map(threat => (
                                <ThreatRow
                                    key={threat['unique-id']}
                                    threat={threat}
                                    pinned={pinnedThreatId === threat['unique-id']}
                                    onHover={onHoverThreat}
                                    onPin={onPinThreat}
                                />
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </section>
    );
}
