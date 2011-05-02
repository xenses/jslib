Firepear jslib slideshow usage
==============================

One copy of this script can drive any number of slideshows. Just put
it (and its stylesheet) where ever you like and call it, as described
below, from any HTML doc you wish.



In every directory with a slideshow-bearing HTML doc, a
subdirectory named `fpslidedecks` is needed. That subdirectory
holds additional subdirs, one per slideshow, named after the
slideshow.

The slides are files in the deck directories, named `slide0001`,
`slide0002`, `slide0003`, and so forth. No extension.

The contents of the slide files are loaded when the document
containing the slideshow is. HTML document fragments, and almost all
markup, are safe in slide ; `<html>`, `<head>`, and `<body>` elements
definitely are not.

Setting up slideshows
---------------------

The slideshow javascript and css need to be loaded as well.

```
  <link rel="stylesheet" href="/path/to/slideshow.css" />
  <script src='/path/to/slideshow.js'></script>
```

And initialize the slideshow(s):

```
  <script>
    // repeat these lines for each slideshow you want to have
    var ss = new slideshow({'name':'NAME', 'x':WIDTH, 'y':HEIGHT, 'num':SLIDES});
    window.addEventListener("DOMContentLoaded", function() { ss.init() }, false);
  </script>
```

And then, for each slideshow on a page, you need the following markup:

```
  <div id="NAME"></div>
```

where `NAME` is the name you've chosen for the slideshow. This will
be the name you use in the Javascript initialization of the
slideshow, and the name of the subdirectory of `fpslidedecks` where
the slides for this show will reside.


Any number of slideshows can be on a single page. Just add more
declarations, `init()` calls, and sets of HTML elements (with `NAME`
changed appropriately).

Backing up to the constructor, its required arguments are:

```
  name  Slideshow name; should match one of your divs
  x     Width, in ems
  y     Height, in ems
  num   Number of slides
```

Things will break horribly if you don't have all these.  There is
no argument validation yet. There are also optional arguments:

```
  outline  If defined and *true*, it will be used to set the color
           of the focus outline of the slideshow. If defined and
           *false*, the slideshow's outline will be turned off. If
           undefined, the outline will be left as the user-agent
           default.

  roll  If true, the slideshow controls will allow rolling around
        from the last to first slide, and vice versa.

  delay  When defined, causes the slideshow to autoadvance one slide
         every <delay> ms. Any action by a viewer will turn off the
         autoadvance behavior. If delay is defined then 'roll' is
         automatically set to true.
```

Styling slideshows
------------------

Do not add padding to the slideshow divs you define. Borders and
margins are okay.

Be aware that the entire slideshow is set to `overflow: hidden`, so
content must fit the slides.

Slide size is inherited from the slideshow constructor settings, and
should not be manipulated -- slide transitions depend on precise
alignment of the slides themselves.

Individual slides are divs with class `slide`. Almost any styling
should be okay on the slides themselves, except margins and
borders. Everything should be okay for elements within slides though,
again, it's up to you to make the content fit.
