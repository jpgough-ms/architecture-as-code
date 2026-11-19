import type { ChipColours } from './threatColours.js';

export function ThreatChip({ label, colours, testId }: { label: string; colours: ChipColours; testId?: string }) {
    return (
        <span
            data-testid={testId}
            style={{
                fontSize: '12px',
                fontWeight: 600,
                padding: '1px 8px',
                borderRadius: '9999px',
                color: colours.text,
                backgroundColor: colours.fill,
                border: `1px solid ${colours.accent}`,
                whiteSpace: 'nowrap',
            }}
        >
            {label}
        </span>
    );
}
