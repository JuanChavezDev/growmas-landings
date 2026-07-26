'use strict';

const zlib = require('node:zlib');

function encodeReportData(payload) {
  const json = JSON.stringify(payload);
  const compressed = zlib.gzipSync(Buffer.from(json, 'utf8'));
  return compressed.toString('base64url');
}

function decodeReportData(encoded) {
  const compressed = Buffer.from(encoded, 'base64url');
  const json = zlib.gunzipSync(compressed, { maxOutputLength: 64 * 1024 }).toString('utf8');
  return JSON.parse(json);
}

module.exports = { encodeReportData, decodeReportData };
