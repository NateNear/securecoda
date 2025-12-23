const alertStore = require('../../../src/services/alertStore');

describe('Alert Store Service', () => {
  beforeEach(() => {
    alertStore.clear();
  });

  test('should initialize with empty alerts array', () => {
    expect(alertStore.list()).toEqual([]);
  });

  test('should add alerts to store', () => {
    const testAlerts = [
      {
        docId: 'doc1',
        type: 'PUBLIC_DOCUMENT',
        severity: 9,
        message: 'Document is public'
      }
    ];

    alertStore.add(testAlerts);
    expect(alertStore.list()).toHaveLength(1);
    expect(alertStore.list()[0].type).toBe('PUBLIC_DOCUMENT');
  });

  test('should add multiple alerts sequentially', () => {
    const alerts1 = [{ docId: 'doc1', type: 'ALERT1', severity: 5 }];
    const alerts2 = [{ docId: 'doc2', type: 'ALERT2', severity: 8 }];

    alertStore.add(alerts1);
    alertStore.add(alerts2);

    expect(alertStore.list()).toHaveLength(2);
  });

  test('should clear all alerts', () => {
    const testAlerts = [
      { docId: 'doc1', type: 'ALERT', severity: 5 },
      { docId: 'doc2', type: 'ALERT', severity: 8 }
    ];

    alertStore.add(testAlerts);
    expect(alertStore.list()).toHaveLength(2);

    alertStore.clear();
    expect(alertStore.list()).toEqual([]);
  });

  test('should handle adding empty array', () => {
    alertStore.add([]);
    expect(alertStore.list()).toEqual([]);
  });

  test('should maintain alert order', () => {
    const alerts = [
      { docId: 'doc1', order: 1 },
      { docId: 'doc2', order: 2 },
      { docId: 'doc3', order: 3 }
    ];

    alertStore.add(alerts);
    const result = alertStore.list();

    expect(result[0].order).toBe(1);
    expect(result[1].order).toBe(2);
    expect(result[2].order).toBe(3);
  });
});
