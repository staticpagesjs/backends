import * as path from 'path';

export function nameByHeader(prefix: string = '') {
	prefix = prefix.replace(/\\/g, '/');
	if (prefix && !prefix.endsWith('/')) prefix += '/';
	return (data: any) =>
		data.header?.path
			? prefix
			+ data.header.path.substring(0, data.header.path.length - path.extname(data.header.path).length)
			+ '.html'
			: undefined;
}

export default nameByHeader;
