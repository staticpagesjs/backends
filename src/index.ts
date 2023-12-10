import { join, relative, normalize } from 'path';
import { readdir, readFile, writeFile, stat } from 'fs/promises';
import glob from 'fast-glob';

export namespace nodefsBackend {
	export type Options = {
		since?: Date;
		dependencies?: Record<string, string | string[] | { (matches: string[]): string | string[]; }>;
		cwd?: string;
	};
}

export function nodefsBackend({
	cwd = '.',
	since,
	dependencies,
}: nodefsBackend.Options = {}) {
	return {
		/**
		 * Creates a tree that ignores items older than `since` with no dependencies newer than `since`.
		 *
		 * Format of dependencies:
		 * ```js
		 * {
		 *   "dependency1-pattern": "item1-pattern",
		 *   "dependency2-pattern": ["item1-pattern", "item2-pattern"]
		 *   "dependency3-pattern": (matches) => ["item1-pattern", "item2-pattern"]
		 * }
		 * ```
		 */
		async tree(dirname: string): Promise<string[]> {
			const basedir = normalize(join(cwd, dirname));
			const files: string[] = [];
			const walk = async (directory: string) => {
				const entries = await readdir(directory, { withFileTypes: true });
				const pending: Promise<void>[] = [];
				for (const entry of entries) {
					const entryPath = join(directory, entry.name);
					if (entry.isDirectory()) {
						pending.push(walk(entryPath));
					} else {
						files.push(entryPath);
					}
				}
				await Promise.all(pending);
			};
			await walk(basedir);
			if (!since) return files.map(x => relative(cwd, x));

			// filter by since
			const filesWithMtimes = await Promise.all(
				files.map(file => stat(file).then(stats => [file, stats.mtime] as const))
			);
			if (!dependencies) return filesWithMtimes.filter(x => since < x[1]).map(x => relative(cwd, x[0]));

			// TODO: filterByDeps could be cached

			// filter by updated dependencies
			const filterByDeps = new Set(
				(await Promise.all(
					Object.entries(dependencies).map(async ([dep, target]) => {
						const depsWithMtimes = await Promise.all(
							glob.sync(dep, { cwd }).map(file => stat(join(cwd, file)).then(stats => [file, stats.mtime] as const))
						);
						const updatedDepsWithMtimes = depsWithMtimes.filter(x => since < x[1]);
						if (!updatedDepsWithMtimes.length) return; // no new dependency on this rule

						const pattern = typeof target === 'function' ? target(updatedDepsWithMtimes.map(x => x[0])) : target;

						return glob.sync(pattern, { cwd }).map(file => join(cwd, file));
					})
				))
				.flat(1)
				.filter(Boolean) as unknown as string[] // we filter undefined values.
			);

			return filesWithMtimes.filter(x => {
				return since < x[1] || filterByDeps.has(x[0]);
			}).map(x => relative(cwd, x[0]));
		},

		read(filename: string) {
			return readFile(join(cwd, filename));
		},

		write(filename: string, data: Uint8Array | string) {
			return writeFile(join(cwd, filename), data);
		},
	};
}

export default nodefsBackend;
