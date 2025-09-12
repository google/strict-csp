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
import * as crypto from 'crypto';
import * as cheerio from 'cheerio';

/** CSP and Trusted Types configuration options. */
export interface StrictCspConfig {
  /**
   * Controls Trusted Types behavior.
   * - `true`: Enforces Trusted Types.
   * - `'report-only'`: Enables Trusted Types in report-only mode.
   * - `false` (default): Does not enable Trusted Types.
   */
  trustedTypes?: boolean | 'report-only';

  /** A URL where CSP and Trusted Types violation reports should be sent. */
  reportUri?: string;

  /**
   * If true, adds `'unsafe-eval'` to the policy. Should only be used as a last
   * resort. Defaults to `false`.
   */
  unsafeEval?: boolean;

  /**
   * If true, adds fallbacks for older browsers. Defaults to `true`.
   */
  browserFallbacks?: boolean;
}

/** Module for enabling a hash-based strict Content Security Policy. */
export class StrictCsp {
  private static readonly HASH_FUNCTION = 'sha256';
  private static readonly INLINE_SCRIPT_SELECTOR = 'script:not([src])';
  private static readonly SOURCED_SCRIPT_SELECTOR = 'script[src]';
  private $: cheerio.Root;
  private config: StrictCspConfig;
  private hashes: string[] = [];

  constructor(html: string, config: StrictCspConfig = {}) {
    this.$ = cheerio.load(html, {
      decodeEntities: false,
      _useHtmlParser2: true,
      xmlMode: false,
    });
    this.config = {
      trustedTypes: false,
      unsafeEval: false,
      browserFallbacks: true,
      ...config,
    };
  }

  serializeDom(): string {
    return this.$.root().html() || '';
  }

  /**
   * Processes the HTML based on the configuration provided in the constructor.
   * @returns An object containing the modified HTML and the generated CSP
   *     string.
   */
  process(): {html: string; csp: string} {
    this.refactorSourcedScripts_();
    this.hashes = this.hashAllInlineScripts_();

    if (this.config.trustedTypes) {
      this.configureTrustedTypes_();
    }

    const csp = this.generateCspString_();

    return {
      html: this.serializeDom(),
      csp: csp,
    };
  }

  private generateCspString_(): string {
    const hashes = this.hashes;
    const cspOptions = {
      enableBrowserFallbacks: this.config.browserFallbacks,
      enableTrustedTypes: !!this.config.trustedTypes,
      enableUnsafeEval: this.config.unsafeEval,
    };
    let strictCspTemplate = {
      // 'strict-dynamic' allows hashed scripts to create new scripts.
      'script-src': [`'strict-dynamic'`, ...hashes],
      // Restricts `object-src` to disable dangerous plugins like Flash.
      'object-src': [`'none'`],
      // Restricts `base-uri` to block the injection of `<base>` tags. This
      // prevents attackers from changing the locations of scripts loaded from
      // relative URLs.
      'base-uri': [`'self'`],
    };

    // Adds fallbacks for browsers not compatible to CSP3 and CSP2.
    // These fallbacks are ignored by modern browsers in presence of hashes,
    // and 'strict-dynamic'.
    if (cspOptions.enableBrowserFallbacks) {
      // Fallback for Safari. All modern browsers supporting strict-dynamic will
      // ignore the 'https:' fallback.
      strictCspTemplate['script-src'].push('https:');
      // 'unsafe-inline' is only ignored in presence of a hash or nonce.
      if (hashes.length > 0) {
        strictCspTemplate['script-src'].push(`'unsafe-inline'`);
      }
    }

    // If enabled, dangerous DOM sinks will only accept typed objects instead of
    // strings.
    if (cspOptions.enableTrustedTypes) {
      strictCspTemplate = {
        ...strictCspTemplate,
        ...{ 'require-trusted-types-for': [`'script'`] },
      };
    }

    // If enabled, `eval()`-calls will be allowed, making the policy slightly
    // less secure.
    if (cspOptions.enableUnsafeEval) {
      strictCspTemplate['script-src'].push(`'unsafe-eval'`);
    }

    return Object.entries(strictCspTemplate)
      .map(([directive, values]) => {
        return `${directive} ${values.join(' ')};`;
      })
      .join('');
  }

