const { fixSharing, deleteDocument } = require('../../../src/services/remediationService');
const codaClient = require('../../../src/config/codaClient');

jest.mock('../../../src/config/codaClient');

describe('Remediation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fixSharing', () => {
    test('should call removePublicAccess on codaClient', async () => {
      codaClient.removePublicAccess.mockResolvedValue({ success: true });

      const result = await fixSharing('doc1');

      expect(codaClient.removePublicAccess).toHaveBeenCalledWith('doc1');
      expect(result.message).toBe('Public sharing removed');
    });

    test('should return success message', async () => {
      codaClient.removePublicAccess.mockResolvedValue({ success: true });

      const result = await fixSharing('doc123');

      expect(result).toHaveProperty('message');
      expect(result.message).toContain('removed');
    });

    test('should handle different docIds', async () => {
      codaClient.removePublicAccess.mockResolvedValue({ success: true });

      await fixSharing('doc1');
      await fixSharing('doc2');
      await fixSharing('doc3');

      expect(codaClient.removePublicAccess).toHaveBeenCalledTimes(3);
      expect(codaClient.removePublicAccess).toHaveBeenNthCalledWith(1, 'doc1');
      expect(codaClient.removePublicAccess).toHaveBeenNthCalledWith(2, 'doc2');
      expect(codaClient.removePublicAccess).toHaveBeenNthCalledWith(3, 'doc3');
    });

    test('should handle API errors gracefully', async () => {
      const error = new Error('API Error');
      codaClient.removePublicAccess.mockRejectedValue(error);

      await expect(fixSharing('doc1')).rejects.toThrow('API Error');
    });
  });

  describe('deleteDocument', () => {
    test('should call deleteDoc on codaClient', async () => {
      codaClient.deleteDoc.mockResolvedValue({ success: true });

      const result = await deleteDocument('doc1');

      expect(codaClient.deleteDoc).toHaveBeenCalledWith('doc1');
      expect(result.message).toBe('Document deleted');
    });

    test('should return delete confirmation', async () => {
      codaClient.deleteDoc.mockResolvedValue({ success: true });

      const result = await deleteDocument('doc456');

      expect(result).toHaveProperty('message');
      expect(result.message).toContain('deleted');
    });

    test('should handle multiple deletion requests', async () => {
      codaClient.deleteDoc.mockResolvedValue({ success: true });

      await deleteDocument('doc1');
      await deleteDocument('doc2');

      expect(codaClient.deleteDoc).toHaveBeenCalledTimes(2);
      expect(codaClient.deleteDoc).toHaveBeenCalledWith('doc1');
      expect(codaClient.deleteDoc).toHaveBeenCalledWith('doc2');
    });

    test('should handle API errors', async () => {
      const error = new Error('Deletion failed');
      codaClient.deleteDoc.mockRejectedValue(error);

      await expect(deleteDocument('doc1')).rejects.toThrow('Deletion failed');
    });

    test('should handle malformed docIds', async () => {
      codaClient.deleteDoc.mockResolvedValue({ success: true });

      // Should not crash with unusual docIds
      await deleteDocument('');
      await deleteDocument(null);
      await deleteDocument(undefined);

      expect(codaClient.deleteDoc).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    test('should propagate codaClient errors', async () => {
      const networkError = new Error('Network timeout');
      codaClient.deleteDoc.mockRejectedValue(networkError);

      await expect(deleteDocument('doc1')).rejects.toThrow('Network timeout');
    });

    test('should handle both functions failing independently', async () => {
      codaClient.removePublicAccess.mockResolvedValue({ success: true });
      codaClient.deleteDoc.mockRejectedValue(new Error('Delete failed'));

      await fixSharing('doc1');
      await expect(deleteDocument('doc1')).rejects.toThrow('Delete failed');

      expect(codaClient.removePublicAccess).toHaveBeenCalledTimes(1);
      expect(codaClient.deleteDoc).toHaveBeenCalledTimes(1);
    });
  });

  describe('concurrency', () => {
    test('should handle concurrent operations', async () => {
      codaClient.removePublicAccess.mockResolvedValue({ success: true });
      codaClient.deleteDoc.mockResolvedValue({ success: true });

      const results = await Promise.all([
        fixSharing('doc1'),
        deleteDocument('doc2'),
        fixSharing('doc3'),
        deleteDocument('doc4')
      ]);

      expect(results).toHaveLength(4);
      expect(codaClient.removePublicAccess).toHaveBeenCalledTimes(2);
      expect(codaClient.deleteDoc).toHaveBeenCalledTimes(2);
    });
  });
});
