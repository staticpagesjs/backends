import { resolve } from 'path';
import { readFile } from 'fs/promises';

import { findByGlob } from './find-by-glob.js';

export namespace reader {
	export type Options<T extends Record<string, unknown>, E extends Record<string, unknown> = findByGlob.Options> = {
		cwd?: string;
		mode?(options: E): Iterable<string> | AsyncIterable<string>;
		parser(body: Buffer, file: string, options: Options<T, E>): T | Promise<T>;
		onError?(error: unknown): void;
	} & E;
}

/**
 * Reads documents from the filesystem.
 */
export async function* reader<T extends Record<string, unknown>, E extends Record<string, unknown> = findByGlob.Options>(options: reader.Options<T, E>) {
	if (!options.cwd) options.cwd = 'pages';
	if (!options.mode) options.mode = findByGlob;
	if (!options.onError) options.onError = error => { console.error(error); };
	const {
		cwd,
		mode,
		parser,
		onError,
	} = options;

	if (typeof mode !== 'function') {
		throw new Error('Parameter error: \'mode\' expects a function.');
	}

	const files = mode(options);

	if (typeof (files as any)[Symbol.iterator] !== 'function' &&
		typeof (files as any)[Symbol.asyncIterator] !== 'function') {
		throw new Error('Parameter error: \'mode\' expects a function that returns an Iterable or an AsyncIterable type.');
	}

	if (typeof parser !== 'function') {
		throw new Error('Parameter error: \'parser\' expects a function.');
	}

	if (typeof onError !== 'function') {
		throw new Error('Parameter error: \'onError\' expects a function.');
	}

	for await (const file of files) {
		try {
			yield await parser(await readFile(resolve(cwd, file)) as any, file, options);
		} catch (error) {
			onError(error);
		}
	}
}

export default reader;
