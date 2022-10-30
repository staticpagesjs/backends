import * as fs from 'fs';
import * as path from 'path';

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
 * Always returns absolute paths where cwd is marked with /./ part.
 */
export function* findAll(cwd = '.', {
	filter,
}: {
	filter?(file: string): boolean;
}): Iterable<string> {
	const resolvedCwd = path.resolve(cwd).replace(/\\/g, '/');
	for (const file of readdir(cwd)) {
		if (filter && !filter(file)) continue;
		yield resolvedCwd + '/./' + file;
	}
}

export default findAll;
