// chunker.js
// v1.0.0 - 14 July 2011
//
// Turn a formatted string into a datastructure, or not

//-----------------------------------------------------------------------

// Copyright (c) 2011, Shawn Boyette, Firepear Informatics
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions
// are met:
//
// * Redistributions of source code must retain the above copyright
//   notice, this list of conditions and the following disclaimer.
//
// * Redistributions in binary form must reproduce the above copyright
//   notice, this list of conditions and the following disclaimer in
//   the documentation and/or other materials provided with the
//   distribution.
//
// * Neither the name of Firepear Informatics nor the names of its
//   contributors may be used to endorse or promote products derived
//   from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
// FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
// COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
// INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
// HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
// STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
// OF THE POSSIBILITY OF SUCH DAMAGE

//-----------------------------------------------------------------------

function chunker(args) {
    // variables
    this.dirRe         = /^#/;
    this.dirExtractRe  = /^#(\w+):(.+)/;
    this.somethingRe   = /\S/;
    this.error         = null;
    this.objectDirList = { 'chunkName':true };
    this.ods = { 'chunkNamed':false };
    // methods
    this.chunk     = chunk;
    this.parseLine = parseLine;
    this.stowChunk = stowChunk;
}

function chunk(string) {
    // reset chunks storage & chunk count
    this.chunks     = new Array;
    this.chunkCount = 0;
    this.curChunk   = { 'content':null, 'meta':{} };
    // split string
    var lines = string.split("\n");
    var numLines = lines.length;
    // process lines
    for (this.i = 0; this.i < numLines; this.i++) {
        if (this.error) break;
        this.parseLine(lines[this.i]);
    }
    // stow last chunk
    if (this.curChunk.content) this.stowChunk();
    // done
    if (this.error) return null;
    return this.chunkCount
}

function parseLine(line) {
    if (this.dirRe.test(line)) {
        if (this.curChunk.content) {
            // if we're looking at a directive and the current chunk
            // has content, then we're the first directive in a new
            // chunk and must handle chunk reset duties:
            this.stowChunk();
            if (this.error) return;
            // reset curChunk
            this.curChunk = { 'content':null, 'meta':{} };
        }
        // unless it looks like a key/value line, we actually don't
        // care. it's effectively a comment but still counts for chunk
        // separation purposes
        var kv = this.dirExtractRe.exec(line);
        if (kv != null && kv.length > 0) {
            // handle object directives
            if (this.objectDirList[kv[1]]) {
                if (this.chunkCount > 0) {
                    this.error = "Object directive found after first chunk at line" + (this.i + 1);
                    return;
                }
                // change chunks container to an object if named
                // chunks are called for
                if (kv[1] == 'chunkName') this.chunks = new Object;
                // set object directive
                this.ods[kv[1]] = kv[2];
                return;
            }
            // handle other directives
            this.curChunk.meta[kv[1]] = kv[2];
        }
    } else {
        // ignore blank lines until we're inside content
        if (!this.somethingRe.test(line) && !this.curChunk.content) return;
        // if we're the first line of content, convert from null to empty array
        if (!this.curChunk.content) this.curChunk.content = new Array;
        // add line
        this.curChunk.content.push(line);
    }
}

function stowChunk() {
    // increment chunk counter
    this.chunkCount++;
    // stitch content back together
    this.curChunk.content = this.curChunk.content.join("\n");            
    if (this.ods.chunkName) {
        // name-based (object) chunks
        if (!this.curChunk.meta[this.ods.chunkName]) {
            this.error = "Named chunks are in effect but no directive '" + this.ods.chunkName + "' for chunk ending at line " + this.i;
            return;
        }
        this.chunks[this.curChunk.meta[this.ods.chunkName]] = this.curChunk;
    } else {
        // array chunks
        this.chunks.push(this.curChunk);
    }            
}