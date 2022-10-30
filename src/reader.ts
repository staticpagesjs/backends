import { readFile } from 'fs/promises';

/**
 * Reads documents from the filesystem.
 */
export async function* reader<T extends Record<string, unknown>>({
	files,
	parser,
	onError = error => { console.error(error); },
}: {
	files: Iterable<string> | AsyncIterable<string>;
	parser(body: Buffer, file: string): T | Promise<T>;
	onError?(error: unknown): void;
}) {
	if (typeof (files as any)[Symbol.iterator] !== 'function' &&
		typeof (files as any)[Symbol.asyncIterator] !== 'function') {
		throw new Error('Parameter error: \'files\' expects an Iterable or an AsyncIterable type.');
	}

	if (typeof parser !== 'function') {
		throw new Error('Parameter error: \'parser\' expects a function.');
	}

	if (typeof onError !== 'function') {
		throw new Error('Parameter error: \'onError\' expects a function.');
	}

	for await (const file of files) {
		try {
			yield await parser(await readFile(file) as any, file);
		} catch (error) {
			onError(error);
		}
	}
}

export default reader;
