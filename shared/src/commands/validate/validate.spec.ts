import fetchMock from 'fetch-mock';
import { validate, sortSpectralIssueBySeverity, convertSpectralDiagnosticToValidationOutputs, convertJsonSchemaIssuesToValidationOutputs, stripRefs, exitBasedOffOfValidationOutcome } from './validate';
import { readFileSync } from 'fs';
import path from 'path';
import { ISpectralDiagnostic } from '@stoplight/spectral-core';
import { ValidationOutcome, ValidationOutput } from './validation.output';
import { ErrorObject } from 'ajv';

const mockRunFunction = vi.fn();

vi.mock('@stoplight/spectral-core', async () => {
    const spectralCore = await vi.importActual('@stoplight/spectral-core');
    return {
        ...spectralCore,
        Spectral: vi.fn().mockImplementation(() => {
            return {
                run: mockRunFunction,
                setRuleset: () => { },
            };
        })
    };
});

vi.mock('../../logger.js', () => {
    return {
        initLogger: () => {
            return {
                info: vi.fn(),
                debug: vi.fn(),
                warn: vi.fn(),
                error: vi.fn()
            };
        }
    };
});

const metaSchemaLocation = 'test_fixtures/calm';
const debugDisabled = false;

describe('validation support functions', () => {
    describe('exitBasedOffOfValidationOutcome', () => {
        let mockExit;

        beforeEach(() => {
            mockExit = vi.spyOn(process, 'exit')
                .mockImplementation((code?) => {
                    if (code != 0) {
                        throw new Error();
                    }
                    return undefined as never;
                });
        });

        afterEach(() => {
            fetchMock.mockGlobal().hardReset();
        });
        it('exit based off of validation outcomes - non-zero outcome if error', () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            mockExit = vi.spyOn(process, 'exit').mockImplementation((code?) => undefined as never);
            const expectedValidationOutcome: ValidationOutcome = new ValidationOutcome([], [], true, false);
            exitBasedOffOfValidationOutcome(expectedValidationOutcome, false);
            expect(mockExit).toHaveBeenCalledWith(1);
        });

        it('exit based off of validation outcomes - zero outcome if warning but failOnWarnings set to false', () => {
            const expectedValidationOutcome: ValidationOutcome = new ValidationOutcome([], [], false, true);
            exitBasedOffOfValidationOutcome(expectedValidationOutcome, false);
            expect(mockExit).toHaveBeenCalledWith(0);
        });

        it('exit based off of validation outcomes - non-zero outcome if warning but failOnWarnings set to true', () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            mockExit = vi.spyOn(process, 'exit').mockImplementation((code?) => undefined as never);
            const expectedValidationOutcome: ValidationOutcome = new ValidationOutcome([], [], false, true);
            exitBasedOffOfValidationOutcome(expectedValidationOutcome, true);
            expect(mockExit).toHaveBeenCalledWith(1);
        });
    });

    describe('sortSpectralIssueBySeverity', () => {

        it('should sort the spectral issues based on the severity', () => {
            const givenFirstError = buildISpectralDiagnostic('error-code-1', 'This is the first error', 0);
            const givenFirstWarning = buildISpectralDiagnostic('warning-code-1', 'This is the first warning', 1);
            const givenSecondWarning = buildISpectralDiagnostic('warning-code-2', 'This is the second warning', 1);
            const givenSecondError = buildISpectralDiagnostic('error-code-2', 'This is the second error', 0);
            const givenNotSortedSpectralIssues: ISpectralDiagnostic[] = [givenFirstError, givenFirstWarning, givenSecondWarning, givenSecondError];
            sortSpectralIssueBySeverity(givenNotSortedSpectralIssues);
            const expectedSortedSpectralIssue: ISpectralDiagnostic[] = [givenFirstError, givenSecondError, givenFirstWarning, givenSecondWarning];
            expect(givenNotSortedSpectralIssues).toStrictEqual(expectedSortedSpectralIssue);
        });
    });

    describe('stripRefs', () => {
        const objectWithRefs = JSON.parse('{"$ref":123,"abc":{"$ref":321}}');
        const expectedString = '{"ref":123,"abc":{"ref":321}}';

        it('should strip refs out of the incoming objects', () => {
            expect(stripRefs(objectWithRefs))
                .toBe(expectedString);
        });
    });

    describe('formatSpectralOutput', () => {

        it('should convert the spectral output to the ValidationOutput format', () => {
            const given: ISpectralDiagnostic[] = [
                {
                    code: 'no-empty-properties',
                    message: 'Must not contain string properties set to the empty string or numerical properties set to zero',
                    severity: 0,
                    path: [
                        'relationships',
                        '0',
                        'relationship-type',
                        'connects',
                        'destination',
                        'interface'
                    ],
                    range: { start: { line: 1, character: 1 }, end: { line: 2, character: 1 } }
                }
            ];

            const expected: ValidationOutput[] = [new ValidationOutput(
                'no-empty-properties',
                'error',
                'Must not contain string properties set to the empty string or numerical properties set to zero',
                '/relationships/0/relationship-type/connects/destination/interface',
                '',
                1,
                2,
                1,
                1
            )];

            const actual = convertSpectralDiagnosticToValidationOutputs(given);

            expect(actual).toStrictEqual(expected);
        });

        it('should convert the spectral output to the ValidationOutput format when path is an empty array', () => {
            const given: ISpectralDiagnostic[] = [
                {
                    code: 'no-empty-properties',
                    message: 'Must not contain string properties set to the empty string or numerical properties set to zero',
                    severity: 0,
                    path: [],
                    range: { start: { line: 1, character: 1 }, end: { line: 2, character: 1 } }
                }
            ];

            const expected: ValidationOutput[] = [new ValidationOutput(
                'no-empty-properties',
                'error',
                'Must not contain string properties set to the empty string or numerical properties set to zero',
                '/',
                '',
                1,
                2,
                1,
                1
            )];

            const actual = convertSpectralDiagnosticToValidationOutputs(given);

            expect(actual).toStrictEqual(expected);
        });

        it('should return an empty array when spectral reports no issues', () => {
            const given: ISpectralDiagnostic[] = [];
            const expected: ValidationOutput[] = [];
            const actual = convertSpectralDiagnosticToValidationOutputs(given);
            expect(actual).toStrictEqual(expected);
        });

    });

    describe('formatJsonSchemaOutput', () => {
        it('should convert the json schema output to the ValidationOutput format', () => {
            const given: ErrorObject[] = [
                {
                    'instancePath': '/nodes/0/interfaces/0/port',
                    'schemaPath': 'https://calm.finos.org/draft/2024-10/meta/interface.json#/defs/host-port-interface/properties/port/type',
                    'keyword': 'type',
                    'params': {
                        'type': 'integer'
                    },
                    'message': 'must be integer'
                }
            ];

            const expected: ValidationOutput[] = [
                new ValidationOutput(
                    'json-schema',
                    'error',
                    'must be integer',
                    '/nodes/0/interfaces/0/port',
                    'https://calm.finos.org/draft/2024-10/meta/interface.json#/defs/host-port-interface/properties/port/type'
                )
            ];

            const actual = convertJsonSchemaIssuesToValidationOutputs(given);

            expect(actual).toStrictEqual(expected);
        });

        it('should convert the json schema output to the ValidationOutput format when instancePath is empty', () => {
            const given: ErrorObject[] = [
                {
                    'instancePath': '',
                    'schemaPath': '#/required',
                    'keyword': 'required',
                    'params': {
                        'missingProperty': 'nodes'
                    },
                    'message': 'must have required property \'nodes\''
                }
            ];

            const expected: ValidationOutput[] = [
                new ValidationOutput(
                    'json-schema',
                    'error',
                    'must have required property \'nodes\'',
                    '',
                    '#/required'
                )
            ];

            const actual = convertJsonSchemaIssuesToValidationOutputs(given);

            expect(actual).toStrictEqual(expected);
        });

        it('should return an empty array when no JSON Schema issues have been reported', () => {
            const given: ErrorObject[] = [];
            const expected: ValidationOutput[] = [];
            const actual = convertJsonSchemaIssuesToValidationOutputs(given);
            expect(actual).toStrictEqual(expected);
        });

    });
});

