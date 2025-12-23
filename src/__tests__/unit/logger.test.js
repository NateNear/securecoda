const logger = require('../../../src/utils/logger');

describe('Logger Utility', () => {
  let consoleLogSpy;
  let consoleWarnSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('info', () => {
    test('should log info messages', () => {
      logger.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('[INFO]', 'Test message');
    });

    test('should handle multiple arguments', () => {
      logger.info('Message', 'arg1', 'arg2');

      expect(consoleLogSpy).toHaveBeenCalledWith('[INFO]', 'Message', 'arg1', 'arg2');
    });
  });

  describe('warn', () => {
    test('should log warning messages', () => {
      logger.warn('Warning message');

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN]', 'Warning message');
    });
  });

  describe('error', () => {
    test('should log error messages', () => {
      logger.error('Error message');

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR]', 'Error message');
    });

    test('should handle error objects', () => {
      const error = new Error('Test error');
      logger.error(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR]', error);
    });
  });
});
