/**
 * Fixed geometry for the lane view. Lanes sit at fixed x positions, so the SVG layer that draws
 * arrows and trust boundaries can be placed from a lane index, without measuring the DOM.
 */
export const LANE_WIDTH = 200;
export const LANE_GAP = 110;
export const ROW_PAD_X = 32;
/** Room above the lanes for the trust boundary labels. */
export const TOP_MARGIN = 56;
export const LANE_HEIGHT = 300;
export const ROW_PAD_BOTTOM = 24;
export const LANE_PAD_TOP = 24;
export const NODE_CARD_HEIGHT = 88;
/** How far the node card is inset from the lane edge. Arrows start and end at the node card. */
export const NODE_INSET = 30;
/** Vertical distance between arrows that join the same two lanes. */
export const ARROW_SPACING = 64;
/** How far a trust boundary arc bulges to the right. */
export const BOUNDARY_BULGE = 26;
/**
 * How far before the next lane a trust boundary arc starts. This keeps the arc clear of the
 * step numbers and threat chips, which sit in the middle of the gap.
 */
export const BOUNDARY_INSET = 30;
/** The diagram shrinks to fit its frame, but not below this. Narrower frames scroll. */
export const MIN_FIT_SCALE = 0.7;

export const NODE_CENTER_Y = TOP_MARGIN + LANE_PAD_TOP + NODE_CARD_HEIGHT / 2;

export const laneLeft = (index: number): number => ROW_PAD_X + index * (LANE_WIDTH + LANE_GAP);
export const laneRight = (index: number): number => laneLeft(index) + LANE_WIDTH;
export const rowWidth = (laneCount: number): number =>
    ROW_PAD_X * 2 + Math.max(laneCount, 1) * LANE_WIDTH + Math.max(laneCount - 1, 0) * LANE_GAP;
export const rowHeight = (maxArrowOffset: number): number =>
    Math.max(TOP_MARGIN + LANE_HEIGHT + ROW_PAD_BOTTOM, NODE_CENTER_Y + (maxArrowOffset + 1) * ARROW_SPACING + 40);

/** Where an arrow starts and ends: the node card edges of its two lanes. */
export function arrowEnds(fromLane: number, toLane: number): { x1: number; x2: number } {
    return fromLane <= toLane
        ? { x1: laneRight(fromLane) - NODE_INSET, x2: laneLeft(toLane) + NODE_INSET }
        : { x1: laneLeft(fromLane) + NODE_INSET, x2: laneRight(toLane) - NODE_INSET };
}

/** Where a trust boundary arc starts, in the gap to the right of a lane and next to the following lane. */
export const boundaryX = (leftLane: number): number => laneRight(leftLane) + LANE_GAP - BOUNDARY_INSET;

/** The scale at which content of the given width fits a frame of the given width. */
export const fitScale = (frameWidth: number, contentWidth: number): number =>
    frameWidth <= 0 ? 1 : Math.min(1, Math.max(MIN_FIT_SCALE, frameWidth / contentWidth));