describe('validate pattern and architecture', () => {
    beforeEach(() => {
        mockRunFunction.mockReturnValue([]);
        vi.useFakeTimers();
    });

    afterEach(() => {
        fetchMock.mockGlobal().hardReset();
    });

    it('throws error when the the Pattern and the Architecture are undefined', async () => {
        await expect(validate(undefined, undefined, metaSchemaLocation, debugDisabled))
            .rejects
            .toThrow();
    });


    it('throws error when the meta schema location is not a directory', async () => {
        await expect(validate({ not: 'json' }, {}, 'test_fixtures/api-gateway.json', debugDisabled))
            .rejects
            .toThrow();
    });

    it('has error when the architecture does not match the json schema', async () => {
        const apiGateway = JSON.parse(readFileSync(path.resolve(__dirname, '../../../test_fixtures/api-gateway.json'), 'utf8'));
        const apiGatewayArchitecture = JSON.parse(readFileSync(path.resolve(__dirname, '../../../test_fixtures/api-gateway-implementation-that-does-not-match-schema.json'), 'utf8'));
        fetchMock.mockGlobal().route('http://exist/api-gateway.json', apiGateway);
        fetchMock.mockGlobal().route('https://exist/api-gateway-implementation.json', apiGatewayArchitecture);

        const response = await validate(apiGatewayArchitecture, apiGateway, metaSchemaLocation, debugDisabled);

        expect(response).not.toBeNull();
        expect(response).not.toBeUndefined();
        expect(response.hasErrors).toBeTruthy();
        expect(response.allValidationOutputs()).not.toBeNull();
        expect(response.allValidationOutputs().length).toBeGreaterThan(0);
    });

    it('has error when the architecture does not pass all the spectral validations', async () => {
        const expectedSpectralOutput: ISpectralDiagnostic[] = [
            {
                code: 'no-empty-properties',
                message: 'Must not contain string properties set to the empty string or numerical properties set to zero',
                severity: 0,
                path: ['/nodes'],
                range: { start: { line: 1, character: 1 }, end: { line: 2, character: 1 } }
            }
        ];

        mockRunFunction.mockReturnValue(expectedSpectralOutput);

        const apiGateway = JSON.parse(readFileSync(path.resolve(__dirname, '../../../test_fixtures/api-gateway.json'), 'utf8'));
        const apiGatewayArchitecture = JSON.parse(readFileSync(path.resolve(__dirname, '../../../test_fixtures/api-gateway-implementation-that-does-not-pass-the-spectral-validation.json'), 'utf8'));
        fetchMock.mockGlobal().route('http://exist/api-gateway.json', apiGateway);
        fetchMock.mockGlobal().route('https://exist/api-gateway-implementation.json', apiGatewayArchitecture);

        const response = await validate(apiGatewayArchitecture, apiGateway, metaSchemaLocation, debugDisabled);
        expect(response).not.toBeNull();
        expect(response).not.toBeUndefined();
        expect(response.hasErrors).toBeTruthy();
        expect(response.allValidationOutputs()).not.toBeNull();
        expect(response.allValidationOutputs().length).toBeGreaterThan(0);
    });

    it('has error when the pattern does not pass all the spectral validations ', async () => {
        const expectedSpectralOutput: ISpectralDiagnostic[] = [
            {
                code: 'no-empty-properties',
                message: 'Must not contain string properties set to the empty string or numerical properties set to zero',
                severity: 0,
                path: ['/nodes'],
                range: { start: { line: 1, character: 1 }, end: { line: 2, character: 1 } }
            }
        ];

        mockRunFunction.mockReturnValue(expectedSpectralOutput);

        const apiGateway = JSON.parse(readFileSync(path.resolve(__dirname, '../../../test_fixtures/api-gateway-with-no-relationships.json'), 'utf8'));
        const apiGatewayArchitecture = JSON.parse(readFileSync(path.resolve(__dirname, '../../../test_fixtures/api-gateway-implementation.json'), 'utf8'));
        fetchMock.mockGlobal().route('http://exist/api-gateway.json', apiGateway);
        fetchMock.mockGlobal().route('https://exist/api-gateway-implementation.json', apiGatewayArchitecture);

        const response = await validate(apiGatewayArchitecture, apiGateway, metaSchemaLocation, debugDisabled);
        expect(response).not.toBeNull();
        expect(response).not.toBeUndefined();
        expect(response.hasErrors).toBeTruthy();
        expect(response.allValidationOutputs()).not.toBeNull();
        expect(response.allValidationOutputs().length).toBeGreaterThan(0);
    });

    it('completes successfully when the spectral validation returns warnings and errors', async () => {
        const expectedSpectralOutput: ISpectralDiagnostic[] = [
            {
                code: 'warning-test',
                message: 'Test warning',
                severity: 1,
                path: ['nodes'],
                range: { start: { line: 1, character: 1 }, end: { line: 2, character: 1 } }
            }
        ];

        mockRunFunction.mockReturnValue(expectedSpectralOutput);

        const apiGateway = JSON.parse(readFileSync(path.resolve(__dirname, '../../../test_fixtures/api-gateway.json'), 'utf8'));
        const apiGatewayArchitecture = JSON.parse(readFileSync(path.resolve(__dirname, '../../../test_fixtures/api-gateway-implementation.json'), 'utf8'));

        const response = await validate(apiGatewayArchitecture, apiGateway, metaSchemaLocation, debugDisabled);
        expect(response).not.toBeNull();
        expect(response).not.toBeUndefined();
        expect(response.hasErrors).not.toBeTruthy();
        expect(response.hasWarnings).toBeTruthy();
        expect(response.allValidationOutputs()).not.toBeNull();
        expect(response.allValidationOutputs().length).toBeGreaterThan(0);
    });

});

