import { reader } from './reader.js';
import { findByGlob } from './find-by-glob.js';
import { parseHeader } from './parse-header.js';

type Data<T> = {
	header: {
		cwd: string;
		path: string;
		dirname: string;
		basename: string;
		extname: string;
	};
} & T;

/**
 * Simply reads documents from the filesystem. Passes a string for the parser callback.
 */
export function simpleReader<T extends Record<string, unknown>>(options: {
	cwd?: string;
	pattern?: string | string[];
	ignore?: string | string[];
	filter?(file: string): boolean;
	parser?: { (body: string, file: string): T | Promise<T>; },
	encoding?: Exclude<BufferEncoding, 'binary'>;
}): AsyncIterable<Data<T>>;

/**
 * Simply reads documents from the filesystem. Passes a Buffer for the parser callback.
 */
export function simpleReader<T extends Record<string, unknown>>(options: {
	cwd?: string;
	pattern?: string | string[];
	ignore?: string | string[];
	filter?(file: string): boolean;
	parser?: { (body: Buffer, file: string): T | Promise<T>; },
	encoding: 'binary';
}): AsyncIterable<Data<T>>;

/**
 * Simply reads documents from the filesystem.
 */
export function simpleReader<T extends Record<string, unknown>>({
	cwd = '.',
	pattern = '**',
	ignore,
	filter,
	parser,
	encoding = 'utf-8',
}: {
	cwd?: string;
	pattern?: string | string[];
	ignore?: string | string[];
	filter?(file: string): boolean;
	parser?: { (body: any, file: string): T | Promise<T>; },
	encoding?: BufferEncoding;
} = {}): AsyncIterable<Data<T>> {
	return reader({
		files: findByGlob({ cwd, pattern, ignore, filter }),
		parser: parser
			? parseHeader(
				(body, file) => parser(
					encoding !== 'binary' ? body.toString(encoding) : body as any,
					file
				) as any
			)
			: parseHeader(
				(body, file) => ({ body: body.toString(encoding) })
			),
	});
}

export default simpleReader;
