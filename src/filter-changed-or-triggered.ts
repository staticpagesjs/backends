import * as fs from 'fs';
import * as path from 'path';
import glob from 'fast-glob';
import micromatch from 'micromatch';

const CWD_MARKER_RE = /.*\/\.\//;

const getTriggered = (cwd: string, lastReadTime: Date, triggers: Record<string, string | string[] | { (matches: string[]): string[]; }>) => {
	const result = new Set<string>();

	for (const srcPattern of Object.keys(triggers)) {
		const filesMatchingSrcPattern = glob.sync(srcPattern, {
			absolute: false,
			cwd: cwd,
			caseSensitiveMatch: false
		});

		const changedFilesMatchingSrcPattern = filesMatchingSrcPattern
			.filter(f => lastReadTime < fs.statSync(path.resolve(cwd, f)).mtime);

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
 * Filters absolute file paths, keeping only where the
 * file modification time is newer than the time provided by `storage.get()`
 * or the file path matches patterns provided by triggering files that are newer.
 */
export async function* filterChangedOrTriggered(
	files: Iterable<string> | AsyncIterable<string>,
{
	storage,
	cwd = '.',
	triggers
}: {
	cwd?: string;
	storage: { get(): Date | undefined | Promise<Date | undefined>; set(date: Date): void; };
	triggers: Record<string, string | string[] | { (matches: string[]): string[]; }>;
}) {
	const now = new Date();
	const lastReadTime = await storage.get();
	if (lastReadTime) {
		const triggeredPatterns = getTriggered(cwd, lastReadTime, triggers);
		const micromatchOptions: micromatch.Options = {
			nocase: true,
			windows: true,
		};
		for await (const file of files) {
			if (lastReadTime < fs.statSync(file).mtime || micromatch.any(file.replace(CWD_MARKER_RE, ''), triggeredPatterns, micromatchOptions)) {
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

export default filterChangedOrTriggered;
