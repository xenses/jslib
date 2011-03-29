// slideshow.js
// v1.2.0
// 28 Mar 2011
//
// Basic Javascript slideshow in-an-object.
// No external dependencies.

//-----------------------------------------------------------------------

// USAGE
//
// Needs a directory named "fpslidedecks" under wherever the calling
// document resides, and a directory with the name of the
// slideShowName variable (set below) under "fpslidedecks".
//
// The slides are simply files in that directory, named slide0000,
// slide0001, slide0002, and so forth.
//
// The contents of the slide files are shoved into the innerHTML of
// the slide elements as they are created, so HTML fragments are
// fine. They should not be complete documents (no <html>, <head>, or
// <body>).
//
// You'll need this CSS in your document/stylesheet:
//
//   #slideshow { overflow: hidden; margin: 0; padding: 0; }
//   #filmstrip { height: 100%; margin: 0; padding: 0; }
//   div.slide { display: inline-block; height: 100%; margin: 0; vertical-align: top; }
//
// CSS customization/prettification should happen in the fragmentary
// HTML of the slide content. Adding a border, margins, or padding to
// #filmstrip or .slide will definitely create problems, as everything
// relies upon precise alignment of elements.
//
// You'll also need the following elements somewhere in your HTML:
//
//   <div id="slideshow"></div>
//   <button id="prevbutt">Prev</button>
//   <button id="nextbutt">Next</button>
//   <span id="curslide"></span>
//
// They don't have to be in a particular order, and can be placed
// where ever you want them.
//
// Finally, in your document, load the script
//
//   <script src='/path/to/slideshow.js'></script>
//
// and then, probably immediately afterward, initialize your slideshow
//
//   window.addEventListener("DOMContentLoaded", function() { slideshowinit('test', 35, 20, 11) });
//
// The arguments to slideshowinit() are the name of the slideshow, its
// width in ems, height in ems, and the number of slides in the deck.
//
// Using "DOMContentLoaded" rather than "load" helps prevent rendering
// flicker. If you don't like it, switch to "load".

//-----------------------------------------------------------------------

// CHANGELOG
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
    this.slideShowName  = name;
    this.slideWidth     = x;
    this.slideHeight    = y;
    this.numSlides      = num;
    this.slides         = new Object;
    this.curSlide       = 1;
    this.stripMargin    = 0;
    this.oldStripMargin = 0;
    this.init              = init;
    this.createCallback    = createCallback;
    this.populateSlideShow = populateSlideShow;
    this.changeSlide       = changeSlide;
    this.updateSlideCounts = updateSlideCounts;
    this.animateSlideTransition = animateSlideTransition;
}

function init() {
    var ss = document.getElementById("slideshow");
    ss.style.width = this.slideWidth + "em";
    ss.style.height = this.slideHeight + "em";
    for (var i = 0; i < this.numSlides; i++) {
        // construct the slide URLs and fire off XHRs for them
        var leadingZs = '000';
        if      (i > 999) { leadingZs = '' }  // pretend to be
        else if (i > 99)  { leadingZs = '0' } // sprintf
        else if (i > 9)   { leadingZs = '00' }
        var url = "./fpslidedecks/" + this.slideShowName + "/slide" + leadingZs + i;
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
        // create filmstrip div
        var strip = document.createElement('div');
        strip.setAttribute('id','filmstrip');
        strip.style.width = (this.slideWidth * this.numSlides) + "em";
        // create slides and populate strip with them
        for (var i = 0; i < this.numSlides; i++) {
            var slide = document.createElement('div');
            slide.setAttribute("class", "slide");
            slide.style.width = this.slideWidth + "em";
            slide.innerHTML = this.slides[i];
            strip.appendChild(slide);
        }
        // make strip the child of the slideshow
        document.getElementById("slideshow").appendChild(strip);
        // turn on buttons
        var me = this;
        document.getElementById('prevbutt').setAttribute("disabled", "true");
        document.getElementById('nextbutt').removeAttribute("disabled");
        document.getElementById('prevbutt').addEventListener("click", function() { me.changeSlide(1) }, false);
        document.getElementById('nextbutt').addEventListener("click", function() { me.changeSlide(-1) }, false);
        // set current/total indicator
        this.updateSlideCounts();
    }
}

function changeSlide(dir) {
    // enable/disable prev/next buttons
    if (dir == -1 && this.curSlide == 1) { // leaving fist slide
        document.getElementById('prevbutt').removeAttribute("disabled");
    } else if (dir == -1 && this.curSlide == this.numSlides - 1) { // arriving at last slide
        document.getElementById('nextbutt').setAttribute("disabled", "true");
    } else if (dir == 1 &&  this.curSlide == this.numSlides) { // leaving last slide
        document.getElementById('nextbutt').removeAttribute("disabled");
    } else if (dir == 1 &&  this.curSlide == 2) { // arriving at first slide
        document.getElementById('prevbutt').setAttribute("disabled", "true");
    }
    // move the filmstrip
    this.curSlide += -(dir);
    this.oldStripMargin = this.stripMargin;
    this.updateSlideCounts();
    this.animateSlideTransition(1, dir, this.slideWidth);
}

function updateSlideCounts() {
    document.getElementById('curslide').innerHTML = this.curSlide + '/' + this.numSlides;
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
    var strip = document.getElementById("filmstrip");
    if (frame == 7) {
        this.stripMargin = this.oldStripMargin + (this.slideWidth * dir);
        strip.style.marginLeft = this.stripMargin + "em";
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
