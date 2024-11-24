const { TextEncoder, TextDecoder } = require('util');
const { Readable } = require('stream');
const { ReadableStream } = require('stream/web');

Object.defineProperties(globalThis, {
    TextEncoder: { value: TextEncoder },
    TextDecoder: { value: TextDecoder },
    ReadableStream: { value: ReadableStream }
});

// Mock fetch for tests
global.fetch = jest.fn();

// Add other required web APIs
if (typeof global.structuredClone !== 'function') {
    global.structuredClone = obj => JSON.parse(JSON.stringify(obj));
}
