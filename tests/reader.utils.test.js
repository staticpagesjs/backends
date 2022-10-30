import { findAll, findByGlob, filterChanged, filterChangedOrTriggered, parseHeader } from '../esm/index.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const testsDir = path.dirname(fileURLToPath(import.meta.url)).replace(/\\/g, '/');

test('findAll() reads everything and possible to filter', async () => {
	const expected = ['file1', 'file2', 'folder/file3']
		.map(x => testsDir + '/input/./' + x + '.txt');

	const output = [...findAll(path.join(testsDir, 'input'), { filter: x => !x.includes('skip.txt') })];

	output.sort((a, b) => a.localeCompare(b));

	expect(output).toEqual(expected);
});

test('findByGlob() reads by pattern and possible to filter and ignore', async () => {
	const expected = ['file1']
		.map(x => testsDir + '/input/./' + x + '.txt');

	const output = [...findByGlob({
		cwd: path.join(testsDir, 'input'),
		pattern: '*.txt',
		ignore: 'skip.txt',
		filter: x => !x.endsWith('2.txt'),
	})];

	output.sort((a, b) => a.localeCompare(b));

	expect(output).toEqual(expected);
});

test('filterChanged() filters newer files only', async () => {
	const expected = ['file1']
		.map(x => testsDir + '/input/./' + x + '.txt');

	const now = new Date();
	const then = new Date();
	then.setFullYear(then.getFullYear() - 1);
	const last = new Date();
	last.setMonth(last.getMonth() - 6);

	const incremental = {
		date: null,
		get() { return last; },
		set(d) { incremental.date = d; }
	};

	fs.utimesSync(testsDir + '/input/file1.txt', now, now);
	fs.utimesSync(testsDir + '/input/file2.txt', then, then);

	const asyncIterable = filterChanged(findByGlob({
		cwd: path.join(testsDir, 'input'),
		pattern: '*.txt',
		ignore: 'skip.txt',
	}), {
		storage: incremental
	});

	const output = [];
	for await (const item of asyncIterable) {
		output.push(item);
	}

	output.sort((a, b) => a.localeCompare(b));

	expect(output).toEqual(expected);
	expect(incremental.date).not.toBeNull();
});

test('filterChangedOrTriggered() filters newer files plus triggered ones only', async () => {
	const expected = ['file1', 'folder/file3']
		.map(x => testsDir + '/input/./' + x + '.txt');

	const now = new Date();
	const then = new Date();
	then.setFullYear(then.getFullYear() - 1);
	const last = new Date();
	last.setMonth(last.getMonth() - 6);

	const incremental = {
		date: null,
		get() { return last; },
		set(d) { incremental.date = d; }
	};

	fs.utimesSync(testsDir + '/input/file1.txt', now, now);
	fs.utimesSync(testsDir + '/input/file2.txt', then, then);
	fs.utimesSync(testsDir + '/input/folder/file3.txt', then, then);

	const asyncIterable = filterChangedOrTriggered(findByGlob({
		cwd: path.join(testsDir, 'input'),
		pattern: '**/*.txt',
		ignore: 'skip.txt',
	}), {
		storage: incremental,
		cwd: path.join(testsDir, 'input'),
		triggers: {
			'*1.txt': 'folder/*'
		}
	});

	const output = [];
	for await (const item of asyncIterable) {
		output.push(item);
	}

	output.sort((a, b) => a.localeCompare(b));

	expect(output).toEqual(expected);
	expect(incremental.date).not.toBeNull();
});

test('parseHeader() makes a standard page object with header', async () => {
	const expected = {
		header: {
			cwd: testsDir + '/input',
			path: 'folder/file3.txt',
			dirname: 'folder',
			basename: 'file3',
			extname: '.txt'
		},
		body: 'hello world'
	};

	const parser = parseHeader(b => JSON.parse(b.toString('utf-8')));

	const output = parser(Buffer.from('{"body":"hello world"}'), testsDir + '/input/./folder/file3.txt');

	expect(output).toEqual(expected);
});
