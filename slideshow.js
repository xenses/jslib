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
// The slides are files in the deck directories, named slide0000,
// slide0001, slide0002, and so forth. No extension.
//
// The contents of the slide files are loaded via XMLHttpRequest,
// slide elements are created, and the slide content is shoved into
// their innerHTML. So HTML fragments are fine. <html>, <head>, and
// <body> elements are not.
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
// For each slideshow on a page, you'll also need the following
// markup:
//
//   <div id="NAME"></div>
//   <button id="NAMEprev">Prev</button>
//   <button id="NAMEnext">Next</button>
//   <span id="NAMEcounts"></span>
//
// where NAME is the name you've chosen for the slideshow. The
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
//     var ss = new slideshow('NAME', 35, 20, 11);
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
    // variables
    this.name = name;            // slideshow name
    this.x    = x;               // width
    this.y    = y;               // height
    this.count     = num;        // how many slides
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
    show.setAttribute('class', 'slideshow');
    show.style.width = this.x + "em";
    show.style.height = this.y + "em";
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
        // create slidestrip div
        var strip = document.createElement('div');
        strip.setAttribute('id', this.name + 'slidestrip');
        strip.setAttribute('class', 'slidestrip');
        strip.style.width = (this.x * this.count) + "em";
        // create slides and populate strip with them
        for (var i = 0; i < this.count; i++) {
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
    if (dir == -1 && this.current == 1) { // leaving fist slide
        document.getElementById(this.name + 'prev').removeAttribute("disabled");
    } else if (dir == -1 && this.current == this.count - 1) { // arriving at last slide
        document.getElementById(this.name + 'next').setAttribute("disabled", "true");
    } else if (dir == 1 &&  this.current == this.count) { // leaving last slide
        document.getElementById(this.name + 'next').removeAttribute("disabled");
    } else if (dir == 1 &&  this.current == 2) { // arriving at first slide
        document.getElementById(this.name + 'prev').setAttribute("disabled", "true");
    }        
    // move the slidestrip
    this.current += -(dir);
    this.oldMargin = this.margin;
    this.updateSlideCounts();
    this.animateSlideTransition(1, dir, this.x);
}

function updateSlideCounts() {
    document.getElementById(this.name + 'counts').innerHTML = this.current + '/' + this.count;
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
