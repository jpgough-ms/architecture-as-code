import { describe, expect, it } from 'vitest';
import {
    LANE_GAP,
    LANE_WIDTH,
    MIN_FIT_SCALE,
    NODE_INSET,
    arrowEnds,
    boundaryX,
    fitScale,
    laneLeft,
    laneRight,
    rowWidth,
} from './threat-layout.js';

describe('threat layout', () => {
    it('places lanes one lane width and one gap apart', () => {
        expect(laneLeft(1) - laneLeft(0)).toBe(LANE_WIDTH + LANE_GAP);
        expect(laneRight(0)).toBe(laneLeft(0) + LANE_WIDTH);
    });

    it('sizes the row for the lanes and the padding either side', () => {
        expect(rowWidth(4)).toBe(laneRight(3) + laneLeft(0));
        expect(rowWidth(0)).toBe(rowWidth(1));
    });

    it('starts and ends an arrow at the node cards, whichever way it points', () => {
        expect(arrowEnds(0, 1)).toEqual({ x1: laneRight(0) - NODE_INSET, x2: laneLeft(1) + NODE_INSET });
        expect(arrowEnds(1, 0)).toEqual({ x1: laneLeft(1) + NODE_INSET, x2: laneRight(0) - NODE_INSET });
    });

    it('starts a trust boundary arc between the lanes and before the next lane', () => {
        const x = boundaryX(1);
        expect(x).toBeGreaterThan(laneRight(1));
        expect(x).toBeLessThan(laneLeft(2));
    });

    describe('fitScale', () => {
        it('keeps full size when the content fits', () => {
            expect(fitScale(1500, 1200)).toBe(1);
        });

        it('shrinks content that is wider than its frame', () => {
            expect(fitScale(900, 1200)).toBe(0.75);
        });

        it('does not shrink below the minimum, so narrow frames scroll', () => {
            expect(fitScale(200, 1200)).toBe(MIN_FIT_SCALE);
        });

        it('keeps full size until the frame has been measured', () => {
            expect(fitScale(0, 1200)).toBe(1);
        });
    });
});
