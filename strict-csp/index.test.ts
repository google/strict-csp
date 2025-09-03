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
    // Intentionally incorrect hash to be updated by the test runner's output.
    const expectedHash = `'sha256-VrXiRzNabZlVUzrPKgON5EtG2BuRUP8wULVkbIOqqkA='`;
    const result = StrictCsp.hashInlineScript(scriptContent);
    expect(result).toBe(expectedHash);
  });
});

describe('StrictCsp.getStrictCsp', () => {
    it('should generate a valid strict CSP policy', () => {
        const hashes = [`'sha256-someHash123='`, `'sha256-anotherHash456='`];
        const result = StrictCsp.getStrictCsp(hashes, {
            enableBrowserFallbacks: true,
            enableTrustedTypes: false,
            enableUnsafeEval: false,
        });

        // Using a snapshot for a more complex output
        expect(result).toMatchSnapshot();
    });

    it('should generate a CSP with no hashes', () => {
        const result = StrictCsp.getStrictCsp([], {
            enableBrowserFallbacks: true,
            enableTrustedTypes: false,
            enableUnsafeEval: false,
        });
        expect(result).toMatchSnapshot();
    });

    it('should generate a CSP with browser fallbacks disabled', () => {
        const hashes = [`'sha256-someHash123='`];
        const result = StrictCsp.getStrictCsp(hashes, {
            enableBrowserFallbacks: false,
        });
        expect(result).toMatchSnapshot();
    });

    it('should generate a CSP with Trusted Types enabled', () => {
        const hashes = [`'sha256-someHash123='`];
        const result = StrictCsp.getStrictCsp(hashes, {
            enableTrustedTypes: true,
        });
        expect(result).toMatchSnapshot();
    });

    it('should generate a CSP with unsafe-eval enabled', () => {
        const hashes = [`'sha256-someHash123='`];
        const result = StrictCsp.getStrictCsp(hashes, {
            enableUnsafeEval: true,
        });
        expect(result).toMatchSnapshot();
    });

    it('should generate a CSP with all options enabled', () => {
        const hashes = [`'sha256-someHash123='`];
        const result = StrictCsp.getStrictCsp(hashes, {
            enableBrowserFallbacks: true,
            enableTrustedTypes: true,
            enableUnsafeEval: true,
        });
        expect(result).toMatchSnapshot();
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

    // Follow the example usage from README.md
    const s = new StrictCsp(initialHtml);
    s.refactorSourcedScriptsForHashBasedCsp();
    const scriptHashes = s.hashAllInlineScripts();
    const strictCsp = StrictCsp.getStrictCsp(scriptHashes, {
      enableBrowserFallbacks: true,
    });
    s.addMetaTag(strictCsp);
    const finalHtml = s.serializeDom();

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

    const s = new StrictCsp(initialHtml);
    s.refactorSourcedScriptsForHashBasedCsp();
    const scriptHashes = s.hashAllInlineScripts();
    const strictCsp = StrictCsp.getStrictCsp(scriptHashes);
    s.addMetaTag(strictCsp);
    const finalHtml = s.serializeDom();

    expect(finalHtml).toMatchSnapshot();
  });
});
