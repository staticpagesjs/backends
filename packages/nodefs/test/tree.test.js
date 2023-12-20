import assert from 'assert';
import { fileURLToPath } from 'url';
import * as path from 'path';
import * as fs from 'fs';
import nodefs from '../esm/index.js';

const inputDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'input');

const time1 = new Date('2023-01-01T00:00:00Z'); // old files
const time2 = new Date('2023-02-01T00:00:00Z'); // last exec
const time3 = new Date('2023-03-01T00:00:00Z'); // new files

describe('tree() Tests', () => {
	before(() => {
		// Set predefined mtimes for each file as git does not preserve that
		fs.utimesSync(path.join(inputDir, 'file1.txt'), time1, time1); // old
		fs.utimesSync(path.join(inputDir, 'file2.txt'), time1, time1); // old
		fs.utimesSync(path.join(inputDir, 'skip.txt'), time3, time3); // new
		fs.utimesSync(path.join(inputDir, 'folder/file3.txt'), time3, time3); // new
	});

	it('can read one file from the filesystem', async () => {
		const backend = nodefs({
			cwd: inputDir,
		});

		const expected = [
			'file1.txt',
			'file2.txt',
			'skip.txt',
			path.join('folder', 'file3.txt')
		];
		const output = await backend.tree('.');

		assert.deepStrictEqual(output, expected);
	});

	it('can list subdirectories', async () => {
		const backend = nodefs({
			cwd: inputDir,
		});

		const expected = [
			'file3.txt'
		];
		const output = await backend.tree('folder');

		assert.deepStrictEqual(output, expected);
	});

	it('reads only newer files using since', async () => {
		const backend = nodefs({
			cwd: inputDir,
			since: time2
		});

		const expected = [
			'skip.txt',
			path.join('folder', 'file3.txt')
		];
		const output = await backend.tree('.');

		assert.deepStrictEqual(output, expected);
	});

	it('corretly handles simple dependencies', async () => {
		const backend = nodefs({
			cwd: inputDir,
			since: time2,
			dependencies: {
				'folder/*': 'file2.*',
			}
		});

		const expected = [
			'file2.txt',
			'skip.txt',
			path.join('folder', 'file3.txt')
		];
		const output = await backend.tree('.');

		assert.deepStrictEqual(output, expected);
	});

	it('corretly handles array dependencies', async () => {
		const backend = nodefs({
			cwd: inputDir,
			since: time2,
			dependencies: {
				'folder/*': ['file2.*', 'file1.*'],
			}
		});

		const expected = [
			'file1.txt',
			'file2.txt',
			'skip.txt',
			path.join('folder', 'file3.txt')
		];
		const output = await backend.tree('.');

		assert.deepStrictEqual(output, expected);
	});

	it('corretly handles simple callback dependencies', async () => {
		const backend = nodefs({
			cwd: inputDir,
			since: time2,
			dependencies: {
				'folder/*': (m) => {
					if (JSON.stringify(m) !== '["folder/file3.txt"]') {
						throw new Error('Expected file list at matches.');
					}
					return 'file2.*';
				},
			}
		});

		const expected = [
			'file2.txt',
			'skip.txt',
			path.join('folder', 'file3.txt')
		];
		const output = await backend.tree('.');

		assert.deepStrictEqual(output, expected);
	});

	it('corretly handles array callback dependencies', async () => {
		const backend = nodefs({
			cwd: inputDir,
			since: time2,
			dependencies: {
				'folder/*': () => ['file2.*', 'file1.*'],
			}
		});

		const expected = [
			'file1.txt',
			'file2.txt',
			'skip.txt',
			path.join('folder', 'file3.txt')
		];
		const output = await backend.tree('.');

		assert.deepStrictEqual(output, expected);
	});

	it('ignores dependencies where the dependency is old', async () => {
		const backend = nodefs({
			cwd: inputDir,
			since: time2,
			dependencies: {
				'file1.txt': 'file2.txt',
			}
		});

		const expected = [
			'skip.txt',
			path.join('folder', 'file3.txt')
		];
		const output = await backend.tree('.');

		assert.deepStrictEqual(output, expected);
	});
});
