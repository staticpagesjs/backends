import * as fs from 'fs';

/**
 * Filters absolute file paths, keeping only where the
 * file modification time is newer than the time provided by `storage.get()`.
 */
export async function* filterChanged(
	files: Iterable<string> | AsyncIterable<string>,
	{ storage }: { storage: { get(): Date | undefined | Promise<Date | undefined>; set(date: Date): void; }; }
) {
	const now = new Date();
	const lastReadTime = await storage.get();
	if (lastReadTime) {
		for await (const file of files) {
			if (lastReadTime < fs.statSync(file).mtime) {
				yield file;
			}
		}
	} else {
		for await (const file of files) {
			yield file;
		}
	}
	storage.set(now);
}

export default filterChanged;
