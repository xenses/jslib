// slideshow.js
// v1.3.2 - 29 Mar 2011
//
// A basic Javascript slideshow in-an-object.
// Skip below license for usage docs.
//
// Copyright (c) 2011, Shawn Boyette <shawn@firepear.net>
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
// * Neither the name of the <ORGANIZATION> nor the names of its
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

// USAGE
//
// One copy of this script can drive any number of slideshows. Just
// put it where you like and call it (as described below) from any
// HTML doc you wish.
//
// In every directory with a slideshow doc, a subdirectory named
// "fpslidedecks" is needed. That subdirectory holds additional
// subdirs, one per slideshow, named after the slideshow.
//
// The slides are files in the deck directories, named slide0000,
// slide0001, slide0002, and so forth. No extension.
//
// The contents of the slide files are loaded via XMLHttpRequest,
// slide elements are created, and the slide content is shoved into
// their innerHTML. So HTML fragments are fine. <html>, <head>, and
// <body> elements are not.
//
// For each slideshow on a page, you need the following markup:
//
//   <div id="NAME"></div>
//
// where NAME is the name you've chosen for the slideshow. Do not add
// padding to the slideshow div(s) in your CSS.
//
// Then, up in the <head>, load the script:
//
//   <script src='/path/to/slideshow.js'></script>
//
// And initialize the slideshow(s):
//
//   <script>
//     var ss = new slideshow({'name':'NAME', 'x':35, 'y':20, 'num':10});
//     window.addEventListener("DOMContentLoaded", function() { ss.init() });
//   </script>
//
// The required arguments to the constructor are:
//
//   name  Name of the slideshow
//   x     Width, in ems
//   y     Height, in ems
//   num   Number of slides
//
// Things will break horribly if you don't have all these, though
// there is no validation yet.
//
// Optional arguments:
//
//   delay  When present, causes the slideshow to autoadvance one slide
//          every <delay> ms. Any action by a viewer 
//
// Any number of slideshows can be on a single page. Just add more
// declarations, init() calls, and sets of HTML elements (with NAME
// changed appropriately).

//-----------------------------------------------------------------------

// CHANGELOG
//
// 1.3.3 Change constructor args to single obj for pseudo-named
//       arguments
//
// 1.3.2 Queue slide changes while slides are changing
//
// 1.3.1 Prevent slide change while slide is changing
//
// 1.3.0 Allow multiple decks per page
//
// 1.2.0 Objectified
//
// 1.1.4 Parameterized initialization, allowing for multiple decks
//       without copying and editing the source file (hurp)
//
// 1.1.3 Changed slide deck directory name and slide naming scheme
//
// 1.1.2 Condensed variable declarations
//
// 1.1.1 Made control variable and button initialization more reliable
//
// 1.1.0 Added transition animation
//
// 1.0.1 Added showCurrentSlide

//-----------------------------------------------------------------------

function slideshow(args) {
    // variables
    this.name = args.name;       // slideshow name
    this.x    = args.x;          // width
    this.y    = args.y;          // height
    this.count     = args.num;   // how many slides
    this.slides    = new Object; // the slides
    this.current   = 1;          // current slide
    this.margin    = 0;          // left margin of slidestrip
    this.oldMargin = 0;          // margin at beginning of animations
    this.queuedChanges  = 0;     // transitions queued during transition
    this.isAnimating    = 0;     // currently transitioning?
    // methods
    this.init              = init;
    this.createCallback    = createCallback;
    this.populateSlideShow = populateSlideShow;
    this.changeSlide       = changeSlide;
    this.updateSlideCounts = updateSlideCounts;
    this.animateSlideTransition = animateSlideTransition;
}