describe('validate pattern only', () => {
    beforeEach(() => {
        mockRunFunction.mockReturnValue([]);
    });

    afterEach(() => {
        fetchMock.mockGlobal().hardReset();
    });

    it('has errors when the pattern does not pass all the spectral validations ', async () => {
        const expectedSpectralOutput: ISpectralDiagnostic[] = [
            {
                code: 'example-error',
                message: 'Example error',
                severity: 0,
                path: ['/nodes'],
                range: { start: { line: 1, character: 1 }, end: { line: 2, character: 1 } }
            }
        ];

        mockRunFunction.mockReturnValue(expectedSpectralOutput);

        const apiGateway = JSON.parse(readFileSync(path.resolve(__dirname, '../../../test_fixtures/api-gateway.json'), 'utf8'));
        fetchMock.mockGlobal().route('http://exist/api-gateway.json', apiGateway);

        const response = await validate(undefined, apiGateway, metaSchemaLocation, debugDisabled);
        expect(response).not.toBeNull();
        expect(response).not.toBeUndefined();
        expect(response.hasErrors).toBeTruthy();
        expect(response.allValidationOutputs()).not.toBeNull();
        expect(response.allValidationOutputs().length).toBeGreaterThan(0);
    });

    it('has errors when spectral returns no errors, but json schema is invalid', async () => {
        const expectedSpectralOutput: ISpectralDiagnostic[] = [
        ];

        mockRunFunction.mockReturnValue(expectedSpectralOutput);

        const apiGateway = JSON.parse(readFileSync(path.resolve(__dirname, '../../../test_fixtures/bad-schema/bad-json-schema.json'), 'utf8'));
        fetchMock.mockGlobal().route('http://exist/api-gateway.json', apiGateway);

        const response = await validate(undefined, apiGateway, metaSchemaLocation, debugDisabled);
        expect(response).not.toBeNull();
        expect(response).not.toBeUndefined();
        expect(response.hasErrors).toBeTruthy();
        expect(response.allValidationOutputs()).not.toBeNull();
        expect(response.allValidationOutputs().length).toBeGreaterThan(0);
    });
});

