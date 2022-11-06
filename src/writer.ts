import * as fs from 'fs';
import * as path from 'path';

export namespace writer {
	export type Options<T extends Record<string, unknown>> = {
		cwd?: string;
		namer: { (data: Readonly<T>): string | undefined | void | Promise<string | undefined | void>; } | { (data: Readonly<T>): string | undefined | void | Promise<string | undefined | void>; }[];
		renderer(data: Readonly<T>): string | NodeJS.ArrayBufferView | undefined | void | Promise<string | NodeJS.ArrayBufferView | undefined | void>;
		onError?(error: unknown): void;
	};
}

/**
 * Writes documents to the filesystem.
 */
export function writer<T extends Record<string, unknown>>({
	cwd = 'dist',
	namer,
	renderer,
	onError = error => { console.error(error); },
}: writer.Options<T>) {
	if (!Array.isArray(namer)) namer = [namer];

	if (namer.some(fn => typeof fn !== 'function')) {
		throw new Error('Parameter error: \'namer\' expects a function or a function array.');
	}

	if (typeof renderer !== 'function') {
		throw new Error('Parameter error: \'renderer\' expects a function.');
	}

	if (typeof onError !== 'function') {
		throw new Error('Parameter error: \'onError\' expects a function.');
	}

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