function init() {
    var show = document.getElementById(this.name);
    show.style.width = this.x + "em";
    show.style.height = (this.y + 1.5) + "em";
    show.style.overflow = "hidden";
    show.style.margin = 0;
    show.style.padding = 0;

    // set up keyboard handling

    for (var i = 0; i < this.count; i++) {
        // construct the slide URLs and fire off XHRs for them
        var leadingZs = '000';
        if      (i > 999) { leadingZs = '' }  // pretend to be
        else if (i > 99)  { leadingZs = '0' } // sprintf
        else if (i > 9)   { leadingZs = '00' }
        var url = "./fpslidedecks/" + this.name + "/slide" + leadingZs + i;
        var r = new XMLHttpRequest();
        r.open("GET", url, true);
        r.onreadystatechange = this.createCallback(i, r);
        r.send(null);
    }
    // this waits for all slides to have their data fetched, then
    // constructs the slideshow
    this.populateSlideShow();
}

function createCallback (slideNum, req) {
    // create a closure over the number of the slide being fetched and
    // the XHR object doing the fetching and return it, setting it as
    // the onreadystatechange value of the XHR itself
    var slides = this.slides;
    return function() { 
        if (req.readyState == 4) {
            if (req.status == 200) {
                slides[slideNum] = req.responseText;
            }
        }
    };
}

function populateSlideShow() {
    var allThere = true; // sentinel for all slides being fetched
    for (var i = 0; i < this.count; i++) {
        if (this.slides[i] == null) {
            allThere = false;
        }
    }
    if (allThere == false) {
        // we're missing slides, call this function again in 50ms
        var me = this;
        window.setTimeout( function() { me.populateSlideShow() }, 50);
    } else {
        // it's all here, then build out the slideshow
        var show = document.getElementById(this.name);
        // create control overlay
        var overlay = buildControlOverlay(this.name);
        // create slidestrip div
        var strip = document.createElement('div');
        strip.setAttribute('id', this.name + 'slidestrip');
        strip.style.height = this.y + "em";
        strip.style.width = (this.x * this.count) + "em";
        // create slides and populate strip with them
        for (var i = 0; i < this.count; i++) {
            var slide = document.createElement('div');
            slide.style.width = this.x + "em";
            slide.style.height = "100%";
            slide.style.display = "inline-block";
            slide.style.verticalAlign = "top";
            slide.innerHTML = this.slides[i];
            strip.appendChild(slide);
        }
        // make overlay and strip the child of the slideshow
        show.appendChild(strip);
        show.appendChild(overlay);
        // turn on controls
        var me = this;
        document.getElementById(this.name + 'ctrlp').addEventListener("click", function() { me.changeSlide(1) }, false);
        document.getElementById(this.name + 'ctrln').addEventListener("click", function() { me.changeSlide(-1) }, false);
        // set current/total indicator
        this.updateSlideCounts();
    }
}

function changeSlide(dir) {
    // queue changes when a transition is in progress
    if (this.isAnimating) {
        // unless that change would overrun the bounds of the slideshow
        if (this.current - this.queuedChanges == 1 || 
            this.current - this.queuedChanges == this.count) { return }
        this.queuedChanges += dir;
        return 
    }
    // flag transition as in progress
    this.isAnimating = true;
    // enable the appropriate buttons
    //if (dir == -1 && this.current == 1) { // leaving fist slide
    //    document.getElementById(this.name + 'prev').removeAttribute("disabled");
    //} else if (dir == -1 && this.current == this.count - 1) { // arriving at last slide
    //    document.getElementById(this.name + 'next').setAttribute("disabled", "true");
    //} else if (dir == 1 &&  this.current == this.count) { // leaving last slide
    //    document.getElementById(this.name + 'next').removeAttribute("disabled");
    //} else if (dir == 1 &&  this.current == 2) { // arriving at first slide
    //    document.getElementById(this.name + 'prev').setAttribute("disabled", "true");
    //}        
    // move the slidestrip
    this.current += -(dir);
    this.oldMargin = this.margin;
    this.updateSlideCounts();
    this.animateSlideTransition(1, dir, this.x);
}

function updateSlideCounts() {
    document.getElementById(this.name + 'ctrlcm').innerHTML = this.current + '/' + this.count;
}

