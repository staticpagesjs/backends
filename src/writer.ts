import * as fs from 'fs';
import * as path from 'path';

import { nameByHeader } from './name-by-header.js';
import { nameByUrl } from './name-by-url.js';

export namespace writer {
	export type Options<T extends Record<string, unknown>> = {
		cwd?: string;
		namer?: { (data: Readonly<T>): string | undefined | void | Promise<string | undefined | void>; } | { (data: Readonly<T>): string | undefined | void | Promise<string | undefined | void>; }[];
		renderer(data: Readonly<T>): string | NodeJS.ArrayBufferView | undefined | void | Promise<string | NodeJS.ArrayBufferView | undefined | void>;
		onError?(error: unknown): void;
	};
}

/**
 * Writes documents to the filesystem.
 */
export function writer<T extends Record<string, unknown>>({
	cwd = 'dist',
	namer = [nameByUrl, nameByHeader, () => { throw new Error('Naming error: could not create an output filename based on .url or .header.path properties.'); }],
	renderer,
	onError = error => { console.error(error); },
}: writer.Options<T>) {
	if (!Array.isArray(namer)) namer = [namer];

	if (typeof cwd !== 'string') throw new Error('Argument type mismatch, \'cwd\' expects a string.');
	if (namer.some(fn => typeof fn !== 'function')) throw new Error('Argument type mismatch, \'namer\' expects a function or an array of functions.');
	if (typeof renderer !== 'function') throw new Error('Argument type mismatch, \'renderer\' expects a function.');
	if (typeof onError !== 'function') throw new Error('Argument type mismatch, \'onError\' expects a function.');

	const dirCache = new Set<string>();

	return async (data: T): Promise<void> => {
		try {
			let outputPath;
			for (const fn of namer as any) {
				outputPath = await fn(data);
				if (outputPath && typeof outputPath === 'string') break;
			}
			if (!outputPath || typeof outputPath !== 'string') return;

			const rendered = await renderer(data);
			if (!rendered) return;

			outputPath = path.resolve(cwd, outputPath);
			const outputDirname = path.dirname(outputPath);
			if (!dirCache.has(outputDirname)) {
				fs.mkdirSync(outputDirname, { recursive: true });
				dirCache.add(outputDirname);
			}

			fs.writeFileSync(outputPath, rendered);
		} catch (error) {
			onError(error);
		}
	};
};

export default writer;
