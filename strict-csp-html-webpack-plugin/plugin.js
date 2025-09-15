/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const strictCspLib = require('strict-csp');

const defaultOptions = {
  enabled: true,
  trustedTypes: false,
  unsafeEval: false,
  reportUri: '',
};

class StrictCspHtmlWebpackPlugin {
  /**
   *
   * @param {object} options Additional options for this module.
   */
  constructor(htmlWebpackPlugin, options = {}) {
    this.htmlWebpackPlugin = htmlWebpackPlugin;
    this.options = { ...defaultOptions, ...options };
  }

  /**
   * Processes HtmlWebpackPlugin's html data by adding the CSP
   * @param htmlPluginData
   * @param compileCb
   */
  processCsp(compilation, htmlPluginData, compileCb) {
    if (this.options.enabled) {
      const {
        trustedTypes,
        enableTrustedTypes,
        enableTrustedTypesReportOnly,
        enableUnsafeEval,
        reportUri,
      } = this.options;

      const processor = new strictCspLib.StrictCsp(htmlPluginData.html, {
        trustedTypes:
          enableTrustedTypesReportOnly || trustedTypes === 'report-only'
            ? 'report-only'
            : enableTrustedTypes || trustedTypes,
        unsafeEval: enableUnsafeEval,
        reportUri: reportUri,
        browserFallbacks: true, // Fallbacks are always enabled in the plugin
      });

      const { csp } = processor.process();
      htmlPluginData.html = processor.serializeDomWithStrictCspMetaTag(csp);
    }

    return compileCb(null, htmlPluginData);
  }

  /**
   * Hooks into webpack to collect assets and hash them, build the policy, and add it into our HTML template
   * @param compiler
   */
  apply(compiler) {
    compiler.hooks.compilation.tap(
      'StrictCspHtmlWebpackPlugin',
      (compilation) => {
        const hook =
          typeof this.htmlWebpackPlugin.getHooks === 'function'
            ? this.htmlWebpackPlugin.getHooks(compilation).beforeEmit // html-webpack-plugin v4 and above
            : compilation.hooks.htmlWebpackPluginAfterHtmlProcessing; // html-webpack-plugin v3

        hook.tapAsync(
          'StrictCspHtmlWebpackPlugin',
          this.processCsp.bind(this, compilation)
        );
      }
    );
  }
}

module.exports = StrictCspHtmlWebpackPlugin;
