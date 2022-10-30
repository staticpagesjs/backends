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
 * To mark the current working directory in a path, put a `/./` marker in the proper position.
 *
 * The return type depends on the provided `bodyParser` return type. If its a Promise, this also returns a Promise.
 */
export function parseHeader(): {
	(body: Buffer, file: string): Data<{ body: Buffer; }>;
};

/**
 * Creates a `header` property containing segments of the file full path.
 *
 * To mark the current working directory in a path, put a `/./` marker in the proper position.
 *
 * The return type depends on the provided `bodyParser` return type. If its a Promise, this also returns a Promise.
 */
export function parseHeader<R extends Record<string, unknown>>(bodyParser: { (body: Buffer, file: string): R; }): {
	(body: Buffer, file: string): Data<R>;
};

/**
 * Creates a `header` property containing segments of the file full path.
 *
 * To mark the current working directory in a path, put a `/./` marker in the proper position.
 *
 * The return type depends on the provided `bodyParser` return type. If its a Promise, this also returns a Promise.
 */
export function parseHeader<R extends Record<string, unknown>>(bodyParser: { (body: Buffer, file: string): Promise<R>; }): {
	(body: Buffer, file: string): Promise<Data<R>>;
};

/**
 * Creates a `header` property containing segments of the file full path.
 *
 * To mark the current working directory in a path, put a `/./` marker in the proper position.
 *
 * The return type depends on the provided `bodyParser` return type. If its a Promise, this also returns a Promise.
 */
export function parseHeader(bodyParser: { (body: any, file: string): any | Promise<any>; } = body => ({ body })) {
	if (bodyParser.constructor.name === 'AsyncFunction') {
		return async (body: Buffer, file: string) => {
			const parts = file.split('/./');
			const [cwd, relativeFile] = parts.length > 1 ? parts : ['', file];
			const extName = path.extname(relativeFile);
			const { header, ...payload } = await (bodyParser(body, file) as Promise<any>);
			return {
				header: {
					cwd,
					path: relativeFile,
					dirname: path.dirname(relativeFile),
					basename: path.basename(relativeFile, extName),
					extname: extName
				},
				...payload
			};
		};
	} else {
		return (body: Buffer, file: string) => {
			const parts = file.split('/./');
			const [cwd, relativeFile] = parts.length > 1 ? parts : ['', parts[0]];
			const extName = path.extname(relativeFile);
			const { header, ...payload } = bodyParser(body, file);
			return {
				header: {
					cwd,
					path: relativeFile,
					dirname: path.dirname(relativeFile),
					basename: path.basename(relativeFile, extName),
					extname: extName
				},
				...payload
			};
		};
	};
}

export default parseHeader;
