// blades.js
// v1.0.0 - xx July 2011
//
// Blade-style UI control

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

function blade(args) {
    // constructor call variables
    this.name   = args.name;  // slideshow name
    this.x      = args.x;     // *individual* blade width
    this.fcolor = args.focus; // blade title focus color
    this.bcolor = args.blur;  // blade title blurred color
    // initialization variables
    this.blades = new Object;
    this.blades.count = 0;          // how many blades right now?
    this.blades.open  = 0;          // which blade is open?
    this.blades.order = new Array;  // name-to-order mapping
    this.blades.elem  = new Object; // holds blade elements
    this.blades.meta  = new Object; // info about blades (l, r, order)
    // methods
    this.init  = init;
    this.switchBlade = switchBlade;
    this.setContent  = setContent;
}

function init(bladeNames) {
    // build blades
    bladeNames.forEach(constructBlade, this);
    // fix blade count
    this.blades.count--;
    // one-off to set proper color on last blade's title
    document.getElementById(this.blades.order[this.blades.open] + 'title').style.color = this.fcolor;
}

function constructBlade(bladeData, index) {
    var wholeName = this.name + bladeData[0];
    var bladeDiv = document.getElementById(this.name);
    // create actual blade div
    var bElem = document.createElement('div');
    // set its name, zindex, and left-position
    bElem.setAttribute('id', wholeName);
    bElem.setAttribute('class', 'blade');
    bElem.style.zIndex = this.blades.count;
    bElem.style.left   = (this.blades.count * 2) + 'em';
    // stow metadata
    this.blades.meta[wholeName] = new Object;
    this.blades.meta[wholeName]['left'] = (this.blades.count * 2) + 'em';
    if (this.blades.count == 0) {
        this.blades.meta[wholeName]['right'] = '0 em';
    } else {
        this.blades.meta[wholeName]['right'] = (this.x + (this.blades.count * 2) - 1) + 'em';
    }
    this.blades.meta[wholeName]['order'] = this.blades.count;
    this.blades.order.push(wholeName);
    // set event listener
    var me = this;
    bElem.addEventListener('click', function() { me.switchBlade(wholeName) }, false);
    // add to blades obj storage and set open blade
    this.blades.elem[wholeName] = bElem;    
    this.blades.open = this.blades.count;
    this.blades.count++;
    // add title
    var bTitle = document.createElement('h2');
    bTitle.setAttribute('id', wholeName + 'title');
    bTitle.setAttribute('class', 'btitle');
    bTitle.innerHTML = bladeData[1];
    bElem.appendChild(bTitle);
    // add content container to blade, then add blade to its own container
    var bCont = document.createElement('div');
    bCont.setAttribute('id', wholeName + 'cont');
    bElem.appendChild(bCont);
    bladeDiv.appendChild(bElem);
}

function switchBlade(bladeName) {
    if (this.blades.meta[bladeName]['order'] == this.blades.open) return;
    // deselect current blade's title
    document.getElementById(this.blades.order[this.blades.open] + 'title').style.color = this.bcolor;

    // set blade.open to new val
    this.blades.open = this.blades.meta[bladeName]['order'];

    // move every blade up to the open one to the left
    for (var i = 0; i <= this.blades.open; i++) {
        var curBlade = this.blades.order[i];
        this.blades.elem[curBlade].style.left = this.blades.meta[curBlade]['left'];
    }
    // and every blade after the open one to the right
    for (var i = this.blades.open + 1; i <= this.blades.count; i++) {
        var curBlade = this.blades.order[i];
        this.blades.elem[curBlade].style.left = this.blades.meta[curBlade]['right'];
    }

    // select new blade's title
    document.getElementById(this.blades.order[this.blades.open] + 'title').style.color = this.fcolor;

}

function setContent(bladeName, content) {
    var bCont = document.getElementById(bladeName + 'cont');
    bCont.innerHTML = content;
}