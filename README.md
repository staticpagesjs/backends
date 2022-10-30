# Static Pages / File provider

This package provides a reader which parses files to an AsyncIterable document stream, and a writer that renders documents to files on the filesystem. Additional utilities also available in this package to find, filter and parse documents.


## Reader

The `reader` is a factory function that creates an AsyncIterable. A list of input files and a document parser callback are its two mandatory inputs.

### Usage
```js
import * as file from '@static-pages/file-provider';

const asyncIterable = file.reader({
  files: file.findByGlob({
    cwd: 'data',
    pattern: '**/*.json',
    ignore: '**/ignored-file*',
  }),
  parser: file.parseHeader(
    body => JSON.parse(body.toString('utf-8'))
  ),
});

// one example source file:
// # /path/to/data/my/folder/file.json
// {"hello":"world"}

// one item in the asyncIterable:
// {
//   header: {
//     cwd: '/path/to/data',
//     path: 'my/folder/file.json',
//     dirname: 'my/folder',
//     basename: 'file',
//     extname: '.json'
//   },
//   hello: 'world'
// }
```

### A simplified reader variant

There is a `simpleReader` implementation if you only need the above functionality.
While the generic `reader` makes it possible to preprocess the list of files and customize the parsed document, usually it is not a required task. For these use cases the `simpleReader` is a better fit because it is easier configurable.

```js
import * as file from '@static-pages/file-provider';

const asyncIterable = file.simpleReader({
  cwd: 'data',
  pattern: '**/*.json',
  ignore: '**/ignored-file*',
  parser: body => JSON.parse(body.toString('utf-8'))
});
```

The two examples are producing equivalent results.

### Utilities for the reader

There are functions to help and generate a list of files for the `reader`:

- `findByGlob` is a glob matcher which will collect all files matching a given pattern.
- `findAll` is a simple recursive directory lister, it will collect all files in the specified directory.

It may be desirable to read only those files which has changed since a given point in time. For these use cases there are two decorators which filters the files list.

- `filterChanged` filters files based on their `mtime` property and a given time, keeping the newer files only.
- `filterChangedOrTriggered` does the same as `filterChanged` with the addition of a triggering mechanism: You can specify file patterns, even outside of the recieved file list. When a file matches these patterns and its `mtime` is newer than a given time, it can keep some files filtered out in the recieved file list.

Another task of the reading is parsing the file contents to an understandable document. At this parsing step, a header may be added to the document to help tracking the source file.

- `parseHeader` captures the filename of the iterated file and creates a `header` object (see reader usage example) containing sliced parts of the path. The full path may contain a `/./` directory segment that marks the `cwd` (the current working directory) for this utility. The `findByGlob` and `findAll` emits paths with these markers.


## Writer

The `writer` is a factory function, its result is another function. While calling the factory, it is possible to set a callback for output file name generation and a renderer that transforms the recieved document to file contents.

### Usage
```js
import { existsSync } from 'fs';
import * as file from '@static-pages/file-provider';

const writeCallback = file.writer({
  namer: [
    file.nameByUrl('dist/'),
    file.nameByHeader('dist/'),
    () => { throw new Error('Cant name document.'); }
  ],
  renderer: d => d.body,
});

const pageData = {
  url: 'folder/file',
  body: '[file contents]',
};

writeCallback(pageData); // writes to a file named 'dist/folder/file.html'
```

### A simplified writer variant

For easier usage there is a `simpleWriter` factory function. It has a bit easier configurable options and some defaults are already set.

```js
import { existsSync } from 'fs';
import * as file from '@static-pages/file-provider';

const writeCallback = file.simpleWriter({
  outDir: 'dist',
  renderer: d => d.body,
});

const pageData = {
  url: 'folder/file',
  body: '[file contents]',
};

writeCallback(pageData); // writes to a file named 'dist/folder/file.html'
```

The two examples are producing equivalent results.

