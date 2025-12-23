require('dotenv').config();
const express = require('express');
const path = require('path');
const api = require('./routes/api');
const logger = require('./utils/logger');
const { poll } = require("./services/poller");

(async () => {
  console.log("🚀 Running initial scan...");
  await poll();
})();

const app = express();
app.use(express.json());

// API routes
app.use('/api', api);

// Serve frontend static files
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'), (err) => {
    if (err) res.status(500).send(err);
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => logger.info(`securecoda listening on ${port}`));

module.exports = app;
