/**
* Created by ajk on 12/15/15.
*/
'use strict';
// jshint expr: true
const bluebirdChecks = require('./bluebirdChecks');
const openBCIUtilities = require('../openBCIUtilities');
const sinon = require('sinon');
const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
// let should = chai.should(); // eslint-disable-line no-unused-lets

const chaiAsPromised = require('chai-as-promised');
const dirtyChai = require('dirty-chai');
const sinonChai = require('sinon-chai');
chai.use(chaiAsPromised);
chai.use(sinonChai);
chai.use(dirtyChai);
const bufferEqual = require('buffer-equal');
const Buffer = require('safe-buffer').Buffer;

let k = require('../openBCIConstants');

const defaultChannelSettingsArray = k.channelSettingsArrayInit(k.OBCINumberOfChannelsDefault);

let sampleBuf = openBCIUtilities.samplePacket();

let accelArray;

let channelScaleFactor = 4.5 / 24 / (Math.pow(2, 23) - 1);

describe('openBCIUtilities', function () {
  beforeEach(function () {
    accelArray = [0, 0, 0];
  });
  afterEach(() => bluebirdChecks.noPendingPromises());
  describe('#transformRawDataPacketsToSample', function () {
    // TODO: Add tests
  });
  describe('#parsePacketStandardAccel', function () {
    it('should return the packet', function () {
      expect(openBCIUtilities.parsePacketStandardAccel({
        channelSettings: defaultChannelSettingsArray,
        rawDataPacket: sampleBuf,
        scale: true
      })).to.not.equal(null);
    });
    it('should have the correct sample number', function () {
      let sample = openBCIUtilities.parsePacketStandardAccel({
        channelSettings: defaultChannelSettingsArray,
        rawDataPacket: sampleBuf,
        scale: true
      });

      expect(sample.sampleNumber).to.equal(0x45);
    });
    it('all the channels should have the same number value as their (index + 1) * scaleFactor', function () {
      // sampleBuf has its channel number for each 3 byte integer. See line 20...
      let sample = openBCIUtilities.parsePacketStandardAccel({
        channelSettings: defaultChannelSettingsArray,
        rawDataPacket: sampleBuf,
        scale: true
      });

      // So parse the sample we created and each value resulting from the channelData array should
      //  be its index + 1 (i.e. channel number) multiplied by the channel scale factor set by the
      //  ADS1299 for a gain of 24 (default)
      sample.channelData.forEach((channelValue, index) => {
        expect(channelValue).to.equal(channelScaleFactor * (index + 1));
      });
    });

    it('all the channels should have the same number value as their (index + 1)', function () {
      // sampleBuf has its channel number for each 3 byte integer. See line 20...
      let sample = openBCIUtilities.parsePacketStandardAccel({
        channelSettings: defaultChannelSettingsArray,
        rawDataPacket: sampleBuf,
        scale: false
      });

      // So parse the sample we created and each value resulting from the channelData array should
      //  be its index + 1 (i.e. channel number) multiplied by the channel scale factor set by the
      //  ADS1299 for a gain of 24 (default)
      sample.channelDataCounts.forEach((channelValue, index) => {
        expect(channelValue).to.equal(index + 1);
      });
    });
    it('all the auxs should have the same number value as their index * scaleFactor', function () {
      let sample = openBCIUtilities.parsePacketStandardAccel({
        channelSettings: defaultChannelSettingsArray,
        rawDataPacket: sampleBuf,
        scale: true
      });

      sample.accelData.forEach((accelValue, index) => {
        expect(accelValue).to.equal(openBCIUtilities.scaleFactorAux * index);
      });
    });
    it('check to see if negative numbers work on channel data', function () {
      let temp = openBCIUtilities.samplePacket();
      // console.log(temp)
      let taco = new Buffer([0x81]);
      taco.copy(temp, 2);
      let sample = openBCIUtilities.parsePacketStandardAccel({
        channelSettings: defaultChannelSettingsArray,
        rawDataPacket: temp,
        scale: true
      });
      assert.equal(sample.channelData[0], channelScaleFactor * -8323071, 'Negative numbers not working correctly');
    });
    it('check to see if negative numbers work on aux data', function () {
      let temp = openBCIUtilities.samplePacket();
      let taco = new Buffer([0x81]);
      taco.copy(temp, 26);
      let sample = openBCIUtilities.parsePacketStandardAccel({
        channelSettings: defaultChannelSettingsArray,
        rawDataPacket: temp,
        scale: true
      });
      expect(sample.accelData[0]).to.be.approximately(-32512 * openBCIUtilities.scaleFactorAux, 1);
    });
    it('should work on 200 samples', function () {
      let numberOfSamplesToTest = 200;
      let samplesReceived = 0;

      for (let i = 0; i < numberOfSamplesToTest; i++) {
        let temp = openBCIUtilities.samplePacket(i);
        // console.log(temp)
        let taco = new Buffer([i]);
        taco.copy(temp, 2);
        let sample = openBCIUtilities.parsePacketStandardAccel({
          channelSettings: defaultChannelSettingsArray,
          rawDataPacket: temp,
          scale: true
        });
        expect(sample.sampleNumber).to.equal(samplesReceived);
        samplesReceived++;
      }
    });
    it('has the right sample number', function () {
      let expectedSampleNumber = 0x45;
      let sample = openBCIUtilities.parsePacketStandardAccel({
        channelSettings: defaultChannelSettingsArray,
        rawDataPacket: sampleBuf,
        scale: true
      });
      expect(sample.sampleNumber).to.equal(expectedSampleNumber);
    });
    it('has the right stop byte', function () {
      let sample = openBCIUtilities.parsePacketStandardAccel({
        channelSettings: defaultChannelSettingsArray,
        rawDataPacket: sampleBuf,
        scale: true
      });
      expect(sample.stopByte).to.equal(openBCIUtilities.makeTailByteFromPacketType(k.OBCIStreamPacketStandardAccel));
    });
    it('has the right start byte', function () {
      let sample = openBCIUtilities.parsePacketStandardAccel({
        channelSettings: defaultChannelSettingsArray,
        rawDataPacket: sampleBuf,
        scale: true
      });
      expect(sample.startByte).to.equal(0xA0);
    });
    describe('#errorConditions', function () {
      it('send non data buffer', function () {
        expect(openBCIUtilities.parsePacketStandardAccel.bind(openBCIUtilities, {
          rawDataPacket: 1
        })).to.throw(k.OBCIErrorInvalidByteLength);
      });
      it('bad start byte', function () {
        let temp = openBCIUtilities.samplePacket();
        temp[0] = 69;
        expect(openBCIUtilities.parsePacketStandardAccel.bind(openBCIUtilities, {
          rawDataPacket: temp
        })).to.throw(k.OBCIErrorInvalidByteStart);
      });
      it('wrong number of bytes', function () {
        expect(openBCIUtilities.parsePacketStandardAccel.bind(openBCIUtilities, {
          rawDataPacket: new Buffer(5)
        })).to.throw(k.OBCIErrorInvalidByteLength);
      });
      it('undefined', function () {
        expect(openBCIUtilities.parsePacketStandardAccel.bind(openBCIUtilities)).to.throw(k.OBCIErrorUndefinedOrNullInput);
      });
    });
  });
  describe('#parsePacketStandardRawAux', function () {
    let packet;
    it('gets 6-byte buffer', function () {
      // Get a packet
      // This packet has aux bytes with the same value as their index
      packet = openBCIUtilities.samplePacketStandardRawAux(0);

      let sample = openBCIUtilities.parsePacketStandardRawAux({
        rawDataPacket: packet,
        channelSettings: defaultChannelSettingsArray,
        scale: true
      });
      expect(Buffer.isBuffer(sample.auxData)).to.be.true();
    });
    it('gets the correct 6-byte buffer', function () {
      // Get a packet
      // This packet has aux bytes with the same value as their index
      packet = openBCIUtilities.samplePacketStandardRawAux(0);

      let sample = openBCIUtilities.parsePacketStandardRawAux({
        rawDataPacket: packet,
        channelSettings: defaultChannelSettingsArray,
        scale: true
      });
      for (let i = 0; i < 6; i++) {
        expect(sample.auxData[i]).to.equal(i);
      }
    });
    it('all the channels should have the same number value as their (index + 1) * scaleFactor', function () {
      packet = openBCIUtilities.samplePacketStandardRawAux(0);
      let sample = openBCIUtilities.parsePacketStandardRawAux({
        rawDataPacket: packet,
        channelSettings: defaultChannelSettingsArray,
        scale: true
      });
      sample.channelData.forEach((channelValue, index) => {
        expect(channelValue).to.equal(channelScaleFactor * (index + 1));
      });
    });
    it('all the channels should have the same number value as their (index + 1)', function () {
      packet = openBCIUtilities.samplePacketStandardRawAux(0);
      let sample = openBCIUtilities.parsePacketStandardRawAux({
        rawDataPacket: packet,
        channelSettings: defaultChannelSettingsArray,
        scale: false
      });
      sample.channelDataCounts.forEach((channelValue, index) => {
        expect(channelValue).to.equal(index + 1);
      });
    });
    it('has the right sample number', function () {
      let expectedSampleNumber = 69;
      packet = openBCIUtilities.samplePacketStandardRawAux(expectedSampleNumber);
      let sample = openBCIUtilities.parsePacketStandardRawAux({
        rawDataPacket: packet,
        channelSettings: defaultChannelSettingsArray,
        scale: true
      });
      expect(sample.sampleNumber).to.equal(expectedSampleNumber);
    });
    it('has the right stop byte', function () {
      packet = openBCIUtilities.samplePacketStandardRawAux(0);
      let sample = openBCIUtilities.parsePacketStandardRawAux({
        rawDataPacket: packet,
        channelSettings: defaultChannelSettingsArray,
        scale: true
      });
      expect(sample.stopByte).to.equal(openBCIUtilities.makeTailByteFromPacketType(k.OBCIStreamPacketStandardRawAux));
    });
    it('has the right start byte', function () {
      packet = openBCIUtilities.samplePacketStandardRawAux(0);
      let sample = openBCIUtilities.parsePacketStandardRawAux({
        rawDataPacket: packet,
        channelSettings: defaultChannelSettingsArray,
        scale: true
      });
      expect(sample.startByte).to.equal(0xA0);
    });
    describe('#errorConditions', function () {
      it('send non data buffer', function () {
        expect(openBCIUtilities.parsePacketStandardRawAux.bind(openBCIUtilities, {
          rawDataPacket: 1
        })).to.throw(k.OBCIErrorInvalidByteLength);
      });
      it('bad start byte', function () {
        let temp = openBCIUtilities.samplePacket();
        temp[0] = 69;
        expect(openBCIUtilities.parsePacketStandardRawAux.bind(openBCIUtilities, {
          rawDataPacket: temp
        })).to.throw(k.OBCIErrorInvalidByteStart);
      });
      it('wrong number of bytes', function () {
        expect(openBCIUtilities.parsePacketStandardRawAux.bind(openBCIUtilities, {
          rawDataPacket: new Buffer(5)
        })).to.throw(k.OBCIErrorInvalidByteLength);
      });
    });
  });
  describe('#getFromTimePacketTime', function () {
    it('should extract the proper time value from packet', function () {
      let sampleWithTime = openBCIUtilities.samplePacketAccelTimeSynced(0);
      let time = openBCIUtilities.getFromTimePacketTime(sampleWithTime);
      expect(time).to.equal(1);
    });
    describe('#errorConditions', function () {
      it('wrong number of bytes', function () {
        expect(openBCIUtilities.getFromTimePacketTime.bind(openBCIUtilities, new Buffer(5))).to.throw(k.OBCIErrorInvalidByteLength);
      });
    });
  });
  describe('#getFromTimePacketAccel', function () {
    let packet;

    it('should emit and array if z axis i.e. sampleNumber % 10 === 9', function () {
      // Make a packet with a sample number that represents z axis
      packet = openBCIUtilities.samplePacketAccelTimeSynced(9);
      let isZAxis = openBCIUtilities.getFromTimePacketAccel(packet, accelArray);
      expect(isZAxis).to.be.true();
    });
    it(`false if sample number is not sampleNumber % 10 === ${k.OBCIAccelAxisZ}`, function () {
      // Make a packet that is anything but the z axis
      packet = openBCIUtilities.samplePacketAccelTimeSynced(k.OBCIAccelAxisX);
      let isZAxis = openBCIUtilities.getFromTimePacketAccel(packet, accelArray);
      expect(isZAxis).to.be.false();

      packet = openBCIUtilities.samplePacketAccelTimeSynced(k.OBCIAccelAxisY);
      isZAxis = openBCIUtilities.getFromTimePacketAccel(packet, accelArray);
      expect(isZAxis).to.be.false();

      packet = openBCIUtilities.samplePacketAccelTimeSynced(34);
      isZAxis = openBCIUtilities.getFromTimePacketAccel(packet, accelArray);
      expect(isZAxis).to.be.false();

      packet = openBCIUtilities.samplePacketAccelTimeSynced(100);
      isZAxis = openBCIUtilities.getFromTimePacketAccel(packet, accelArray);
      expect(isZAxis).to.be.false();
    });
    describe('#errorConditions', function () {
      it('wrong number of bytes', function () {
        expect(openBCIUtilities.getFromTimePacketAccel.bind(openBCIUtilities, new Buffer(5))).to.throw(k.OBCIErrorInvalidByteLength);
      });
    });
  });
  describe('#parsePacketTimeSyncedAccel', function () {
    // Global array (at least it's global in practice) to store accel data between packets
    let packet1, packet2, packet3;

    it(`should only include accel data array on sampleNumber%10 === ${k.OBCIAccelAxisZ}`, function () {
      // Generate three packets, packets only get one axis value per packet
      //  X axis data is sent with every sampleNumber % 10 === 7
      packet1 = openBCIUtilities.samplePacketAccelTimeSynced(k.OBCIAccelAxisX);
      //  Y axis data is sent with every sampleNumber % 10 === 8
      packet2 = openBCIUtilities.samplePacketAccelTimeSynced(k.OBCIAccelAxisY);
      //  Z axis data is sent with every sampleNumber % 10 === 9
      packet3 = openBCIUtilities.samplePacketAccelTimeSynced(k.OBCIAccelAxisZ);

      let sample = openBCIUtilities.parsePacketTimeSyncedAccel({
        rawDataPacket: packet1,
        channelSettings: defaultChannelSettingsArray,
        timeOffset: 0,
        accelArray
      });
      expect(sample).to.not.have.property('accelData');

      sample = openBCIUtilities.parsePacketTimeSyncedAccel({
        rawDataPacket: packet2,
        channelSettings: defaultChannelSettingsArray,
        timeOffset: 0,
        accelArray
      });
      expect(sample).to.not.have.property('accelData');

      sample = openBCIUtilities.parsePacketTimeSyncedAccel({
        rawDataPacket: packet3,
        channelSettings: defaultChannelSettingsArray,
        timeOffset: 0,
        accelArray
      });
      expect(sample).to.have.property('accelData');
    });
    it("should convert raw numbers into g's with scale factor", function () {
      // Generate three packets, packets only get one axis value per packet
      //  X axis data is sent with every sampleNumber % 10 === 7
      packet1 = openBCIUtilities.samplePacketAccelTimeSynced(k.OBCIAccelAxisX);
      //  Y axis data is sent with every sampleNumber % 10 === 8
      packet2 = openBCIUtilities.samplePacketAccelTimeSynced(k.OBCIAccelAxisY);
      //  Z axis data is sent with every sampleNumber % 10 === 9
      packet3 = openBCIUtilities.samplePacketAccelTimeSynced(k.OBCIAccelAxisZ);

      let sample = openBCIUtilities.parsePacketTimeSyncedAccel({
        rawDataPacket: packet1,
        channelSettings: defaultChannelSettingsArray,
        timeOffset: 0,
        accelArray
      });
      sample = openBCIUtilities.parsePacketTimeSyncedAccel({
        rawDataPacket: packet2,
        channelSettings: defaultChannelSettingsArray,
        timeOffset: 0,
        accelArray
      });
      sample = openBCIUtilities.parsePacketTimeSyncedAccel({
        rawDataPacket: packet3,
        channelSettings: defaultChannelSettingsArray,
        timeOffset: 0,
        accelArray
      });
      sample.accelData.forEach((accelValue, index) => {
        expect(accelValue).to.equal(openBCIUtilities.scaleFactorAux);
      });
    });
    it('with scale all the channels should have the same number value as their (index + 1) * scaleFactor', function () {
      packet1 = openBCIUtilities.samplePacketAccelTimeSynced(0);
      let sample = openBCIUtilities.parsePacketTimeSyncedAccel({
        rawDataPacket: packet1,
        channelSettings: defaultChannelSettingsArray,
        timeOffset: 0,
        scale: true,
        accelArray
      }); // sampleBuf has its channel number for each 3 byte integer. See line 20...
      sample.channelData.forEach((channelValue, index) => {
        expect(channelValue).to.equal(channelScaleFactor * (index + 1));
      });
    });
    it('without scale all the channels should have the same number value as their (index + 1)', function () {
      packet1 = openBCIUtilities.samplePacketAccelTimeSynced(0);
      let sample = openBCIUtilities.parsePacketTimeSyncedAccel({
        rawDataPacket: packet1,
        channelSettings: defaultChannelSettingsArray,
        timeOffset: 0,
        scale: false,
        accelArray
      }); // sampleBuf has its channel number for each 3 byte integer. See line 20...
      sample.channelDataCounts.forEach((channelValue, index) => {
        expect(channelValue).to.equal(index + 1);
      });
    });
    it('has the right sample number', function () {
      let expectedSampleNumber = 69;
      packet1 = openBCIUtilities.samplePacketAccelTimeSynced(expectedSampleNumber);
      let sample = openBCIUtilities.parsePacketTimeSyncedAccel({
        rawDataPacket: packet1,
        channelSettings: defaultChannelSettingsArray,
        timeOffset: 0,
        accelArray
      }); // sampleBuf has its channel number for each 3 byte integer. See line 20...
      expect(sample.sampleNumber).to.equal(expectedSampleNumber);
    });
    it('has the right stop byte', function () {
      packet1 = openBCIUtilities.samplePacketAccelTimeSynced(0);
      let sample = openBCIUtilities.parsePacketTimeSyncedAccel({
        rawDataPacket: packet1,
        channelSettings: defaultChannelSettingsArray,
        timeOffset: 0,
        accelArray
      }); // sampleBuf has its channel number for each 3 byte integer. See line 20...
      expect(sample.stopByte).to.equal(openBCIUtilities.makeTailByteFromPacketType(k.OBCIStreamPacketAccelTimeSynced));
    });
    it('has the right start byte', function () {
      packet1 = openBCIUtilities.samplePacketAccelTimeSynced(0);
      let sample = openBCIUtilities.parsePacketTimeSyncedAccel({
        rawDataPacket: packet1,
        channelSettings: defaultChannelSettingsArray,
        timeOffset: 0,
        accelArray
      }); // sampleBuf has its channel number for each 3 byte integer. See line 20...
      expect(sample.startByte).to.equal(0xA0);
    });
    describe('#errorConditions', function () {
      it('wrong number of bytes', function () {
        expect(openBCIUtilities.parsePacketTimeSyncedAccel.bind(openBCIUtilities, {
          rawDataPacket: new Buffer(5),
          channelSettings: defaultChannelSettingsArray,
          timeOffset: 0,
          accelArray
        })).to.throw(k.OBCIErrorInvalidByteLength);
      });
    });
  });
  describe('#getFromTimePacketRawAux', function () {
    let packet;
    it('should put the two aux bytes into a buffer', function () {
      // Get a packet
      packet = openBCIUtilities.samplePacketRawAuxTimeSynced(0);

      let rawAuxBuffer = openBCIUtilities.getFromTimePacketRawAux(packet);
      expect(rawAuxBuffer.byteLength).to.equal(2);
    });
    describe('#errorConditions', function () {
      it('wrong number of bytes', function () {
        expect(openBCIUtilities.getFromTimePacketRawAux.bind(openBCIUtilities, new Buffer(5))).to.throw(k.OBCIErrorInvalidByteLength);
      });
    });
  });
  describe('#parsePacketTimeSyncedRawAux', function () {
    let packet;
    it('should put the two aux bytes into a buffer', function () {
      // Generate three packets, packets only get one axis value per packet
      packet = openBCIUtilities.samplePacketRawAuxTimeSynced(0);

      let sample = openBCIUtilities.parsePacketTimeSyncedRawAux({
        rawDataPacket: packet,
        channelSettings: defaultChannelSettingsArray,
        timeOffset: 0
      });
      expect(sample).to.have.property('auxData');
      expect(sample.auxData[0]).to.equal(0);
      expect(sample.auxData[1]).to.equal(1);
      expect(sample.auxData.byteLength).to.equal(2);
    });
    it('with scale all the channels should have the same number value as their (index + 1) * scaleFactor', function () {
      packet = openBCIUtilities.samplePacketRawAuxTimeSynced(0);
      let sample = openBCIUtilities.parsePacketTimeSyncedRawAux({
        rawDataPacket: packet,
        timeOffset: 0,
        channelSettings: defaultChannelSettingsArray,
        scale: true
      });
      sample.channelData.forEach((channelValue, index) => {
        expect(channelValue).to.equal(channelScaleFactor * (index + 1));
      });
    });
    it('without scale all the channels should have the same number value as their (index + 1)', function () {
      packet = openBCIUtilities.samplePacketRawAuxTimeSynced(0);
      let sample = openBCIUtilities.parsePacketTimeSyncedRawAux({
        rawDataPacket: packet,
        timeOffset: 0,
        scale: false
      });
      sample.channelDataCounts.forEach((channelValue, index) => {
        expect(channelValue).to.equal(index + 1);
      });
    });
    it('has the right sample number', function () {
      let expectedSampleNumber = 69;
      packet = openBCIUtilities.samplePacketRawAuxTimeSynced(expectedSampleNumber);
      let sample = openBCIUtilities.parsePacketTimeSyncedRawAux({
        channelSettings: defaultChannelSettingsArray,
        rawDataPacket: packet,
        timeOffset: 0
      });
      expect(sample.sampleNumber).to.equal(expectedSampleNumber);
    });
    it('has the right stop byte', function () {
      packet = openBCIUtilities.samplePacketRawAuxTimeSynced(0);
      let sample = openBCIUtilities.parsePacketTimeSyncedRawAux({
        channelSettings: defaultChannelSettingsArray,
        rawDataPacket: packet,
        timeOffset: 0
      });
      expect(sample.stopByte).to.equal(openBCIUtilities.makeTailByteFromPacketType(k.OBCIStreamPacketRawAuxTimeSynced));
    });
    it('has the right start byte', function () {
      packet = openBCIUtilities.samplePacketRawAuxTimeSynced(0);
      let sample = openBCIUtilities.parsePacketTimeSyncedRawAux({
        channelSettings: defaultChannelSettingsArray,
        rawDataPacket: packet,
        timeOffset: 0
      });
      expect(sample.startByte).to.equal(0xA0);
    });
    describe('#errorConditions', function () {
      it('wrong number of bytes', function () {
        expect(openBCIUtilities.parsePacketTimeSyncedRawAux.bind(openBCIUtilities, {
          channelSettings: defaultChannelSettingsArray,
          rawDataPacket: new Buffer(5),
          timeOffset: 0
        })).to.throw(k.OBCIErrorInvalidByteLength);
      });
    });
  });
  describe('#convertSampleToPacketStandard', function () {
    let generateSample = openBCIUtilities.randomSample(k.OBCINumberOfChannelsDefault, k.OBCISampleRate250);

    // get new sample
    let newSample = generateSample(0);

    // try to convert to packet
    let packetBuffer = openBCIUtilities.convertSampleToPacketStandard(newSample);

    it('should have correct start byte', function () {
      expect(packetBuffer[0]).to.equal(k.OBCIByteStart, 'confirming start byte');
    });
    it('should have correct stop byte', function () {
      expect(packetBuffer[k.OBCIPacketSize - 1]).to.equal(k.OBCIByteStop, 'confirming stop byte');
    });
    it('should have correct sample number', function () {
      expect(packetBuffer[1]).to.equal(1, 'confirming sample number is 1 more than 0');
    });
    it('should convert channel data to binary', function () {
      let sample = openBCIUtilities.parsePacketStandardAccel({
        rawDataPacket: packetBuffer,
        channelSettings: defaultChannelSettingsArray
      });
      for (let i = 0; i < k.OBCINumberOfChannelsDefault; i++) {
        expect(sample.channelData[i]).to.be.approximately(newSample.channelData[i], 0.001);
      }
    });
    it('should convert aux data to binary', function () {
      let sample = openBCIUtilities.parsePacketStandardAccel({
        rawDataPacket: packetBuffer,
        channelSettings: defaultChannelSettingsArray
      });
      for (let i = 0; i < 3; i++) {
        expect(sample.accelData[i]).to.be.approximately(newSample.auxData[i], 0.001);
      }
    });
  });
  describe('#convertSampleToPacketRawAux', function () {
    let generateSample = openBCIUtilities.randomSample(k.OBCINumberOfChannelsDefault, k.OBCISampleRate250);

    // get new sample
    let newSample = generateSample(0);

    // Make a fake 6 byte buffer
    let rawBuffer = new Buffer([0, 1, 2, 3, 4, 5]);

    // try to convert to packet
    let packetBuffer = openBCIUtilities.convertSampleToPacketRawAux(newSample, rawBuffer);

    it('should have correct start byte', function () {
      expect(packetBuffer[0]).to.equal(k.OBCIByteStart, 'confirming start byte');
    });
    it('should have correct stop byte', function () {
      expect(packetBuffer[k.OBCIPacketSize - 1]).to.equal(openBCIUtilities.makeTailByteFromPacketType(k.OBCIStreamPacketStandardRawAux), 'confirming stop byte');
    });
    it('should have correct sample number', function () {
      expect(packetBuffer[1]).to.equal(1, 'confirming sample number is 1 more than 0');
    });
    it('should convert channel data to binary', function () {
      let sample = openBCIUtilities.parsePacketStandardRawAux({
        rawDataPacket: packetBuffer,
        channelSettings: defaultChannelSettingsArray
      });
      for (let i = 0; i < k.OBCINumberOfChannelsDefault; i++) {
        expect(sample.channelData[i]).to.be.approximately(newSample.channelData[i], 0.001);
      }
    });
    it('should get raw aux buffer', function () {
      let sample = openBCIUtilities.parsePacketStandardRawAux({
        rawDataPacket: packetBuffer,
        channelSettings: defaultChannelSettingsArray
      });
      expect(sample.auxData).to.exist();
      expect(bufferEqual(rawBuffer, sample.auxData)).to.be.true();
    });
  });
  describe('#convertSampleToPacketAccelTimeSynced', function () {
    let generateSample = openBCIUtilities.randomSample(k.OBCINumberOfChannelsDefault, k.OBCISampleRate250);

    // get new sample
    let newSample = generateSample(0);

    // Make a time
    let time = 1010101;

    // Accel array
    let accelArray = [0, 0, 0];

    // Channel Settings
    let channelSettingsArray = k.channelSettingsArrayInit(8);

    // try to convert to packet
    let packetBuffer = openBCIUtilities.convertSampleToPacketAccelTimeSynced(newSample, time);

    it('should have correct start byte', () => {
      expect(packetBuffer[0]).to.equal(k.OBCIByteStart, 'confirming start byte');
    });
    it('should have correct stop byte', () => {
      expect(packetBuffer[k.OBCIPacketSize - 1]).to.equal(openBCIUtilities.makeTailByteFromPacketType(k.OBCIStreamPacketAccelTimeSynced), 'confirming stop byte');
    });
    it('should have correct sample number', () => {
      expect(packetBuffer[1]).to.equal(1, 'confirming sample number is 1 more than 0');
    });
    it('should convert channel data to binary', function () {
      let sample = openBCIUtilities.parsePacketTimeSyncedAccel({
        rawDataPacket: packetBuffer,
        channelSettings: channelSettingsArray,
        timeOffset: 0,
        accelArray
      });
      for (let i = 0; i < k.OBCINumberOfChannelsDefault; i++) {
        expect(sample.channelData[i]).to.be.approximately(newSample.channelData[i], 0.001);
      }
    });
    it('should get board time', function () {
      let sample = openBCIUtilities.parsePacketTimeSyncedAccel({
        rawDataPacket: packetBuffer,
        channelSettings: channelSettingsArray,
        timeOffset: 0,
        accelArray
      });
      expect(sample.boardTime).to.exist();
      expect(sample.boardTime).to.equal(time);
    });
    it('should get time stamp with offset', function () {
      let timeOffset = 80;
      let sample = openBCIUtilities.parsePacketTimeSyncedAccel({
        rawDataPacket: packetBuffer,
        channelSettings: channelSettingsArray,
        timeOffset: timeOffset,
        accelArray
      });
      expect(sample.timeStamp).to.exist();
      expect(sample.timeStamp).to.equal(time + timeOffset);
    });
  });
  describe('#convertSampleToPacketRawAuxTimeSynced', function () {
    let generateSample = openBCIUtilities.randomSample(k.OBCINumberOfChannelsDefault, k.OBCISampleRate250);

    // get new sample
    let newSample = generateSample(0);

    // Make a time
    let time = 1010101;

    // Raw Aux
    let rawAux = new Buffer([0, 1]);

    // Channel Settings
    let channelSettingsArray = k.channelSettingsArrayInit(8);

    // try to convert to packet
    let packetBuffer = openBCIUtilities.convertSampleToPacketRawAuxTimeSynced(newSample, time, rawAux);

    it('should have correct start byte', () => {
      expect(packetBuffer[0]).to.equal(k.OBCIByteStart, 'confirming start byte');
    });
    it('should have correct stop byte', () => {
      expect(packetBuffer[k.OBCIPacketSize - 1]).to.equal(openBCIUtilities.makeTailByteFromPacketType(k.OBCIStreamPacketRawAuxTimeSynced), 'confirming stop byte');
    });
    it('should have correct sample number', () => {
      expect(packetBuffer[1]).to.equal(1, 'confirming sample number is 1 more than 0');
    });
    it('should convert channel data to binary', function () {
      let sample = openBCIUtilities.parsePacketTimeSyncedRawAux({
        rawDataPacket: packetBuffer,
        timeOffset: 0,
        channelSettings: channelSettingsArray
      });
      for (let i = 0; i < k.OBCINumberOfChannelsDefault; i++) {
        expect(sample.channelData[i]).to.be.approximately(newSample.channelData[i], 0.001);
      }
    });
    it('should get raw aux buffer', function () {
      let sample = openBCIUtilities.parsePacketTimeSyncedRawAux({
        rawDataPacket: packetBuffer,
        timeOffset: 0,
        scale: false
      });
      expect(sample.auxData).to.exist();
      expect(bufferEqual(rawAux, sample.auxData)).to.be.true();
    });
    it('should get board time', function () {
      let sample = openBCIUtilities.parsePacketTimeSyncedRawAux({
        rawDataPacket: packetBuffer,
        timeOffset: 0,
        scale: false
      });
      expect(sample.boardTime).to.exist();
      expect(sample.boardTime).to.equal(time);
    });
    it('should get time stamp with offset', function () {
      let timeOffset = 80;
      let sample = openBCIUtilities.parsePacketTimeSyncedRawAux({
        rawDataPacket: packetBuffer,
        timeOffset: timeOffset,
        scale: false
      });
      expect(sample.timeStamp).to.exist();
      expect(sample.timeStamp).to.equal(time + timeOffset);
    });
  });
  describe('#interpret24bitAsInt32', function () {
    it('converts a small positive number', function () {
      let buf1 = new Buffer([0x00, 0x06, 0x90]); // 0x000690 === 1680
      let num = openBCIUtilities.interpret24bitAsInt32(buf1);
      assert.equal(num, 1680);
    });
    it('converts a large positive number', function () {
      let buf1 = new Buffer([0x02, 0xC0, 0x01]); // 0x02C001 === 180225
      let num = openBCIUtilities.interpret24bitAsInt32(buf1);
      assert.equal(num, 180225);
    });
    it('converts a small negative number', function () {
      let buf1 = new Buffer([0xFF, 0xFF, 0xFF]); // 0xFFFFFF === -1
      let num = openBCIUtilities.interpret24bitAsInt32(buf1);
      expect(num).to.be.approximately(-1, 1);
    });
    it('converts a large negative number', function () {
      let buf1 = new Buffer([0x81, 0xA1, 0x01]); // 0x81A101 === -8281855
      let num = openBCIUtilities.interpret24bitAsInt32(buf1);
      expect(num).to.be.approximately(-8281855, 1);
    });
  });
  describe('#interpret16bitAsInt32', function () {
    it('converts a small positive number', function () {
      let buf1 = new Buffer([0x06, 0x90]); // 0x0690 === 1680
      let num = openBCIUtilities.interpret16bitAsInt32(buf1);
      assert.equal(num, 1680);
    });
    it('converts a large positive number', function () {
      let buf1 = new Buffer([0x02, 0xC0]); // 0x02C0 === 704
      let num = openBCIUtilities.interpret16bitAsInt32(buf1);
      assert.equal(num, 704);
    });
    it('converts a small negative number', function () {
      let buf1 = new Buffer([0xFF, 0xFF]); // 0xFFFF === -1
      let num = openBCIUtilities.interpret16bitAsInt32(buf1);
      assert.equal(num, -1);
    });
    it('converts a large negative number', function () {
      let buf1 = new Buffer([0x81, 0xA1]); // 0x81A1 === -32351
      let num = openBCIUtilities.interpret16bitAsInt32(buf1);
      assert.equal(num, -32351);
    });
  });
  describe('#floatTo3ByteBuffer', function () {
    it('converts random floats to a 3-byte buffer', function () {
      let generateSample = openBCIUtilities.randomSample(k.OBCINumberOfChannelsDefault, k.OBCISampleRate250);
      let newSample = generateSample(0);

      for (let i = 0; i < k.OBCINumberOfChannelsDefault; i++) {
        let buff = openBCIUtilities.floatTo3ByteBuffer(newSample.channelData[i]);

        let num = openBCIUtilities.interpret24bitAsInt32(buff);

        num = num * channelScaleFactor;

        expect(num).to.be.approximately(newSample.channelData[i], 0.00002);
      }
    });
  });
  describe('#floatTo2ByteBuffer', function () {
    it('converts random floats to a 2-byte buffer', function () {
      let auxData = [0.001, 1, -0.00892];

      for (let i = 0; i < 3; i++) {
        let buff = openBCIUtilities.floatTo2ByteBuffer(auxData[i]);

        let num = openBCIUtilities.interpret16bitAsInt32(buff);

        num = num * openBCIUtilities.scaleFactorAux;

        expect(num).to.be.approximately(auxData[i], 0.001);
      }
    });
  });
  describe('#randomSample', function () {
    it('should generate a random sample', function () {
      let generateSample = openBCIUtilities.randomSample(k.OBCINumberOfChannelsDefault, k.OBCISampleRate250);
      let oldSampleNumber = 0;
      let newSample = generateSample(oldSampleNumber);
      assert(newSample.sampleNumber, oldSampleNumber + 1);
      describe('#debugPrettyPrint', function () {
        it('works with a good sample', function () {
          openBCIUtilities.debugPrettyPrint(newSample);
        });
        it('does not with a undefined sample', function () {
          openBCIUtilities.debugPrettyPrint();
        });
      });
    });
    it('should generate a sample with accel data every 25Hz', function () {
      let generateSample = openBCIUtilities.randomSample(k.OBCINumberOfChannelsDefault, k.OBCISampleRate250);
      let newSample = generateSample(0);

      let passed = false;
      // Should get one non-zero auxData array (on the 10th sample)
      for (let i = 0; i < 10; i++) {
        newSample = generateSample(newSample.sampleNumber);
        if (newSample.auxData[0] !== 0 || newSample.auxData[1] !== 0 || newSample.auxData[2] !== 0) {
          passed = true;
          expect(newSample.auxData[0]).to.be.approximately(0, 0.1);
          expect(newSample.auxData[1]).to.be.approximately(0, 0.1);
          expect(newSample.auxData[2]).to.be.approximately(1, 0.4);
        }
      }
      assert(passed, 'a sample with accel data was produced');
    });
  });
  describe('#impedanceCalculationForChannel', function () {
    it('rejects when undefined sampleObject', function (done) {
      let bad;
      expect(openBCIUtilities.impedanceCalculationForChannel(bad, 1)).to.be.rejected.and.notify(done);
    });
    it('rejects when undefined channel number', function (done) {
      let bad;
      expect(openBCIUtilities.impedanceCalculationForChannel('taco', bad)).to.be.rejected.and.notify(done);
    });
    it('rejects when invalid channel number', function (done) {
      expect(openBCIUtilities.impedanceCalculationForChannel('taco', 69)).to.be.rejected.and.notify(done);
    });
  });
  describe('#impedanceSummarize', function () {
    let impedanceArray = [];
    let numberOfChannels = 8;
    beforeEach(() => {
      impedanceArray = openBCIUtilities.impedanceArray(numberOfChannels);
    });
    it('should find impedance good', function () {
      impedanceArray[0].N.raw = 2201.84;

      openBCIUtilities.impedanceSummarize(impedanceArray[0].N);

      expect(impedanceArray[0].N.text).to.equal(k.OBCIImpedanceTextGood); // Check the text
    });
    it('should find impedance ok', function () {
      impedanceArray[0].N.raw = 5201.84;

      openBCIUtilities.impedanceSummarize(impedanceArray[0].N);

      expect(impedanceArray[0].N.text).to.equal(k.OBCIImpedanceTextOk); // Check the text
    });
    it('should find impedance bad', function () {
      impedanceArray[0].N.raw = 10201.84;

      openBCIUtilities.impedanceSummarize(impedanceArray[0].N);

      expect(impedanceArray[0].N.text).to.equal(k.OBCIImpedanceTextBad); // Check the text
    });
    it('should find impedance none', function () {
      impedanceArray[0].N.data = 44194179.09; // A huge number that would be seen if there was no electrode connected

      openBCIUtilities.impedanceSummarize(impedanceArray[0].N);

      expect(impedanceArray[0].N.text).to.equal(k.OBCIImpedanceTextNone); // Check the text
    });
  });
  describe('#makeDaisySampleObject', function () {
    let lowerSampleObject, upperSampleObject, daisySampleObject;
    before(() => {
      // Make the lower sample (channels 1-8)
      lowerSampleObject = openBCIUtilities.newSample(1);
      lowerSampleObject.channelData = [1, 2, 3, 4, 5, 6, 7, 8];
      lowerSampleObject.auxData = [0, 1, 2];
      lowerSampleObject.timestamp = 4;
      lowerSampleObject.accelData = [0.5, -0.5, 1];
      // Make the upper sample (channels 9-16)
      upperSampleObject = openBCIUtilities.newSample(2);
      upperSampleObject.channelData = [9, 10, 11, 12, 13, 14, 15, 16];
      upperSampleObject.auxData = [3, 4, 5];
      upperSampleObject.timestamp = 8;

      daisySampleObject = openBCIUtilities.makeDaisySampleObject(lowerSampleObject, upperSampleObject);
    });
    it('should make a channelData array 16 elements long', function () {
      expect(daisySampleObject.channelData).to.have.length(k.OBCINumberOfChannelsDaisy);
    });
    it('should make a channelData array with lower array in front of upper array', function () {
      for (let i = 0; i < 16; i++) {
        expect(daisySampleObject.channelData[i]).to.equal(i + 1);
      }
    });
    it('should make the sample number equal to the second packet divided by two', function () {
      expect(daisySampleObject.sampleNumber).to.equal(upperSampleObject.sampleNumber / 2);
    });
    it('should put the aux packets in an object', function () {
      expect(daisySampleObject.auxData).to.have.property('lower');
      expect(daisySampleObject.auxData).to.have.property('upper');
    });
    it('should put the aux packets in an object in the right order', function () {
      for (let i = 0; i < 3; i++) {
        expect(daisySampleObject.auxData['lower'][i]).to.equal(i);
        expect(daisySampleObject.auxData['upper'][i]).to.equal(i + 3);
      }
    });
    it('should average the two timestamps together', function () {
      let expectedAverage = (upperSampleObject.timestamp + lowerSampleObject.timestamp) / 2;
      expect(daisySampleObject.timestamp).to.equal(expectedAverage);
    });
    it('should place the old timestamps in an object', function () {
      expect(daisySampleObject._timestamps.lower).to.equal(lowerSampleObject.timestamp);
      expect(daisySampleObject._timestamps.upper).to.equal(upperSampleObject.timestamp);
    });
    it('should store an accelerometer value if present', function () {
      expect(daisySampleObject).to.have.property('accelData');
    });
  });

  describe('#makeDaisySampleObjectWifi', function () {
    let lowerSampleObject, upperSampleObject, daisySampleObject;
    let lowerSampleObjectNoScale, upperSampleObjectNoScale, daisySampleObjectNoScale;
    before(() => {
      // Make the lower sample (channels 1-8)
      lowerSampleObject = openBCIUtilities.newSample(1);
      lowerSampleObject.channelData = [1, 2, 3, 4, 5, 6, 7, 8];
      lowerSampleObject.auxData = [0, 1, 2];
      lowerSampleObject.timestamp = 4;
      lowerSampleObject.accelData = [0.5, -0.5, 1];
      // Make the upper sample (channels 9-16)
      upperSampleObject = openBCIUtilities.newSample(2);
      upperSampleObject.channelData = [9, 10, 11, 12, 13, 14, 15, 16];
      upperSampleObject.auxData = [3, 4, 5];
      upperSampleObject.timestamp = 8;

      daisySampleObject = openBCIUtilities.makeDaisySampleObjectWifi(lowerSampleObject, upperSampleObject);

      lowerSampleObjectNoScale = openBCIUtilities.newSample(1);
      lowerSampleObjectNoScale.channelDataCounts = [1, 2, 3, 4, 5, 6, 7, 8];
      lowerSampleObjectNoScale.auxData = [0, 1, 2];
      lowerSampleObjectNoScale.timestamp = 4;
      lowerSampleObjectNoScale.accelData = [0.5, -0.5, 1];
      // Make the upper sample (channels 9-16)
      upperSampleObjectNoScale = openBCIUtilities.newSample(2);
      upperSampleObjectNoScale.channelDataCounts = [9, 10, 11, 12, 13, 14, 15, 16];
      upperSampleObjectNoScale.auxData = [3, 4, 5];
      upperSampleObjectNoScale.timestamp = 8;

      // Call the function under test
      daisySampleObjectNoScale = openBCIUtilities.makeDaisySampleObjectWifi(lowerSampleObjectNoScale, upperSampleObjectNoScale);
    });
    it('should make a channelData array 16 elements long', function () {
      expect(daisySampleObject.channelData).to.have.length(k.OBCINumberOfChannelsDaisy);
      expect(daisySampleObjectNoScale.channelDataCounts).to.have.length(k.OBCINumberOfChannelsDaisy);
    });
    it('should make a channelData array with lower array in front of upper array', function () {
      for (let i = 0; i < 16; i++) {
        expect(daisySampleObject.channelData[i]).to.equal(i + 1);
        expect(daisySampleObjectNoScale.channelDataCounts[i]).to.equal(i + 1);
      }
    });
    it('should make the sample number equal to the second packet divided by two', function () {
      expect(daisySampleObject.sampleNumber).to.equal(upperSampleObject.sampleNumber);
      expect(daisySampleObjectNoScale.sampleNumber).to.equal(upperSampleObject.sampleNumber);
    });
    it('should put the aux packets in an object', function () {
      expect(daisySampleObject.auxData).to.have.property('lower');
      expect(daisySampleObject.auxData).to.have.property('upper');
      expect(daisySampleObjectNoScale.auxData).to.have.property('lower');
      expect(daisySampleObjectNoScale.auxData).to.have.property('upper');
    });
    it('should put the aux packets in an object in the right order', function () {
      for (let i = 0; i < 3; i++) {
        expect(daisySampleObject.auxData['lower'][i]).to.equal(i);
        expect(daisySampleObject.auxData['upper'][i]).to.equal(i + 3);
        expect(daisySampleObjectNoScale.auxData['lower'][i]).to.equal(i);
        expect(daisySampleObjectNoScale.auxData['upper'][i]).to.equal(i + 3);
      }
    });
    it('should take the lower timestamp', function () {
      expect(daisySampleObject.timestamp).to.equal(lowerSampleObject.timestamp);
      expect(daisySampleObjectNoScale.timestamp).to.equal(lowerSampleObject.timestamp);
    });
    it('should place the old timestamps in an object', function () {
      expect(daisySampleObject._timestamps.lower).to.equal(lowerSampleObject.timestamp);
      expect(daisySampleObject._timestamps.upper).to.equal(upperSampleObject.timestamp);
      expect(daisySampleObjectNoScale._timestamps.lower).to.equal(lowerSampleObjectNoScale.timestamp);
      expect(daisySampleObjectNoScale._timestamps.upper).to.equal(upperSampleObjectNoScale.timestamp);
    });
    it('should store an accelerometer value if present', function () {
      expect(daisySampleObject).to.have.property('accelData');
    });
  });
  describe('#isEven', function () {
    it('should return true for even number', function () {
      expect(openBCIUtilities.isEven(2)).to.be.true();
    });
    it('should return false for odd number', function () {
      expect(openBCIUtilities.isEven(1)).to.be.false();
    });
  });
  describe('#isOdd', function () {
    it('should return true for odd number', function () {
      expect(openBCIUtilities.isOdd(1)).to.be.true();
    });
    it('should return false for even number', function () {
      expect(openBCIUtilities.isOdd(2)).to.be.false();
    });
  });
  describe('#getChannelDataArray', function () {
    let sampleBuf, badChanArray;
    beforeEach(() => {
      sampleBuf = openBCIUtilities.samplePacket(0);
    });
    it('should reject when channelSettingsArray is not in fact an array', function () {
      expect(openBCIUtilities.getChannelDataArray.bind(openBCIUtilities, {
        rawDataPacket: sampleBuf,
        channelSettings: {},
        protocol: k.OBCIProtocolSerial
      })).to.throw('Error [getChannelDataArray]: Channel Settings must be an array!');
    });
    it('in default mode, should reject when empty channel setting array', function () {
      badChanArray = new Array(k.OBCINumberOfChannelsDefault).fill(0);
      expect(openBCIUtilities.getChannelDataArray.bind(openBCIUtilities, {
        rawDataPacket: sampleBuf,
        channelSettings: badChanArray,
        protocol: k.OBCIProtocolWifi
      })).to.throw('Error [getChannelDataArray]: Invalid channel settings object at index 0');
    });
    it('should reject when unsupported protocol', function () {
      expect(openBCIUtilities.getChannelDataArray.bind(openBCIUtilities, {
        rawDataPacket: sampleBuf,
        channelSettings: k.channelSettingsArrayInit(k.OBCINumberOfChannelsDefault),
        protocol: 'taco'
      })).to.throw('Error [getChannelDataArray]: Invalid protocol must be wifi or serial');
    });
    it('in daisy mode, should reject when empty channel setting array', function () {
      badChanArray = new Array(k.OBCINumberOfChannelsDaisy).fill(0);
      expect(openBCIUtilities.getChannelDataArray.bind(openBCIUtilities, {
        rawDataPacket: sampleBuf,
        channelSettings: badChanArray,
        protocol: k.OBCIProtocolWifi
      })).to.throw('Error [getChannelDataArray]: Invalid channel settings object at index 0');
    });
    it('in cyton mode, should reject if not numbers in gain position', function () {
      badChanArray = [];
      for (let i = 0; i < k.OBCINumberOfChannelsDefault; i++) {
        badChanArray.push({
          gain: 'taco'
        });
      }
      expect(openBCIUtilities.getChannelDataArray.bind(openBCIUtilities, {
        rawDataPacket: sampleBuf,
        channelSettings: badChanArray,
        protocol: k.OBCIProtocolWifi
      })).to.throw('Error [getChannelDataArray]: Property gain of channelSettingsObject not or type Number');
    });
    it('in daisy mode, should reject if not numbers in gain position', function () {
      badChanArray = [];
      for (let i = 0; i < k.OBCINumberOfChannelsDaisy; i++) {
        badChanArray.push({
          gain: 'taco'
        });
      }
      expect(openBCIUtilities.getChannelDataArray.bind(openBCIUtilities, {
        rawDataPacket: sampleBuf,
        channelSettings: badChanArray,
        protocol: k.OBCIProtocolWifi
      })).to.throw('Error [getChannelDataArray]: Property gain of channelSettingsObject not or type Number');
    });
    describe('Serial', function () {
      it('should multiply each channel by the proper scale value', function () {
        let chanArr = k.channelSettingsArrayInit(k.OBCINumberOfChannelsDefault); // Not in daisy mode
        let scaleFactor = 4.5 / 24 / (Math.pow(2, 23) - 1);
        // Call the function under test
        let valueArray = openBCIUtilities.getChannelDataArray({
          rawDataPacket: sampleBuf,
          channelSettings: chanArr,
          protocol: k.OBCIProtocolSerial
        });
        for (let j = 0; j < k.OBCINumberOfChannelsDefault; j++) {
          // console.log(`channel data ${j + 1}: ${valueArray[j]} : actual ${scaleFactor * (j + 1)}`);
          expect(valueArray[j]).to.be.closeTo(scaleFactor * (j + 1), 0.0001);
        }
      });
      it('in daisy mode, on odd samples should use gains from index 0-7 of channel settings array', function () {
        // Overwrite the default
        sampleBuf = openBCIUtilities.samplePacket(1); // even's are the daisy channels
        // Make a 16 element long channel settings array
        let chanArr = k.channelSettingsArrayInit(k.OBCINumberOfChannelsDaisy);
        // Set the upper (8-15) of channel settings array. If the function under test uses the 1 gain, then the test
        //  will fail.
        for (let i = k.OBCINumberOfChannelsDefault; i < k.OBCINumberOfChannelsDaisy; i++) {
          chanArr[i].gain = 1;
        }
        let scaleFactor = 4.5 / 24 / (Math.pow(2, 23) - 1);
        // Call the function under test
        let valueArray = openBCIUtilities.getChannelDataArray({
          rawDataPacket: sampleBuf,
          channelSettings: chanArr,
          protocol: k.OBCIProtocolSerial
        });
        for (let j = 0; j < k.OBCINumberOfChannelsDefault; j++) {
          // console.log(`channel data ${j + 1}: ${valueArray[j]} : actual ${scaleFactor * (j + 1)}`)
          expect(valueArray[j]).to.be.closeTo(scaleFactor * (j + 1), 0.0001);
        }
      });
      it('in daisy mode, on even samples should use gains from index 8-15 of channel settings array', function () {
        // Overwrite the default
        sampleBuf = openBCIUtilities.samplePacket(2); // even's are the daisy channels
        // Make a 16 element long channel settings array
        let chanArr = k.channelSettingsArrayInit(k.OBCINumberOfChannelsDaisy);
        // Set the lower (0-7) of channel settings array. If the function under test uses the 1 gain, then the test
        //  will fail.
        for (let i = 0; i < k.OBCINumberOfChannelsDefault; i++) {
          chanArr[i].gain = 1;
        }
        // gain here is 24, the same as in the channel settings array
        let scaleFactor = 4.5 / 24 / (Math.pow(2, 23) - 1);
        // Call the function under test
        let valueArray = openBCIUtilities.getChannelDataArray({
          rawDataPacket: sampleBuf,
          channelSettings: chanArr,
          protocol: k.OBCIProtocolSerial
        });
        for (let j = 0; j < k.OBCINumberOfChannelsDefault; j++) {
          // console.log(`channel data ${j + 1}: ${valueArray[j]} : actual ${scaleFactor * (j + 1)}`)
          expect(valueArray[j]).to.be.closeTo(scaleFactor * (j + 1), 0.0001);
        }
      });
    });
    describe('Wifi', function () {
      it('should multiply each channel by the ganglion scale value when num chan is 4', function () {
        let chanArr = k.channelSettingsArrayInit(k.OBCINumberOfChannelsGanglion); // Not in daisy mode
        let scaleFactor = 1.2 / 51.0 / (Math.pow(2, 23) - 1);
        // Call the function under test
        let valueArray = openBCIUtilities.getChannelDataArray({
          rawDataPacket: sampleBuf,
          channelSettings: chanArr,
          protocol: k.OBCIProtocolWifi
        });
        for (let j = 0; j < k.OBCINumberOfChannelsGanglion; j++) {
          // console.log(`channel data ${j + 1}: ${valueArray[j]} : actual ${scaleFactor * (j + 1)}`);
          expect(valueArray[j]).to.be.closeTo(scaleFactor * (j + 1), 0.0001);
        }
      });
      it('should multiply each channel by the cyton scale value when num chan is 8', function () {
        let chanArr = k.channelSettingsArrayInit(k.OBCINumberOfChannelsDefault); // Not in daisy mode
        let scaleFactor = 4.5 / 24 / (Math.pow(2, 23) - 1);
        // Call the function under test
        let valueArray = openBCIUtilities.getChannelDataArray({
          rawDataPacket: sampleBuf,
          channelSettings: chanArr,
          protocol: k.OBCIProtocolWifi
        });
        for (let j = 0; j < k.OBCINumberOfChannelsDefault; j++) {
          // console.log(`channel data ${j + 1}: ${valueArray[j]} : actual ${scaleFactor * (j + 1)}`);
          expect(valueArray[j]).to.be.closeTo(scaleFactor * (j + 1), 0.0001);
        }
      });
      it('in daisy mode, when last sample num not equal to cur sample num should use gains from index 0-7 of channel settings array', function () {
        // Overwrite the default
        const lastSampleNumber = 0;
        const curSampleNumber = lastSampleNumber + 1;
        sampleBuf = openBCIUtilities.samplePacket(curSampleNumber);
        // Make a 16 element long channel settings array
        let chanArr = k.channelSettingsArrayInit(k.OBCINumberOfChannelsDaisy);
        // Set the upper (8-15) of channel settings array. If the function under test uses the 1 gain, then the test
        //  will fail.
        for (let i = k.OBCINumberOfChannelsDefault; i < k.OBCINumberOfChannelsDaisy; i++) {
          chanArr[i].gain = 1;
        }
        let scaleFactor = 4.5 / 24 / (Math.pow(2, 23) - 1);
        // Call the function under test
        let valueArray = openBCIUtilities.getChannelDataArray({
          rawDataPacket: sampleBuf,
          channelSettings: chanArr,
          protocol: k.OBCIProtocolWifi,
          lastSampleNumber
        });
        for (let j = 0; j < k.OBCINumberOfChannelsDefault; j++) {
          // console.log(`channel data ${j + 1}: ${valueArray[j]} : actual ${scaleFactor * (j + 1)}`)
          expect(valueArray[j]).to.be.closeTo(scaleFactor * (j + 1), 0.0001);
        }
      });
      it('in daisy mode, when last sample number is equal to cur sample number should use gains from index 8-15 of channel settings array', function () {
        // Overwrite the default
        const lastSampleNumber = 1;
        const curSampleNumber = lastSampleNumber;
        sampleBuf = openBCIUtilities.samplePacket(curSampleNumber);
        // Make a 16 element long channel settings array
        let chanArr = k.channelSettingsArrayInit(k.OBCINumberOfChannelsDaisy);
        // Set the lower (0-7) of channel settings array. If the function under test uses the 1 gain, then the test
        //  will fail.
        for (let i = 0; i < k.OBCINumberOfChannelsDefault; i++) {
          chanArr[i].gain = 1;
        }
        // gain here is 24, the same as in the channel settings array
        let scaleFactor = 4.5 / 24 / (Math.pow(2, 23) - 1);
        // Call the function under test
        let valueArray = openBCIUtilities.getChannelDataArray({
          rawDataPacket: sampleBuf,
          channelSettings: chanArr,
          protocol: k.OBCIProtocolWifi,
          lastSampleNumber
        });
        for (let j = 0; j < k.OBCINumberOfChannelsDefault; j++) {
          // console.log(`channel data ${j + 1}: ${valueArray[j]} : actual ${scaleFactor * (j + 1)}`)
          expect(valueArray[j]).to.be.closeTo(scaleFactor * (j + 1), 0.0001);
        }
      });
    });
  });
  describe('#countADSPresent', function () {
    it('should not crash on small buff', function () {
      let buf = new Buffer('AJ!');

      expect(openBCIUtilities.countADSPresent(buf)).to.equal(0);
    });
    it('should not find any ADS1299 present', function () {
      let buf = new Buffer('AJ Keller is an awesome programmer!\n I know right!');

      expect(openBCIUtilities.countADSPresent(buf)).to.equal(0);
    });
    it('should find one ads present', function () {
      let buf = new Buffer(`OpenBCI V3 Simulator
On Board ADS1299 Device ID: 0x12345
LIS3DH Device ID: 0x38422$$$`);

      expect(openBCIUtilities.countADSPresent(buf)).to.equal(1);
    });
    it('should find two ads1299 present', function () {
      let buf = new Buffer(`OpenBCI V3 Simulator
On Board ADS1299 Device ID: 0x12345
On Daisy ADS1299 Device ID: 0xFFFFF
LIS3DH Device ID: 0x38422
$$$`);

      expect(openBCIUtilities.countADSPresent(buf)).to.equal(2);
    });
  });
  describe('#doesBufferHaveEOT', function () {
    it('should not crash on small buff', function () {
      let buf = new Buffer('AJ!');

      expect(openBCIUtilities.doesBufferHaveEOT(buf)).to.be.false();
    });
    it('should not find any $$$', function () {
      let buf = new Buffer(`OpenBCI V3 Simulator
On Board ADS1299 Device ID: 0x12345
On Daisy ADS1299 Device ID: 0xFFFFF
LIS3DH Device ID: 0x38422
Firmware: v2
`);

      expect(openBCIUtilities.doesBufferHaveEOT(buf)).to.be.false();

      buf = Buffer.concat([buf, new Buffer(k.OBCIParseEOT)], buf.length + 3);

      expect(openBCIUtilities.doesBufferHaveEOT(buf)).to.equal(true);
    });
    it('should find a $$$', function () {
      let buf = new Buffer(`OpenBCI V3 Simulator
On Board ADS1299 Device ID: 0x12345
On Daisy ADS1299 Device ID: 0xFFFFF
LIS3DH Device ID: 0x38422
Firmware: v2
$$$`);

      expect(openBCIUtilities.doesBufferHaveEOT(buf)).to.equal(true);
    });
  });
  describe('#findV2Firmware', function () {
    it('should not crash on small buff', function () {
      let buf = new Buffer('AJ!');

      expect(openBCIUtilities.findV2Firmware(buf)).to.be.false();
    });
    it('should not find any v2', function () {
      let buf = new Buffer('AJ Keller is an awesome programmer!\n I know right!');

      expect(openBCIUtilities.findV2Firmware(buf)).to.be.false();
    });
    it('should not find a v2', function () {
      let buf = new Buffer(`OpenBCI V3 Simulator
On Board ADS1299 Device ID: 0x12345
LIS3DH Device ID: 0x38422$$$`);

      expect(openBCIUtilities.findV2Firmware(buf)).to.be.false();
    });
    it('should find a v2', function () {
      let buf = new Buffer(`OpenBCI V3 Simulator
On Board ADS1299 Device ID: 0x12345
On Daisy ADS1299 Device ID: 0xFFFFF
LIS3DH Device ID: 0x38422
Firmware: v2.0.0
$$$`);

      expect(openBCIUtilities.findV2Firmware(buf)).to.equal(true);
    });
  });
  describe('#getMajorFirmwareVersion', function () {
    it('should not crash on small buff', function () {
      let buf = new Buffer('AJ!');

      expect(openBCIUtilities.getMajorFirmwareVersion(buf)).to.equal(null);
    });
    it('should not find any v2', function () {
      let buf = new Buffer('AJ Keller is an awesome programmer!\n I know right!');

      expect(openBCIUtilities.getMajorFirmwareVersion(buf)).to.equal(null)
    });
    it('should not find a v2', function () {
      let buf = new Buffer(`OpenBCI V3 Simulator
On Board ADS1299 Device ID: 0x12345
LIS3DH Device ID: 0x38422$$$`);

      expect(openBCIUtilities.getMajorFirmwareVersion(buf)).to.equal(null)
    });
    it('should find a v2', function () {
      let buf = new Buffer(`OpenBCI V3 Simulator
On Board ADS1299 Device ID: 0x12345
On Daisy ADS1299 Device ID: 0xFFFFF
LIS3DH Device ID: 0x38422
Firmware: v2.0.0
$$$`);

      expect(openBCIUtilities.getMajorFirmwareVersion(buf)).to.equal('v2');
    });
    it('should find a v3', function () {
      let buf = new Buffer(`OpenBCI V3 Simulator
On Board ADS1299 Device ID: 0x12345
On Daisy ADS1299 Device ID: 0xFFFFF
LIS3DH Device ID: 0x38422
Firmware: v3.0.0
$$$`);

      expect(openBCIUtilities.getMajorFirmwareVersion(buf)).to.equal('v3');
    });
  });
  describe('#isFailureInBuffer', function () {
    it('should not crash on small buff', function () {
      let buf = new Buffer('AJ!');

      expect(openBCIUtilities.isFailureInBuffer(buf)).to.be.false();
    });
    it('should not find any failure in a success message', function () {
      let buf = new Buffer('Success: Poll time set$$$');

      expect(openBCIUtilities.isFailureInBuffer(buf)).to.be.false();
    });
    it('should find failure in a failure message', function () {
      let buf = new Buffer('Failure: Could not change Dongle channel number$$$');

      expect(openBCIUtilities.isFailureInBuffer(buf)).to.equal(true);
    });
  });
  describe('#isSuccessInBuffer', function () {
    it('should not crash on small buff', function () {
      let buf = new Buffer('AJ!');

      expect(openBCIUtilities.isSuccessInBuffer(buf)).to.be.false();
    });
    it('should not find any success in a failure message', function () {
      let buf = new Buffer('Failure: Could not change Dongle channel number');

      expect(openBCIUtilities.isSuccessInBuffer(buf)).to.be.false();
    });
    it('should find success in a success message', function () {
      let buf = new Buffer('Success: Poll time set$$$');

      expect(openBCIUtilities.isSuccessInBuffer(buf)).to.equal(true);
    });
  });

  describe('#isStopByte', function () {
    it('should return true for a normal stop byte', () => {
      expect(openBCIUtilities.isStopByte(0xC0)).to.be.true();
    });
    it('should return true for a good stop byte with a different end nibble', () => {
      expect(openBCIUtilities.isStopByte(0xCF)).to.be.true();
    });
    it('should return false for a bad stop byte', () => {
      expect(openBCIUtilities.isStopByte(0xF0)).to.be.false();
    });
    it('should return false for a bad stop byte', () => {
      expect(openBCIUtilities.isStopByte(0x00)).to.be.false();
    });
  });

  describe('#isTimeSyncSetConfirmationInBuffer', function () {
    // Attn: 0x2C is ASCII for ','
    let comma = 0x2C;
    it('should not find the character in a buffer without the character', function () {
      expect(openBCIUtilities.isTimeSyncSetConfirmationInBuffer(openBCIUtilities.samplePacket())).to.be.false();
    });
    it('should find with just 0x2C', function () {
      let buffer = new Buffer([comma]);
      expect(openBCIUtilities.isTimeSyncSetConfirmationInBuffer(buffer), 'just comma').to.be.true();
    });
    it('should find even at start of buffer', function () {
      // Start of buffer
      let buffer = new Buffer([comma, k.OBCIByteStart]);
      expect(openBCIUtilities.isTimeSyncSetConfirmationInBuffer(buffer), 'before packet').to.be.true();
    });
    it('should find even at back of buffer', function () {
      // Back of buffer
      let buffer = new Buffer([0xC0, comma]);
      expect(openBCIUtilities.isTimeSyncSetConfirmationInBuffer(buffer), 'after packet').to.be.true();
    });
    it('should find wedged beween two packets', function () {
      // / wedged
      let buffer = new Buffer([0xC0, comma, 0xA0]);
      expect(openBCIUtilities.isTimeSyncSetConfirmationInBuffer(buffer), 'wedged between packets').to.be.true();
    });
    it('should not find if no comma present', function () {
      // / wedged
      let buffer = new Buffer([0x2D]);
      expect(openBCIUtilities.isTimeSyncSetConfirmationInBuffer(buffer), 'not comma').to.be.false();
    });
    it('should not find if comma at the front of bad block', function () {
      // Start of buffer
      let buffer = new Buffer([comma, 0xCC]);
      expect(openBCIUtilities.isTimeSyncSetConfirmationInBuffer(buffer), 'front of buffer').to.be.false();
    });
    it('should not find if comma at the back of bad block', function () {
      // Back of buffer
      let buffer = new Buffer([0xD3, comma]);
      expect(openBCIUtilities.isTimeSyncSetConfirmationInBuffer(buffer), 'end of buffer').to.be.false();
    });
    it('should not find is not the comma', function () {
      // Wedged
      let buffer = new Buffer([comma, comma, comma]);
      expect(openBCIUtilities.isTimeSyncSetConfirmationInBuffer(buffer), 'strictly commas').to.be.false();
    });
    it('should find the character in a buffer packed with samples', function () {
      let buf1 = openBCIUtilities.samplePacket(1);
      let buf2 = openBCIUtilities.samplePacket(2);
      let buf3 = new Buffer([0x2C]);
      let buf4 = openBCIUtilities.samplePacket(3);

      let bufferLength = buf1.length + buf2.length + buf3.length + buf4.length;
      /* eslint new-cap: ["error", { "properties": false }] */
      let buffer = new Buffer.concat([buf1, buf2, buf3, buf4], bufferLength);
      expect(openBCIUtilities.isTimeSyncSetConfirmationInBuffer(buffer)).to.be.true();
    });
    it('should find the character in a buffer packed with samples with comma at end', function () {
      let buf1 = openBCIUtilities.samplePacket(1);
      let buf2 = openBCIUtilities.samplePacket(2);
      let buf3 = openBCIUtilities.samplePacket(3);
      let buf4 = new Buffer([0x2C]);

      let bufferLength = buf1.length + buf2.length + buf3.length + buf4.length;
      /* eslint new-cap: ["error", { "properties": false }] */
      let buffer = new Buffer.concat([buf1, buf2, buf3, buf4], bufferLength);
      expect(openBCIUtilities.isTimeSyncSetConfirmationInBuffer(buffer)).to.be.true();
    });
    it('should not find the character in a buffer packed with samples', function () {
      let buf1 = openBCIUtilities.samplePacket(1);
      let buf2 = openBCIUtilities.samplePacket(2);
      let buf3 = openBCIUtilities.samplePacket(3);

      let bufferLength = buf1.length + buf2.length + buf3.length;
      /* eslint new-cap: ["error", { "properties": false }] */
      let buffer = new Buffer.concat([buf1, buf2, buf3], bufferLength);
      expect(openBCIUtilities.isTimeSyncSetConfirmationInBuffer(buffer)).to.be.false();
    });
  });
  describe('#makeTailByteFromPacketType', function () {
    it('should convert 0 to 0xC0', function () {
      expect(openBCIUtilities.makeTailByteFromPacketType(0)).to.equal(0xC0);
    });
    it('should convert 5 to 0xC5', function () {
      expect(openBCIUtilities.makeTailByteFromPacketType(5)).to.equal(0xC5);
    });
    it('should convert 15 to 0xCF', function () {
      expect(openBCIUtilities.makeTailByteFromPacketType(15)).to.equal(0xCF);
    });
    it('should convert 16 to 0xC0', function () {
      expect(openBCIUtilities.makeTailByteFromPacketType(16)).to.equal(0xC0);
    });
    it('should convert 30 to 0xC0', function () {
      expect(openBCIUtilities.makeTailByteFromPacketType(30)).to.equal(0xC0);
    });
    it('should convert -2 to 0xC0', function () {
      expect(openBCIUtilities.makeTailByteFromPacketType(-2)).to.equal(0xC0);
    });
  });
  describe('#newSyncObject', function () {
    let syncObj = openBCIUtilities.newSyncObject();
    it('should have property timeSyncSent', function () {
      expect(syncObj).to.have.property('timeSyncSent', 0);
    });
    it('should have property timeOffset', function () {
      expect(syncObj).to.have.property('timeOffset', 0);
    });
    it('should have property timeOffsetMaster', function () {
      expect(syncObj).to.have.property('timeOffsetMaster', 0);
    });
    it('should have property timeRoundTrip', function () {
      expect(syncObj).to.have.property('timeRoundTrip', 0);
    });
    it('should have property timeTransmission', function () {
      expect(syncObj).to.have.property('timeTransmission', 0);
    });
    it('should have property timeSyncSentConfirmation', function () {
      expect(syncObj).to.have.property('timeSyncSentConfirmation', 0);
    });
    it('should have property timeSyncSetPacket', function () {
      expect(syncObj).to.have.property('timeSyncSetPacket', 0);
    });
    it('should have property valid', function () {
      expect(syncObj).to.have.property('valid', false);
    });
    it('should have property correctedTransmissionTime', function () {
      expect(syncObj).to.have.property('correctedTransmissionTime', false);
    });
    it('should have property boardTime', function () {
      expect(syncObj).to.have.property('boardTime', 0);
    });
    it('should have property error', function () {
      expect(syncObj).to.have.property('error', null);
    });
  });
  describe('#droppedPacketCheck', function () {
    it('should return an array of missed packet numbers', function () {
      let previous = 0;
      let current = previous + 2;
      assert.sameMembers(openBCIUtilities.droppedPacketCheck(previous, current), [1], 'dropped one packet');

      previous = 0;
      current = previous + 4;
      assert.sameMembers(openBCIUtilities.droppedPacketCheck(previous, current), [1, 2, 3], 'dropped three packets');

      previous = 255;
      current = 2;
      assert.sameMembers(openBCIUtilities.droppedPacketCheck(previous, current), [0, 1], 'dropped two packets on wrap edge!');

      previous = 254;
      current = 2;
      assert.sameMembers(openBCIUtilities.droppedPacketCheck(previous, current), [255, 0, 1], 'dropped three packets on wrap!');

      previous = 250;
      current = 1;
      assert.sameMembers(openBCIUtilities.droppedPacketCheck(previous, current), [251, 252, 253, 254, 255, 0], 'dropped a bunch of packets on wrap!');
    });
    it('should roll over when 255 was previous and current is 0', function () {
      let previous = 255;
      let current = 0;
      expect(openBCIUtilities.droppedPacketCheck(previous, current)).to.be.null();
    });
    it('should return null when previous is one less then new sample number', function () {
      let previous = 0;
      let current = previous + 1;
      expect(openBCIUtilities.droppedPacketCheck(previous, current)).to.be.null();
    });
  });
  describe('#stripToEOTBuffer', function () {
    it('should return the buffer if no EOT', function () {
      let buf = null;
      if (k.getVersionNumber(process.version) >= 6) {
        // From introduced in node version 6.x.x
        buf = Buffer.from('tacos are delicious');
      } else {
        buf = new Buffer('tacos are delicious');
      }
      expect(openBCIUtilities.stripToEOTBuffer(buf).toString()).to.equal(buf.toString());
    });
    it('should slice the buffer after just eot $$$', function () {
      let eotBuf = null;
      let bufPost = null;
      if (k.getVersionNumber(process.version) >= 6) {
        // From introduced in node version 6.x.x
        eotBuf = Buffer.from(k.OBCIParseEOT);
        bufPost = Buffer.from('tacos');
      } else {
        eotBuf = new Buffer(k.OBCIParseEOT);
        bufPost = new Buffer('tacos');
      }

      let totalBuf = Buffer.concat([eotBuf, bufPost]);
      expect(openBCIUtilities.stripToEOTBuffer(totalBuf).toString()).to.equal(bufPost.toString());
    });
    it('should slice the buffer after eot $$$', function () {
      let bufPre = null;
      let eotBuf = null;
      let bufPost = null;
      if (k.getVersionNumber(process.version) >= 6) {
        // From introduced in node version 6.x.x
        bufPre = Buffer.from('tacos are delicious');
        eotBuf = Buffer.from(k.OBCIParseEOT);
        bufPost = Buffer.from('tacos');
      } else {
        bufPre = new Buffer('tacos are delicious');
        eotBuf = new Buffer(k.OBCIParseEOT);
        bufPost = new Buffer('tacos');
      }

      let totalBuf = Buffer.concat([bufPre, eotBuf, bufPost]);
      expect(openBCIUtilities.stripToEOTBuffer(totalBuf).toString()).to.equal(bufPost.toString());
    });
    it('should return null if nothing left', function () {
      let bufPre = null;
      let eotBuf = null;
      if (k.getVersionNumber(process.version) >= 6) {
        // From introduced in node version 6.x.x
        bufPre = Buffer.from('tacos are delicious');
        eotBuf = Buffer.from(k.OBCIParseEOT);
      } else {
        bufPre = new Buffer('tacos are delicious');
        eotBuf = new Buffer(k.OBCIParseEOT);
      }

      let totalBuf = Buffer.concat([bufPre, eotBuf]);
      expect(openBCIUtilities.stripToEOTBuffer(totalBuf)).to.equal(null);
    });
  });
  describe('#impedanceTestObjDefault', function () {
    it('should give a new impedance object', function () {
      const expectedImpedanceObj = {
        active: false,
        buffer: [],
        count: 0,
        isTestingPInput: false,
        isTestingNInput: false,
        onChannel: 0,
        sampleNumber: 0,
        continuousMode: false,
        impedanceForChannel: 0,
        window: 40
      };
      expect(openBCIUtilities.impedanceTestObjDefault()).to.deep.equal(expectedImpedanceObj);
    });
  });
  describe('#impedanceCalculateArray', function () {
    const numberOfChannels = k.OBCINumberOfChannelsDefault;
    const newRandomSample = openBCIUtilities.randomSample(numberOfChannels, k.OBCISampleRate250, false, 'none');

    afterEach(() => bluebirdChecks.noPendingPromises());

    it('should not produce an array of impedances till window', function () {
      const impTestObj = openBCIUtilities.impedanceTestObjDefault();
      for (let i = 0; i < impTestObj.window - 1; i++) {
        expect(openBCIUtilities.impedanceCalculateArray(newRandomSample(i), impTestObj)).to.equal(null);
      }
      expect(impTestObj.buffer.length).to.equal(impTestObj.window - 1);
    });
    it('should produce and array of impedances at window', function () {
      const impTestObj = openBCIUtilities.impedanceTestObjDefault();
      let impedanceArray = null;
      for (let i = 0; i < impTestObj.window; i++) {
        impedanceArray = openBCIUtilities.impedanceCalculateArray(newRandomSample(i), impTestObj);
      }
      expect(impedanceArray.length).to.equal(numberOfChannels);
    });
  });
});

