import { simpleReader } from '../esm/index.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const testsDir = path.dirname(fileURLToPath(import.meta.url)).replace(/\\/g, '/');

test('it reads the specified files by glob and parses its contents', async () => {
	const expected = [{
		header: {
			cwd: testsDir + '/input',
			path: 'file1.txt',
			dirname: '.',
			basename: 'file1',
			extname: '.txt',
		},
		body: 'hello file1'
	}];

	const asyncIterable = simpleReader({
		cwd: path.join(testsDir, 'input'),
		pattern: '*.txt',
		ignore: 'skip.txt',
		filter: x => !x.endsWith('2.txt'),
		encoding: 'utf-8',
		parser(body) {
			return { body: 'hello ' + body.trim() };
		},
	});

	const output = [];
	for await (const item of asyncIterable) {
		output.push(item);
	}

	output.sort((a, b) => a.body.localeCompare(b.body));

	expect(output).toEqual(expected);
});
