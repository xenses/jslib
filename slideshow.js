// slideshow.js
// v1.4.5 - 03 Apr 2011
//
// A basic Javascript slideshow in-an-object.
// Usage docs follow license

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

// USAGE
//
// One copy of this script can drive any number of slideshows. Just
// put it where you like and call it (as described below) from any
// HTML doc you wish.
//
// In every directory with a slideshow-bearing HTML doc, a
// subdirectory named "fpslidedecks" is needed. That subdirectory
// holds additional subdirs, one per slideshow, named after the
// slideshow.
//
// The slides are files in the deck directories, named slide0001,
// slide0002, slide0003, and so forth. No extension.
//
// The contents of the slide files are loaded via XMLHttpRequest,
// slide elements are created, and the slide content is shoved into
// their innerHTML. So HTML fragments are fine. <html>, <head>, and
// <body> elements are not.
//
// Setting up slideshows
// ---------------------
// For each slideshow on a page, you need the following markup:
//
//   <div id="NAME"></div>
//
// where NAME is the name you've chosen for the slideshow. This will
// be the name you use in the Javascript initialization of the
// slideshow, and the name of the subdirectory of 'fpslidedecks' where
// the slides for this show will reside.
//
// Load the script:
//
//   <script src='/path/to/slideshow.js'></script>
//
// And initialize the slideshow(s):
//
//   <script>
//     // repeat these lines for each slideshow you want to have
//     var ss = new slideshow({'name':'NAME', 'x':35, 'y':20, 'num':10});
//     window.addEventListener("DOMContentLoaded", function() { ss.init() }, false);
//   </script>
//
// The required arguments to the constructor are:
//
//   name  Slideshow name; should match one of your divs
//   x     Width, in ems
//   y     Height, in ems
//   num   Number of slides
//
// Things will break horribly if you don't have all these.  There is
// no argument validation yet.
//
// The constructor also has optional arguments:
//
//   outline  If defined and *true*, it will be used to set the color
//            of the focus outline of the slideshow. If defined and
//            *false*, the slideshow's outline will be turned off. If
//            undefined, the outline will be left as the user-agent
//            default.
//
//   roll  If true, the slideshow controls will allow rolling around
//         from the last to first slide, and vice versa.
//
//   delay  When defined, causes the slideshow to autoadvance one slide
//          every <delay> ms. Any action by a viewer will turn off the
//          autoadvance behavior. If delay is defined then 'roll' is
//          automatically set to true.
//
// Any number of slideshows can be on a single page. Just add more
// declarations, init() calls, and sets of HTML elements (with NAME
// changed appropriately).
//
// Styling slideshows
// ------------------
//
// Do not add padding or margins to the slideshow divs you
// define. Borders are okay.
//
// Individual slides all have the class '.slide', which can be use as
// a selector for targetting styles on slides. Almost any styling
// should be okay on individual slides.
//
// Be aware that the entire slideshow is set to 'overflow: hidden', so
// content must fit the slides. Slide size is inherited from the
// slideshow, and should not be manipulated -- slide transitions
// depend on precise alignment of the slides themselves.

//-----------------------------------------------------------------------

// TODO
//
// implement delay

//-----------------------------------------------------------------------

function slideshow(args) {
    // constructor call variables
    this.name  = args.name;  // slideshow name
    this.x     = args.x;     // width
    this.y     = args.y;     // height
    this.count = args.num;   // how many slides
    this.conf  = args        // stow args as configuration
    if (this.conf.delay) this.conf.roll = true;
    // initialization variables
    this.slides    = new Object; // the slides
    this.current   = 1;          // current slide
    this.margin    = 0;          // left margin of slidestrip
    this.queuedChanges  = 0;     // transitions queued during transition
    this.isAnimating    = 0;     // currently transitioning?
    // methods
    this.init              = init;
    this.createCallback    = createCallback;
    this.populateSlideShow = populateSlideShow;
    this.shiftOneSlide     = shiftOneSlide;
    this.jumpToSlide       = jumpToSlide;
    this.moveSlidestrip    = moveSlidestrip;
    this.updateSlideCounts = updateSlideCounts;
    this.animateSlideTransition = animateSlideTransition;
    this.fadeIn  = fadeIn;
    this.fadeOut = fadeOut;
    this.buildSlideshowContainer = buildSlideshowContainer;
    this.buildControlOverlay     = buildControlOverlay;
    this.buildHelpFrame          = buildHelpFrame;
    this.keyDispatch = keyDispatch;
    this.haltAdvance = haltAdvance;
}

