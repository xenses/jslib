var trun = 0;
var tpas = 0;

// load sourcefile
load("../chunker.js");

// instantiate chunker
var chunker = new chunker;
trun++;
if (chunker == undefined) {
    print("Test " + trun + " failed: Object instantiation failed (undef)");
} else {
    tpas++;
}
trun++;
if (typeof chunker != 'object') {
    print("Test " + trun + " failed: Object instantiation failed (bad type)");
} else {
    tpas++;
}
trun++;
if (chunker.curChunk.content) {
    print("Test " + trun + " failed: curChunk.content is not null at object instantiation");
} else {
    tpas++;
}

//----------------------------------------

print("End of test");
print("  Tests run..... " + trun);
print("  Tests passed.. " + tpas);
