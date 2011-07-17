var trun = 0;
var tpas = 0;

// load sourcefile
load("../chunker.js");

// instantiate chunker
var c = new chunker;
trun++;
if (c == undefined) {
    print("Test " + trun + " failed: Object instantiation failed (undef)");
} else {
    tpas++;
}
trun++;
if (typeof c != 'object') {
    print("Test " + trun + " failed: Object instantiation failed (bad type)");
} else {
    tpas++;
}
trun++;
if (! c instanceof chunker) {
    print("Test " + trun + " failed: Object instantiation failed (bad instance)");
} else {
    tpas++;
}
trun++;
if (c.curChunk.content) {
    print("Test " + trun + " failed: curChunk.content is not null at object instantiation");
} else {
    tpas++;
}


// try parsing a null document
c.chunk('');
trun++;
if (c.chunkCount == undefined) {
    print("Test " + trun + " failed: curChunk.chunkCount is not defined after chunk()");
} else {
    tpas++;
}
trun++;
if (c.chunkCount != 0) {
    print("Test " + trun + " failed: curChunk.chunkCount should be 0 after chunk('')");
} else {
    tpas++;
}


// ok, let's go for a minimal-ish contentful doc
c.chunk("#test doc 1\nchunk 1\n#\nchunk 2\n#\nchunk 3");
trun++;
if (! c.chunks instanceof Array) {
    print("Test " + trun + " failed: curChunk.chunks should be instanceof Array");
} else {
    tpas++;
}
trun++;
if (c.chunks.length != 3) {
    print("Test " + trun + " failed: curChunk.chunks.length should be 3 but is " + c.chunks.length);
} else {
    tpas++;
}
trun++;
if (c.chunks[0]['content'] != "chunk 1") {
    print("Test " + trun + " failed: curChunk.chunks[0]['content'] should be 'chunk 1' but is " + c.chunks[0]['content']);
} else {
    tpas++;
}
trun++;
if (c.chunks[1]['content'] != "chunk 2") {
    print("Test " + trun + " failed: curChunk.chunks[0]['content'] should be 'chunk 2' but is " + c.chunks[1]['content']);
} else {
    tpas++;
}
trun++;
if (c.chunks[2]['content'] != "chunk 3") {
    print("Test " + trun + " failed: curChunk.chunks[0]['content'] should be 'chunk 3' but is " + c.chunks[2]['content']);
} else {
    tpas++;
}


//----------------------------------------
print("End of test");
print("  Tests run..... " + trun);
print("  Tests passed.. " + tpas);
