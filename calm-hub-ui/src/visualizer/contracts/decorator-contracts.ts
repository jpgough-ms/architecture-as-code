export type DecoratorData = Record<string, unknown>;

export type DeploymentStatus = 'pending' | 'in-progress' | 'completed' | 'failed' | 'rolled-back';

export interface DeploymentDecoratorData extends DecoratorData {
    'start-time': string;
    'end-time'?: string;
    status: DeploymentStatus;
    'deployment-details'?: string;
    notes?: string;
}

export interface Decorator {
    schema: string;
    uniqueId: string;
    type: string;
    target: string[];
    targetType?: string[];
    appliesTo: string[];
    data: DecoratorData;
}

export interface DeploymentDecorator extends Decorator {
    type: 'deployment';
    data: DeploymentDecoratorData;
}

export interface DeploymentPanelProps {
    decorators: DeploymentDecorator[];
}

export type ThreatRating = 'low' | 'medium' | 'high' | 'critical';

export type ThreatStatus = 'identified' | 'mitigated' | 'partially-mitigated' | 'accepted';

export type ThreatMitigationState = 'planned' | 'implemented' | 'verified';

export interface ThreatClassification {
    scheme: string;
    value: string;
    reference?: string;
}

export interface ThreatMitigation {
    control: string;
    state: ThreatMitigationState;
    note?: string;
}

export interface ThreatResidualRisk {
    rating: ThreatRating;
    justification?: string;
    'accepted-by'?: string;
    'review-by'?: string;
}

export interface Threat {
    'unique-id': string;
    name: string;
    description?: string;
    classification?: ThreatClassification[];
    'applies-to': {
        relationships: string[];
        'sequence-numbers'?: number[];
    };
    likelihood?: ThreatRating;
    impact?: ThreatRating;
    status: ThreatStatus;
    mitigations?: ThreatMitigation[];
    'residual-risk'?: ThreatResidualRisk;
}

export interface TrustBoundary {
    'unique-id': string;
    name: string;
    description?: string;
    relationships: string[];
}

/** The `data` of a decorator that conforms to the threat model decorator standards. */
export interface ThreatModelData extends DecoratorData {
    methodology: string;
    'assessed-on'?: string;
    assessor?: string;
    'trust-boundaries'?: TrustBoundary[];
    threats: Threat[];
}

export interface ThreatModelDecorator extends Decorator {
    type: 'threat-model';
    data: ThreatModelData;
}