  /**
   * Configures Trusted Types by adding the necessary reporting scripts.
   */
  private configureTrustedTypes_(): void {
    if (this.config.trustedTypes === 'report-only') {
      const reportOnlyScript = StrictCsp.createReportOnlyModeScript(
        this.config.reportUri
      );
      this.prependScriptToBody_(reportOnlyScript);
    } else {
      if (!this.config.reportUri) {
        this.appendScriptToBody_(
          `console.error("No reportUri provided. Trusted Types reports will not be sent to a remote endpoint.")`
        );
        return;
      }
      const reporterScript = StrictCsp.createReporterScript(
        this.config.reportUri
      );
      this.appendScriptToBody_(reporterScript);
    }
  }

  /**
   * Enables a CSP via a meta tag at the beginning of the document.
   * Warning: It's recommended to set CSP as HTTP response header instead of
   * using a meta tag. Injections before the meta tag will not be covered by CSP
   * and meta tags don't support CSP in report-only mode.
   *
   * @param csp A Content Security Policy string.
   */
  addMetaTag(csp: string): void {
    let metaTag = this.$('meta[http-equiv="Content-Security-Policy"]');
    if (!metaTag.length) {
      metaTag = cheerio.load('<meta http-equiv="Content-Security-Policy">')(
        'meta'
      );
      metaTag.prependTo(this.$('head'));
    }
    metaTag.attr('content', csp);
  }

  /**
   * Creates a new script tag and adds it to the body element.
   *
   * @param script JS content of the script to be added.
   */
  private appendScriptToBody_(script: string): void {
    const newScript = cheerio.load('<script>')('script');
    newScript.text(script);
    newScript.appendTo(this.$('body'));
  }

  /**
   * Creates a new script tag and adds it to the body element.
   *
   * @param script JS content of the script to be added.
   */
  private prependScriptToBody_(script: string): void {
    const newScript = cheerio.load('<script>')('script');
    newScript.text(script);
    newScript.prependTo(this.$('body'));
  }

  /**
   * Replaces all sourced scripts with a single inline script that can be hashed
   */
  private refactorSourcedScripts_(): void {
    const scriptInfoList = this.$(StrictCsp.SOURCED_SCRIPT_SELECTOR)
      .get()
      .map((script) => {
        const src = this.$(script).attr('src');
        const type = this.$(script).attr('type');
        this.$(script).remove();
        return { src, type };
      })
      .filter(
        (info): info is { src: string; type: string | undefined } =>
          info.src !== undefined
      );

    const loaderScript = StrictCsp.createLoaderScript(
      scriptInfoList,
      !!this.config.trustedTypes
    );
    if (!loaderScript) {
      return;
    }

    this.appendScriptToBody_(loaderScript);
  }

  /**
   * Returns a list of hashes of all inline scripts found in the HTML document.
   */
  private hashAllInlineScripts_(): string[] {
    return this.$(StrictCsp.INLINE_SCRIPT_SELECTOR)
      .map((i, elem) => StrictCsp.hashInlineScript(this.$(elem).html() || ''))
      .get();
  }

  /**
   * Returns JS code for dynamically loading sourced (external) scripts.
   * @param scriptInfoList A list of objects containing src and type for scripts that should be loaded
   */
  private static createLoaderScript(
    scriptInfoList: { src: string; type?: string }[],
    enableTrustedTypes = false
  ): string | undefined {
    if (!scriptInfoList.length) {
      return undefined;
    }
    return enableTrustedTypes
      ? `
    var scripts = ${JSON.stringify(scriptInfoList)};
    var scriptSrcs = new Set(scripts.map(function(s) { return s.src; }));
    var policy = self.trustedTypes && self.trustedTypes.createPolicy ?
      self.trustedTypes.createPolicy('strict-csp#loader', {createScriptURL: function(u) {
        return scriptSrcs.has(u) ? u : null;
      }}) : { createScriptURL: function(u) { return u; } };
    scripts.forEach(function(scriptInfo) {
      var s = document.createElement('script');
      s.src = policy.createScriptURL(scriptInfo.src);
      if (scriptInfo.type) {
        s.type = scriptInfo.type;
      }
      s.async = false; // preserve execution order.
      document.body.appendChild(s);
    });
    `
      : `
    var scripts = ${JSON.stringify(scriptInfoList)};
    scripts.forEach(function(scriptInfo) {
      var s = document.createElement('script');
      s.src = scriptInfo.src;
      if (scriptInfo.type) {
        s.type = scriptInfo.type;
      }
      s.async = false; // preserve execution order.
      document.body.appendChild(s);
    });
    `;
  }

