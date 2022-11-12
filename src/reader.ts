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
	const optionsWithDefaults: reader.Options<T, E> = {
		cwd: 'pages',
		mode: findByGlob,
		onError: error => { console.error(error); },
		...options,
	};
	const { cwd, mode, parser, onError } = optionsWithDefaults;

	if (typeof mode !== 'function') throw new Error('Argument type mismatch, \'mode\' expects a function.');

	const files = mode(optionsWithDefaults);

	if (typeof (files as any)[Symbol.iterator] !== 'function' && typeof (files as any)[Symbol.asyncIterator] !== 'function') throw new Error('Argument type mismatch, \'mode\' expects a function that returns an Iterable or an AsyncIterable type.');
	if (typeof parser !== 'function') throw new Error('Argument type mismatch, \'parser\' expects a function.');
	if (typeof onError !== 'function') throw new Error('Argument type mismatch, \'onError\' expects a function.');
	if (typeof cwd !== 'string') throw new Error('Argument type mismatch, \'cwd\' expects a string.');

	for await (const file of files) {
		try {
			yield await parser(await readFile(resolve(cwd, file)), file, optionsWithDefaults);
		} catch (error) {
			onError(error);
		}
	}
}

export default reader;
