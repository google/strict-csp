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
  enableTrustedTypes: false,
  enableUnsafeEval: false,
  enableTrustedTypesReportOnly: false,
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
      const { enableTrustedTypes, enableTrustedTypesReportOnly, enableUnsafeEval, reportUri } = this.options;
      var strictCspModule;
      if (enableTrustedTypes) {
        const trustedTypesModule = new strictCspLib.TrustedTypes(htmlPluginData.html, reportUri);
        trustedTypesModule.addTrustedTypes();
        if (enableTrustedTypesReportOnly) {
          // Pass through Trusted Types violations.
          trustedTypesModule.addReportOnlyMode();
        } else {
          // Still let the browser block Trusted Types violations but send the reports to the endpoint.
          trustedTypesModule.addReporterScript();
        }
        strictCspModule = trustedTypesModule.getStrictCspModule();
      } else {
        strictCspModule = new strictCspLib.StrictCsp(htmlPluginData.html);
      }
      strictCspModule.refactorSourcedScriptsForHashBasedCsp(enableTrustedTypes);
      const scriptHashes = strictCspModule.hashAllInlineScripts();
      const strictCsp = strictCspLib.StrictCsp.getStrictCsp(scriptHashes, {
        enableBrowserFallbacks: true,
        enableTrustedTypes,
        enableUnsafeEval,
      });
      strictCspModule.addMetaTag(strictCsp);
      htmlPluginData.html = strictCspModule.serializeDom();
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
