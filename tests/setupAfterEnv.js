// Increase timeout for all tests
jest.setTimeout(30000);

// Clean up after each test
afterEach(() => {
  jest.useRealTimers();
});
