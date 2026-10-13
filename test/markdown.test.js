import test from 'node:test';
import assert from 'node:assert/strict';
import { markdownToHtml } from '../public/markdown.js';

test('Markdown import converts supported headings, emphasis, and lists to editor HTML', () => {
  assert.equal(
    markdownToHtml('# Heading\n\nA **bold** and *italic* line.\n\n- first\n- second\n\n1. numbered'),
    '<h1>Heading</h1><p>A <strong>bold</strong> and <em>italic</em> line.</p><ul><li>first</li><li>second</li></ul><ol><li>numbered</li></ol>'
  );
});

test('Markdown import escapes raw HTML before creating editor markup', () => {
  assert.equal(markdownToHtml('<img src=x onerror=alert(1)>'), '<p>&lt;img src=x onerror=alert(1)&gt;</p>');
});
