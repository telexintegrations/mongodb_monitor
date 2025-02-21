const { MongoClient } = require('mongodb');
const sinon = require('sinon');
const { Monitor, GET_MONITOR_DATA } = require('../src/monitor');
require('dotenv').config();
const mongoUrl = process.env.MONGO_URL;

describe('Monitor', () => {
  describe('constructor', () => {
    it('should initialize with mongoUrl and null client', () => {
      const monitor = new Monitor(mongoUrl);
      
      expect(monitor.mongoUrl).toEqual(mongoUrl);
      expect(monitor.client).toBe(null);
    });

    it('should handle empty mongoUrl', () => {
      const monitor = new Monitor();
      
      expect(monitor.mongoUrl).toBe(undefined);
      expect(monitor.client).toBe(null);
    });

    it('should handle invalid mongoUrl types', () => {
      const cases = [null, undefined, 123, {}, []];
      
      cases.forEach(invalidUrl => {
        const monitor = new Monitor(invalidUrl);
        expect(monitor.mongoUrl).toEqual(invalidUrl);
        expect(monitor.client).toBe(null);
      });
    });
  });
});

describe('GET_MONITOR_DATA', () => {
  let monitor;
  let mockMonitor;
  let mockPayloadSchema;

  beforeEach(() => {
    mockMonitor = {
      connect: sinon.stub().resolves(),
      collectPerformanceData: sinon.stub().resolves({
        timestamp: '2023-01-01',
        databaseMetrics: { size: 1000 }
      })
    };

    mockPayloadSchema = {
      parse: sinon.stub()
    };

    Monitor.prototype.connect = mockMonitor.connect;
    Monitor.prototype.collectPerformanceData = mockMonitor.collectPerformanceData;
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should handle case with no valid settings', async () => {
    const testData = {
      settings: [
        { default: '' },
        { default: '' }
      ],
      query: {}
    };

    mockPayloadSchema.parse.returns(testData);

    const result = await GET_MONITOR_DATA(testData);

    expect(mockMonitor.connect.callCount).toBe(0);
    expect(mockMonitor.collectPerformanceData.callCount).toBe(0);
  });

  it('should handle payload schema validation error', async () => {
    const testData = {};
    const validationError = new Error('Invalid payload');
    mockPayloadSchema.parse.throws(validationError);

    const result = await GET_MONITOR_DATA(testData);

    expect(mockMonitor.connect.callCount).toBe(0);
    expect(mockMonitor.collectPerformanceData.callCount).toBe(0);
  });

  it('should handle connection error', async () => {
    const testData = {
      settings: [{ default: mongoUrl }],
      query: {}
    };
    const connectionError = new Error('Connection failed');
    mockPayloadSchema.parse.returns(testData);
    mockMonitor.connect.rejects(connectionError);

    const result = await GET_MONITOR_DATA(testData);

    expect(mockMonitor.collectPerformanceData.callCount).toBe(0);
  });
  
  it('should handle performance data collection error', async () => {
    const testData = {
      settings: [{ default: mongoUrl }],
      query: {}
    };
    mockPayloadSchema.parse.returns(testData);
    mockMonitor.connect.resolves();
    const collectionError = new Error('Collection failed');
    mockMonitor.collectPerformanceData.rejects(collectionError);
  });
});
