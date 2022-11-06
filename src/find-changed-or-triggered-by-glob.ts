import * as fs from 'fs';
import { resolve } from 'path';
import glob from 'fast-glob';
import micromatch from 'micromatch';

import { findByGlob } from './find-by-glob.js';

export namespace findChangedOrTriggeredByGlob {
	export type Options = {
		cwd?: string;
		triggers: Record<string, string | string[] | { (matches: string[]): string[]; }>;
		storage: {
			get(): Date | undefined | Promise<Date | undefined>;
			set(date: Date): void;
		};
	} & findByGlob.Options;
}

const getTriggered = (cwd: string, lastReadTime: Date, triggers: Record<string, string | string[] | { (matches: string[]): string[]; }>) => {
	const result = new Set<string>();

	for (const srcPattern of Object.keys(triggers)) {
		const filesMatchingSrcPattern = glob.sync(srcPattern, {
			absolute: false,
			cwd: cwd,
			caseSensitiveMatch: false
		});

		const changedFilesMatchingSrcPattern = filesMatchingSrcPattern
			.filter(f => lastReadTime < fs.statSync(resolve(cwd, f)).mtime);

		if (changedFilesMatchingSrcPattern.length > 0) {
			const dest = triggers[srcPattern];
			if (typeof dest === 'function') {
				const destPatterns = dest(changedFilesMatchingSrcPattern);
				for (const pattern of destPatterns) {
					result.add(pattern);
				}
			} else if (Array.isArray(dest)) {
				for (const pattern of dest) {
					result.add(pattern);
				}
			} else {
				result.add(dest);
			}
		}
	}
	return [...result];
};

/**
 * Finds files by glob pattern, keeping only those where the
 * modification time is newer than the time provided by `storage.get()` or
 * the file path matches patterns provided by triggering files that are newer.
 */
export async function* findChangedOrTriggeredByGlob({ cwd = '.', triggers, storage, ...rest }: findChangedOrTriggeredByGlob.Options) {
	const files = findByGlob({ cwd, ...rest });
	const now = new Date();
	const lastReadTime = await storage.get();
	if (lastReadTime) {
		const triggeredPatterns = getTriggered(cwd, lastReadTime, triggers);
		for await (const file of files) {
			if (lastReadTime < fs.statSync(resolve(cwd, file)).mtime || micromatch.any(file, triggeredPatterns)) {
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

export default findChangedOrTriggeredByGlob;
