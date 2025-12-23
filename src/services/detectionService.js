const config = require("../config");

const detectionService = {
  analyze(docs, permissionsMap) {
    const alerts = [];
    const now = Date.now();

    const UNUSED_DAYS_THRESHOLD = 0.001; // ~1.5 minutes for testing

    docs.forEach(doc => {
      const updated = new Date(doc.updatedAt).getTime();
      const ageDays = (now - updated) / (1000 * 60 * 60 * 24);

      // 1. Unused document
      if (ageDays > UNUSED_DAYS_THRESHOLD) {
        alerts.push({
          docId: doc.id,
          type: "UNUSED_DOCUMENT",
          severity: config.UNUSED_DOCUMENT,
          message: `${doc.name} unused for ${ageDays.toFixed(3)} days`
        });
      }

      // 2. Publicly shared documents  
      const permissions = permissionsMap[doc.id] || [];

      const publicShare = permissions.find(
        p => p.principal?.type === "anonymousViewer"
      );

      if (publicShare) {
        alerts.push({
          docId: doc.id,
          type: "PUBLIC_DOCUMENT",
          severity: config.PUBLIC_DOCUMENT || 9,
          message: `${doc.name} is shared publicly`
        });
      }

      // 3. Shared with external domains
      const externalShare = permissions.find(p => {
        const email = p.principal?.email;
        if (!email) return false;

        const domain = email.split("@")[1];
        const allowed = ["yourcompany.com"];

        return !allowed.includes(domain);
      });

      if (externalShare) {
        alerts.push({
          docId: doc.id,
          type: "EXTERNAL_SHARE",
          severity: 8,
          message: `${doc.name} shared with outside domain`
        });
      }
    });

    return alerts;
  },

  detectSensitiveRows(rows) {
    const alerts = [];
    const pattern = /(password|secret|card|ssn|token|key|credential)/i;
    rows.forEach(row => {

      const text = JSON.stringify(row.values);
      if (pattern.test(text)) {
        alerts.push({
          rowId: row.id,
          type: "SENSITIVE_DATA_IN_ROW",
          severity: 8,
          message: "Sensitive content found in table row"
        });
      }
    });

    return alerts;
  },

  detectSensitiveHTML(html) {
    const alerts = [];
    const pattern = /(password|token|secret|apikey|credential)/i;

    if (pattern.test(html)) {
      alerts.push({
        type: "SENSITIVE_TEXT_ON_PAGE",
        severity: 8,
        message: "Sensitive text found inside page content"
      });
    }

    return alerts;
  },

  detectSensitivePageContent(contentItems, docId, pageId, pageName) {
  const alerts = [];

  const sensitivePatterns = /(password|secret|token|apikey|card|ssn)/i;

  for (const item of contentItems) {
    const text = item?.itemContent?.content || "";

    if (sensitivePatterns.test(text)) {
      alerts.push({
        docId,
        pageId,
        type: "SENSITIVE_PAGE_CONTENT",
        severity: 8,
        message: `Sensitive content found on page '${pageName}'.`
      });
    }
  }

  return alerts;
}

};

module.exports = detectionService;

