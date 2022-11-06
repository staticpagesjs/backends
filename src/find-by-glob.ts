import glob from 'fast-glob';

export namespace findByGlob {
	export type Options = {
		cwd?: string;
		pattern?: string | string[];
		ignore?: string | string[];
		filter?(file: string): boolean;
	};
}

/**
 * Finds files by glob pattern.
 * Always returns relative paths to cwd.
 */
export function* findByGlob({
	cwd = '.',
	pattern = '**',
	ignore,
	filter
}: findByGlob.Options): Iterable<string> {
	for (const file of glob.sync(pattern, {
		cwd: cwd,
		absolute: false,
		caseSensitiveMatch: false,
		...(ignore && { ignore: Array.isArray(ignore) ? ignore : [ignore] }),
	})) {
		if (filter && !filter(file)) continue;
		yield file;
	}
}

export default findByGlob;
