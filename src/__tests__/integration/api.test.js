const request = require('supertest');
const express = require('express');
const api = require('../../../src/routes/api');
const alertStore = require('../../../src/services/alertStore');

// Create a minimal Express app for testing
const app = express();
app.use(express.json());
app.use('/api', api);

describe('API Routes Integration Tests', () => {
  beforeEach(() => {
    alertStore.clear();
  });

  describe('GET /api/alerts', () => {
    test('should return empty array when no alerts', async () => {
      const response = await request(app)
        .get('/api/alerts')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    test('should return alerts when present', async () => {
      const testAlert = {
        docId: 'doc1',
        type: 'PUBLIC_DOCUMENT',
        severity: 9,
        message: 'Document is public'
      };

      alertStore.add([testAlert]);

      const response = await request(app)
        .get('/api/alerts')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].type).toBe('PUBLIC_DOCUMENT');
      expect(response.body[0].docId).toBe('doc1');
    });

    test('should return multiple alerts', async () => {
      const alerts = [
        { docId: 'doc1', type: 'ALERT1', severity: 5 },
        { docId: 'doc2', type: 'ALERT2', severity: 8 },
        { docId: 'doc3', type: 'ALERT3', severity: 9 }
      ];

      alertStore.add(alerts);

      const response = await request(app)
        .get('/api/alerts')
        .expect(200);

      expect(response.body).toHaveLength(3);
    });

    test('should return alerts as JSON with correct headers', async () => {
      alertStore.add([{ docId: 'doc1', type: 'TEST', severity: 5 }]);

      const response = await request(app)
        .get('/api/alerts')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/rescan', () => {
    test('should return success message', async () => {
      const response = await request(app)
        .post('/api/rescan')
        .expect(200);

      expect(response.body.message).toBe('Scan complete');
    });

    test('should accept POST request', async () => {
      const response = await request(app)
        .post('/api/rescan');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/remediate/:docId', () => {
    test('should accept remediate request with docId', async () => {
      const response = await request(app)
        .post('/api/remediate/doc1')
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });

    test('should handle different docIds', async () => {
      const response1 = await request(app)
        .post('/api/remediate/doc1')
        .expect(200);

      const response2 = await request(app)
        .post('/api/remediate/doc2')
        .expect(200);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });

    test('should return result message', async () => {
      const response = await request(app)
        .post('/api/remediate/testdoc')
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid routes with 404', async () => {
      const response = await request(app)
        .get('/api/nonexistent');

      expect(response.status).toBe(404);
    });

    test('should handle different HTTP methods appropriately', async () => {
      const response = await request(app)
        .put('/api/alerts');

      expect(response.status).toBe(404);
    });
  });

  describe('Response Format', () => {
    test('GET /api/alerts should return valid JSON array', async () => {
      const response = await request(app)
        .get('/api/alerts')
        .expect(200);

      expect(typeof response.body).toBe('object');
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('POST /api/rescan should return valid JSON object', async () => {
      const response = await request(app)
        .post('/api/rescan')
        .expect(200);

      expect(typeof response.body).toBe('object');
      expect(!Array.isArray(response.body)).toBe(true);
    });

    test('POST /api/remediate should return valid JSON object', async () => {
      const response = await request(app)
        .post('/api/remediate/doc1')
        .expect(200);

      expect(typeof response.body).toBe('object');
      expect(!Array.isArray(response.body)).toBe(true);
    });
  });
});
