// slideshow.js
// v1.3.2
// 29 Mar 2011
//
// A basic Javascript slideshow in-an-object.
//

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
// The slides are files in the deck directories. Slides are named
// slide0000, slide0001, slide0002, and so forth.
//
// The contents of the slide files are shoved into the innerHTML of
// the slide elements as they are created, so HTML fragments are
// fine. They should not be complete documents (no <html>, <head>, or
// <body>).
//
// You'll need this CSS in your document/stylesheet:
//
//   .slideshow { overflow: hidden; margin: 0; padding: 0; }
//   .slidestrip { height: 100%; margin: 0; padding: 0; }
//   .slide { display: inline-block; height: 100%; margin: 0; vertical-align: top; }
//
// Adding border, margins, or padding to these classes will definitely
// create problems, as everything relies upon precise alignment of
// elements. Styling should be done on markup included in the slide
// content itself.
//
// You'll also need the following elements somewhere in your HTML:
//
//   <div id="NAME"></div>
//   <button id="NAMEprev">Prev</button>
//   <button id="NAMEnext">Next</button>
//   <span id="NAMEcounts"></span>
//
// Where "NAME" is the name you've chosen for the slideshow. The
// elements don't have to be in a particular order, and can be placed
// as you like.
//
// Finally, in your document, load the script
//
//   <script src='/path/to/slideshow.js'></script>
//
// and then, probably immediately afterward, initialize your slideshow(s)
//
//   <script>
//     var ss = new slideshow('test', 35, 20, 11);
//     window.addEventListener("DOMContentLoaded", function() { ss.init() });
//   </script>
//
// The arguments to slideshow() are: the name of the slideshow, its
// width (in ems), height (in ems), and the number of slides in the
// deck.
//
// Any number of slideshows can be on a single page. Just add more
// declarations, init() calls, and sets of HTML elements (with NAME
// changed appropriately).

//-----------------------------------------------------------------------

// CHANGELOG
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

function slideshow(name, x, y, num) {
    this.name = name;
    this.x    = x;
    this.y    = y;
    this.numSlides      = num;
    this.slides         = new Object;
    this.curSlide       = 1;
    this.stripMargin    = 0;
    this.oldStripMargin = 0;
    this.queuedChanges  = 0;
    this.init              = init;
    this.createCallback    = createCallback;
    this.populateSlideShow = populateSlideShow;
    this.changeSlide       = changeSlide;
    this.updateSlideCounts = updateSlideCounts;
    this.animateSlideTransition = animateSlideTransition;
}

function init() {
    var show = document.getElementById(this.name);
    show.setAttribute('class', 'slideshow');
    show.style.width = this.x + "em";
    show.style.height = this.y + "em";
    for (var i = 0; i < this.numSlides; i++) {
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
    for (var i = 0; i < this.numSlides; i++) {
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
        // create slidestrip div
        var strip = document.createElement('div');
        strip.setAttribute('id', this.name + 'slidestrip');
        strip.setAttribute('class', 'slidestrip');
        strip.style.width = (this.x * this.numSlides) + "em";
        // create slides and populate strip with them
        for (var i = 0; i < this.numSlides; i++) {
            var slide = document.createElement('div');
            slide.setAttribute("class", "slide");
            slide.style.width = this.x + "em";
            slide.innerHTML = this.slides[i];
            strip.appendChild(slide);
        }
        // make strip the child of the slideshow
        document.getElementById(this.name).appendChild(strip);
        // turn on buttons
        var me = this;
        document.getElementById(this.name + 'prev').setAttribute("disabled", "true");
        document.getElementById(this.name + 'next').removeAttribute("disabled");
        document.getElementById(this.name + 'prev').addEventListener("click", function() { me.changeSlide(1) }, false);
        document.getElementById(this.name + 'next').addEventListener("click", function() { me.changeSlide(-1) }, false);
        // set current/total indicator
        this.updateSlideCounts();
    }
}

function changeSlide(dir) {
    // queue changes
    if (this.animating) { 
        // FIXME need to not allow queued changes to exceed hte number
        // of slides left to flip in the direction we're heading. the
        // following line is wrong
        if (Math.abs(self.queuedChanges) == self.numSlides) { return }
        this.queuedChanges += dir;
        return 
    }
    this.animating = true;
    // enable the appropriate buttons
    if (dir == -1 && this.curSlide == 1) { // leaving fist slide
        document.getElementById(this.name + 'prev').removeAttribute("disabled");
    } else if (dir == -1 && this.curSlide == this.numSlides - 1) { // arriving at last slide
        document.getElementById(this.name + 'next').setAttribute("disabled", "true");
    } else if (dir == 1 &&  this.curSlide == this.numSlides) { // leaving last slide
        document.getElementById(this.name + 'next').removeAttribute("disabled");
    } else if (dir == 1 &&  this.curSlide == 2) { // arriving at first slide
        document.getElementById(this.name + 'prev').setAttribute("disabled", "true");
    }        
    // move the slidestrip
    this.curSlide += -(dir);
    this.oldStripMargin = this.stripMargin;
    this.updateSlideCounts();
    this.animateSlideTransition(1, dir, this.x);
}

function updateSlideCounts() {
    document.getElementById(this.name + 'counts').innerHTML = this.curSlide + '/' + this.numSlides;
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
        this.stripMargin = this.oldStripMargin + (this.x * dir);
        strip.style.marginLeft = this.stripMargin + "em";
        this.animating = false;
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
    this.stripMargin += curMove * dir;
    strip.style.marginLeft = this.stripMargin + "em";
    var me = this;
    window.setTimeout(function () { me.animateSlideTransition(frame + 1, dir, dist - curMove ) }, 30)
}
