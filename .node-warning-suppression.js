// Suppress specific deprecation warnings
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning.name === 'DeprecationWarning' && warning.code === 'DEP0040') {
    return;
  }
  console.warn(warning);
});
