const detectionService = require('../../../src/services/detectionService');

describe('Detection Service', () => {
  describe('analyze - Unused Documents', () => {
    test('should detect unused document after threshold', () => {
      const now = Date.now();
      const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();

      const docs = [
        {
          id: 'doc1',
          name: 'Old Report',
          updatedAt: twoHoursAgo,
          createdAt: '2023-01-01T00:00:00Z'
        }
      ];

      const alerts = detectionService.analyze(docs, {});

      expect(alerts.length).toBeGreaterThan(0);
      const unusedAlert = alerts.find(a => a.type === 'UNUSED_DOCUMENT');
      expect(unusedAlert).toBeDefined();
      expect(unusedAlert.severity).toBe(5);
    });

    test('should not detect recently updated document as unused', () => {
      const now = new Date().toISOString();

      const docs = [
        {
          id: 'doc1',
          name: 'Recent Report',
          updatedAt: now,
          createdAt: '2023-01-01T00:00:00Z'
        }
      ];

      const alerts = detectionService.analyze(docs, {});
      const unusedAlert = alerts.find(a => a.type === 'UNUSED_DOCUMENT');

      expect(unusedAlert).toBeUndefined();
    });

    test('should include metadata in unused document alert', () => {
      const now = Date.now();
      const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();

      const docs = [
        {
          id: 'doc1',
          name: 'Old Report',
          updatedAt: threeDaysAgo,
          createdAt: '2023-01-01T00:00:00Z'
        }
      ];

      const alerts = detectionService.analyze(docs, {});
      const unusedAlert = alerts.find(a => a.type === 'UNUSED_DOCUMENT');

      expect(unusedAlert.metadata).toBeDefined();
      expect(unusedAlert.metadata.updatedAt).toBe(threeDaysAgo);
      expect(unusedAlert.metadata.createdAt).toBe('2023-01-01T00:00:00Z');
    });
  });

  describe('analyze - Public Documents', () => {
    test('should detect publicly shared documents', () => {
      const docs = [
        {
          id: 'doc1',
          name: 'Public Spreadsheet',
          updatedAt: new Date().toISOString(),
          createdAt: '2023-01-01T00:00:00Z'
        }
      ];

      const permissionsMap = {
        doc1: [
          {
            id: 'perm1',
            principal: { type: 'anonymousViewer' },
            access: 'readOnly'
          }
        ]
      };

      const alerts = detectionService.analyze(docs, permissionsMap);
      const publicAlert = alerts.find(a => a.type === 'PUBLIC_DOCUMENT');

      expect(publicAlert).toBeDefined();
      expect(publicAlert.severity).toBe(9);
      expect(publicAlert.message).toContain('shared');
    });

    test('should not detect non-public documents as public', () => {
      const docs = [
        {
          id: 'doc1',
          name: 'Private Document',
          updatedAt: new Date().toISOString(),
          createdAt: '2023-01-01T00:00:00Z'
        }
      ];

      const permissionsMap = {
        doc1: [
          {
            id: 'perm1',
            principal: { type: 'user', email: 'user@company.com' },
            access: 'readWrite'
          }
        ]
      };

      const alerts = detectionService.analyze(docs, permissionsMap);
      const publicAlert = alerts.find(a => a.type === 'PUBLIC_DOCUMENT');

      expect(publicAlert).toBeUndefined();
    });
  });

  describe('analyze - External Sharing', () => {
    test('should detect documents shared with external domains', () => {
      const docs = [
        {
          id: 'doc1',
          name: 'Shared Document',
          updatedAt: new Date().toISOString(),
          createdAt: '2023-01-01T00:00:00Z'
        }
      ];

      const permissionsMap = {
        doc1: [
          {
            id: 'perm1',
            principal: { type: 'user', email: 'external@otherdomain.com' },
            access: 'readWrite'
          }
        ]
      };

      const alerts = detectionService.analyze(docs, permissionsMap);
      const externalAlert = alerts.find(a => a.type === 'EXTERNAL_SHARE');

      expect(externalAlert).toBeDefined();
      expect(externalAlert.severity).toBe(8);
    });

    test('should not flag internal domain sharing', () => {
      const docs = [
        {
          id: 'doc1',
          name: 'Internal Document',
          updatedAt: new Date().toISOString(),
          createdAt: '2023-01-01T00:00:00Z'
        }
      ];

      const permissionsMap = {
        doc1: [
          {
            id: 'perm1',
            principal: { type: 'user', email: 'coworker@yourcompany.com' },
            access: 'readWrite'
          }
        ]
      };

      const alerts = detectionService.analyze(docs, permissionsMap);
      const externalAlert = alerts.find(a => a.type === 'EXTERNAL_SHARE');

      expect(externalAlert).toBeUndefined();
    });
  });

  describe('detectSensitiveRows', () => {
    test('should detect password keyword in row data', () => {
      const rows = [
        {
          id: 'row1',
          values: {
            username: 'admin',
            password: 'secret123'
          }
        }
      ];

      const alerts = detectionService.detectSensitiveRows(rows);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('SENSITIVE_DATA_IN_ROW');
      expect(alerts[0].severity).toBe(8);
    });

    test('should detect multiple sensitive patterns', () => {
      const rows = [
        {
          id: 'row1',
          values: {
            apiKey: 'sk_live_12345',
            token: 'abc123def456'
          }
        }
      ];

      const alerts = detectionService.detectSensitiveRows(rows);

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe('SENSITIVE_DATA_IN_ROW');
    });

    test('should not alert on safe data', () => {
      const rows = [
        {
          id: 'row1',
          values: {
            name: 'John Doe',
            email: 'john@company.com',
            department: 'Engineering'
          }
        }
      ];

      const alerts = detectionService.detectSensitiveRows(rows);

      expect(alerts).toHaveLength(0);
    });

    test('should handle empty rows array', () => {
      const alerts = detectionService.detectSensitiveRows([]);

      expect(alerts).toEqual([]);
    });
  });

  describe('detectSensitiveHTML', () => {
    test('should detect password keyword in HTML', () => {
      const html = '<h1>Login</h1><input type="password" name="pwd" />';

      const alerts = detectionService.detectSensitiveHTML(html);

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe('SENSITIVE_TEXT_ON_PAGE');
      expect(alerts[0].severity).toBe(8);
    });

    test('should detect API key in HTML', () => {
      const html = '<div>API Key: sk_live_abc123def456</div>';

      const alerts = detectionService.detectSensitiveHTML(html);

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe('SENSITIVE_TEXT_ON_PAGE');
    });

    test('should not alert on safe HTML', () => {
      const html = '<h1>Welcome</h1><p>This is a public article</p>';

      const alerts = detectionService.detectSensitiveHTML(html);

      expect(alerts).toHaveLength(0);
    });

    test('should handle empty HTML string', () => {
      const alerts = detectionService.detectSensitiveHTML('');

      expect(alerts).toEqual([]);
    });
  });

  describe('edge cases', () => {
    test('should handle documents with no permissions', () => {
      const docs = [
        {
          id: 'doc1',
          name: 'Document',
          updatedAt: new Date().toISOString(),
          createdAt: '2023-01-01T00:00:00Z'
        }
      ];

      const alerts = detectionService.analyze(docs, {});

      // Should not crash, may have unused document alert if old enough
      expect(Array.isArray(alerts)).toBe(true);
    });

    test('should handle permissions with missing email', () => {
      const docs = [
        {
          id: 'doc1',
          name: 'Document',
          updatedAt: new Date().toISOString(),
          createdAt: '2023-01-01T00:00:00Z'
        }
      ];

      const permissionsMap = {
        doc1: [
          {
            id: 'perm1',
            principal: { type: 'group' }
          }
        ]
      };

      const alerts = detectionService.analyze(docs, permissionsMap);

      // Should not crash
      expect(Array.isArray(alerts)).toBe(true);
    });

    test('should handle very large alert volumes', () => {
      const docs = Array.from({ length: 100 }, (_, i) => ({
        id: `doc${i}`,
        name: `Document ${i}`,
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: '2023-01-01T00:00:00Z'
      }));

      const alerts = detectionService.analyze(docs, {});

      expect(alerts.length).toBeGreaterThan(0);
      // Should handle large volume without performance issues
      expect(Array.isArray(alerts)).toBe(true);
    });
  });
});
