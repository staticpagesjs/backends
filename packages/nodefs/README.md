# Static Pages / NodeJS Filesystem Backend

This package provides a backend implementation that can work in NodeJS environments using the built-in `fs` module.
Supports incremental builds and dependencies among files.

## Usage
```js
import staticPages from '@static-pages/core';
import nodefs from '@static-pages/nodefs';
import { existsSync, readFileSync, writeFileSync } from 'fs';

const lastFilename = '.last';
const currentDate = new Date();
const proviousDate = existsSync(lastFilename) ? new Date(readFileSync(lastFilename, 'utf-8')) : undefined;

const fsBackend = nodefs({
  cwd: 'path/to/base',
  since: proviousDate,
  dependencies: {
    // when any news changes, consider the home page as changed (eg. we also display news there)
    'news/*.md': 'home/en-GB.md',
  }
});

const generator = staticPages.with({
  from: { backend: fsBackend },
  to: { backend: fsBackend },
});

generator(
  // routes
)
.then(() => {
  writeFileSync(lastFilename, currentDate.toJSON());
});
```

> `since` filters the files based on their modification date.\
> `dependencies` filters the files based on their dependencies modification date.


## Docs

### __`nodefs(options: Options): Backend`__

Creates a backend interface with the given options.
For details about the `Backend` interface see [@static-pages/core](https://www.npmjs.com/package/@static-pages/core) package.

```ts
type Options = {
  cwd?: string;
  since?: Date;
  dependencies?: Record<string, string | string[] | { (matches: string[]): string | string[]; }>;
};
```

#### `options`
- `cwd` (default: `process.cwd()`) sets the current working directory.
- `since` (optional) when set, `tree()` call will filter files based on their modification time compared to this date. This date should be serialized to / unserialized from a persistent storage.
- `dependencies` (optional) when set, `tree()` call will filter files based on their dependencies modification date. Only effective when `since` is set.
   Define this as an object where the keys are glob patterns of the dependencies and their values are patterns of the dependant files.
   When the value is a callback, it will recieve the matching dependency filenames that are newer than `since`, based on this list you can generate dependent file patterns.


## Where to use this?
This package can enable the staticPages generator to work on the local filesystem.
Read more at the [Static Pages JS project page](https://staticpagesjs.github.io/).
