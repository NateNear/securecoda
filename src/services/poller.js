const codaClient = require("../config/codaClient");
const alertStore = require("./alertStore");
const detectionService = require("./detectionService");

async function poll() {
  console.log("🔄 Running SecureCoda Scan...");

  alertStore.clear();

  const docs = await codaClient.listDocuments();
  console.log("Documents:", docs);

  // 1. Fetch permissions for each doc
  const permissionsMap = {};
  for (const doc of docs) {
    permissionsMap[doc.id] = await codaClient.listPermissions(doc.id);
  }
  console.log("Permissions Map:", permissionsMap);
  
  // 2. Document-level + permission-level detection
  const docAlerts = detectionService.analyze(docs, permissionsMap);
  alertStore.add(docAlerts);

  // 3. Scan table rows for sensitive data
  for (const doc of docs) {
    const tables = await codaClient.listTables(doc.id);

    for (const table of tables) {
      const rows = await codaClient.listRows(doc.id, table.id);
      const rowAlerts = detectionService.detectSensitiveRows(rows);
      alertStore.add(rowAlerts);
    }
  }

  // 4. Scan page HTML for sensitive text
  for (const doc of docs) {
    const pages = await codaClient.listPages(doc.id);

    for (const page of pages) {
      const html = await codaClient.exportPage(doc.id, page.id);
      const pageAlerts = detectionService.detectSensitiveHTML(html);
      alertStore.add(pageAlerts);
    }
  }

  // 4. Scan page content using new content API
for (const doc of docs) {
  const pages = await codaClient.listPages(doc.id);

  for (const page of pages) {
    const contentItems = await codaClient.getFullPageContent(doc.id, page.id);

    const pageAlerts = detectionService.detectSensitivePageContent(
      contentItems,
      doc.id,
      page.id,
      page.name
    );

    alertStore.add(pageAlerts);
  }
}

  console.log("Scan complete. Total alerts:", alertStore.list().length);
}

module.exports = { poll };
