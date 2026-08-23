'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { renderVideoPageHtml } = require('./video-template');

test('renders the video element pointing at the VSL asset', () => {
  const html = renderVideoPageHtml({ whatsappUrl: 'https://wa.me/51999999999?text=hola' });
  assert.match(html, /src="\/mas-pacientes\/vsl\.mp4"/);
  assert.match(html, /poster="\/mas-pacientes\/vsl-poster\.jpg"/);
});

test('renders the WhatsApp CTA with the given whatsappUrl', () => {
  const html = renderVideoPageHtml({ whatsappUrl: 'https://wa.me/51999999999?text=hola' });
  assert.match(html, /href="https:\/\/wa\.me\/51999999999\?text=hola"/);
  assert.match(html, /Agendar mi Auditoría Gratis/);
});

test('escapes the whatsappUrl so it cannot inject markup', () => {
  const html = renderVideoPageHtml({ whatsappUrl: '"><script>alert(1)</script>' });
  assert.doesNotMatch(html, /<script>alert/);
});

test('marks the page noindex so it does not show up in search results', () => {
  const html = renderVideoPageHtml({ whatsappUrl: 'https://wa.me/51999999999?text=hola' });
  assert.match(html, /name="robots" content="noindex, nofollow"/);
});
