import * as fs from 'fs';

export namespace findAll {
	export type Options = {
		cwd?: string;
		filter?(file: string): boolean;
	};
}

const readdir = (dir: string) => {
	const files: string[] = [];
	const readdir = (dir: string, prefix = '') => {
		for (const dirent of fs.readdirSync(dir, { withFileTypes: true })) {
			if (dirent.isDirectory()) {
				readdir(dir + '/' + dirent.name, prefix + dirent.name + '/');
			} else {
				files.push(prefix + dirent.name);
			}
		}
	};
	readdir(dir.replace(/[\\/]+$/, ''));
	return files;
};

/**
 * Finds all files in a directory.
 * Always returns relative paths to cwd.
 */
export function* findAll({
	cwd = '.',
	filter,
}: findAll.Options): Iterable<string> {
	if (typeof filter === 'function') {
		for (const file of readdir(cwd)) {
			if (filter(file)) yield file;
		}
	} else {
		for (const file of readdir(cwd)) {
			yield file;
		}
	}
}

export default findAll;
