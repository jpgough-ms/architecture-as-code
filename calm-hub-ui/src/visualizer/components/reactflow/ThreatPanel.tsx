import { useState, useMemo, useEffect } from 'react';
import { THEME } from './theme.js';
import type { ThreatPanelProps } from '../../contracts/contracts.js';
import {
    ThreatSummarySection,
    ThreatFilterBar,
    ThreatDetail,
    STRIDE_LABELS,
    MITIGATION_STYLES,
    type ThreatFilters,
} from './threat-panel/index.js';

export function ThreatPanel({ decorators, selectedThreatId }: ThreatPanelProps) {
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [filters, setFilters] = useState<ThreatFilters>({ strideCategory: '', mitigationStatus: '', trustBoundary: '' });

    // Use the first (most recent) threat model decorator
    const decorator = decorators[0];

    const threats = decorator?.data.threats ?? [];
    const recommendations = decorator?.data.recommendations;
    const trustBoundaries = decorator?.data['trust-boundaries'] ?? [];

    const trustBoundaryOptions = useMemo(() => {
        const ids = new Set<string>();
        threats.forEach((t) => {
            if (t['trust-boundary']) ids.add(t['trust-boundary']);
        });
        return Array.from(ids);
    }, [threats]);

    const filtered = useMemo(() => {
        return threats.filter((t) => {
            if (filters.strideCategory && t['stride-category'] !== filters.strideCategory) return false;
            if (filters.mitigationStatus && t['mitigation-status'] !== filters.mitigationStatus) return false;
            if (filters.trustBoundary && t['trust-boundary'] !== filters.trustBoundary) return false;
            return true;
        });
    }, [threats, filters]);

    // Sync selection when a threat is selected from the diagram
    useEffect(() => {
        if (!selectedThreatId) return;
        // Clear filters so the threat is visible, then select it
        const idx = threats.findIndex((t) => t.id === selectedThreatId);
        if (idx >= 0) {
            setFilters({ strideCategory: '', mitigationStatus: '', trustBoundary: '' });
            setSelectedIndex(idx);
        }
    }, [selectedThreatId, threats]);

    const handleFiltersChange = (f: ThreatFilters) => {
        setFilters(f);
        setSelectedIndex(0);
    };

    if (!decorator || threats.length === 0) {
        return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.colors.muted, fontSize: '13px', fontStyle: 'italic' }}>
                No threat model found for this architecture.
            </div>
        );
    }

    const selected = filtered[selectedIndex] ?? filtered[0];

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                border: `1px solid ${THEME.colors.border}`,
                borderRadius: '8px',
                overflow: 'hidden',
                background: THEME.colors.backgroundSecondary,
            }}
        >
            <ThreatSummarySection decorator={decorator} />
            <ThreatFilterBar
                filters={filters}
                onChange={handleFiltersChange}
                trustBoundaryOptions={trustBoundaryOptions}
            />

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Threat list */}
                <div
                    style={{
                        width: '260px',
                        flexShrink: 0,
                        borderRight: `1px solid ${THEME.colors.border}`,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            padding: '10px 12px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: THEME.colors.muted,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            borderBottom: `1px solid ${THEME.colors.border}`,
                            background: THEME.colors.card,
                        }}
                    >
                        Threats ({filtered.length}{filtered.length !== threats.length ? ` of ${threats.length}` : ''})
                    </div>
                    <div style={{ flex: 1, overflow: 'auto' }}>
                        {filtered.length === 0 ? (
                            <div style={{ padding: '16px 12px', fontSize: '12px', color: THEME.colors.muted, fontStyle: 'italic' }}>
                                No threats match the current filters.
                            </div>
                        ) : (
                            filtered.map((threat, index) => {
                                const isSelected = index === selectedIndex;
                                const mitigationStyle = MITIGATION_STYLES[threat['mitigation-status']];
                                const strideInfo = STRIDE_LABELS[threat['stride-category']];

                                return (
                                    <button
                                        key={threat.id}
                                        onClick={() => setSelectedIndex(index)}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '4px',
                                            width: '100%',
                                            padding: '10px 12px',
                                            borderTop: 'none',
                                            borderRight: 'none',
                                            borderBottom: `1px solid ${THEME.colors.border}`,
                                            borderLeft: isSelected ? `3px solid ${THEME.colors.accent}` : '3px solid transparent',
                                            background: isSelected ? `${THEME.colors.accent}18` : 'transparent',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: mitigationStyle.dot, flexShrink: 0 }} />
                                            <span style={{ fontSize: '12px' }}>{strideInfo.emoji}</span>
                                            <span
                                                style={{
                                                    fontSize: '12px',
                                                    fontWeight: isSelected ? 600 : 400,
                                                    color: isSelected ? THEME.colors.accent : THEME.colors.foreground,
                                                }}
                                            >
                                                {strideInfo.label}
                                            </span>
                                        </div>
                                        <span style={{ fontSize: '11px', color: THEME.colors.muted, paddingLeft: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>
                                            {threat.description}
                                        </span>
                                        <span style={{ fontSize: '10px', color: THEME.colors.muted, paddingLeft: '14px', fontFamily: 'monospace' }}>
                                            {threat.id}
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Detail view */}
                <div style={{ flex: 1, overflow: 'hidden', background: THEME.colors.card }}>
                    {selected ? (
                        <ThreatDetail threat={selected} recommendations={recommendations} />
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.colors.muted, fontSize: '13px', fontStyle: 'italic' }}>
                            Select a threat to view details.
                        </div>
                    )}
                </div>
            </div>

            {/* Trust boundaries section (collapsed) */}
            {trustBoundaries.length > 0 && (
                <div
                    style={{
                        borderTop: `1px solid ${THEME.colors.border}`,
                        padding: '8px 14px',
                        background: THEME.colors.card,
                        fontSize: '11px',
                        color: THEME.colors.muted,
                    }}
                >
                    <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Trust Boundaries: {trustBoundaries.length}
                    </span>
                    <span style={{ marginLeft: '8px' }}>
                        {trustBoundaries.map((tb) => tb.name).join(' · ')}
                    </span>
                </div>
            )}
        </div>
    );
}