  /**
   * Calculates a CSP compatible hash of an inline script.
   * @param scriptText Text between opening and closing script tag. Has to
   *     include whitespaces and newlines!
   */
  static hashInlineScript(scriptText: string): string {
    const hash = crypto
      .createHash(StrictCsp.HASH_FUNCTION)
      .update(scriptText, 'utf-8')
      .digest('base64');
    return `'${StrictCsp.HASH_FUNCTION}-${hash}'`;
  }

  /**
   * Returns the JS code for sending Trusted Types violation reports to the specified Report URI.
   * @param reportUri
   * @returns
   */
  private static createReporterScript(reportUri: string): string {
    return `
    if (self.ReportingObserver) {
      const options = {
        types: ["csp-violation"],
        buffered: true,
      };
      const observer = new ReportingObserver(function(reports, observer) {
        reports.forEach(function(report) {
          if (report.body.blockedURL === 'trusted-types-sink') {
            const data = JSON.stringify({'csp-report': {
              'document-uri': report.body.documentURL,
              'referrer': report.body.referrer,
              'violated-directive': report.body.effectiveDirective,
              'effective-directive': report.body.effectiveDirective,
              'original-policy': report.body.originalPolicy,
              'disposition': report.body.disposition,
              'blocked-uri': report.body.blockedURL,
              'line-number': report.body.lineNumber,
              'column-number': report.body.columnNumber,
              'status-code': report.body.statusCode,
              'source-file': report.body.sourceFile,
              'script-sample': report.body.sample
            }});
            const blob = new Blob([data], {'Content-Type': 'application/json'});
            if (self.navigator && self.navigator.sendBeacon) {
              navigator.sendBeacon('${reportUri}', blob);
            } else {
              // Technically no need to worry about this because all browsers that support ReportingObserver support sendBeacon
              const req = new XMLHttpRequest();
              req.open('POST', '${reportUri}');
              req.setRequestHeader('Content-Type', 'application/json');
              req.send(data);
            }
          }
        });
      }, options);
      observer.observe();
    } else {
      console.error('No ReportingObserver API present. Content Security Policy and Trusted Types reports will not be sent to the reporting URI.');
    }
    `;
  }

  /**
   * Returns the JS code for using the default policy to
   * @param reportUri
   * @returns
   */
  private static createReportOnlyModeScript(
    reportUri: string | undefined
  ): string {
    var reportingScript;
    if (reportUri) {
      reportingScript = `
      const generateAndSendReport = function(sample) {
        const stack = (new Error()).stack;
        const regex = /([^ \()]+):(\d+):(\d+)/g;
        let match;
        let lastMatch;
        while ((match = regex.exec(stack)) !== null) {
          lastMatch = match;
        }
        const data = JSON.stringify({'csp-report': {
          'document-uri': window.location.href,
          'referrer': '', // No way of knowning this.
          'violated-directive': 'require-trusted-types-for',
          'effective-directive': 'require-trusted-types-for',
          'original-policy': '', // No way of knowing this
          'disposition': 'report',
          'blocked-uri': 'trusted-types-sink',
          'line-number': lastMatch && lastMatch[2] ? +lastMatch[2] : 0,
          'column-number': lastMatch && lastMatch[3] ? +lastMatch[3] : 0,
          'source-file': lastMatch && lastMatch[1] ? lastMatch[1] : '',
          'status-code': 0, // No way of knowing this.
          'script-sample': sample
        }});
        const blob = new Blob([data], {'Content-Type': 'application/json'});
        if (self.navigator && self.navigator.sendBeacon) {
          navigator.sendBeacon('${reportUri}', blob);
        }
        return data;
      };
      `;
    } else {
      reportingScript = `
      console.error("No reportUri was specified. Reports will not be sent to the remote endpoint.");
      const generateAndSendReport = function(sample) {};
      `;
    }
    return `
    if (self.trustedTypes && !self.trustedTypes.defaultPolicy) {
      ${reportingScript}
      self.trustedTypes.createPolicy('default', {
        createHTML: function(s) {
          console.error("[Report Only] Uncaught TypeError: This document requires 'TrustedHTML' assignment: " + s);
          generateAndSendReport('Element innerHTML|' + s);
          return s;
        },
        createScript: function(s) {
          console.error("[Report Only] Uncaught TypeError: This document requires 'TrustedScript' assignment: " + s);
          generateAndSendReport('HTMLScriptElement text|' + s);
          return s;
        },
        createScriptURL: function(s) {
          console.error("[Report Only] Uncaught TypeError: This document requires 'TrustedScriptURL' assignment: " + s);
          generateAndSendReport('HTMLScriptElement src|' + s);
          return s;
        },
      });
    }
    `;
  }
}