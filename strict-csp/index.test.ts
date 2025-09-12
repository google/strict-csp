// strict-csp/index.test.ts
import { StrictCsp } from './index';
import * as crypto from 'crypto';

describe('StrictCsp.hashInlineScript', () => {
  it('should correctly calculate the sha256 hash of a simple script', () => {
    // Arrange
    const scriptContent = `console.log('hello');`;
    const expectedHash = crypto
      .createHash('sha256')
      .update(scriptContent, 'utf-8')
      .digest('base64');

    // Act
    const result = StrictCsp.hashInlineScript(scriptContent);

    // Assert
    expect(result).toBe(`'sha256-${expectedHash}'`);
  });

  it('should produce a consistent hash for an empty string', () => {
    const result = StrictCsp.hashInlineScript('');
    expect(result).toBe("'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='");
  });

  it('should correctly handle scripts with leading/trailing whitespace', () => {
    // Whitespace is significant in hashes
    const scriptContent = `
      alert('test');
    `;
    const expectedHash = crypto
      .createHash('sha256')
      .update(scriptContent, 'utf-8')
      .digest('base64');

    const result = StrictCsp.hashInlineScript(scriptContent);
    expect(result).toBe(`'sha256-${expectedHash}'`);
  });

  it('should produce a known hash for a specific script', () => {
    const scriptContent = `console.log('Hello, World!');`;
    const expectedHash = `'sha256-VrXiRzNabZlVUzrPKgON5EtG2BuRUP8wULVkbIOqqkA='`;
    const result = StrictCsp.hashInlineScript(scriptContent);
    expect(result).toBe(expectedHash);
  });
});

describe('StrictCsp.process() CSP generation', () => {
  it('should generate a valid strict CSP policy', () => {
    const html = `<script>console.log('inline');</script>`;
    const processor = new StrictCsp(html, {
      browserFallbacks: true,
      trustedTypes: false,
      unsafeEval: false,
    });
    const { csp } = processor.process();
    expect(csp).toMatchSnapshot();
  });

  it('should generate a CSP with no hashes for empty html', () => {
    const processor = new StrictCsp('', {
      browserFallbacks: true,
      trustedTypes: false,
      unsafeEval: false,
    });
    const { csp } = processor.process();
    expect(csp).toMatchSnapshot();
  });

  it('should generate a CSP with browser fallbacks disabled', () => {
    const html = `<script>console.log('inline');</script>`;
    const processor = new StrictCsp(html, {
      browserFallbacks: false,
    });
    const { csp } = processor.process();
    expect(csp).toMatchSnapshot();
  });

  it('should generate a CSP with Trusted Types enabled', () => {
    const html = `<script>console.log('inline');</script>`;
    const processor = new StrictCsp(html, {
      trustedTypes: true,
    });
    const { csp } = processor.process();
    expect(csp).toMatchSnapshot();
  });

  it('should generate a CSP with unsafe-eval enabled', () => {
    const html = `<script>console.log('inline');</script>`;
    const processor = new StrictCsp(html, {
      unsafeEval: true,
    });
    const { csp } = processor.process();
    expect(csp).toMatchSnapshot();
  });

  it('should generate a CSP with all options enabled', () => {
    const html = `<script>console.log('inline');</script>`;
    const processor = new StrictCsp(html, {
      browserFallbacks: true,
      trustedTypes: true,
      unsafeEval: true,
    });
    const { csp } = processor.process();
    expect(csp).toMatchSnapshot();
  });
});

describe('StrictCsp end-to-end serialization', () => {
  it('should correctly refactor and add a CSP meta tag to a document', () => {
    const initialHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test</title>
        </head>
        <body>
          <script src="main.js"></script>
          <script>console.log('inline script');</script>
        </body>
      </html>`;

    const processor = new StrictCsp(initialHtml, {
      browserFallbacks: true,
    });
    const { csp } = processor.process();
    processor.addMetaTag(csp);
    const finalHtml = processor.serializeDom();

    expect(finalHtml).toMatchSnapshot();
  });

  it('should correctly preserve the type="module" attribute', () => {
    const initialHtml = `
      <!DOCTYPE html>
      <html>
        <body>
          <script type="module" src="app.js"></script>
        </body>
      </html>`;

    const processor = new StrictCsp(initialHtml);
    const { csp } = processor.process();
    processor.addMetaTag(csp);
    const finalHtml = processor.serializeDom();

    expect(finalHtml).toMatchSnapshot();
  });
});

describe('StrictCsp with TrustedTypes', () => {
  const baseHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test</title>
        </head>
        <body>
        </body>
      </html>`;

  it('should add a reporter script', () => {
    const processor = new StrictCsp(baseHtml, {
      trustedTypes: true,
      reportUri: 'https://example.com/report',
    });
    const { html } = processor.process();
    expect(html).toMatchSnapshot();
  });

  it('should add a report-only script', () => {
    const processor = new StrictCsp(baseHtml, {
      trustedTypes: 'report-only',
      reportUri: 'https://example.com/report',
    });
    const { html } = processor.process();
    expect(html).toMatchSnapshot();
  });

  it('should handle a missing reportUri for the reporter script', () => {
    const processor = new StrictCsp(baseHtml, { trustedTypes: true });
    const { html } = processor.process();
    expect(html).toMatchSnapshot();
  });

  it('should handle a missing reportUri for the report-only script', () => {
    const processor = new StrictCsp(baseHtml, { trustedTypes: 'report-only' });
    const { html } = processor.process();
    expect(html).toMatchSnapshot();
  });

  it('should refactor scripts with Trusted Types enabled', () => {
    const initialHtml = `
      <!DOCTYPE html>
      <html>
        <body>
          <script src="app.js"></script>
        </body>
      </html>`;

    const processor = new StrictCsp(initialHtml, { trustedTypes: true });
    const { html } = processor.process();
    expect(html).toMatchSnapshot();
  });
});