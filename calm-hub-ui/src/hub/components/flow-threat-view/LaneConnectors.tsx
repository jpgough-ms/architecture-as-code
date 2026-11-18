import type { KeyboardEvent } from 'react';
import type { Arrow, Boundary, Lane, ThreatViewModel } from './threat-view-model.js';
import { classificationInitial } from './threat-view-model.js';
import { STATUS_STYLE } from './threat-status.js';
import { isSameSelection, type ThreatSelection } from './threat-selection.js';
import { ARROW_SPACING, BOUNDARY_BULGE, LANE_HEIGHT, NODE_CENTER_Y, TOP_MARGIN, arrowEnds, boundaryX } from './threat-layout.js';

interface LaneConnectorsProps {
    model: ThreatViewModel;
    selection: ThreatSelection | null;
    onSelect: (selection: ThreatSelection) => void;
    width: number;
    height: number;
}

const CHIP_RADIUS = 9;
const CHIP_SPACING = 21;
const BOUNDARY_OVERSHOOT = 14;
const RAISED_ARROW_LIFT = 90;

function activateOnKey(activate: () => void) {
    return (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            activate();
        }
    };
}

function Markers() {
    return (
        <defs>
            <marker id="threat-arrow-end" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0,10 3.5,0 7" className="fill-primary" />
            </marker>
            <marker id="threat-arrow-start" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto-start-reverse">
                <polygon points="0 0,10 3.5,0 7" className="fill-primary" />
            </marker>
            <marker id="threat-arrow-end-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0,10 3.5,0 7" className="fill-info" />
            </marker>
            <marker id="threat-arrow-start-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto-start-reverse">
                <polygon points="0 0,10 3.5,0 7" className="fill-info" />
            </marker>
        </defs>
    );
}

interface ArrowShapeProps {
    arrow: Arrow;
    lanes: Lane[];
    selected: boolean;
    onSelect: () => void;
}

function ArrowShape({ arrow, lanes, selected, onSelect }: ArrowShapeProps) {
    const { x1, x2 } = arrowEnds(arrow.fromLane, arrow.toLane);
    const y = NODE_CENTER_Y + arrow.offset * ARROW_SPACING;
    const raised = Math.abs(arrow.toLane - arrow.fromLane) > 1;
    const mx = (x1 + x2) / 2;
    const path = raised ? `M ${x1} ${y} Q ${mx} ${y - RAISED_ARROW_LIFT} ${x2} ${y}` : `M ${x1} ${y} L ${x2} ${y}`;
    // The label of a raised arrow sits on its peak, which is half the lift above the line.
    const labelY = raised ? y - RAISED_ARROW_LIFT / 2 - 8 : y - 12;
    const hasForward = arrow.steps.some(s => !s.isReturn);
    const hasReturn = arrow.steps.some(s => s.isReturn);
    const suffix = selected ? '-active' : '';
    const from = lanes[arrow.fromLane]?.name ?? arrow.fromLane;
    const to = lanes[arrow.toLane]?.name ?? arrow.toLane;
    const label = `${from} to ${to}, ${arrow.threats.length} threat${arrow.threats.length === 1 ? '' : 's'}`;
    const chipsStart = mx - ((arrow.threats.length - 1) * CHIP_SPACING) / 2;

    return (
        <g
            role="button"
            tabIndex={0}
            aria-label={label}
            aria-pressed={selected}
            data-testid={`arrow-${arrow.relationshipId}`}
            className="pointer-events-auto cursor-pointer outline-none focus-visible:opacity-80"
            onClick={onSelect}
            onKeyDown={activateOnKey(onSelect)}
        >
            <path d={path} fill="none" stroke="transparent" strokeWidth={24} />
            <path
                d={path}
                fill="none"
                className={selected ? 'stroke-info' : 'stroke-primary'}
                strokeWidth={selected ? 3.5 : 2}
                markerEnd={hasForward ? `url(#threat-arrow-end${suffix})` : undefined}
                markerStart={hasReturn ? `url(#threat-arrow-start${suffix})` : undefined}
            />
            <text x={mx} y={labelY} textAnchor="middle" fontSize={12} fontWeight={700} className={selected ? 'fill-info' : 'fill-base-content'}>
                {arrow.steps.map(s => s.sequenceNumber).join(', ')}
            </text>
            {arrow.threats.map((threat, i) => {
                const style = STATUS_STYLE[threat.status];
                const cx = chipsStart + i * CHIP_SPACING;
                return (
                    <g key={threat['unique-id']} data-testid={`chip-${threat['unique-id']}`}>
                        <title>{`${threat.name} (${style.label})`}</title>
                        <circle cx={cx} cy={y + 20} r={CHIP_RADIUS} className={style.fill} />
                        <text x={cx} y={y + 24} textAnchor="middle" fontSize={11} fontWeight={700} className={style.text}>
                            {classificationInitial(threat)}
                        </text>
                    </g>
                );
            })}
            {arrow.protocol && (
                <text x={mx} y={y + 46} textAnchor="middle" fontSize={11} className="fill-base-content/60">
                    {arrow.protocol}
                </text>
            )}
        </g>
    );
}