describe('openBCIGanglionUtils', function () {
  describe('#convert18bitAsInt32', function () {
    it('converts a small positive number', function () {
      const buf1 = new Buffer([0x00, 0x06, 0x90]); // 0x000690 === 1680
      const num = openBCIUtilities.convert18bitAsInt32(buf1);
      assert.equal(num, 1680);
    });
    it('converts a small positive number', function () {
      const buf1 = new Buffer([0x00, 0x06, 0x90]); // 0x000690 === 1680
      const num = openBCIUtilities.convert18bitAsInt32(buf1);
      assert.equal(num, 1680);
    });
    it('converts a large positive number', function () {
      const buf1 = new Buffer([0x02, 0xC0, 0x00]); // 0x02C001 === 180225
      const num = openBCIUtilities.convert18bitAsInt32(buf1);
      assert.equal(num, 180224);
    });
    it('converts a small negative number', function () {
      const buf1 = new Buffer([0xFF, 0xFF, 0xFF]); // 0xFFFFFF === -1
      const num = openBCIUtilities.convert18bitAsInt32(buf1);
      expect(num).to.be.approximately(-1, 1);
    });
    it('converts a large negative number', function () {
      const buf1 = new Buffer([0x04, 0xA1, 0x01]); // 0x04A101 === -220927
      const num = openBCIUtilities.convert18bitAsInt32(buf1);
      expect(num).to.be.approximately(-220927, 1);
    });
  });
  describe('#convert19bitAsInt32', function () {
    it('converts a small positive number', function () {
      const buf1 = new Buffer([0x00, 0x06, 0x90]); // 0x000690 === 1680
      const num = openBCIUtilities.convert19bitAsInt32(buf1);
      assert.equal(num, 1680);
    });
    it('converts a small positive number', function () {
      const buf1 = new Buffer([0x00, 0x06, 0x90]); // 0x000690 === 1680
      const num = openBCIUtilities.convert19bitAsInt32(buf1);
      assert.equal(num, 1680);
    });
    it('converts a large positive number', function () {
      const buf1 = new Buffer([0x02, 0xC0, 0x00]); // 0x02C001 === 180225
      const num = openBCIUtilities.convert19bitAsInt32(buf1);
      assert.equal(num, 180224);
    });
    it('converts a small negative number', function () {
      const buf1 = new Buffer([0xFF, 0xFF, 0xFF]); // 0xFFFFFF === -1
      const num = openBCIUtilities.convert19bitAsInt32(buf1);
      expect(num).to.be.approximately(-1, 1);
    });
    it('converts a large negative number', function () {
      const buf1 = new Buffer([0x04, 0xA1, 0x01]); // 0x04A101 === -220927
      const num = openBCIUtilities.convert19bitAsInt32(buf1);
      expect(num).to.be.approximately(-220927, 1);
    });
  });
  describe('decompressDeltas18Bit', function () {
    it('should extract the proper values for each channel', function () {
      let buffer = new Buffer(
        [
          0b00000000, // 0
          0b00000000, // 1
          0b00000000, // 2
          0b00000000, // 3
          0b00100000, // 4
          0b00000000, // 5
          0b00101000, // 6
          0b00000000, // 7
          0b00000100, // 8
          0b10000000, // 9
          0b00000000, // 10
          0b10111100, // 11
          0b00000000, // 12
          0b00000111, // 13
          0b00000000, // 14
          0b00101000, // 15
          0b11000000, // 16
          0b00001010  // 17
        ]);
      let expectedValue = [[0, 2, 10, 4], [131074, 245760, 114698, 49162]];
      let actualValue = openBCIUtilities.decompressDeltas18Bit(buffer);

      for (let i = 0; i < 4; i++) {
        expect(actualValue[0][i]).to.equal(expectedValue[0][i]);
        expect(actualValue[1][i]).to.equal(expectedValue[1][i]);
      }
    });
    it('should extract the proper values for each channel (neg test)', function () {
      let buffer = new Buffer(
        [
          0b11111111, // 0
          0b11111111, // 1
          0b01111111, // 2
          0b11111111, // 3
          0b10111111, // 4
          0b11111111, // 5
          0b11100111, // 6
          0b11111111, // 7
          0b11110101, // 8
          0b00000000, // 9
          0b00000001, // 10
          0b01001111, // 11
          0b10001110, // 12
          0b00110000, // 13
          0b00000000, // 14
          0b00011111, // 15
          0b11110000, // 16
          0b00000001  // 17
        ]);
      let expectedValue = [[-3, -5, -7, -11], [-262139, -198429, -262137, -4095]];
      let actualValue = openBCIUtilities.decompressDeltas18Bit(buffer);

      for (let i = 0; i < 4; i++) {
        expect(actualValue[0][i]).to.equal(expectedValue[0][i]);
        expect(actualValue[1][i]).to.equal(expectedValue[1][i]);
      }
    });
  });
  describe('decompressDeltas19Bit', function () {
    it('should extract the proper values for each channel', function () {
      let buffer = new Buffer(
        [
          0b00000000, // 0
          0b00000000, // 1
          0b00000000, // 2
          0b00000000, // 3
          0b00001000, // 4
          0b00000000, // 5
          0b00000101, // 6
          0b00000000, // 7
          0b00000000, // 8
          0b01001000, // 9
          0b00000000, // 10
          0b00001001, // 11
          0b11110000, // 12
          0b00000001, // 13
          0b10110000, // 14
          0b00000000, // 15
          0b00110000, // 16
          0b00000000, // 17
          0b00001000  // 18
        ]);
      let expectedValue = [[0, 2, 10, 4], [262148, 507910, 393222, 8]];
      let actualValue = openBCIUtilities.decompressDeltas19Bit(buffer);
      for (let i = 0; i < 4; i++) {
        expect(actualValue[0][i]).to.equal(expectedValue[0][i]);
        expect(actualValue[1][i]).to.equal(expectedValue[1][i]);
      }
    });
    it('should extract the proper values for each channel (neg test)', function () {
      let buffer = new Buffer(
        [
          0b11111111, // 0
          0b11111111, // 1
          0b10111111, // 2
          0b11111111, // 3
          0b11101111, // 4
          0b11111111, // 5
          0b11111100, // 6
          0b11111111, // 7
          0b11111111, // 8
          0b01011000, // 9
          0b00000000, // 10
          0b00001011, // 11
          0b00111110, // 12
          0b00111000, // 13
          0b11100000, // 14
          0b00000000, // 15
          0b00111111, // 16
          0b11110000, // 17
          0b00000001  // 18
        ]);
      let expectedValue = [[-3, -5, -7, -11], [-262139, -198429, -262137, -4095]];
      let actualValue = openBCIUtilities.decompressDeltas19Bit(buffer);

      for (let i = 0; i < 4; i++) {
        expect(actualValue[0][i]).to.equal(expectedValue[0][i]);
        expect(actualValue[1][i]).to.equal(expectedValue[1][i]);
      }
    });
  });
});

