import { controlHighlightKey, type Lane } from './threat-view-model.js';
import { LANE_HEIGHT, LANE_PAD_TOP, LANE_WIDTH, NODE_CARD_HEIGHT, NODE_INSET, TOP_MARGIN, laneLeft } from './threat-layout.js';

interface ThreatLaneProps {
    lane: Lane;
    index: number;
    /** Keys of the form `nodeId::controlKey` to light up. */
    highlighted: ReadonlySet<string>;
}

/** One node and the controls it declares. */
export function ThreatLane({ lane, index, highlighted }: ThreatLaneProps) {
    return (
        <div
            data-testid={`lane-${lane.nodeId}`}
            className="absolute rounded-3xl border-2 border-base-content/60 bg-base-100"
            style={{ left: laneLeft(index), top: TOP_MARGIN, width: LANE_WIDTH, height: LANE_HEIGHT }}
        >
            <div
                className="absolute flex flex-col items-center justify-center rounded-2xl border border-primary bg-primary/15 px-2 text-center"
                style={{ left: NODE_INSET, right: NODE_INSET, top: LANE_PAD_TOP, height: NODE_CARD_HEIGHT }}
            >
                <span className="text-sm font-semibold text-base-content">{lane.name}</span>
                {lane.nodeType && <span className="text-xs text-base-content/60">{lane.nodeType}</span>}
            </div>

            <div className="absolute inset-x-4 overflow-y-auto" style={{ top: LANE_PAD_TOP + NODE_CARD_HEIGHT + 20, bottom: 12 }}>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-base-content/60">Controls</div>
                {lane.controls.length === 0 ? (
                    <div className="text-xs text-base-content/40">None declared</div>
                ) : (
                    <ul className="space-y-1">
                        {lane.controls.map(control => {
                            const lit = highlighted.has(controlHighlightKey(lane.nodeId, control.key));
                            return (
                                <li
                                    key={control.key}
                                    data-testid={`control-${lane.nodeId}-${control.key}`}
                                    data-highlighted={lit || undefined}
                                    className={`rounded-md px-2 py-1 text-xs transition-colors ${
                                        lit ? 'bg-success/25 ring-2 ring-success text-base-content' : 'bg-base-200 text-base-content/80'
                                    }`}
                                >
                                    {control.name}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