interface BoundaryShapeProps {
    boundary: Boundary;
    selected: boolean;
    onSelect: () => void;
}

function BoundaryShape({ boundary, selected, onSelect }: BoundaryShapeProps) {
    const x = boundaryX(boundary.leftLane);
    const top = TOP_MARGIN - BOUNDARY_OVERSHOOT;
    const bottom = TOP_MARGIN + LANE_HEIGHT + BOUNDARY_OVERSHOOT;
    const path = `M ${x} ${top} Q ${x + BOUNDARY_BULGE * 2} ${(top + bottom) / 2} ${x} ${bottom}`;
    const nonAdjacent = boundary.rightLane - boundary.leftLane > 1;
    const labelWidth = Math.max(84, boundary.name.length * 6.6 + 22);
    const label = `Trust boundary ${boundary.name}, ${boundary.threats.length} threat${boundary.threats.length === 1 ? '' : 's'}`;

    return (
        <g
            role="button"
            tabIndex={0}
            aria-label={label}
            aria-pressed={selected}
            data-testid={`boundary-${boundary.id}`}
            className="pointer-events-auto cursor-pointer outline-none focus-visible:opacity-80"
            onClick={onSelect}
            onKeyDown={activateOnKey(onSelect)}
        >
            <path d={path} fill="none" stroke="transparent" strokeWidth={28} />
            <path
                d={path}
                fill="none"
                className="stroke-error"
                strokeWidth={selected ? 5 : 3}
                strokeLinecap="round"
                strokeDasharray={nonAdjacent ? '4 6' : undefined}
            />
            <rect
                x={x + BOUNDARY_BULGE / 2 - labelWidth / 2}
                y={6}
                width={labelWidth}
                height={24}
                rx={12}
                className={selected ? 'fill-error stroke-error' : 'fill-base-100 stroke-error'}
                strokeWidth={1.5}
            />
            <text
                x={x + BOUNDARY_BULGE / 2}
                y={22}
                textAnchor="middle"
                fontSize={12}
                fontWeight={600}
                className={selected ? 'fill-error-content' : 'fill-error'}
            >
                {boundary.name}
            </text>
        </g>
    );
}

/** The arrows, STRIDE chips and trust boundary arcs, drawn over the lanes. */
export function LaneConnectors({ model, selection, onSelect, width, height }: LaneConnectorsProps) {
    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="pointer-events-none absolute left-0 top-0"
            role="group"
            aria-label="Flow arrows and trust boundaries"
        >
            <Markers />
            {model.boundaries.map(boundary => (
                <BoundaryShape
                    key={boundary.id}
                    boundary={boundary}
                    selected={isSameSelection(selection, { kind: 'boundary', id: boundary.id })}
                    onSelect={() => onSelect({ kind: 'boundary', id: boundary.id })}
                />
            ))}
            {model.arrows.map(arrow => (
                <ArrowShape
                    key={arrow.relationshipId}
                    arrow={arrow}
                    lanes={model.lanes}
                    selected={isSameSelection(selection, { kind: 'arrow', id: arrow.relationshipId })}
                    onSelect={() => onSelect({ kind: 'arrow', id: arrow.relationshipId })}
                />
            ))}
        </svg>
    );
}
