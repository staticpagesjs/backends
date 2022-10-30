import * as path from 'path';

export function nameByUrl(prefix: string = '') {
	prefix = prefix.replace(/\\/g, '/');
	if (prefix && !prefix.endsWith('/')) prefix += '/';
	return (data: any) =>
		data.url
			? prefix + data.url + '.html'
			: undefined;
}

export default nameByUrl;
