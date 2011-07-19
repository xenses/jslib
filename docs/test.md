Firepear jslib test library
===========================

test.js is a very simple testing library on the model of Perl's
`Test::More`. It can be used in standalone test scripts (with
Spidermonkey or V8) or in HTML-embedded testing.

It currently provides two testing functions:

* `is`, which tests for equivalence
* `isnt`, which tests for difference

There is also a summary function, `testPrintSummary`, which should be
called at the end of a test document to write out a summary of the
test run.

is() and isnt()
---------------

These functions work in exactly the same way, and take exactly the
same arguments. They do a simple test for equivalence (or lack
thereof) between the given and expected expressions.

```is(GIVEN_EXPR, EXPECTED_EXPR, MSG)```

`MSG` is the message to be printed if the test fails. Sucessful tests
are silent.


Usage
-----

To use test.js in console testing scripts, just load it into the
script. See `/test/chunker_test.js` in this repo for an example.

To use it in an HTML document, I recommend a minimal setup like

```
<!DOCTYPE html>
<html lang="en">
<head>
  <script src="/path/to/test.js"></script>
  <style>body { font-family: monospace; white-space: pre; }</style>
</head>
<body>
  <script>
    // tests go here! (or you could do
    // '<script src="/path/to/test_script.js"></script>'
    // instead of inlining)
    is(2+2, 4, "we can add");
    is(true, false, "a fallacy");
    testPrintSummary();
  </script>
</body>
</html>
```
