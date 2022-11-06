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
	const files = glob.sync(pattern, {
		cwd: cwd,
		absolute: false,
		caseSensitiveMatch: false,
		...(ignore && { ignore: Array.isArray(ignore) ? ignore : [ignore] }),
	});

	if (typeof filter === 'function') {
		for (const file of files) {
			if (filter(file)) yield file;
		}
	} else {
		for (const file of files) {
			yield file;
		}
	}
}

export default findByGlob;
