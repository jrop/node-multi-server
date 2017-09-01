About
=====

[![Greenkeeper badge](https://badges.greenkeeper.io/jrop/node-multi-server.svg)](https://greenkeeper.io/)

This module is aimed at providing node with a simlper interface for creating and hosting multiple websites, supporting Sessions, Cookies, HTML Forms (www-form-data), and File Uploads internally (multipart/form-data).  This module is in early development, and not all functionality is gauranteed to work.

HTTPS is not supported (yet!).

Again, this is all highly untested code, so it is not gauranteed to work.

API Use
=======

See this project's Wiki for how to use the library.

TODO
====

1. Make temp directory and uploaded file timeout configurable
2. Create better documentation

Notes
=====

This module does not attempt to provide any attempt in assisting with template/view management.  For this kind of functionality, there are plenty of standalone modules (my personal favorite is `ejs`).

Installation
============

These are just plain [node modules][http://nodejs.org/docs/latest/api/modules.html] right now.  Eventually, I want to host this in an NPM repo for easy installation.

License
=======

The MIT License (MIT)

Copyright (c) 2012 https://github.com/jrop

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
