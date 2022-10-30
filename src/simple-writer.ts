import { writer } from './writer.js';
import { nameByUrl } from './name-by-url.js';
import { nameByHeader } from './name-by-header.js';
import * as path from 'path';

const defaultNamers = [
	nameByUrl(),
	nameByHeader(),
	() => { throw new Error('Could not produce a filename for a data object.'); }
];
const defaultOutFile = (data: any) => {
	for (const namer of defaultNamers) {
		const name = namer(data);
		if (name) return name;
	}
};

/**
 * Simply writes documents to the filesystem.
 */
export function simpleWriter<T extends Record<string, unknown>>({
	outDir = 'dist',
	outFile = defaultOutFile,
	verify,
	renderer = (data) => data.body as string | Buffer,
	onError = error => { console.error(error); },
}: {
	outDir?: string;
	outFile?(data: Readonly<T>): string | undefined | void | Promise<string | undefined | void>;
	verify?(filename: string, data: Readonly<T>, rendered: string | NodeJS.ArrayBufferView): boolean | Promise<boolean>;
	renderer?(data: Readonly<T>): string | NodeJS.ArrayBufferView | Promise<string | NodeJS.ArrayBufferView>;
	onError?(error: unknown): void;
}) {
	if (typeof outDir !== 'string') {
		throw new Error('Parameter error: \'outDir\' expects a string.');
	}

	if (typeof outFile !== 'function') {
		throw new Error('Parameter error: \'outFile\' expects a function.');
	}

	const named = new WeakMap();

	return writer({
		namer: async (data: any) => {
			let filename = await outFile(data);
			if (filename) {
				if (path.extname(filename) === '') filename += '.html';
				const name = path.resolve(outDir, filename);
				named.set(data, name);
				return name;
			}
		},
		renderer: async (data: any) => {
			const rendered = await renderer(data);
			if (verify && !(await verify(named.get(data), data, rendered))) return;
			return rendered;
		},
		onError,
	});
};

export default simpleWriter;
