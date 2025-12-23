const codaClient = require('../config/codaClient');

async function fixSharing(docId) {
  await codaClient.removePublicAccess(docId); 
  return { message: "Public sharing removed" };
}

async function deleteDocument(docId) {
  await codaClient.deleteDoc(docId);
  return { message: "Document deleted" };
}

module.exports = { fixSharing, deleteDocument };

