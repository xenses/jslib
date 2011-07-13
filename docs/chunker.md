Firepear jslib chunker
======================

This script is object-based, so only one copy is needed for any number
of blade elements on any number of pages. No external resources are
needed.

A chunker object has one method: `chunk`. This method takes a string
as input, and returns either a structure (if the string could be
parsed into chunks) or `null` (if the string could not be parsed).


Line types
----------

Parsing is line-oriented. There are two types of lines: directives,
and everything else.

Consecutive "everything else" lines become the content of the parsed
chunks. Directives determine everything else.


Directives
----------

A directive is a line with `#` as its first character (*not* the first
*non-whitespace* character).

The first directive after any nonzero number of non-directives
signifies the beginning of a new chunk.

There are two types of directives: *object directives*, which modify
the behavior of the chunker object, and *chunk directives* which
specify metadata about the current chunk.