/**
 * Test the function that parses an incoming data buffer for packets
 */
describe('#extractRawDataPackets', function () {
  it('should do nothing when empty buffer inserted', () => {
    let buffer = null;

    // Test the function
    let output = openBCIUtilities.extractRawDataPackets(buffer);

    expect(output.buffer).to.equal(null);
    expect(output.rawDataPackets).to.deep.equal([]);
  });
  it('should return an unaltered buffer if there is less than a packets worth of data in it', () => {
    let expectedString = 'AJ';
    let buffer = new Buffer(expectedString);

    // Test the function
    let output = openBCIUtilities.extractRawDataPackets(buffer);

    // Convert the buffer to a string and ensure that it equals the expected string
    expect(bufferEqual(buffer, output.buffer)).to.be.true();
    expect(output.rawDataPackets).to.deep.equal([]);
  });
  it('should identify a packet', () => {
    let buffer = openBCIUtilities.samplePacketReal(0);

    // Call the function under test
    let output = openBCIUtilities.extractRawDataPackets(buffer);

    // The buffer should not have anything in it any more
    expect(output.buffer).to.be.null();
    expect(bufferEqual(buffer, output.rawDataPackets[0])).to.be.true();
  });
  it('should extract a buffer and preserve the remaining data in the buffer', () => {
    let expectedString = 'AJ';
    let extraBuffer = new Buffer(expectedString);
    // declare the big buffer
    let buffer = new Buffer(k.OBCIPacketSize + extraBuffer.length);
    // Fill that new big buffer with buffers
    const expectedRawDataPacket = openBCIUtilities.samplePacketReal(0);
    expectedRawDataPacket.copy(buffer, 0);
    extraBuffer.copy(buffer, k.OBCIPacketSize);
    // Call the function under test
    const output = openBCIUtilities.extractRawDataPackets(buffer);
    expect(bufferEqual(expectedRawDataPacket, output.rawDataPackets[0])).to.be.true();
    expect(bufferEqual(output.buffer, extraBuffer)).to.be.true(); // Should return the extra parts of the buffer
  });
  it('should be able to extract multiple packets from a single buffer', () => {
    // We are going to extract multiple buffers
    let expectedNumberOfBuffers = 3;
    // declare the big buffer
    let buffer = new Buffer(k.OBCIPacketSize * expectedNumberOfBuffers);
    // Fill that new big buffer with buffers
    const expectedRawDataPackets = [
      openBCIUtilities.samplePacketReal(0),
      openBCIUtilities.samplePacketReal(1),
      openBCIUtilities.samplePacketReal(2)
    ];
    expectedRawDataPackets[0].copy(buffer, 0);
    expectedRawDataPackets[1].copy(buffer, k.OBCIPacketSize);
    expectedRawDataPackets[2].copy(buffer, k.OBCIPacketSize * 2);
    // Call the function under test
    const output = openBCIUtilities.extractRawDataPackets(buffer);
    // The buffer should not have anything in it any more
    expect(output.buffer).to.be.null();
    for (let i = 0; i < expectedNumberOfBuffers; i++) {
      expect(bufferEqual(expectedRawDataPackets[i], output.rawDataPackets[i])).to.be.true(`Expected 0x${expectedRawDataPackets[i].toString('HEX')} to equal 0x${output.rawDataPackets[i].toString('HEX')}`);
    }
  });

  it('should be able to get multiple packets and keep extra data on the end', () => {
    let expectedString = 'AJ';
    let extraBuffer = new Buffer(expectedString);
    // We are going to extract multiple buffers
    let expectedNumberOfBuffers = 2;
    // declare the big buffer
    let buffer = new Buffer(k.OBCIPacketSize * expectedNumberOfBuffers + extraBuffer.length);
    // Fill that new big buffer with buffers
    const expectedRawDataPackets = [
      openBCIUtilities.samplePacketReal(0),
      openBCIUtilities.samplePacketReal(1)
    ];
    expectedRawDataPackets[0].copy(buffer, 0);
    expectedRawDataPackets[1].copy(buffer, k.OBCIPacketSize);
    extraBuffer.copy(buffer, k.OBCIPacketSize * 2);
    // Call the function under test
    const output = openBCIUtilities.extractRawDataPackets(buffer);
    for (let i = 0; i < expectedNumberOfBuffers; i++) {
      expect(bufferEqual(expectedRawDataPackets[i], output.rawDataPackets[i])).to.be.true(`Expected 0x${expectedRawDataPackets[i].toString('HEX')} to equal 0x${output.rawDataPackets[i].toString('HEX')}`);
    }
    expect(bufferEqual(output.buffer, extraBuffer)).to.be.true(); // Should return the extra parts of the buffer
  });

  it('should be able to get multiple packets with junk in the middle', () => {
    let expectedString = ',';
    let extraBuffer = new Buffer(expectedString);
    // We are going to extract multiple buffers
    let expectedNumberOfBuffers = 2;
    // declare the big buffer
    let buffer = new Buffer(k.OBCIPacketSize * expectedNumberOfBuffers + extraBuffer.length);
    // Fill that new big buffer with buffers
    const expectedRawDataPackets = [
      openBCIUtilities.samplePacketReal(0),
      openBCIUtilities.samplePacketReal(1)
    ];
    expectedRawDataPackets[0].copy(buffer, 0);
    extraBuffer.copy(buffer, k.OBCIPacketSize);
    expectedRawDataPackets[1].copy(buffer, k.OBCIPacketSize + extraBuffer.byteLength);

    const output = openBCIUtilities.extractRawDataPackets(buffer);
    for (let i = 0; i < expectedNumberOfBuffers; i++) {
      expect(bufferEqual(expectedRawDataPackets[i], output.rawDataPackets[i]), `Expected 0x${expectedRawDataPackets[i].toString('HEX')} to equal 0x${output.rawDataPackets[i].toString('HEX')}`).to.be.true();
    }
    expect(bufferEqual(output.buffer, extraBuffer)).to.be.true(); // Should return the extra parts of the buffer
  });

  it('should be able to get multiple packets with junk in the middle and end', () => {
    let expectedString = ',';
    let extraBuffer = new Buffer(expectedString);
    // We are going to extract multiple buffers
    let expectedNumberOfBuffers = 2;
    // declare the big buffer
    let buffer = new Buffer(k.OBCIPacketSize * expectedNumberOfBuffers + extraBuffer.length * 2);
    // Fill that new big buffer with buffers
    // Fill that new big buffer with buffers
    const expectedRawDataPackets = [
      openBCIUtilities.samplePacketReal(0),
      openBCIUtilities.samplePacketReal(1)
    ];
    expectedRawDataPackets[0].copy(buffer, 0);
    extraBuffer.copy(buffer, k.OBCIPacketSize);
    expectedRawDataPackets[1].copy(buffer, k.OBCIPacketSize + extraBuffer.byteLength);
    extraBuffer.copy(buffer, k.OBCIPacketSize * 2 + extraBuffer.byteLength);

    const output = openBCIUtilities.extractRawDataPackets(buffer);
    for (let i = 0; i < expectedNumberOfBuffers; i++) {
      expect(bufferEqual(expectedRawDataPackets[i], output.rawDataPackets[i]), `Expected 0x${expectedRawDataPackets[i].toString('HEX')} to equal 0x${output.rawDataPackets[i].toString('HEX')}`).to.be.true();
    }
    // The buffer should have everything in it
    expect(bufferEqual(Buffer.concat([extraBuffer, extraBuffer]), output.buffer)).to.be.true();
  });

  it('should be able to get multiple packets with junk in the front, middle and end', () => {
    let expectedString = ',';
    let extraBuffer = new Buffer(expectedString);
    // We are going to extract multiple buffers
    let expectedNumberOfBuffers = 2;
    // declare the big buffer
    let buffer = new Buffer(k.OBCIPacketSize * expectedNumberOfBuffers + extraBuffer.length * 3);
    // Fill that new big buffer with buffers
    // Fill that new big buffer with buffers
    const expectedRawDataPackets = [
      openBCIUtilities.samplePacketReal(0),
      openBCIUtilities.samplePacketReal(1)
    ];
    extraBuffer.copy(buffer, 0);
    expectedRawDataPackets[0].copy(buffer, extraBuffer.byteLength);
    extraBuffer.copy(buffer, k.OBCIPacketSize + extraBuffer.byteLength);
    expectedRawDataPackets[1].copy(buffer, k.OBCIPacketSize + extraBuffer.byteLength * 2);
    extraBuffer.copy(buffer, k.OBCIPacketSize * 2 + extraBuffer.byteLength * 2);

    const output = openBCIUtilities.extractRawDataPackets(buffer);
    for (let i = 0; i < expectedNumberOfBuffers; i++) {
      expect(bufferEqual(expectedRawDataPackets[i], output.rawDataPackets[i]), `Expected 0x${expectedRawDataPackets[i].toString('HEX')} to equal 0x${output.rawDataPackets[i].toString('HEX')}`).to.be.true();
    }
    // The buffer should have everything in it
    expect(bufferEqual(Buffer.concat([extraBuffer, extraBuffer, extraBuffer]), output.buffer)).to.be.true();
  });
});

