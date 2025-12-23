const axios = require("axios");
require("dotenv").config();

const api = axios.create({
  baseURL: "https://coda.io/apis/v1",
  headers: {
    Authorization: `Bearer ${process.env.CODA_API_TOKEN}`,
    "Content-Type": "application/json"
  }
});


const codaClient = {
  async listDocuments() {
    try {
      const res = await api.get("/docs");
      return res.data.items;
    } catch (err) {
      console.error("❌ Error fetching documents:", err.response?.data || err);
      return [];
    }
  },

  async listTables(docId) {
    try {
      const res = await api.get(`/docs/${docId}/tables`);
      return res.data.items;
    } catch (err) {
      console.error(`❌ Error fetching tables for ${docId}:`, err.response?.data || err);
      return [];
    }
  },

  async listRows(docId, tableId) {
    try {
      const res = await api.get(`/docs/${docId}/tables/${tableId}/rows?limit=20`);
      const page = req.query.page || 1;
      const limit = req.query.limit || 50;

      const start = (page-1)* limit;
      const end = start + limit;

      const answer = res.data.items.slice(start, end);
      return answer;
    } catch (err) {
      console.error(`❌ Error fetching rows for table ${tableId}:`, err.response?.data || err);
      return [];
    }
  },

  async listPages(docId) {
    try {
      const res = await api.get(`/docs/${docId}/pages`);
      return res.data.items;
    } catch (err) {
      console.error(`❌ Error fetching pages for ${docId}:`, err.response?.data || err);
      return [];
    }
  },

  async exportPage(docId, pageId) {
    try {
      const res = await api.get(`/docs/${docId}/pages/${pageId}/export/html`);
      return res.data;
    } catch (err) {
      console.error(`❌ Error exporting HTML for page ${pageId}:`, err.response?.data || err);
      return "";
    }
  },

  async listPermissions(docId) {
    try {
      const res = await api.get(`/docs/${docId}/acl/permissions`);
      return res.data.items;
    } catch (err) {
      console.error(`❌ Error fetching permissions for ${docId}:`, err.response?.data || err);
      return [];
    }
  },

  async removePublicAccess(docId) {
    try {
      const res = await api.get(`/docs/${docId}/acl/permissions`);
      const permissions = res.data.items || [];

      const publicPerm = permissions.find(
        (p) => p.access === "readOnly"
      );

      if (!publicPerm) {
        return { success: false, message: "No public access found on this document" };
      }

      await api.delete(`/docs/${docId}/acl/permissions/${publicPerm.id}`);

      return { success: true, message: "Public access removed successfully" };

    } catch (err) {
      console.error(`❌ Error removing public access for ${docId}:`, err.response?.data || err);
      return { success: false };
    }
  },


  async deleteDoc(docId) {
    try {
      await api.delete(`/docs/${docId}`);
      return { success: true, message: "Document deleted" };
    } catch (err) {
      console.error(`❌ Error deleting document ${docId}:`, err.response?.data || err);
      return { success: false };
    }
  },

  async getPageContent(docId, pageId, pageToken = null) {
  try {
    const res = await api.get(`/docs/${docId}/pages/${pageId}/content`, {
      params: pageToken ? { pageToken } : {}
    });

    return res.data;

  } catch (err) {
    console.error(`❌ Error fetching content for page ${pageId}:`, err.response?.data || err);
    return { items: [] };
  }
},

async getFullPageContent(docId, pageId) {
  let allItems = [];
  let pageToken = null;

  while (true) {
    const res = await this.getPageContent(docId, pageId, pageToken);

    allItems = allItems.concat(res.items);

    if (!res.nextPageToken) break;
    pageToken = res.nextPageToken;
  }

  return allItems;
}


};

module.exports = codaClient;
