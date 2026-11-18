import type { KeyboardEvent } from 'react';
import { describeResolution, type ResolvedThreat } from './threat-view-model.js';
import { STATUS_STYLE } from './threat-status.js';

interface ThreatRowProps {
    threat: ResolvedThreat;
    pinned: boolean;
    onHover: (threatId: string | null) => void;
    onPin: (threatId: string) => void;
}

/** One threat with its mitigations. Hover or click lights up the controls it relies on. */
export function ThreatRow({ threat, pinned, onHover, onPin }: ThreatRowProps) {
    const id = threat['unique-id'];
    const status = STATUS_STYLE[threat.status];
    const category = threat.classification?.[0]?.value;
    const pin = () => onPin(id);
    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            pin();
        }
    };

    return (
        <li
            data-testid={`threat-${id}`}
            tabIndex={0}
            aria-pressed={pinned}
            className={`cursor-pointer rounded-xl border bg-base-100 p-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary ${
                pinned ? 'border-success ring-2 ring-success' : 'border-base-300'
            }`}
            onMouseEnter={() => onHover(id)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(id)}
            onBlur={() => onHover(null)}
            onClick={pin}
            onKeyDown={onKeyDown}
        >
            <div className="flex flex-wrap items-center gap-2">
                {category && <span className="badge badge-outline badge-sm">{category}</span>}
                <span className="font-semibold text-base-content">{threat.name}</span>
                <span className={`${status.badge} badge-sm ml-auto`}>{status.label}</span>
            </div>

            {threat.description && <p className="mt-1 text-xs text-base-content/70">{threat.description}</p>}

            {(threat.likelihood || threat.impact) && (
                <p className="mt-1 text-xs text-base-content/60">
                    {threat.likelihood && <>Likelihood: {threat.likelihood}</>}
                    {threat.likelihood && threat.impact && ' · '}
                    {threat.impact && <>Impact: {threat.impact}</>}
                </p>
            )}

            <ul className="mt-2 space-y-1" aria-label={`Mitigations for ${threat.name}`}>
                {threat.mitigations.length === 0 && (
                    <li className="text-xs font-medium text-error">No mitigation recorded</li>
                )}
                {threat.mitigations.map(m => (
                    <li key={m.control} className="text-xs" data-testid={`mitigation-${id}-${m.control}`}>
                        <span className="font-mono font-semibold">{m.control}</span>
                        <span className="text-base-content/60"> · {m.state} · </span>
                        <span className={m.resolution.kind === 'missing' ? 'font-semibold text-error' : 'text-success'}>
                            {describeResolution(m.resolution)}
                        </span>
                        {m.note && <span className="block text-base-content/60">{m.note}</span>}
                    </li>
                ))}
            </ul>

            {threat['residual-risk'] && (
                <div className="mt-2 rounded-md bg-info/10 p-2 text-xs" data-testid={`residual-${id}`}>
                    <span className="font-semibold">Residual risk: {threat['residual-risk'].rating}</span>
                    {threat['residual-risk'].justification && <span> · {threat['residual-risk'].justification}</span>}
                    {threat['residual-risk']['accepted-by'] && (
                        <span className="block text-base-content/60">
                            Accepted by {threat['residual-risk']['accepted-by']}
                            {threat['residual-risk']['review-by'] && `, review by ${threat['residual-risk']['review-by']}`}
                        </span>
                    )}
                </div>
            )}
        </li>
    );
}