/**
 * Test the function that routes raw packets for processing
 */
describe('#transformRawDataPacketsToSamples', function () {
  it('should process three ganglion packets packet', function () {
    let rawDataToSample = k.rawDataToSampleObjectDefault(k.OBCINumberOfChannelsGanglion);
    rawDataToSample.protocol = k.OBCIProtocolWifi;
    rawDataToSample.lastSampleNumber = 0;

    rawDataToSample.rawDataPackets = [
      openBCIUtilities.samplePacket(0),
      openBCIUtilities.samplePacket(1),
      openBCIUtilities.samplePacket(2)
    ];

    // gain here is 51, the same as in the channel settings array
    let scaleFactor = 1.2 / 51 / (Math.pow(2, 23) - 1);

    // Call the function under test
    let samples = openBCIUtilities.transformRawDataPacketsToSample(rawDataToSample);

    for (let j = 0; j < k.OBCINumberOfChannelsGanglion; j++) {
      // console.log(`channel data ${j + 1}: ${valueArray[j]} : actual ${scaleFactor * (j + 1)}`)
      expect(samples[0].channelData[j]).to.be.closeTo(scaleFactor * (j + 1), 0.00000001);
      expect(samples[1].channelData[j]).to.be.closeTo(scaleFactor * (j + 1), 0.00000001);
      expect(samples[2].channelData[j]).to.be.closeTo(scaleFactor * (j + 1), 0.00000001);
    }

    // Ensure that we extracted only one buffer
    expect(samples).to.have.length(3);
  });
  it('should process three cyton packets packet', function () {
    let rawDataToSample = k.rawDataToSampleObjectDefault(k.OBCINumberOfChannelsCyton);
    rawDataToSample.protocol = k.OBCIProtocolWifi;
    rawDataToSample.lastSampleNumber = 0;

    rawDataToSample.rawDataPackets = [
      openBCIUtilities.samplePacket(0),
      openBCIUtilities.samplePacket(1),
      openBCIUtilities.samplePacket(2)
    ];

    // gain here is 24, the same as in the channel settings array
    let scaleFactor = 4.5 / 24 / (Math.pow(2, 23) - 1);

    // Call the function under test
    let samples = openBCIUtilities.transformRawDataPacketsToSample(rawDataToSample);

    for (let j = 0; j < k.OBCINumberOfChannelsDefault; j++) {
      // console.log(`channel data ${j + 1}: ${valueArray[j]} : actual ${scaleFactor * (j + 1)}`)
      expect(samples[0].channelData[j]).to.be.closeTo(scaleFactor * (j + 1), 0.00000001);
      expect(samples[1].channelData[j]).to.be.closeTo(scaleFactor * (j + 1), 0.00000001);
      expect(samples[2].channelData[j]).to.be.closeTo(scaleFactor * (j + 1), 0.00000001);
    }

    // Ensure that we extracted only one buffer
    expect(samples).to.have.length(3);
  });
  it('should process three daisy packets packet', function () {
    let rawDataToSample = k.rawDataToSampleObjectDefault(k.OBCINumberOfChannelsDaisy);
    rawDataToSample.protocol = k.OBCIProtocolWifi;
    rawDataToSample.lastSampleNumber = 0;

    rawDataToSample.rawDataPackets = [
      openBCIUtilities.samplePacket(0),
      openBCIUtilities.samplePacket(1),
      openBCIUtilities.samplePacket(1)
    ];

    for (let i = 0; i < k.OBCINumberOfChannelsDefault; i++) {
      rawDataToSample.channelSettings[i].gain = 1;
    }
    // gain here is 24, the same as in the channel settings array
    let scaleFactor = 4.5 / 24 / (Math.pow(2, 23) - 1);
    let scaleFactor1 = 4.5 / (Math.pow(2, 23) - 1);

    // Call the function under test
    let samples = openBCIUtilities.transformRawDataPacketsToSample(rawDataToSample);

    for (let j = 0; j < k.OBCINumberOfChannelsDefault; j++) {
      // console.log(`channel data ${j + 1}: ${valueArray[j]} : actual ${scaleFactor * (j + 1)}`)
      expect(samples[0].channelData[j]).to.be.closeTo(scaleFactor * (j + 1), 0.00000001);
    }

    for (let j = 0; j < k.OBCINumberOfChannelsDefault; j++) {
      // console.log(`channel data ${j + 1}: ${valueArray[j]} : actual ${scaleFactor * (j + 1)}`)
      expect(samples[1].channelData[j]).to.be.closeTo(scaleFactor1 * (j + 1), 0.00000001);
    }

    for (let j = 0; j < k.OBCINumberOfChannelsDefault; j++) {
      // console.log(`channel data ${j + 1}: ${valueArray[j]} : actual ${scaleFactor * (j + 1)}`)
      expect(samples[2].channelData[j]).to.be.closeTo(scaleFactor * (j + 1), 0.00000001);
    }

    // Ensure that we extracted only one buffer
    expect(samples).to.have.length(3);
  });
});

