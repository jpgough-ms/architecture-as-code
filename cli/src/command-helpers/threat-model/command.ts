import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { CalmHubClient } from '@finos/calm-shared';
import { resolveCalmHubOptions } from '../hub-commands';
import { checkbox, confirm, input, select } from '@inquirer/prompts';
import { Architecture, Session, buildDecorator, findGaps } from './model';
import { validateThreatModel } from './validate';
import { CatalogueControl, Prompter, runWalk } from './walk';

export interface ThreatModelOptions {
    architecturePath: string;
    flow?: string;
    sessionPath?: string;
    saveSessionPath?: string;
    outputPath?: string;
    target?: string;
    assessor?: string;
    assessedOn?: string;
    calmHubUrl?: string;
    controlDomain?: string;
}

async function readJson<T>(file: string): Promise<T> {
    return JSON.parse(await readFile(file, 'utf-8')) as T;
}

const inquirerPrompter: Prompter = {
    confirm: (_key, message, defaultValue) => confirm({ message, default: defaultValue }),
    input: (_key, message, defaultValue) => input({ message, default: defaultValue }),
    select: (_key, message, choices, defaultValue) => select({ message, choices, default: defaultValue }),
    checkbox: (_key, message, choices) => choices.length === 0 ? Promise.resolve([]) : checkbox({ message, choices }),
    say: message => console.log(message)
};

async function loadCatalogue(calmHubUrl: string | undefined, domain: string | undefined): Promise<CatalogueControl[]> {
    if (!domain) return [];
    const client = new CalmHubClient(await resolveCalmHubOptions({ calmHubUrl }));
    return (await client.listControls(domain)).map(c => ({ name: c.name, description: c.description }));
}

function today(): string {
    return new Date().toISOString().slice(0, 10);
}

function describe(decorator: Record<string, unknown>, architecture: Architecture): string {
    const threats = (decorator.data as { threats: Array<{ status: string }> }).threats;
    const counts = threats.reduce<Record<string, number>>((acc, t) => ({ ...acc, [t.status]: (acc[t.status] ?? 0) + 1 }), {});
    const lines = [`${threats.length} threats: ${Object.entries(counts).map(([s, n]) => `${n} ${s}`).join(', ') || 'none'}`];
    const gaps = findGaps(architecture, decorator);
    for (const gap of gaps) lines.push(`Gap: ${gap.threat} needs ${gap.control} (${gap.state}), which the architecture does not declare`);
    return lines.join('\n');
}

/** Writes a STRIDE threat model decorator, from a saved session or from an interactive walk. Returns false when the result breaks the standard. */
export async function runThreatModel(options: ThreatModelOptions, prompter: Prompter = inquirerPrompter): Promise<boolean> {
    const architecture = await readJson<Architecture>(options.architecturePath);
    let session: Session;
    if (options.sessionPath) {
        session = await readJson<Session>(options.sessionPath);
        if (options.flow && options.flow !== session.flow) throw new Error(`The session is for flow '${session.flow}', not '${options.flow}'`);
    } else {
        const flows = architecture.flows ?? [];
        if (flows.length === 0) throw new Error('The architecture has no flows. Add a flow, then run the threat model again.');
        const flow = options.flow ?? await prompter.select('flow', 'Which flow?', flows.map(f => ({ name: f.name ?? f['unique-id'], value: f['unique-id'] })));
        session = await runWalk(architecture, {
            flow,
            assessedOn: options.assessedOn ?? today(),
            assessor: options.assessor ?? (await prompter.input('assessor', 'Assessor (optional)', '') || undefined),
            catalogue: await loadCatalogue(options.calmHubUrl, options.controlDomain)
        }, prompter);
    }

    if (options.saveSessionPath) await writeFile(options.saveSessionPath, JSON.stringify(session, null, 4) + '\n');

    const outputDir = options.outputPath ? path.dirname(path.resolve(options.outputPath)) : process.cwd();
    const target = options.target ?? path.relative(outputDir, path.resolve(options.architecturePath)).split(path.sep).join('/');
    const decorator = buildDecorator(architecture, session, target);
    const text = JSON.stringify(decorator, null, 4) + '\n';
    if (options.outputPath) await writeFile(options.outputPath, text);
    else process.stdout.write(text);

    const problems = validateThreatModel(decorator, architecture);
    console.error(describe(decorator, architecture));
    for (const problem of problems) console.error(`✖ ${problem.path}: ${problem.message}`);
    return problems.length === 0;
}

export async function runValidateThreatModel(decoratorPath: string, architecturePath?: string): Promise<boolean> {
    const decorator = await readJson<Record<string, unknown>>(decoratorPath);
    const architecture = architecturePath ? await readJson<Architecture>(architecturePath) : undefined;
    const problems = validateThreatModel(decorator, architecture);
    for (const problem of problems) console.error(`✖ ${problem.path}: ${problem.message}`);
    if (problems.length === 0) {
        console.log(`✔ ${decoratorPath} conforms to the STRIDE threat model standard 1.0${architecture ? ` and matches ${architecturePath}` : ''}`);
        if (architecture) console.log(describe(decorator, architecture));
    }
    return problems.length === 0;
}
