import { statSync } from 'fs';
import { resolve } from 'path';

import { findByGlob } from './find-by-glob.js';

export namespace findChangedByGlob {
	export type Options = {
		storage: {
			get(): Date | undefined | Promise<Date | undefined>;
			set(date: Date): void;
		};
	} & findByGlob.Options;
}

/**
 * Finds files by glob pattern, keeping only those where the
 * modification time is newer than the time provided by `storage.get()`.
 */
export async function* findChangedByGlob({ cwd = '.', storage, ...rest }: findChangedByGlob.Options) {
	const files = findByGlob({ cwd, ...rest });
	const now = new Date();
	const lastReadTime = await storage.get();
	if (lastReadTime) {
		for await (const file of files) {
			if (lastReadTime < statSync(resolve(cwd, file)).mtime) {
				yield file;
			}
		}
	} else {
		for await (const file of files) {
			yield file;
		}
	}
	storage.set(now);
}

export default findChangedByGlob;
