const express = require('express');
const alertStore = require('../services/alertStore');
const { fixSharing, deleteDocument } = require('../services/remediationService');
const { poll } = require('../services/poller');
const codaClient = require('../config/codaClient');

const router = express.Router();

router.get('/alerts', (req, res) => {
  console.log("Fetching alerts, total:", alertStore.list());
  const page = req.query.page || 1;
      const limit = req.query.limit || 50;

      const start = (page-1)* limit;
      const end = start + limit;

      const answer = alertStore.list().slice(start, end);
  res.json(answer);
});

router.get('/documents', async (req, res) => {
  try {
    const docs = await codaClient.listDocuments();
    res.json(docs);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

router.get('/documents/:docId', async (req, res) => {
  try {
    const doc = await codaClient.getDocument(req.params.docId);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(doc);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

router.post('/rescan', async (req, res) => {
  await poll();
  res.json({ message: 'Scan complete' });
});

router.post('/remediate/:docId', async (req, res) => {
  const result = await deleteDocument(req.params.docId);
  res.json(result);
});

module.exports = router;
