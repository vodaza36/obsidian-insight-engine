// E2E specific setup
beforeAll(async () => {
  // Add any e2e specific setup here
});

afterAll(async () => {
  // Force exit after all tests complete
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});
