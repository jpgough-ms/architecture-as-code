export type DecoratorData = Record<string, unknown>;

export interface Decorator {
    schema?: string;
    uniqueId: string;
    /** The API does not require a type. */
    type?: string;
    target: string[];
    targetType?: string[];
    appliesTo: string[];
    data: DecoratorData;
    /** Hub-owned UTC ISO-8601 times. A decorator stored before Hub recorded them has none. */
    creationDateTime?: string;
    updateDateTime?: string;
}

export type ControlEvaluationStatus = 'met' | 'not-met' | 'not-applicable';

export interface ControlEvaluationFinding {
    subject: string;
    check?: string;
    description: string;
    expression?: string;
    cause?: string;
}

export interface ControlEvaluationDecoratorData extends DecoratorData {
    control: { 'unique-id': string; 'control-id'?: string; 'requirement-url': string; 'attached-to'?: string };
    status: ControlEvaluationStatus;
    'evaluated-at': string;
    change?: { commit: string; 'diff-sha256'?: string; spec?: string };
    findings?: ControlEvaluationFinding[];
    actors?: Record<string, string>;
    engine?: { name: string; version?: string; 'policy-sha256'?: string };
    'report-sha256'?: string;
    'report-uri'?: string;
}

export interface ControlEvaluationDecorator extends Decorator {
    type: 'control-evaluation';
    data: ControlEvaluationDecoratorData;
}

/** An element's latest evaluation per control, and the overall result shown on the diagram. */
export interface ElementEvaluation {
    status: 'met' | 'not-met';
    latest: ControlEvaluationDecorator[];
}

/** The `threat-model` decorator standard 1.0. Hub does not require any field, so every read is guarded. */
export type ThreatStatus = 'identified' | 'mitigated' | 'partially-mitigated' | 'accepted' | 'transferred' | 'not-applicable';
export type ThreatRating = 'low' | 'medium' | 'high' | 'critical';

export interface TrustBoundary {
    'unique-id': string;
    name: string;
    description?: string;
    elements: string[];
}

export interface ThreatMitigation {
    control: string;
    state: 'planned' | 'implemented' | 'verified';
    'attached-to'?: string;
    note?: string;
    evidence?: string[];
}

export interface Threat {
    'unique-id': string;
    name: string;
    description?: string;
    classification?: { scheme: string; value: string; reference?: string }[];
    'applies-to': string[];
    'sequence-numbers'?: number[];
    likelihood?: ThreatRating;
    impact?: ThreatRating;
    status: ThreatStatus;
    justification?: string;
    mitigations?: ThreatMitigation[];
    'residual-risk'?: { rating: ThreatRating; 'accepted-by'?: string; 'review-by'?: string };
}

export interface ThreatModelDecoratorData extends DecoratorData {
    flow: string;
    methodology: string;
    'assessed-on': string;
    assessor?: string;
    'trust-boundaries'?: TrustBoundary[];
    threats: Threat[];
}

export interface ThreatModelDecorator extends Decorator {
    type: 'threat-model';
    data: ThreatModelDecoratorData;
}
