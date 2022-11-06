import * as path from 'path';

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
 * Creates a `header` property containing segments of the file full path.
 *
 * The return type depends on the provided `bodyParser` return type. If its a Promise, this call also returns a Promise.
 */
export function parseHeader(): {
	(body: Buffer, file: string): Data<{ body: Buffer; }>;
};

/**
 * Creates a `header` property containing segments of the file full path.
 *
 * The return type depends on the provided `bodyParser` return type. If its a Promise, this call also returns a Promise.
 */
export function parseHeader<R extends Record<string, unknown>>(bodyParser: { (body: Buffer, file: string, options: Record<string, unknown>): R; }): {
	(body: Buffer, file: string): Data<R>;
};

/**
 * Creates a `header` property containing segments of the file full path.
 *
 * The return type depends on the provided `bodyParser` return type. If its a Promise, this call also returns a Promise.
 */
export function parseHeader<R extends Record<string, unknown>>(bodyParser: { (body: Buffer, file: string, options: Record<string, unknown>): Promise<R>; }): {
	(body: Buffer, file: string): Promise<Data<R>>;
};

/**
 * Creates a `header` property containing segments of the file full path.
 *
 * The return type depends on the provided `bodyParser` return type. If its a Promise, this call also returns a Promise.
 */
export function parseHeader(bodyParser: { (body: any, file: string, options: Record<string, unknown>): any | Promise<any>; } = body => ({ body })) {
	if (bodyParser.constructor.name === 'AsyncFunction') {
		return async (body: Buffer, file: string, options: { cwd?: string; [k: string]: unknown; }) => {
			const extName = path.extname(file);
			const { header, ...payload } = await (bodyParser(body, file, options) as Promise<any>);
			return {
				header: {
					cwd: path.resolve(options.cwd ?? '.').replace(/\\/g, '/'),
					path: file,
					dirname: path.dirname(file),
					basename: path.basename(file, extName),
					extname: extName
				},
				...payload
			};
		};
	} else {
		return (body: Buffer, file: string, options: { cwd?: string; [k: string]: unknown; }) => {
			const extName = path.extname(file);
			const { header, ...payload } = bodyParser(body, file, options);
			return {
				header: {
					cwd: path.resolve(options.cwd ?? '.').replace(/\\/g, '/'),
					path: file,
					dirname: path.dirname(file),
					basename: path.basename(file, extName),
					extname: extName
				},
				...payload
			};
		};
	};
}

export default parseHeader;
