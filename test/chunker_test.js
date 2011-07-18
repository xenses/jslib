// load test lib
load("../test.js");

// load sourcefile
load("../chunker.js");

// instantiate chunker
var c = new chunker;
isnt(c, undefined,  "c should exist");
is(typeof c, 'object', "..and it should be an object");
is(c instanceof chunker, true, "...and it should be a 'chunker' instance");

// try parsing a null document
is(c.chunk(''), 0, "Parsing null document should yield zero");
is(c.error, null, "no error");
is (c.chunkCount, 0, "curChunk.chunkCount should be 0 after chunk('')");

// ok, let's go for a minimal-ish contentful doc
is(c.chunk("#test doc 1\nchunk 1\n#\nchunk 2\n#\nchunk 3"), 3, "chunk() should return 3 here");
is(c.error, null, "no error");
is(c.chunks instanceof Array, true, "curChunk.chunks should be instanceof Array");
is(c.chunks.length, 3, "curChunk.chunks.length should be 3");
is(c.chunks[0].content, "chunk 1", "curChunk.chunks[0].content mismatch");
is(c.chunks[1].content, "chunk 2", "curChunk.chunks[1].content mismatch");
is(c.chunks[2].content, "chunk 3", "curChunk.chunks[2].content mismatch");

// make sure blank lines before content are ignored
is(c.chunk("\n\n\n\n#\n\n\nchunk 1\n#\nchunk\n\nnumber\n2"), 2, "chunk() should return 2 here");
is(c.error, null, "no error");
is(c.chunks instanceof Array, true, "curChunk.chunks should be instanceof Array");
is(c.chunks.length, 2, "curChunk.chunks.length should be 2");
is(c.chunks[0].content, "chunk 1", "chunks[0].content mismatch");
is(c.chunks[1].content, "chunk\n\nnumber\n2", "chunks[1].content mismatch");

// let's go k/v directives
is(c.chunk("#foo:bar\none\n#a:1\n#b:2\n#c:3 4 5\ntwo\n#\nthree"), 3, "three chunks, two with metadata");
is(c.error, null, "no error");
is(c.chunks[0].content, "one", "first chunk content");
is(typeof c.chunks[0].meta, "object", "first chunk should have metadata");
is(c.chunks[0].meta.foo, "bar", "first chunk should have one metadata item named foo, value bar");
is(c.chunks[0].meta.bar, undefined, "first chunk shouldn't have any other metadata (1)");
is(c.chunks[0].meta.a, undefined, "first chunk shouldn't have any other metadata (2)");
is(c.chunks[1].content, "two", "second chunk content");
is(typeof c.chunks[1].meta, "object", "second chunk should have metadata (1)");
is(Object.keys(c.chunks[1].meta), 'a,b,c', "2nd chunk should have metadata (2)");
is(c.chunks[1].meta.a, 1, "2nd chunk meta.a");
is(c.chunks[1].meta.b, 2, "2nd chunk meta.b");
is(c.chunks[1].meta.c, "3 4 5", "2nd chunk meta.c");
is(c.chunks[2].content, "three", "3rd chunk content");
is(Object.keys(c.chunks[2].meta), '', "3rd chunk should not have metadata");

// now try named chunks
is(c.chunk("#chunkName:name\n#name:first\none\n#name:second\ntwo\n#name:third\nthree"),3,"three chunks, named");
is(c.error, null, "no error");
is(Object.keys(c.chunks), 'first,second,third', "chunk names");
is(c.chunks.first.content, 'one', "first named chunk content");
is(c.chunks.second.content, 'two', "2nd named chunk content");
is(c.chunks.third.content, 'three', "3rd named chunk content");

// named with metadata
is(c.chunk("#chunkName:name\n#name:first\none\n#name:second\n#a:1\n#b:2\ntwo"),2,"2 chunks, named, with metadata");
is(c.error, null, "no error");
is(Object.keys(c.chunks), 'first,second', "chunk names");
is(Object.keys(c.chunks.first.meta), 'name', "1st chunk has no metadata (except name)");
is(Object.keys(c.chunks.second.meta), 'name,a,b', "2nd chunk does");
is(c.chunks.second.meta.a, 1, "2nd chunk meta.a");
is(c.chunks.second.meta.b, 2, "2nd chunk meta.b");

// error test: object directives must come before first chunk
is(c.chunk("#name:first\none\n#chunkName:name\n#name:second\n#a:1\n#b:2\ntwo"), null, "object directives can't come after a chunk");
is(c.error, "Object directive found after first chunk at line 3", "err msg");

// error test: named chunks but no name!
is(c.chunk("#chunkName:name\n#name:first\none\n#name:second\ntwo\n#\nthree"), null, "");
is(c.error, "Named chunks are in effect but no directive 'name' for chunk ending at line 7", "named chunks must have a name");

// end-of-run
testPrintSummary();
