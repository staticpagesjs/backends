import assert from 'assert';
import { fileURLToPath } from 'url';
import * as path from 'path';
import nodefs from '../esm/index.js';

const inputDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'input');

describe('read() Tests', () => {
	it('can read one file from the filesystem', async () => {
		const backend = nodefs({
			cwd: inputDir
		});

		const expected = 'file1';
		const output = (await backend.read('file1.txt')).toString().trim();

		assert.deepStrictEqual(output, expected);
	});

	it('can read multiple times', async () => {
		const backend = nodefs({
			cwd: inputDir
		});

		const expected = ['file1', 'file2'];
		const output = [];

		output.push((await backend.read('file1.txt')).toString().trim());
		output.push((await backend.read('./file2.txt')).toString().trim());

		assert.deepStrictEqual(output, expected);
	});

	it('can read from subdirectories', async () => {
		const backend = nodefs({
			cwd: inputDir
		});

		const expected = 'file3';
		const output = (await backend.read('./folder/file3.txt')).toString().trim();

		assert.deepStrictEqual(output, expected);
	});
});
