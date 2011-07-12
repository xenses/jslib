Firepear jslib blades usage
===========================

This script is object-based, so only one copy is needed for any number
of blade elements on any number of pages. No external resources are
needed.


What's a blade?
---------------

Blades are a UI element. They are most like tabs, but while tabs share
a layout space with header/selectors running across the top, blades
all have their own layout space and their selectors run down the side,
adding to their width.

```
 --------------------
| Tab1 | Tab2 | Tab3 |
-------       ------------------
|                               |
| A collection of three tabs    |
| with the second tab           |
| selected.                     |
--------------------------------

--------------------------
|B|B   A collection of |B|
|l|l   three blades    |l|
|a|a   with the 2nd    |a|
|d|d   blade select-   |d|
|e|e   ed.             |e|
|1|2                   |3|
| |                    | |
| |                    | |
--------------------------
```


Setting up blades
-----------------

Include the script on your webpage

```
<script src="/path/to/blades.js"></script>
```

Then give yourself a new set of blades:

```
var blades = new bladeset({'name':'thes', 'x':40, 'hx':2, 'focus':'#565656', 'blur':'#888'});
```

'name' is the bladeset's name. It should be unique within a page, and
affects the names of elements created by the script. `x` is the width
of the bladeset, in ems. `hx` is the blade header width in
ems. `focus` is the color that the selected blade's header will be
displayed in, and `blur` is the color that all blurred blade headers
will be.

After creating the bladeset, attach the `init` method to an event so
that the blades themselves can be created:

```
window.addEventListener("DOMContentLoaded",
                        function() { blades.init([['class','Classification'],
                                                  ['search','Search'],
                                                  ['index','Index'],
                                                  ['help','Help/About']]); }, false);

```

The argument to `init` is an array of arrays, with one inner array for
each blade to be created. The elements of the inner arrays are the
name of the blade and the text to be displayed as that blade's header.


The innards of blades
---------------------

Each blade is a `div` element with an id attribute set to the name of
the bladeset plus the name of the blade (so, from the example given,
the first blade would have an id of `thesclass`).

Inside this div is the header and a content div. The content div is,
unsurprisingly, where the content of the blade should go. Each blade's
content area is a div with its id attribute set to the name of the
blade plus the string `cont` (so `thesclasscont` is the content div of
the first blade in the example).


Setting the content of blades
-----------------------------

You may either set the `innerHTML` property of the content div
directly, or you can use the `setContent` method on an individual
blade.

Very shortly, a new method, `loadContent` will be provided to retrieve
blade content over the network.


Styling blades
--------------

All blades have their `class` attribute set to `blade`, and this
(along with ids) may be used to target styles in CSS. Please see
`blades.css` in this distribution for the styles which should, at a
minimum, be set.

The vertical headers of the blades are twitchy. If they're not
positioning correctly with the font of your choice, twiddle the
`width`, `margin-*`, and `top` rules.

Set the font for the headers with the selector `.blade h2.btitle`

