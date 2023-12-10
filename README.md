# Static Pages / NodeJS Filesystem Backend

This package provides a backend implementation that can work in NodeJS environments using the built-in `fs` module.
Supports incremental builds and dependencies among files.

## Usage
```js
import fsBackend from '@static-pages/nodefs-backend';

const backend = fsBackend({
  cwd: 'path/to/base',
  since: new Date('2023-11-15T22:10:05Z'),
  dependencies: {
    // assume home/en-GB.md embeds content from news/*.md during page generation
    'news/*.md': 'home/en-GB.md',
  }
});
```

> `since` filters the files based on their modification date.\
> `dependencies` filters the files based on their dependencies modification date and only used when `since` is set.


## Docs

### __`nodefsBackend(options: Options): Backend`__

Creates a backend interface with the given options.

```ts
type Options = {
  since?: Date;
  dependencies?: Record<string, string | string[] | { (matches: string[]): string | string[]; }>;
  cwd?: string;
};
interface Backend {
  tree(dirname: string): MaybePromise<Iterable<string> | AsyncIterable<string>>;
  read(filename: string): MaybePromise<Uint8Array | string>;
  write(filename: string, data: Uint8Array | string): MaybePromise<void>;
}
type MaybePromise<T> = T | Promise<T>;
```

#### `options`
- `cwd` (default: `process.cwd()`) sets the current working directory.
- `since` (optional) when set, `tree()` call will filter files based on their modification time compared to this date.
- `dependencies` (optional) when set, `tree()` call will filter files based on their dependencies modification date. Only effective when `since` is set.
   Define this as an object where the keys are glob patterns of the dependencies and their values are patterns of the dependant files.
   When the value is a callback, it will recieve the matching dependency filenames that are newer than `since`, based on this list you can generate dependent file patterns.


### __`backend.tree(dirname: string)`__

Reads all existing filenames in a given directory to an array.

- The `dirname` must be a relative path to the `cwd` set in the options.
- The returned filenames are relative to `dirname`.


### __`backend.read(filename: string)`__

Reads the contents of a given file.


### __`backend.write(filename: string, data: Uint8Array | string)`__

Writes contents to a given file.


## Where to use this?
This module can be used to generate static HTML pages from/to file based sources. Read more at the [Static Pages JS project page](https://staticpagesjs.github.io/).
