// slideshow.js
// v1.1.0, 2011-03-27
//
// Basic Javascript slideshow in-a-box.
// No external dependencies.
// Assumes only 1 slideshow per page.

// CHANGELOG
//
// 1.1.0    Added transition animation
// 1.0.1    Added showCurrentSlide

// Needs a directory named "slides" under wherever the calling
// document resides, and a directory with the name of the
// slideShowName variable (set below) under "slides". The slides are
// files in that directory, named (0, 1, 2, 3, ...) with no extension
// and no leading zeroes. The contents of the slide files are shoved
// into the innerHTML of the slide elements as they are created, so
// HTML fragments are fine. They should not be complete, conformant
// HTML docs.

// You'll be needing this CSS in your document/stylesheet
//
//   #slideshow { overflow: hidden; margin: 0; padding: 0; }
//   #filmstrip { height: 100%; margin: 0; padding: 0; }
//   div.slide { display: inline-block; height: 100%; margin: 0; vertical-align: top; }
//
// Add colors/fonts as you like, and a border to the slideshow element
// if you'd prefer. adding a border, margins, or padding to the
// filmstrip or slides will make bad things happen, though. Don't
// forget to style your slide markup as well.

// You'll also need the following somewhere in your HTML (in no
// particular order)
//   <div id="slideshow"></div>
//   <button id="prevbutt" disabled="true">Prev</button>
//   <button id="nextbutt">Next</button>
//   <span id="curslide"></span>
// and that's it.


// edit these values to suit you
var slideShowName = "test" // slides go in ./slides/slideShowName
var slideWidth = 35;       // slide (and slideshow) width in ems
var slideHeight = 20;      // height, also ems
var numSlides = 5;

//-----------------------------------------------------------------------

// do not edit these
var slides = new Object;
var curSlide = 1;
var stripMargin = 0;
var oldStripMargin;

// initialization function; a lambda called on window load
window.onload = function() {
    var ss = document.getElementById("slideshow");
    ss.style.width = slideWidth + "em";
    ss.style.height = slideHeight + "em";
    for (var i = 0; i < numSlides; i++) {
        // construct the slide URLs and fire off XHRs for them
        var url = "./slides/" + slideShowName + "/" + i;
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
        // turn on prev/next buttons
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


function animateSlideTransition(iter, dir, dist) {
    // iteration 1,2: move 1/3 distance
    // iteration 3-6: move 1/2 distance
    // iteration 7: move to final position
    var strip = document.getElementById("filmstrip");
    if (iter == 7) {
        stripMargin = oldStripMargin + (slideWidth * dir);
        strip.style.marginLeft = stripMargin + "em";
        return;
    }

    var thisMove;
    if (iter < 3) {
        thisMove = dist / 3;
    } else  {
        thisMove = dist / 2;
    }
    stripMargin += thisMove * dir;
    strip.style.marginLeft = stripMargin + "em";
    window.setTimeout(function () { animateSlideTransition(iter + 1, dir, dist - thisMove ) }, 30)
}

function showCurrentSlide() {
    document.getElementById('curslide').innerHTML = curSlide + '/' + numSlides;
}