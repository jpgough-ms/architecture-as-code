import { THEME } from '../theme.js';
import { OVERLAY_STYLES } from '../overlay/overlayStyle.js';
import { mapStatus, statusText } from '../../../overlay/overlayEngine.js';
import type { DecoratorOverlay } from '../../../contracts/contracts.js';

export interface ChipColours {
    text: string;
    accent: string;
    fill: string;
}

const NEUTRAL: ChipColours = { text: THEME.colors.muted, accent: THEME.colors.border, fill: THEME.colors.backgroundSecondary };

/** The colours the threat-model view gives a status, so a chip matches the badges. A hidden or unknown status is neutral. */
export function threatChipColours(overlay: DecoratorOverlay | undefined, value: unknown): ChipColours {
    const status = overlay ? mapStatus(overlay, value)?.status : undefined;
    if (!status) return NEUTRAL;
    const { text, accent } = OVERLAY_STYLES[status];
    return { text, accent, fill: `${accent}18` };
}

export const statusLabel = (value: unknown) => (typeof value === 'string' && value ? statusText(value) : '(no status)');
