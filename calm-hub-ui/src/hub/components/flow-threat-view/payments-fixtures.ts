import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CalmCore } from '@finos/calm-models/model';
import type { CalmCoreSchema, CalmFlowSchema } from '@finos/calm-models/types';
import type { ThreatModelDecorator } from '../../../visualizer/contracts/decorator-contracts.js';

/**
 * Test fixtures read straight from examples/payments-api, which is also what the CALM Hub
 * seed scripts load, so the tests fail if the demo data and the view drift apart.
 */
function readExample<T>(file: string): T {
    // Built from the file path, not `new URL(..., import.meta.url)`, which Vite treats as an asset import.
    const here = dirname(fileURLToPath(import.meta.url));
    const path = resolve(here, '../../../../../examples/payments-api', file);
    return JSON.parse(readFileSync(path, 'utf8')) as T;
}

export const architectureJson = readExample<CalmCoreSchema>('payments-api.architecture.json');
export const flowJson = readExample<CalmFlowSchema>('submit-payment.flow.json');
export const architecture = CalmCore.fromSchema(architectureJson);

const rawDecorator = readExample<Record<string, unknown> & { data: ThreatModelDecorator['data'] }>(
    'submit-payment.stride.decorator.json',
);

/** The decorator as CALM Hub returns it: bean fields in camelCase, `data` as authored. */
export const decorator: ThreatModelDecorator = {
    schema: String(rawDecorator.$schema),
    uniqueId: String(rawDecorator['unique-id']),
    type: 'threat-model',
    target: rawDecorator.target as string[],
    appliesTo: rawDecorator['applies-to'] as string[],
    data: rawDecorator.data,
};
