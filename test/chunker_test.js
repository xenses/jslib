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
    print("Test " + trun + " failed: curChunk.chunks[1]['content'] should be 'chunk 2' but is " + c.chunks[1]['content']);
} else {
    tpas++;
}
trun++;
if (c.chunks[2]['content'] != "chunk 3") {
    print("Test " + trun + " failed: curChunk.chunks[2]['content'] should be 'chunk 3' but is " + c.chunks[2]['content']);
} else {
    tpas++;
}


// make sure blank lines before content are ignored
var num = c.chunk("\n\n\n\n#\n\n\nchunk 1\n#\nchunk\n\nnumber\n2")
trun++;
if (num != 2) {
    print("Test " + trun + " failed: chunk() should have returned 2 but returned " + num);
} else {
    tpas++;
}
trun++;
if (! c.chunks instanceof Array) {
    print("Test " + trun + " failed: curChunk.chunks should be instanceof Array");
} else {
    tpas++;
}
trun++;
if (c.chunks.length != 2) {
    print("Test " + trun + " failed: curChunk.chunks.length should be 2 but is " + c.chunks.length);
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
if (c.chunks[1]['content'] != "chunk\n\nnumber\n2") {
    print("Test " + trun + " failed: curChunk.chunks[1]['content'] should be 'chunk\\n2' but is " + c.chunks[1]['content']);
} else {
    tpas++;
}


printSums();
