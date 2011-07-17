// load test lib
load("../test.js");

// load sourcefile
load("../chunker.js");

// instantiate chunker
var c = new chunker;
isnt(c, undefined,  "Object instantiation failed (undef)");
is(typeof c, 'object', "Object instantiation failed (bad type)");
is(c instanceof chunker, true, "Object instantiation failed (bad instance)");

// try parsing a null document
is(c.chunk(''), 0, "Parsing null document should yield zero");
is (c.chunkCount, 0, "curChunk.chunkCount should be 0 after chunk('')");

// ok, let's go for a minimal-ish contentful doc
is(c.chunk("#test doc 1\nchunk 1\n#\nchunk 2\n#\nchunk 3"), 3, "chunk() should return 3");
is(c.chunks instanceof Array, true, "curChunk.chunks should be instanceof Array");
is(c.chunks.length, 3, "curChunk.chunks.length should be 3");
is(c.chunks[0]['content'], "chunk 1", "curChunk.chunks[0]['content'] mismatch");
is(c.chunks[1]['content'], "chunk 2", "curChunk.chunks[1]['content'] mismatch");
is(c.chunks[2]['content'], "chunk 3", "curChunk.chunks[2]['content'] mismatch");

// make sure blank lines before content are ignored
is(c.chunk("\n\n\n\n#\n\n\nchunk 1\n#\nchunk\n\nnumber\n2"), 2, "chunk() should return 2");
is(c.chunks instanceof Array, true, "curChunk.chunks should be instanceof Array");
is(c.chunks.length, 2, "curChunk.chunks.length should be 2");
is(c.chunks[0]['content'], "chunk 1", "chunks[0]['content'] mismatch");
is(c.chunks[1]['content'], "chunk\n\nnumber\n2", "chunks[1]['content'] mismatch");

// end-of-run
testPrintSummary();