Results of the `outFile` callback always gets a `.html` extension if the returned value is extensionless; and the `outDir` is always prepended if its not an absolute path. The `outFile` default behaviour is to try to use the `url` field with a `.html` extension, or when missing use the `header.path` field where the extension is replaced to `.html`.

Its possible to define a `verify` callback where you can check various things before the write is done, eg.: check if the file already exsits and prevent an overwrite.

There is an `onError` callback which gets called when an error occurs.

### Utilities for the writer

There are two helper methods for output naming.

- `nameByHeader` tries to extract `header.path` and replace its extension to `.html`.
- `nameByUrl` tries to use the `url` property and appends a `.html` to it.

Both of these are factory functions.


## Docs

### __`reader(options: reader.Options): AsyncIterable<Record<string, unknown>>`__

Reads documents from the filesystem.

#### `options`
- `files` (required) an iterable or an async iterable list of file names. To generate these lists see `findByGlob()` and `findAll()`.
- `parser` (required) a function that recieves the file contents as a `Buffer` and produces a `Record<string, unknown>` document. Call `buffer.toString('utf-8')` to convert the buffer to string.
- `onError` (default: `(e) => { console.error(e); }`) an error handler that gets called when something throws while reading and parsing the files. Set it to `(e) => { throw e; }` to completely halt the iteration.


### __`findByGlob(options: findByGlob.Options): Iterable<string>`__

Generates an iterable list of files matching a pattern in a directory. The file paths are absolute paths. The configured `cwd` is marked in each path with a `/./` segment. See the file reader example.

#### `options`
- `cwd` (default: `.`) sets the current working directory.
- `pattern` (default: `**`) glob pattern(s) that selects the files to read. Can be a `string` or a `string` array.
- `ignore` (default: `undefined`) glob pattern(s) that selects the files to ignore. Can be a `string` or a `string` array.
- `filter` (default: `undefined`) a callback function that gets called on every file name. Return `true` to keep that filename.


### __`findAll(cwd: string, options: findAll.Options): Iterable<string>`__

Generates an iterable list of all existing files in a directory. The file paths are absolute paths. The configured `cwd` is marked in each path with a `/./` segment. See the file reader example.

#### `cwd`
Sets the current working directory.  
default: `.`

#### `options`
- `filter` (default: `undefined`) a callback function that gets called on every file name. Return `true` to keep that filename.


### __`filterChanged(files: Iterable<string> | AsyncIterable<string>, options: filterChanged.Options): AsyncIterable<string>`__

This decorates an iterable or an async iterable file list, ignoring files that are older than a set date. This date is retrieved by `storage.get()` and when the iteration is done the `storage.set(new Date())` is called to preserve the last execution time.

#### `files`
An iterable or an async iterable list of file names. To generate these lists see `findByGlob()` and `findAll()`.  
Required.

#### `options`
- `storage` (required) an object with `get()` and `set()` members to  store and retrieve `Date` objects. These dates indicates the time of the last execution occured.


### __`filterChangedOrTriggered(files: Iterable<string> | AsyncIterable<string>, options: filterChanged.Options): AsyncIterable<string>`__

This decorates an iterable or an async iterable file list, ignoring files that are older than a set date. This date is retrieved by `storage.get()` and when the iteration is done the `storage.set(new Date())` is called to preserve the last execution time. Additionally you must provide pattern map which describes file relations, eg.: when a file is modified and matches a pattern like `abc*.yaml`, we want to keep the files in the iterable that matches `abc*.md` pattern.

#### `files`
An iterable or an async iterable list of file names. To generate these lists see `findByGlob()` and `findAll()`.  
Required.

#### `options`
- `storage` (required) an object with `get()` and `set()` members to  store and retrieve `Date` objects. These dates indicates the time of the last execution occured.
- `cwd` (default: `.`) sets the current working directory.
- `triggers` (required) an object where the keys and values are glob patterns which defines relations between files. When key matches a modified or new file, all files will be filtered in the result that matches the value.


### __`parseHeader<R extends Record<string, unknown>>(bodyParser?: { (body: Buffer, file: string): R; }): { (body: Buffer, file: string): R; }`__

