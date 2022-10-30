import * as path from 'path';
import glob from 'fast-glob';

/**
 * Finds files by glob pattern.
 * Always returns absolute paths where cwd is marked with /./ part.
 */
export function* findByGlob({
	cwd = '.',
	pattern = '**',
	ignore,
	filter,
}: {
	cwd?: string;
	pattern?: string | string[];
	ignore?: string | string[];
	filter?(file: string): boolean;
}): Iterable<string> {
	const resolvedCwd = path.resolve(cwd).replace(/\\/g, '/');
	for (const file of glob.sync(pattern, {
		cwd: cwd,
		absolute: false,
		caseSensitiveMatch: false,
		...(ignore && { ignore: Array.isArray(ignore) ? ignore : [ignore] }),
	})) {
		if (filter && !filter(file)) continue;
		yield resolvedCwd + '/./' + file;
	}
}

export default findByGlob;
