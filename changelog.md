# 0.0.9

### New Features

* Add impedance calculation functions from cyton
* The simulator from OpenBCI_NodeJS has been ripped out and place into this library! Woo.

# 0.0.8

### New Features

* Sample object now has property `valid` of type `boolean`, `false` when error parseing packet, `true` otherwise. On `false` there will be another property called `error` of type `string` which contains an error message.

# 0.0.7

### Continuous Integration

* Add `npm run test-lint` to add linting to travis.yml

### Bug Fixes

* Last sample number was confusing to use with `transformRawDataPacketsToSample`

### New Features

* In openBCIUtilities.js add function `transformRawDataPacketToSample` to parse a single raw data packet
* In openBCIConstants.js add function `rawDataToSampleObjectDefault(numChannels)` which should be used by drivers to create the object that is passed through each call to `transformRawDataPacketsToSample` 

# 0.0.6

### Bug Fixes

* Could not use 'daisy' with sample rate setter.

### New Features

* Add function in utilities for making daisy packets.
* Add code to `getChannelDataArray` for ganglion and daisy data being routed over wifi
* Create idea of protocols i.e. `BLE`, `Wifi`, and `Serial`

### Breaking changes

* `getChannelDataArray` now takes object as only arg.

# 0.0.5

### Bug Fixes

* When not scaling outputs `channelDataCounts` instead of `channelData`

# 0.0.4

### Bug Fixes

* Fix bug where samples were not properly being extracted

# 0.0.2

### Breaking Changes

* Renamed `Sample` to `Utilities` in `index.js`
* Renamed openBCIUtilities.js to openBCIUtilities.js
* Renamed openBCIUtilities-test.js to openBCIUtilities-test.js

### New Features

* Added a function in the sample module that parses a raw buffer of OpenBCI data, extracts raw data packets and returns the buffer with just the raw data packets removed. Allowing the user to process other data that is not a raw data.

# 0.0.1

Initial release
