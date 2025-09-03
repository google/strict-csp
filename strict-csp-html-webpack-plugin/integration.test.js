const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const cheerio = require('cheerio');
const config = require('./test-fixture/webpack.config.js');

describe('StrictCspHtmlWebpackPlugin Integration Test', () => {
  it('should build successfully and the output should match the snapshot', (done) => {
    webpack(config, (err, stats) => {
      if (err) {
        return done(err);
      }
      if (stats.hasErrors()) {
        return done(new Error(stats.toJson().errors.map(e => e.message).join('\n')));
      }

      const outputFile = path.resolve(__dirname, 'test-fixture/dist/index.html');
      const outputHtml = fs.readFileSync(outputFile, 'utf8');
      const $ = cheerio.load(outputHtml);

      // 1. Check for the CSP meta tag.
      const metaTag = $('meta[http-equiv="Content-Security-Policy"]');
      expect(metaTag.length).toBe(1);

      // 2. Check that the CSP content contains a hash.
      const cspContent = metaTag.attr('content');
      expect(cspContent).toContain(`'sha256-`);

      // 3. Check for the loader script.
      const loaderScript = $('script:not([src])').html();
      expect(loaderScript).toContain('var scripts =');
      expect(loaderScript).toContain(`document.createElement('script')`);

      // 4. Finally, match the whole output against the snapshot.
      expect(outputHtml).toMatchSnapshot();
      done();
    });
  });
});