/**
 * Test the function that routes raw packets for processing
 */
describe('#transformRawDataPacketToSample', function () {
  var funcSpyTimeSyncedAccel, funcSpyTimeSyncedRawAux, funcSpyStandardRawAux, funcSpyStandardAccel;

  before(function () {
    // Put watchers on all functions
    funcSpyStandardAccel = sinon.spy(openBCIUtilities, 'parsePacketStandardAccel');
    funcSpyStandardRawAux = sinon.spy(openBCIUtilities, 'parsePacketStandardRawAux');
    funcSpyTimeSyncedAccel = sinon.spy(openBCIUtilities, 'parsePacketTimeSyncedAccel');
    funcSpyTimeSyncedRawAux = sinon.spy(openBCIUtilities, 'parsePacketTimeSyncedRawAux');
  });
  beforeEach(function () {
    funcSpyStandardAccel.reset();
    funcSpyStandardRawAux.reset();
    funcSpyTimeSyncedAccel.reset();
    funcSpyTimeSyncedRawAux.reset();
  });
  after(function () {
    // ourBoard = null
  });
  after(() => bluebirdChecks.noPendingPromises());

  it('should process a standard packet', function () {
    var buffer = openBCIUtilities.samplePacket(0);

    // Call the function under test
    openBCIUtilities.transformRawDataPacketToSample({
      rawDataPacket: buffer,
      channelSettings: defaultChannelSettingsArray
    });

    // Ensure that we extracted only one buffer
    expect(funcSpyStandardAccel).to.have.been.calledOnce();
  });
  it('should process a standard packet with raw aux', function () {
    var buffer = openBCIUtilities.samplePacketStandardRawAux(0);

    // Call the function under test
    openBCIUtilities.transformRawDataPacketToSample({
      channelSettings: defaultChannelSettingsArray,
      rawDataPacket: buffer
    });

    // Ensure that we extracted only one buffer
    expect(funcSpyStandardRawAux).to.have.been.calledOnce();
  });
  it('should call nothing for a user defined packet type ', function () {
    var buffer = openBCIUtilities.samplePacketUserDefined();

    // Call the function under test
    openBCIUtilities.transformRawDataPacketToSample({
      channelSettings: defaultChannelSettingsArray,
      rawDataPacket: buffer
    });

    // Nothing should be called
    expect(funcSpyStandardAccel).to.not.have.been.called();
    expect(funcSpyStandardRawAux).to.not.have.been.called();
    expect(funcSpyTimeSyncedAccel).to.not.have.been.called();
    expect(funcSpyTimeSyncedRawAux).to.not.have.been.called();
  });
  it('should throw err when no channel settings', function () {
    var buffer = new Buffer(5).fill(0);

    // Call the function under test
    let sample = openBCIUtilities.transformRawDataPacketToSample({
      rawDataPacket: buffer
    });

    expect(sample.valid).to.be.false();
    expect(sample.error.message).to.equal(k.OBCIErrorInvalidByteLength);
    expect(bufferEqual(buffer, sample.rawDataPacket)).to.be.true();
  });
  it('should process a time sync set packet with accel', function () {
    var buffer = openBCIUtilities.samplePacketAccelTimeSyncSet();

    // Call the function under test
    openBCIUtilities.transformRawDataPacketToSample({
      channelSettings: defaultChannelSettingsArray,
      rawDataPacket: buffer
    });

    // we should call to get a packet
    expect(funcSpyTimeSyncedAccel).to.have.been.calledOnce();
  });
  it('should process bad one', function () {
    var buffer = openBCIUtilities.samplePacketRawAuxTimeSyncSet(0);
    buffer.writeUInt8(215, k.OBCIPacketPositionStopByte);

    // Call the function under test
    openBCIUtilities.transformRawDataPacketToSample({
      channelSettings: defaultChannelSettingsArray,
      rawDataPacket: buffer
    });
  });
  it('should process a time synced packet with accel', function () {
    var buffer = openBCIUtilities.samplePacketAccelTimeSynced(0);

    // Call the function under test
    openBCIUtilities.transformRawDataPacketToSample({
      channelSettings: defaultChannelSettingsArray,
      rawDataPacket: buffer
    });

    // Ensure that we extracted only one buffer
    expect(funcSpyTimeSyncedAccel).to.have.been.calledOnce();
  });
  it('should process a time sync set packet with raw aux', function () {
    var buffer = openBCIUtilities.samplePacketRawAuxTimeSyncSet(0);

    // Call the function under test
    openBCIUtilities.transformRawDataPacketToSample({
      channelSettings: defaultChannelSettingsArray,
      rawDataPacket: buffer
    });

    expect(funcSpyTimeSyncedRawAux).to.have.been.calledOnce();
  });
  it('should process a time synced packet with raw aux', function () {
    var buffer = openBCIUtilities.samplePacketRawAuxTimeSynced(0);

    // Call the function under test
    openBCIUtilities.transformRawDataPacketToSample({
      channelSettings: defaultChannelSettingsArray,
      rawDataPacket: buffer
    });

    // Ensure that we extracted only one buffer
    expect(funcSpyTimeSyncedRawAux).to.have.been.calledOnce();
  });
  it('should not identify any packet', function () {
    var buffer = openBCIUtilities.samplePacket(0);

    // Set the stop byte to some number not yet defined
    buffer[k.OBCIPacketPositionStopByte] = 0xCF;

    // Call the function under test
    openBCIUtilities.transformRawDataPacketToSample({
      channelSettings: defaultChannelSettingsArray,
      rawDataPacket: buffer
    });

    // Nothing should be called
    expect(funcSpyStandardAccel).to.not.have.been.called();
    expect(funcSpyStandardRawAux).to.not.have.been.called();
    expect(funcSpyTimeSyncedAccel).to.not.have.been.called();
    expect(funcSpyTimeSyncedRawAux).to.not.have.been.called();
  });
});
