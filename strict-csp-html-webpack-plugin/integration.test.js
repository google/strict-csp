const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const cheerio = require('cheerio');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const StrictCspHtmlWebpackPlugin = require(path.resolve(__dirname, './plugin.js'));

const runWebpack = (options, done) => {
  const config = {
    context: __dirname,
    mode: 'production',
    entry: {
      library1: './test-fixture/src/library1.js',
      app: './test-fixture/src/app.js',
      library2: './test-fixture/src/library2.js',
    },
    output: {
      path: path.resolve(__dirname, 'test-fixture/dist'),
      filename: '[name].bundle.js',
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './test-fixture/src/template.html',
      }),
      new StrictCspHtmlWebpackPlugin(HtmlWebpackPlugin, options),
    ],
  };

  webpack(config, (err, stats) => {
    if (err) {
      return done(err);
    }
    if (stats.hasErrors()) {
      return done(new Error(stats.toJson().errors.map((e) => e.message).join('\n')));
    }

    const outputFile = path.resolve(
      __dirname,
      'test-fixture/dist/index.html'
    );
    const outputHtml = fs.readFileSync(outputFile, 'utf8');
    done(null, outputHtml);
  });
};

describe('StrictCspHtmlWebpackPlugin Integration Test', () => {
  it('should build successfully without Trusted Types', (done) => {
    runWebpack({}, (err, outputHtml) => {
      if (err) return done(err);
      const $ = cheerio.load(outputHtml);
      const metaTag = $('meta[http-equiv="Content-Security-Policy"]');
      expect(metaTag.length).toBe(1);
      const cspContent = metaTag.attr('content');
      expect(cspContent).not.toContain('require-trusted-types-for');
      expect(outputHtml).toMatchSnapshot();
      done();
    });
  });

  it('should build successfully with Trusted Types enabled', (done) => {
    runWebpack({ trustedTypes: true }, (err, outputHtml) => {
      if (err) return done(err);
      const $ = cheerio.load(outputHtml);
      const metaTag = $('meta[http-equiv="Content-Security-Policy"]');
      expect(metaTag.length).toBe(1);
      const cspContent = metaTag.attr('content');
      expect(cspContent).toContain("require-trusted-types-for 'script'");
      expect(outputHtml).toMatchSnapshot();
      done();
    });
  });

  it('should build successfully with Trusted Types in report-only mode', (done) => {
    runWebpack(
      {
        trustedTypes: 'report-only',
        reportUri: 'https://example.com/report',
      },
      (err, outputHtml) => {
        if (err) return done(err);
        const $ = cheerio.load(outputHtml);
        const metaTag = $('meta[http-equiv="Content-Security-Policy"]');
        expect(metaTag.length).toBe(1);
        const cspContent = metaTag.attr('content');
        expect(cspContent).toContain("require-trusted-types-for 'script'");
        const loaderScript = $('script:not([src])').html();
        expect(loaderScript).toContain('const generateAndSendReport');
        expect(outputHtml).toMatchSnapshot();
        done();
      }
    );
  });
});