function init() {
    var me = this;
    this.buildSlideshowContainer();
    for (var i = 1; i < this.count + 1; i++) {
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
    var me = this;
    var allThere = true; // sentinel for all slides being fetched
    for (var i = 1; i < this.count + 1; i++) {
        if (this.slides[i] == null) {
            allThere = false;
        }
    }
    if (allThere == false) {
        // we're missing slides, call this function again in 50ms
        window.setTimeout(function() { me.populateSlideShow() }, 50);
        return;
    }

    // it's all here, then build the slides
    var strip = document.getElementById(this.name + 'slidestrip');
    // create slides and populate strip with them
    for (var i = 1; i < this.count + 1; i++) {
        var slide = document.createElement('div');
        slide.setAttribute('id', this.name + 'slide' + i);
        slide.style.width = this.x + "em";
        slide.style.height = "100%";
        slide.style.display = "inline-block";
        slide.style.verticalAlign = "top";
        slide.innerHTML = this.slides[i];
        strip.appendChild(slide);
    }
    // set current/total indicator
    this.updateSlideCounts();
    // kick off autoadvance if delay is set
    if (this.conf.delay)
        this.delayTimeout = window.setTimeout(function() { me.shiftOneSlide("next") }, this.conf.delay);
}

//-----------------------------------------------------------------------

function shiftOneSlide(dir) {
    // rack up slide advance if needed, so that roll overs don't end slideshow
    var me = this;
    if (this.conf.delay)
        this.delayTimeout = window.setTimeout(function() { me.shiftOneSlide("next") }, this.conf.delay + 30 * 7);

    // don't roll off ends, but roll over if desired
    if (dir == "prev" && this.current == 1) {
        if (this.conf.roll) this.jumpToSlide(this.count);
        return;
    }
    if (dir == "next" && this.current == this.count) {
        if (this.conf.roll) this.jumpToSlide(1);
        return;
    }

    this.moveSlidestrip(dir, 1)
}

function jumpToSlide(slide) {
    // no out-of-bounds and switching to current is a no-op
    if (slide < 1 || slide > this.count) return;
    if (slide == this.current) return;
    // erase any queued changes and wait until current slide
    // transition is complete
    if (this.isAnimating) {
        var me = this;
        this.queuedChanges = 0;
        window.setTimeout(function() { me.jumpToSlide(slide) }, 50);
        return;
    }

    var dir = (slide > this.current) ? "next" : "prev";
    this.moveSlidestrip(dir, Math.abs(slide - this.current));
}

function moveSlidestrip(dir, slides) {
    var dist = slides * this.x;
    dir = (dir == "prev") ? 1 : -1;
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
    // move the slidestrip
    this.current -= (slides * dir);
    this.updateSlideCounts();
    this.animateSlideTransition(1, dir, dist);
}

// animateSlideTransition
//
// Called recursively to animate switching from one slide to the
// next. Takes three arguments:
//
//   frame  Current frame of the animation
//
//   dir    Direction of the animation: 1 for left-to-right (prev), -1
//          for right-to-left (next)
//
//   dist   Distance remaining to be travelled in the animation, in
//          em
//
// The animation algorithm is very simple:
//
//   Frame 1,2: move 1/3 dist
//   Frame 3-6: move 1/2 dist
//   Frame 7  : move to final position
function animateSlideTransition(frame, dir, dist) {
    var strip = document.getElementById(this.name + "slidestrip");
    //alert(frame +":"+ dir +":"+ dist +":"+ strip.style.marginLeft);
    if (frame == 7) {
        // do final placement
        this.margin = -((this.current * this.x) - this.x);
        strip.style.marginLeft = this.margin + "em";
        this.isAnimating = false;
        // handle queued changes
        if (this.queuedChanges != 0) {
            this.queuedChanges -= dir;
            if (dir > 0) { this.shiftOneSlide("prev")  }
            else         { this.shiftOneSlide("next") }
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

function updateSlideCounts() {
    var count = this.current + '/' + this.count;
    document.getElementById(this.name + 'ctrlcm').innerHTML = count;
    document.getElementById(this.name + 'kdsi').innerHTML = count;
}

//-----------------------------------------------------------------------

function fadeOut(ev, elem, frame) {
    var event = window.event || ev;
    if (event && event != null) {
        if (event.relatedTarget.tagName != "BODY" && event.relatedTarget.tagName != "HTML") { return }
    }

    if (this.faderTimeout) {
        window.clearTimeout(this.faderTimeout);
        this.faderTimeout = undefined;
    }
    if (frame == 6) {
        elem.style.opacity = 0;
        this.faderTimeout = null;
        // bury element
        elem.style.zIndex = -50;
        return;
    }
    var me = this;
    elem.style.opacity = elem.style.opacity / 2;
    this.faderTimeout = window.setTimeout(function () { me.fadeOut(null, elem, frame + 1) }, 20)
}

function fadeIn(ev, elem, frame) {
    var event = window.event || ev;
    if (event && event != null) {
        if (event.relatedTarget.tagName != "BODY" && event.relatedTarget.tagName != "HTML") { return }
    }

    if (this.faderTimeout) {
        window.clearTimeout(this.faderTimeout);
        this.faderTimeout = undefined;
    }
    if (frame == 6) {
        elem.style.opacity = 1;
        this.faderTimeout = null;
        return;
    }
    if (frame == 1) {
        // raise element
        elem.style.zIndex = 50;
        elem.style.opacity = 0.125;
    } else {        
        elem.style.opacity = elem.style.opacity * 1.5;
    }
    var me = this;
    this.faderTimeout = window.setTimeout(function () { me.fadeIn(null, elem, frame + 1) }, 20)
}

//-----------------------------------------------------------------------

function keyDispatch(ev) {
    this.haltAdvance();
    var event = window.event || ev;
    var k = event.keyCode;

    // fire key events
    if      (k == 37) { this.shiftOneSlide("prev") }
    else if (k == 39) { this.shiftOneSlide("next") }
    else if (k == 38) { this.jumpToSlide(1) }
    else if (k == 40) { this.jumpToSlide(this.count) }
    else { return }

    // display transient slide count FIXME this also needs raise/bury
    var me = this;
    var kdsi = document.getElementById(this.name + 'kdsi');
    if (this.kdsiTimeout) {
        window.clearTimeout(this.kdsiTimeout);
        this.kdsiTimeout = undefined;
    }
    kdsi.style.opacity = 1;
    this.kdsiTimeout = window.setTimeout(function() {me.fadeOut(null, kdsi, 1) }, 500);
}

function haltAdvance() {
    // turn off autoadvance if it is on
    if (this.conf.delay) {
        this.conf.delay = false;
        if (this.delayTimeout) window.clearTimeout(this.delayTimeout);
    }
}

//-----------------------------------------------------------------------

function buildSlideshowContainer() {
    var me = this;
    var show = document.getElementById(this.name);
    show.style.width = this.x + "em";
    show.style.height = this.y + "em";
    show.style.overflow = "hidden";
    show.style.margin = 0;
    show.style.padding = 0;
    show.setAttribute("tabindex", -1);
    if (this.conf.outline != undefined) {
        if (this.conf.outline) {
            show.style.outlineColor = this.conf.outline;
        } else {
            show.style.outline = 0;
        }
    }
    // create slidestrip
    var strip = document.createElement('div');
    strip.setAttribute('id', this.name + 'slidestrip');
    strip.style.height = this.y + "em";
    strip.style.width = (this.x * this.count) + "em";
    show.appendChild(strip);
    // create controls
    var ctrl = this.buildControlOverlay();
    show.appendChild(ctrl);
    // create key-driven slide indicator
    var kdsi = document.createElement('div');
    kdsi.setAttribute('id', this.name + 'kdsi');
    kdsi.style.zIndex = -50;
    kdsi.style.width = "5em";
    kdsi.style.position = "relative";
    kdsi.style.left = (this.x - 6) + "em";
    kdsi.style.top = "-" + (this.y + 1) + "em";
    kdsi.style.backgroundColor = "#555";
    kdsi.style.color = "#ddd";
    kdsi.style.textAlign = "center";
    kdsi.style.padding = "3px";
    kdsi.style.opacity = 0;
    kdsi.style.border = "solid thin #ddd";
    kdsi.style.borderRadius = "0.5em";
    show.appendChild(kdsi);
    // turn on controls
    var me = this;
    var pnbutn = document.getElementById(this.name + 'ctrlp');
    pnbutn.addEventListener("click", function() { me.haltAdvance(); me.shiftOneSlide("prev") }, false);
    pnbutn = document.getElementById(this.name + 'ctrln');
    pnbutn.addEventListener("click", function() { me.haltAdvance(); me.shiftOneSlide("next") }, false);
    // set up controls fade in/out
    show.addEventListener("mouseover", function(event) { me.fadeIn(event, ctrl, 1) }, false);
    show.addEventListener("mouseout", function(event) { me.fadeOut(event, ctrl, 1) }, false);
    // set up keyboard handling
    show.addEventListener("click", function() {show.focus() }, false);
    show.addEventListener('keydown', function(event) { me.keyDispatch(event) }, false);
    // finish
    return show
}

function buildControlOverlay() {
    var ol = document.createElement('div');
    ol.setAttribute("id", this.name + "ctrl");
    ol.style.zIndex = -50;
    ol.style.width = this.x + 'em';
    ol.style.position = "relative";
    ol.style.top = "-3.5em";
    ol.style.color = '#ddd';
    ol.style.backgroundColor = '#555';
    ol.style.borderTop = 'solid thin #555';
    ol.style.borderBottom = 'solid thin #555';
    ol.style.fontFamily = 'sans-serif';
    ol.style.cursor = "default";
    ol.style.opacity = 0;
    // left arrow block
    var lab = document.createElement('div');
    lab.setAttribute("id", this.name + "ctrlp");
    lab.style.display = 'inline-block';
    lab.style.width = "20%";
    lab.style.textAlign = "center";
    lab.style.borderRight = "solid thin #ddd"
    lab.innerHTML = "&lArr; Prev";
    lab.addEventListener("mousedown",
                         function() { lab.style.color = "#fff"; lab.style.backgroundColor = "#666" }, false);
    lab.addEventListener("mouseup",
                         function() { lab.style.color = "#ddd"; lab.style.backgroundColor = "#555" }, false);
    // right arrow block
    var rab = document.createElement('div');
    rab.setAttribute("id", this.name + "ctrln");
    rab.style.display = 'inline-block';
    rab.style.width = "20%";
    rab.style.textAlign = "center";
    rab.style.borderLeft = "solid thin #ddd"
    rab.style.khtmlUserSelect = "none";
    rab.innerHTML = "Next &rArr;";
    rab.addEventListener("mousedown",
                         function() { rab.style.color = "#fff"; rab.style.backgroundColor = "#666" }, false);
    rab.addEventListener("mouseup",
                         function() { rab.style.color = "#ddd"; rab.style.backgroundColor = "#555" }, false);
    // center block
    var cb = document.createElement('div');
    cb.setAttribute("id", this.name + "ctrlc");
    cb.style.display = 'inline-block';
    cb.style.width = "59%";
    var cbm = document.createElement('div');
    cbm.setAttribute("id", this.name + "ctrlcm");
    cbm.style.display = 'inline-block';
    cbm.style.width = "89%";
    cbm.style.paddingLeft = "3px";
    var cbh = document.createElement('div');
    cbh.setAttribute("id", this.name + "ctrlch");
    cbh.style.display = 'inline-block';
    cbh.style.width = "9%";
    cbh.innerHTML = "?"
    cbh.addEventListener('click', buildHelpFrame, false);
    cb.appendChild(cbm);
    cb.appendChild(cbh);
    // put it all together
    ol.appendChild(lab);
    ol.appendChild(cb);
    ol.appendChild(rab);
    return ol;
}

function buildHelpFrame() {
    alert("Apologies for the shittiness of this dialog. It'll be better soon.\n\nYou already found the mouse controls, but they cover up slide content. Click anywhere in slideshow to give keyboard focus (which you just did), then:\n\nLeft   Previous slide\nRight  Next slide\nUp     First slide\nDown   Last slide");
}