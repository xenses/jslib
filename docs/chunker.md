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
as input. It returns the number of chunks found (if the string could
be parsed), zero if there were no parsable chunks, or `null` if there
was an error.

After parsing, the chunks are stored in `chunker.chunks`, which may be
an Array or Object (details below at `chunkNameDirective`). If an
error is indicated, the error message will be found in
`chunker.error`.


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
chunkName -- If set, this directive tells the chunker which chunk
             directive to use as the name of each chunk. This implies
             that chunks will be delivered as an Object-of-Objects
             instead of an Array-of-Objects, which is the default.

             If set, and the given directive does not occur in a
             chunk's metadata, it will be a fatal error.

             Example: 'chunkName':'name'
```

The first directive after one or more non-directives signifies the
beginning of a new chunk.


Example
-------

```
# this is an example file to be parsed by chunker.js
#
# anything that starts with a '#' is considered a directive, including
# otherwise-blank lines like the one above.
#
# any directive will trigger a chunk "break", but unless they look
# like a key/value pair as defined above, they are otherwise ignored
# and are, basically, comments.
#
# here's a key/value directive:
#
#foo:23 skidoo
#
# The key here is 'foo' and the value is '23 skidoo'. This doesn't
# work though:
#
# foo : 23 skidoo
#
# because there can't be any spaces until after the colon. Also, the
# part before the colon has can consist only of alphanumerics and '_'.
#
# Let's make this parse run use name-based chunk storage instead of
# array-based.
#
#chunkName:name
#
# Now we have to have a directive with a key of 'name' for every
# chunk, or the parse run will fail.
#
#name:alice
#
# we can define as many other key/value pairs as we want on each
# chunk. The chunker doesn't know about any of them except the Object
# Directives, and simply stows them. This is what this first chunk
# would look like so far, for instance:
#
# {
#   'content':null,
#   'meta':{
#            'foo':'23 skidoo',
#            'name':'alice'
#          }
# }
#
# time to add some actual content
<p>
  Probably in the form of fragmentary HTML documents, but anything
  goes.
</p>


Whatever goes here gets copied into the chunk content verbatim.

# Until the next directive is encountered, which terminates processing
# of the current chunk and begins the next.
#
# And so on, and so on.
```