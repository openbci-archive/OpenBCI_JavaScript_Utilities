# OpenBCI JavaScript Utilities Library

<p align="center">
  <img alt="banner" src="/images/node_icon2.png/" width="300">
</p>
<p align="center" href="">
  Provide a stable javascript library for OpenBCI
</p>

[![Build Status](https://travis-ci.org/OpenBCI/OpenBCI_JavaScript_Utilities.svg?branch=master)](https://travis-ci.org/OpenBCI/OpenBCI_JavaScript_Utilities)
[![codecov](https://codecov.io/gh/OpenBCI/OpenBCI_Javascript_Utilities/branch/master/graph/badge.svg)](https://codecov.io/gh/OpenBCI/OpenBCI_Javascript_Utilities)
[![Dependency Status](https://david-dm.org/OpenBCI/OpenBCI_Javascript_Utilities.svg)](https://david-dm.org/OpenBCI/OpenBCI_Javascript_Utilities)
[![npm](https://img.shields.io/npm/dm/openbci-utilities.svg?maxAge=2592000)](http://npmjs.com/package/openbci-utilities)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)

## Welcome!

First and foremost, Welcome! :tada: Willkommen! :confetti_ball: Bienvenue! :balloon::balloon::balloon:

Thank you for visiting the OpenBCI JavaScript Utilities Library repository.

This document (the README file) is a hub to give you some information about the project. Jump straight to one of the sections below, or just scroll down to find out more.

* [What are we doing? (And why?)](#what-are-we-doing)
* [Who are we?](#who-are-we)
* [What do we need?](#what-do-we-need)
* [How can you get involved?](#get-involved)
* [Get in touch](#contact-us)
* [Find out more](#find-out-more)
* [Understand the jargon](#glossary)

## What are we doing?

### The problem

* The first javascript libraries for OpenBCI was the [NodeJS Cyton SDK][link_nodejs], then the [NodeJS Ganglion SDK][link_nodejs_ganglion], then the [NodeJS for WiFi][link_nodejs_wifi], each with their own interfaces, serial, bluetooth, and wifi respectively.
* The ganglion's raw data is incredibly complex and must be decompressed and carefully parsed, in less words, it takes time to learn to parse this stream
* People want to use the [Ganglion][link_shop_ganglion] in the web browser

So, if even developers are interested in working with [OpenBCI][link_shop_openbci] devices with javascript, they have a huge burden to overcome before they can parse the data.

### The solution

The OpenBCI JavaScript Utilities Library will:

* Provide a nice cozy home to all the horror of parsing raw binary byte streams
* Use automated testing extensively and don't let untested code be released!
* Work in the browser and NodeJS!
* Be able to parse ganglion and cyton data.
* Store a constants file so every module agrees on names of keys and such

Using a single unified JavaScript library solves the challenges of parsing raw brainwave data. Our main goal is to ***provide a stable javascript library for OpenBCI***

## Who are we?

The main code writer of the OpenBCI JavaScript Utilities Library is [AJ Keller][link_aj_keller]. This code all started in the OpenBCI NodeJS SDK for Cyton. Many people contributed, if not directly, but by advice or instructions drawn on a coffee table to calculate impedance. A lot of people who use this library never have any idea about it! Every user of the OpenBCI GUI is heavily dependent on this code base for all data acquisition from the Cyton, Ganglion and WiFi shield!

## What do we need?

**You**! In whatever way you can help.

We need expertise in programming, user experience, software sustainability, documentation and technical writing and project management.

We'd love your feedback along the way.

Our primary goal is to provide a stable javascript library for OpenBCI, and we're excited to support the professional development of any and all of our contributors. If you're looking to learn to code, try out working collaboratively, or translate you skills to the digital domain, we're here to help.

## Get involved

If you think you can help in any of the areas listed above (and we bet you can) or in any of the many areas that we haven't yet thought of (and here we're *sure* you can) then please check out our [contributors' guidelines](CONTRIBUTING.md) and our [roadmap](ROADMAP.md).

Please note that it's very important to us that we maintain a positive and supportive environment for everyone who wants to participate. When you join us we ask that you follow our [code of conduct](CODE_OF_CONDUCT.md) in all interactions both on and offline.

## Contact us

If you want to report a problem or suggest an enhancement we'd love for you to [open an issue](../../issues) at this github repository because then we can get right on it. But you can also contact [AJ][link_aj_keller] by email (pushtheworldllc AT gmail DOT com) or on [twitter](https://twitter.com/aj-ptw).

## Find out more

You might be interested in:

* What is [OpenBCI][link_openbci]?

And of course, you'll want to know our:

* [Contributors' guidelines](CONTRIBUTING.md)
* [Roadmap](ROADMAP.md)

## Thank you

Thank you so much (Danke schön! Merci beaucoup!) for visiting the project and we do hope that you'll join us on this amazing journey to make programming with OpenBCI fun and easy.

# Documentation

### Table of Contents:
---

1. [Installation](#install)
2. [Usage](#usage)
2. [Developing](#developing)
3. [Testing](#developing-testing)
4. [Contribute](#contribute)
5. [License](#license)

## <a name="install"></a> Installation:

```
npm install openbci-utilities
```

## <a name="usage"></a> Usage:

### In NodeJS

```node
const { constants, debug, utilities } = require('openbci-utilities');

console.log('OpenBCIUtilities', OpenBCIUtilities);
```

### In Web Browser

**index.html**

```html
<!doctype html>
<html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <title>OpenBCI Utilities</title>
    </head>
    <body>
        <pre>See data in the console</pre>
        <script src="../../dist/openbci-utilities.var.js"></script>
        <script src="./index.js"></script>
    </body>
</html>
```

**index.js**

```javascript
console.log(OpenBCIUtilities);
```


## <a name="developing"></a> Developing:
### <a name="developing-running"></a> Running:

```
npm install
```

### <a name="developing-testing"></a> Testing:

```
npm test
```

## <a name="contribute"></a> Contribute:

1. Fork it!
2. Branch off of `development`: `git checkout development`
2. Create your feature branch: `git checkout -b my-new-feature`
3. Make changes
4. If adding a feature, please add test coverage.
5. Ensure tests all pass. (`npm test`)
6. Commit your changes: `git commit -m 'Add some feature'`
7. Push to the branch: `git push origin my-new-feature`
8. Submit a pull request. Make sure it is based off of the `development` branch when submitting! :D

## <a name="license"></a> License:

MIT

[link_aj_keller]: https://github.com/aj-ptw
[link_shop_wifi_shield]: https://shop.openbci.com/collections/frontpage/products/wifi-shield?variant=44534009550
[link_shop_ganglion]: https://shop.openbci.com/collections/frontpage/products/pre-order-ganglion-board
[link_shop_cyton]: https://shop.openbci.com/collections/frontpage/products/cyton-biosensing-board-8-channel
[link_shop_cyton_daisy]: https://shop.openbci.com/collections/frontpage/products/cyton-daisy-biosensing-boards-16-channel
[link_nodejs]: https://github.com/OpenBCI/OpenBCI_NodeJS
[link_nodejs_cyton]: https://github.com/OpenBCI/OpenBCI_NodeJS_Cyton
[link_nodejs_ganglion]: https://github.com/OpenBCI/OpenBCI_NodeJS_Ganglion
[link_nodejs_wifi]: https://github.com/OpenBCI/OpenBCI_NodeJS_Wifi
[link_ptw]: https://www.pushtheworldllc.com
[link_openbci]: http://www.openbci.com
[link_mozwow]: http://mozillascience.github.io/working-open-workshop/index.html
[link_wifi_get_streaming]: examples/getStreaming/getStreaming.js
[link_openleaderscohort]: https://medium.com/@MozOpenLeaders
[link_mozsci]: https://science.mozilla.org
