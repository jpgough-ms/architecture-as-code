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

// Threat Model Decorator Types

export type StrideCategory = 'spoofing' | 'tampering' | 'repudiation' | 'information-disclosure' | 'denial-of-service' | 'elevation-of-privilege';
export type RiskLevel = 'high' | 'medium' | 'low';
export type MitigationStatus = 'mitigated' | 'partial' | 'unmitigated';
export type OverallRisk = 'critical' | 'high' | 'medium' | 'low';
export type TrustBoundaryCriticality = 'critical' | 'high' | 'medium' | 'low';

export interface ThreatModelSummary {
    date: string;
    methodology: string;
    'overall-risk': OverallRisk;
    'total-threats': number;
    'unmitigated-threats'?: number;
    'partially-mitigated-threats'?: number;
    'mitigated-threats'?: number;
}

export interface TrustBoundary {
    id: string;
    name: string;
    from?: string;
    to?: string;
    protocol?: string;
    criticality: TrustBoundaryCriticality;
}

export interface Threat {
    id: string;
    'trust-boundary'?: string;
    'stride-category': StrideCategory;
    description: string;
    risk: RiskLevel;
    'mitigation-status': MitigationStatus;
    'existing-controls'?: string[];
    notes?: string;
}

export interface Recommendation {
    id: string;
    priority: OverallRisk;
    threats?: string[];
    description: string;
    implementation?: string;
}

export interface ThreatModelDecoratorData extends DecoratorData {
    summary: ThreatModelSummary;
    'trust-boundaries'?: TrustBoundary[];
    threats: Threat[];
    recommendations?: Recommendation[];
}

export interface ThreatModelDecorator extends Decorator {
    type: 'threat-model';
    data: ThreatModelDecoratorData;
}

export interface ThreatPanelProps {
    decorators: ThreatModelDecorator[];
    selectedThreatId?: string | null;
}
