# v0.3.6

### Bug Fixes 

* Fix bug where parseGanglion could result in a concat of non-buffer types

# v0.3.5

### Bug Fixes 

* Fix bug where `getFirmware` failed for patch or minor versions over 9 (aka double digits)

# v0.3.4

### Bug Fixes 

* Protect and ensure buffer returned for raw data packets

# v0.3.3

### Enhancements 

* Add raw of version to `getFirmware` 
* Bump mathjs to 4.0.0 to resolve insecurity

# v0.3.1

### Enhancements 

* Removed `lodash` from dependencies to reduce bundle size (thanks @alexcastillo!!)

# v0.3.0

You can now use this module in the browser!! Huge should out to @alexcastillo for help with making with refactoring the project!

### Breaking Changes

* Removed simulator file back into cyton repo
* Removed `safe-buffer` in place of `buffer`
* Removed support for node version 5 and below
* `Utilities` changed to to `utilities`
* `Constants` is now `constants`
* Inidividual functions can now be importated from the utilities module.

# v0.2.7

### Bug Fixes

* No `stopByte` property for daisy samples. Added tests.

# v0.2.6

### Bug Fixes

* Accel data with counts did not work for cyton with daisy over wifi.

# v0.2.5

### Bug Fixes

* Had incorrect ganglion accel multiplication factor of 32mg per count but was really 16mg per count
* `newSample` and `newSampleNoScale` in utility file did not have `valid` is `true` property.

# v0.2.4

### New Features

* Add new constants for emitter

### Bug Fixes

* Fix bug where ganglion sample channel data when scale was false produced array of 8 values instead of 4

# v0.2.3

### New Features

* Add function for parsing an impedance object `.parsePacketImpedance()`

# v0.2.2

### Bug Fixes

* Fix wrap around bug in extractRawBLEDataPackets

# v0.2.1

### Bug Fixes

* Accel data with counts did not work for cyton with daisy. Also fixed up some test errors with the effected functions.

### New Features

* Add features for `openbci-ganglion`

# v0.2.0

### New Feature

* With scale option false, `.parsePacketStandardAccel()` `.parsePacketTimeSyncedAccel()` will now return array called will now return `accelDataCounts` property with un-scaled data.

# v0.1.5

### Bug Fixes

* Was missing errors in constants used by ganglion and other ble projects.
* Fixed getChannelData functions to support 2 channel cytons

# v0.1.4

### Bug Fixes

* E-patch on new function added 0.1.3


# v0.1.3

### New Features

* A bunch of functions to support synchronization of channel settings with cyton. Will be used by both the Wifi and the Cyton node modules.

# v0.1.2

### Bug Fixes

* Send counts did not work for daisy.
* Sample output was inconsistent
* Fixed `timeStamp` to `timestamp` this was pr #147 (thanks @alexdevmotion)

# v0.1.1

### Bug Fixes

* Send counts did not work for daisy.

# v0.1.0

### New Functions

* Add function `getFirmware(dataBuffer)` to utilities

### Breaking Changes

* Removed function called `findV2Firmware()` because it's useless with v3.0.0 firmware

# v0.0.10

### New Function

* Add `boardTypeForNumberOfChannels()` to Constants

# v0.0.9

### New Features

* Add impedance calculation functions from cyton
* The simulator from OpenBCI_NodeJS has been ripped out and place into this library! Woo.

# v0.0.8

### New Features

* Sample object now has property `valid` of type `boolean`, `false` when error parseing packet, `true` otherwise. On `false` there will be another property called `error` of type `string` which contains an error message.

# v0.0.7

### Continuous Integration

* Add `npm run test-lint` to add linting to travis.yml

### Bug Fixes

* Last sample number was confusing to use with `transformRawDataPacketsToSample`

### New Features

* In openBCIUtilities.js add function `transformRawDataPacketToSample` to parse a single raw data packet
* In openBCIConstants.js add function `rawDataToSampleObjectDefault(numChannels)` which should be used by drivers to create the object that is passed through each call to `transformRawDataPacketsToSample`

# v0.0.6

### Bug Fixes

* Could not use 'daisy' with sample rate setter.

### New Features

* Add function in utilities for making daisy packets.
* Add code to `getChannelDataArray` for ganglion and daisy data being routed over wifi
* Create idea of protocols i.e. `BLE`, `Wifi`, and `Serial`

### Breaking changes

* `getChannelDataArray` now takes object as only arg.

# v0.0.5

### Bug Fixes

* When not scaling outputs `channelDataCounts` instead of `channelData`

# v0.0.4

### Bug Fixes

* Fix bug where samples were not properly being extracted

# v0.0.2

### Breaking Changes

* Renamed `Sample` to `Utilities` in `index.js`
* Renamed openBCIUtilities.js to openBCIUtilities.js
* Renamed openBCIUtilities-test.js to openBCIUtilities-test.js

### New Features

* Added a function in the sample module that parses a raw buffer of OpenBCI data, extracts raw data packets and returns the buffer with just the raw data packets removed. Allowing the user to process other data that is not a raw data.

# v0.0.1

Initial release
