import { useEffect, useMemo, useState } from 'react';
import type { Architecture } from '@finos/calm-models/model';
import type { CalmCoreSchema, CalmFlowSchema } from '@finos/calm-models/types';
import type { ThreatModelDecorator } from '../../../visualizer/contracts/decorator-contracts.js';
import { useIsMobile } from '../../../hooks/useMediaQuery.js';
import { FlowHeader } from '../flow-sequence-diagram/FlowHeader.js';
import { LaneConnectors } from './LaneConnectors.js';
import { ThreatLane } from './ThreatLane.js';
import { ThreatPanel } from './ThreatPanel.js';
import { buildThreatViewModel, controlHighlightKey } from './threat-view-model.js';
import { isSameSelection, type ThreatSelection } from './threat-selection.js';
import { fitScale, rowHeight, rowWidth } from './threat-layout.js';

interface FlowThreatViewProps {
    flowJson: Partial<CalmFlowSchema>;
    architectureJson: CalmCoreSchema | null;
    architecture: Architecture | null;
    threatModel: ThreatModelDecorator | null;
}

function Message({ children }: { children: string }) {
    return <div className="flex h-full items-center justify-center p-6 text-center text-base-content/50">{children}</div>;
}

/**
 * The Threats tab of a flow: one lane per node with its controls, the flow's arrows between
 * the lanes, trust boundaries drawn across the relationships that cross them, and a panel that
 * shows the threats of whatever is clicked.
 */
export function FlowThreatView({ flowJson, architectureJson, architecture, threatModel }: FlowThreatViewProps) {
    const isMobile = useIsMobile();
    const [selection, setSelection] = useState<ThreatSelection | null>(null);
    const [hoveredThreatId, setHoveredThreatId] = useState<string | null>(null);
    const [pinnedThreatId, setPinnedThreatId] = useState<string | null>(null);
    const [frame, setFrame] = useState<HTMLDivElement | null>(null);
    const [frameWidth, setFrameWidth] = useState(0);

    // Desktop shrinks the lanes to fit the frame. Mobile keeps full size and scrolls.
    useEffect(() => {
        if (!frame) return;
        const measure = () => setFrameWidth(frame.clientWidth);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(frame);
        return () => observer.disconnect();
    }, [frame]);

    const model = useMemo(
        () => (threatModel && architecture && architectureJson
            ? buildThreatViewModel({ decorator: threatModel, flowJson, architecture, architectureJson })
            : null),
        [threatModel, architecture, architectureJson, flowJson],
    );

    const highlighted = useMemo(() => {
        const keys = new Set<string>();
        const threatId = hoveredThreatId ?? pinnedThreatId;
        const threat = model?.threats.find(t => t['unique-id'] === threatId);
        for (const mitigation of threat?.mitigations ?? []) {
            if (mitigation.resolution.kind === 'node') {
                keys.add(controlHighlightKey(mitigation.resolution.nodeId, mitigation.control));
            }
        }
        return keys;
    }, [model, hoveredThreatId, pinnedThreatId]);

    if (!threatModel) {
        return <Message>No threat model applies to this flow. Add a decorator of type threat-model that applies to the flow.</Message>;
    }
    if (!model) {
        return <Message>The architecture for this flow could not be loaded.</Message>;
    }
    if (model.lanes.length === 0) {
        return <Message>None of the relationships in this flow are in the architecture.</Message>;
    }

    const select = (next: ThreatSelection) => {
        setPinnedThreatId(null);
        setHoveredThreatId(null);
        setSelection(current => (isSameSelection(current, next) ? null : next));
    };
    const close = () => {
        setSelection(null);
        setPinnedThreatId(null);
        setHoveredThreatId(null);
    };
    const pinThreat = (threatId: string) => setPinnedThreatId(current => (current === threatId ? null : threatId));

    const width = rowWidth(model.lanes.length);
    const height = rowHeight(Math.max(0, ...model.arrows.map(a => a.offset)));
    const scale = isMobile ? 1 : fitScale(frameWidth, width);
    const panel = (
        <ThreatPanel
            model={model}
            selection={selection}
            pinnedThreatId={pinnedThreatId}
            onHoverThreat={setHoveredThreatId}
            onPinThreat={pinThreat}
            onClose={isMobile && selection ? close : undefined}
        />
    );

    return (
        <div className="flex h-full w-full flex-col overflow-auto bg-base-200" data-testid="flow-threat-view">
            <FlowHeader description={flowJson.description} />
            <div className="space-y-4 px-6 pb-6 pt-2">
                <div ref={setFrame} className="overflow-x-auto rounded-xl border border-base-300 bg-base-100 shadow-sm">
                    <div style={{ width: width * scale, height: height * scale }}>
                        <div className="relative" style={{ width, height, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                            {model.lanes.map((lane, index) => (
                                <ThreatLane key={lane.nodeId} lane={lane} index={index} highlighted={highlighted} />
                            ))}
                            <LaneConnectors model={model} selection={selection} onSelect={select} width={width} height={height} />
                        </div>
                    </div>
                </div>

                {isMobile && selection ? (
                    <div
                        className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-base-100 p-4 animate-slide-in-right"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Threats"
                        data-testid="threat-overlay"
                    >
                        {panel}
                    </div>
                ) : (
                    panel
                )}
            </div>
        </div>
    );
}
