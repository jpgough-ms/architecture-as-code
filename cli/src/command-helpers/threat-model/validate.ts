import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import decoratorsSchema from 'calm-schema-1.3/schema/decorators.json';
import baseStandard from './standards/threat-model.decorator.standard.json';
import strideStandard from './standards/stride.threat-model.decorator.standard.json';
import { Architecture, ArchitectureIndex, STANDARD_ID } from './model';

export interface ThreatModelProblem {
    path: string;
    message: string;
}

let validateSchema: ReturnType<Ajv2020['compile']> | undefined;

function schemaValidator() {
    if (!validateSchema) {
        const ajv = new Ajv2020({ strict: false, allErrors: true });
        addFormats(ajv);
        ajv.addSchema(decoratorsSchema);
        ajv.addSchema(baseStandard);
        validateSchema = ajv.compile(strideStandard);
    }
    return validateSchema;
}

interface DecoratorShape {
    'applies-to'?: string[];
    data?: {
        flow?: string;
        'trust-boundaries'?: Array<{ 'unique-id'?: string; elements?: string[] }>;
        threats?: Array<{ 'unique-id'?: string; 'applies-to'?: string[]; 'sequence-numbers'?: number[]; mitigations?: Array<{ 'attached-to'?: string }> }>;
    };
}

/** The rules of the threat model standard that JSON Schema cannot check. */
function checkAgainstArchitecture(decorator: DecoratorShape, architecture: Architecture): ThreatModelProblem[] {
    const problems: ThreatModelProblem[] = [];
    const index = new ArchitectureIndex(architecture);
    const data = decorator.data ?? {};
    const isElement = (id: string) => index.nodes.has(id) || index.relationships.has(id);
    const flow = architecture.flows?.find(f => f['unique-id'] === data.flow);

    if (!flow) problems.push({ path: '/data/flow', message: `flow '${data.flow}' is not in the flows of the target` });

    const named = new Set<string>();
    const checkElement = (id: string, path: string) => {
        if (!isElement(id)) problems.push({ path, message: `'${id}' is not a node or relationship of the target` });
    };
    const checkUnique = (ids: Array<string | undefined>, path: string, kind: string) => {
        const seen = new Set<string>();
        ids.forEach((id, i) => {
            if (id && seen.has(id)) problems.push({ path: `${path}/${i}/unique-id`, message: `${kind} id '${id}' is not unique` });
            if (id) seen.add(id);
        });
    };

    const boundaries = data['trust-boundaries'] ?? [];
    boundaries.forEach((boundary, i) => (boundary.elements ?? []).forEach((id, j) => {
        named.add(id);
        checkElement(id, `/data/trust-boundaries/${i}/elements/${j}`);
    }));
    checkUnique(boundaries.map(b => b['unique-id']), '/data/trust-boundaries', 'boundary');

    const sequenceNumbers = new Set(flow?.transitions.map(t => t['sequence-number']));
    const threats = data.threats ?? [];
    threats.forEach((threat, i) => {
        (threat['applies-to'] ?? []).forEach((id, j) => {
            named.add(id);
            checkElement(id, `/data/threats/${i}/applies-to/${j}`);
        });
        (threat.mitigations ?? []).forEach((mitigation, j) => {
            if (mitigation['attached-to']) checkElement(mitigation['attached-to'], `/data/threats/${i}/mitigations/${j}/attached-to`);
        });
        if (flow) (threat['sequence-numbers'] ?? []).forEach((n, j) => {
            if (!sequenceNumbers.has(n)) problems.push({ path: `/data/threats/${i}/sequence-numbers/${j}`, message: `${n} is not a transition of flow '${data.flow}'` });
        });
    });
    checkUnique(threats.map(t => t['unique-id']), '/data/threats', 'threat');

    const appliesTo = new Set(decorator['applies-to'] ?? []);
    for (const id of [data.flow, ...named]) {
        if (id && !appliesTo.has(id)) problems.push({ path: '/applies-to', message: `'${id}' is missing from applies-to` });
    }
    return problems;
}

/** Checks a decorator against the STRIDE threat model standard 1.0 and, when given, the architecture it targets. */
export function validateThreatModel(decorator: unknown, architecture?: Architecture): ThreatModelProblem[] {
    const validate = schemaValidator();
    const problems: ThreatModelProblem[] = [];
    if (!validate(decorator)) {
        for (const error of validate.errors ?? []) {
            if (error.keyword === 'if' || error.keyword === 'allOf') continue;
            problems.push({ path: error.instancePath || '/', message: `${error.message}${error.params && 'allowedValues' in error.params ? ` (${(error.params.allowedValues as string[]).join(', ')})` : ''}` });
        }
    }
    const declared = (decorator as { $schema?: string })?.$schema;
    if (declared && declared !== STANDARD_ID) problems.push({ path: '/$schema', message: `expected ${STANDARD_ID}` });
    if (architecture && decorator && typeof decorator === 'object') problems.push(...checkAgainstArchitecture(decorator as DecoratorShape, architecture));
    // allOf branches of the standards report the same failure more than once.
    return problems.filter((p, i) => problems.findIndex(q => q.path === p.path && q.message === p.message) === i);
}
