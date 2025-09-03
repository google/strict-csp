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
});
