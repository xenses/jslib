// slideshow.js
// v1.1.3, 2011-03-27
//
// Basic Javascript slideshow in-a-box.
// No external dependencies.
// Assumes only 1 slideshow per page but can host many in a directory.

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
// Finally, edit these values to suit you:
var slideShowName = "test" // slides go in ./slides/slideShowName
var slideWidth = 35;       // slide (and slideshow) width in ems
var slideHeight = 20;      // height, also ems
var numSlides = 11;

//-----------------------------------------------------------------------

// TODO
//
// * Add first/last buttons
//
// * Decouple init from window.onload
//
// * Rewrite as object to allow more than one show per page

// CHANGELOG
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

var slides = curSlide = stripMargin = oldStripMargin = 0;

// initialization function; a lambda called on window load
window.onload = function() {
    slides = new Object;
    curSlide = 1;
    stripMargin = 0;

    var ss = document.getElementById("slideshow");
    ss.style.width = slideWidth + "em";
    ss.style.height = slideHeight + "em";
    for (var i = 0; i < numSlides; i++) {
        // construct the slide URLs and fire off XHRs for them
        var leadingZs = '000';
        if      (i > 999) { leadingZs = '' }  // pretend to be
        else if (i > 99)  { leadingZs = '0' } // sprintf
        else if (i > 9)   { leadingZs = '00' }
        var url = "./fpslidedecks/" + slideShowName + "/slide" + leadingZs + i;
        var r = new XMLHttpRequest();
        r.open("GET", url, true);
        r.onreadystatechange = createCallback(i, r);
        r.send(null);
    }
    // this waits for all slides to have their data fetched, then
    // constructs the slideshow
    populateSlideShow();
}

function createCallback (thisSlide, req) {
    // create a closure over the number of the slide being fetched and
    // the XHR object doing the fetching and return it, setting it as
    // the onreadystatechange value of the XHR itself
    return function() { 
        if (req.readyState == 4) {
            if (req.status == 200) {
                slides[thisSlide] = req.responseText;
            }
        }
    };
}

function populateSlideShow() {
    var allThere = true; // sentinel for all slides being fetched
    for (var i = 0; i < numSlides; i++) {
        if (slides[i] == null) {
            allThere = false;
        }
    }
    if (allThere == false) {
        // if we're missing slides, call this function again in 50ms
        window.setTimeout(populateSlideShow, 50);
    } else {
        // but if it's all here, then build out the slideshow
        // create filmstrip div
        var strip = document.createElement('div');
        strip.setAttribute('id','filmstrip');
        strip.style.width = (slideWidth * numSlides) + "em";
        // create slides and populate strip with them
        for (var i = 0; i < numSlides; i++) {
            var slide = document.createElement('div');
            slide.setAttribute("class", "slide");
            slide.style.width = slideWidth + "em";
            slide.innerHTML = slides[i];
            strip.appendChild(slide);
        }
        // make strip the child of the slideshow
        document.getElementById("slideshow").appendChild(strip);
        // turn on buttons
        document.getElementById('prevbutt').setAttribute("disabled", "true");
        document.getElementById('nextbutt').removeAttribute("disabled");
        document.getElementById('prevbutt').addEventListener("click", function() { changeSlide(1) }, false);
        document.getElementById('nextbutt').addEventListener("click", function() { changeSlide(-1) }, false);
        // set current slide indicator
        showCurrentSlide();
    }
}

function changeSlide(dir) {
    // enable/disable prev/next buttons
    if (dir == -1 && curSlide == 1) { // leaving slide 1
        document.getElementById('prevbutt').removeAttribute("disabled");
    } else if (dir == -1 && curSlide == numSlides - 1) { // arriving at last slide
        document.getElementById('nextbutt').setAttribute("disabled", "true");
    } else if (dir == 1 &&  curSlide == numSlides) { // leaving last slide
        document.getElementById('nextbutt').removeAttribute("disabled");
    } else if (dir == 1 &&  curSlide == 2) { // arriving at first slide
        document.getElementById('prevbutt').setAttribute("disabled", "true");
    }
    // move the filmstrip
    curSlide += -(dir);
    oldStripMargin = stripMargin;
    animateSlideTransition(1, dir, slideWidth);
    showCurrentSlide();
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
        stripMargin = oldStripMargin + (slideWidth * dir);
        strip.style.marginLeft = stripMargin + "em";
        return;
    }

    var thisMove;
    if (frame < 3) {
        thisMove = dist / 3;
    } else  {
        thisMove = dist / 2;
    }
    stripMargin += thisMove * dir;
    strip.style.marginLeft = stripMargin + "em";
    window.setTimeout(function () { animateSlideTransition(frame + 1, dir, dist - thisMove ) }, 30)
}

function showCurrentSlide() {
    document.getElementById('curslide').innerHTML = curSlide + '/' + numSlides;
}