Helper to parse the full file path into a header segment. See the file reader example.

The returned document contains these properties:
- `data.header.cwd` is the absolute path of the `cwd` set in the options.
- `data.header.path` is the file path relative to the `header.cwd`.
- `data.header.dirname` is equivalent to `path.dirname(header.path)`.
- `data.header.basename` is equivalent to `path.basename(header.path, header.extname)`.
- `data.header.extname` is equivalent to `path.extname(header.path)`.

#### `bodyParser`
Callback function to parse the contents of the file. Eg. a json file should use `d => JSON.parse(d.toString('utf-8'))`.  
Default: return the unchanged buffer in a property named `body`.


### __`simpleReader<T extends Record<string, unknown>>(options: simpleReader.Options): AsyncIterable<Data<T>>`__

This implementation merges the `reader` with its suppiled utilities `findByGlob` and `parseHeader` for ease of use. Usually this is enough and its easier to configure.

#### `options`
- `cwd` (default: `.`) sets the current working directory.
- `pattern` (default: `**`) glob pattern(s) that selects the files to read. Can be a `string` or a `string` array.
- `ignore` (default: `undefined`) glob pattern(s) that selects the files to ignore. Can be a `string` or a `string` array.
- `filter` (default: `undefined`) a callback function that gets called on every file name. Return `true` to keep that filename.
- `parser` (default: return the unchanged buffer in a property named `body`) a callback function to parse the contents of the file. Eg. a json file should use `d => JSON.parse(d.toString('utf-8'))`.


### __`writer(options: writer.Options): { (data: Record<string, unknown>): void }`__

Writes documents to the filesystem.

#### `options`
- `namer` (required) a callback (async or regular) that generates a full absolute file name for the output. It can be function or an array of functions.
- `renderer` (required) a callback (async or regular) that generates the file contents. It can return a `string`, a `NodeJS.ArrayBufferView` or `void`. In the latter case, the writing is omitted.
- `onError` (default: `(e) => { console.error(e); }`) an error handler that gets called when something throws while rendering and writing the files.


### __`nameByHeader(prefix: string = ''): { (data: Record<string, unknown>): string | void }`__

Tries to name output files the same as the input was. Replaces the original filename extension to `.html`.

#### `prefix`
A path fragment that is prepended to the result. Eg. if set to `dist/` the outputs will named like `dist/file.html`.  
Defaults to empty string, you probably want to change this.


### __`nameByUrl(prefix: string = ''): { (data: Record<string, unknown>): string | void }`__

Tries to name output files by the `url` property of the document. Appends `.html` extension to it.

#### `prefix`
A path fragment that is prepended to the result. Eg. if set to `dist/` the outputs will named like `dist/file.html`.  
Defaults to empty string, you probably want to change this.


### __`simpleWriter(options: simpleWriter.Options): { (data: Record<string, unknown>): void }`__

Merges the `writer` with its utilities `nameByHeader` and `nameByUrl` plus introduces some configuration simplifications for ease of use.

#### `options`
- `outDir` (default: `dist`) a directory where the output files will be preserved.
- `outFile` (default: try to name files with `nameByUrl` then `nameByHeader` whichever succeeds first) a callback function that generates the output name. The `outDir` is prepended automatically to this value.
- `verify` (optional) is a tester function that can stop the writing of the file. It recieves the proposed filename, the source document and the rendered output as parameters in this order. When it returns falsy values then the write is omitted.
- `renderer` (required) a callback (async or regular) that generates the file contents. It can return a `string`, a `NodeJS.ArrayBufferView` or `void`. In the latter case, the writing is omitted.
- `onError` (default: `(e) => { console.error(e); }`) an error handler that gets called when something throws while rendering and writing the files.


### Other notes

- Windows style backslashes are always normalized to Unix style forward slashes in paths.


## Where to use this?
This module can be used to generate static HTML pages from/to file based sources. Read more at the [Static Pages JS project page](https://staticpagesjs.github.io/).
