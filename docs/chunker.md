Firepear jslib chunker
======================

This script is object-based, so only one copy is needed for any number
of blade elements on any number of pages. No external resources are
needed.

```
<script src="/path/to/chunker.js"></script>
var chunker = new chunker;
```

A chunker object has one method: `chunk`. This method takes a string
as input, and returns the number of chunks found (if the string could
be parsed) or `null` (if the string could not be parsed).

After parsing, the chunks are stored in `chunker.chunks`, which may be
an Array or Object (details below at `chunkNameDirective`).


Line types
----------

Parsing is line-oriented. There are two types of lines: directives,
and everything else.

Consecutive "everything else" lines become the content of the parsed
chunks. Directives determine everything else.


Directives
----------

A directive is a line with `#` as its first character (*not* the first
*non-whitespace* character). If a directive is in the form

```
#WORD:VALUE
```

then it is interpreted as a key/value pair and stored as metadata for
the current chunk.

There are two types of directives: *object directives*, which modify
the behavior of the chunker object, and *chunk directives* which
specify metadata about the current chunk.

Object directives must occur while the chunk count is zero. The
reserved `WORD`s for object directives are:

```
chunkNameDirective -- If set, this directive tells the chunker which
                      chunk directive to use as the name of each
                      chunk. This implies that chunks will be
                      delivered as an Object-of-Objects instead of an
                      Array-of-Objects, which is teh default.

                      If set, and the named directive does not occur
                      in a chunk's metadata, it will be a fatal error.

                      Example: 'chunkNameDirective':'name'
```

The first directive after one or more non-directives signifies the
beginning of a new chunk.