describe('validate - architecture only', () => {
    beforeEach(() => {
        mockRunFunction.mockReturnValue([]);
    });

    afterEach(() => {
        fetchMock.mockGlobal().hardReset();
    });


    it('return errors when the architecture does not pass all the spectral validations ', async () => {
        const expectedSpectralOutput: ISpectralDiagnostic[] = [
            {
                code: 'example-error',
                message: 'Example error',
                severity: 0,
                path: ['/nodes'],
                range: { start: { line: 1, character: 1 }, end: { line: 2, character: 1 } }
            }
        ];

        mockRunFunction.mockReturnValue(expectedSpectralOutput);

        const apiGateway = JSON.parse(readFileSync(path.resolve(__dirname, '../../../test_fixtures/api-gateway-implementation.json'), 'utf8'));
        fetchMock.mockGlobal().route('http://exist/api-gateway-implementation.json', apiGateway);

        const response = await validate(apiGateway, undefined, metaSchemaLocation, debugDisabled);
        expect(response).not.toBeNull();
        expect(response).not.toBeUndefined();
        expect(response.hasErrors).toBeTruthy();
        expect(response.allValidationOutputs()).not.toBeNull();
        expect(response.allValidationOutputs().length).toBeGreaterThan(0);
    });

    it('returns no errors when the architecture passes all the spectral validations with no errors', async () => {
        const expectedSpectralOutput: ISpectralDiagnostic[] = [];

        mockRunFunction.mockReturnValue(expectedSpectralOutput);

        const apiGateway = JSON.parse(readFileSync(path.resolve(__dirname, '../../../test_fixtures/api-gateway-implementation.json'), 'utf8'));
        fetchMock.mockGlobal().route('http://exist/api-gateway-implementation.json', apiGateway);

        const response = await validate(apiGateway, undefined, metaSchemaLocation, debugDisabled);
        
        expect(response).not.toBeNull();
        expect(response).not.toBeUndefined();
        expect(response.hasErrors).not.toBeTruthy();
        expect(response.hasWarnings).not.toBeTruthy();
        expect(response.allValidationOutputs()).not.toBeNull();
        expect(response.allValidationOutputs().length).toBe(0);
    });

    it('validates architecture against schema specified in $schema property when no pattern provided', async () => {
        const expectedSpectralOutput: ISpectralDiagnostic[] = [];
        mockRunFunction.mockReturnValue(expectedSpectralOutput);

        // Create a simple valid architecture with a CALM schema reference
        const validArchitecture = {
            '$schema': 'https://raw.githubusercontent.com/finos/architecture-as-code/main/calm/draft/2024-03/meta/calm.json',
            'nodes': [
                {
                    'unique-id': 'test-node',
                    'node-type': 'system',
                    'name': 'Test Node',
                    'description': 'A test node'
                }
            ],
            'relationships': []
        };

        fetchMock.mockGlobal().route('http://exist/valid-architecture.json', JSON.stringify(validArchitecture));
        
        // Mock the CALM schema
        const calmSchema = readFileSync(path.resolve(__dirname, '../../../test_fixtures/calm/calm.json'), 'utf8');
        fetchMock.mockGlobal().route('https://raw.githubusercontent.com/finos/architecture-as-code/main/calm/draft/2024-03/meta/calm.json', calmSchema);

        // Mock the core schema
        const coreSchema = readFileSync(path.resolve(__dirname, '../../../test_fixtures/calm/core.json'), 'utf8');
        fetchMock.mockGlobal().route('https://raw.githubusercontent.com/finos/architecture-as-code/main/calm/draft/2024-03/meta/core.json', coreSchema);

        const response = await validate('http://exist/valid-architecture.json', '', metaSchemaLocation, false);
        
        expect(response).not.toBeNull();
        expect(response).not.toBeUndefined();
        
        // For a valid architecture, we should not have errors
        expect(response.hasErrors).toBeFalsy();
        expect(response.hasWarnings).toBeFalsy();
    });
});

function buildISpectralDiagnostic(code: string, message: string, severity: number): ISpectralDiagnostic {
    return {
        code: code,
        message: message,
        severity: severity,
        path: [
            'relationships',
            '0',
            'relationship-type',
            'connects',
            'destination',
            'interface'
        ],
        range: { start: { line: 1, character: 1 }, end: { line: 2, character: 1 } }
    };
}