// animateSlideTransition
//
// This function is called recursively to animate switching from one
// slide to the next. It takes three arguments:
//
//   frame  the current frame of the animation
//
//   dir    the direction of the animation (1 for left-to-right, -1 
//          for right-to-left)
//
//   dist   The distance remaining to be travelled in the animation
//
// The animation algorithm is very simple:
//
//   Frame 1,2: move 1/3 dist
//   Frame 3-6: move 1/2 dist
//   Frame 7  : move to final position
function animateSlideTransition(frame, dir, dist) {
    var strip = document.getElementById(this.name + "slidestrip");
    if (frame == 7) {
        // do final placement
        this.margin = this.oldMargin + (this.x * dir);
        strip.style.marginLeft = this.margin + "em";
        this.isAnimating = false;
        // handle queued changes
        if (this.queuedChanges != 0) {
            this.queuedChanges -= dir;
            if (dir > 0) { this.changeSlide(1)  }
            else         { this.changeSlide(-1) }
        }
        return;
    }

    var curMove;
    if (frame < 3) {
        curMove = dist / 3;
    } else  {
        curMove = dist / 2;
    }
    this.margin += curMove * dir;
    strip.style.marginLeft = this.margin + "em";
    var me = this;
    window.setTimeout(function () { me.animateSlideTransition(frame + 1, dir, dist - curMove ) }, 30)
}

function buildControlOverlay(name) {
    var ol = document.createElement('div');
    ol.setAttribute("id", name + "ctrl");
    ol.style.width = this.x + 'em';
    ol.style.height = '1.2em';
    ol.style.color = '#ddd';
    ol.style.padding = 0
    ol.style.backgroundColor = '#555';
    ol.style.fontFamily = 'sans-serif';
    ol.style.fontSize = '1.2em';
    ol.style.cursor = "default";
    // left arrow block
    var lab = document.createElement('div');
    lab.setAttribute("id", name + "ctrlp");
    lab.style.display = 'inline-block';
    lab.style.width = "20%";
    lab.style.textAlign = "center";
    lab.style.borderRight = "solid thin #ddd"
    lab.innerHTML = "&lArr;";
    lab.addEventListener("mousedown",
                         function() { lab.style.color = "#fff"; lab.style.backgroundColor = "#666" });
    lab.addEventListener("mouseup",
                         function() { lab.style.color = "#ddd"; lab.style.backgroundColor = "#555" });
    // right arrow block
    var rab = document.createElement('div');
    rab.setAttribute("id", name + "ctrln");
    rab.style.display = 'inline-block';
    rab.style.width = "20%";
    rab.style.textAlign = "center";
    rab.style.borderLeft = "solid thin #ddd"
    rab.style.khtmlUserSelect = "none";
    rab.innerHTML = "&rArr;";
    rab.addEventListener("mousedown",
                         function() { rab.style.color = "#fff"; rab.style.backgroundColor = "#666" });
    rab.addEventListener("mouseup",
                         function() { rab.style.color = "#ddd"; rab.style.backgroundColor = "#555" });
    // center block
    var cb = document.createElement('div');
    cb.setAttribute("id", name + "ctrlc");
    cb.style.display = 'inline-block';
    cb.style.width = "59%";
    cb.style.textAlign = "center";
    var cbm = document.createElement('div');
    cbm.setAttribute("id", name + "ctrlcm");
    cbm.style.display = 'inline-block';
    cbm.style.width = "95%";
    cbm.style.textAlign = "center";
    var cbh = document.createElement('div');
    cbh.setAttribute("id", name + "ctrlch");
    cbh.style.display = 'inline-block';
    cbh.style.fontSize = "small";
    cbh.style.padding = "2px";
    cbh.style.width = "4%";
    cbh.style.color = "#fd7";
    cbh.style.verticalAlign = "middle";
    cbh.innerHTML = "?"
    cb.appendChild(cbm);
    cb.appendChild(cbh);
    // put it all together
    ol.appendChild(lab);
    ol.appendChild(cb);
    ol.appendChild(rab);
    return ol;
}