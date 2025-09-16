# strict-csp

[Available on npm](https://www.npmjs.com/package/strict-csp)

⚠️ This is experimental. Make sure to check [what's not supported](https://github.com/google/strict-csp/issues?q=is%3Aissue+is%3Aopen+label%3Afeature).

## What this library does: defense-in-depth against XSS 🛡

_💡 Are you using webpack? Head over to [strict-csp-html-webpack-plugin](https://github.com/google/strict-csp/tree/main/strict-csp-html-webpack-plugin) instead. It uses this library under the hood to generate a CSP you can use in your webpack project!_

Cross-site scripting (XSS)—the ability to inject malicious scripts into a web application—has been one of the biggest web security vulnerabilities for over a decade.

strict-csp is a **bundler-agnostic** library that helps protect your single-page application against XSS attacks. It does so by generating a [strict, hash-based Content-Security-Policy (CSP)](https://web.dev/strict-csp) for your web application.

A strict CSP helps protect your site against XSS by preventing browsers from executing malicious scripts.

## Usage

This library offers two primary workflows for applying a strict CSP.

### Workflow 1: HTTP Header (Recommended)

The recommended and most secure approach is to set the CSP as an HTTP response header. The `.process()` method returns both the modified HTML and the CSP string needed for the header.

```javascript
// Let's say `htmlString` is your SPA's html as a string.
const processor = new StrictCsp(htmlString, {
  // Configuration options go here
  browserFallbacks: true,
});

// Process the HTML and generate the CSP.
const { html, csp } = processor.process();

// In your server:
// 1. Set the CSP as an HTTP Header.
// response.setHeader('Content-Security-Policy', csp);
// 2. Serve the modified HTML.
// response.send(html);
```

### Workflow 2: Meta Tag (Alternative)

If you cannot set HTTP headers, you can inject the CSP into a `<meta>` tag.

```javascript
const processor = new StrictCsp(htmlString);

// 1. Process the HTML to get the CSP string.
// (We ignore the 'html' returned here as it will be outdated).
const { csp } = processor.process();

// 2. Add the meta tag and get the final HTML.
const finalHtml = processor.serializeDomWithStrictCspMetaTag(csp);

// Serve the finalHtml.
```

## Example with Trusted Types

You can also use this library to configure [Trusted Types](https://web.dev/trusted-types) and set up violation reporting. The `.process()` method automatically handles injecting the necessary reporting scripts into the HTML and adding the required directives to the CSP.

```javascript
const processor = new StrictCsp(htmlString, {
  // Enable Trusted Types in report-only mode
  trustedTypes: 'report-only',
  // Specify an endpoint for violation reports
  reportUri: 'https://your-reporting-endpoint.com/report',
});

const { html, csp } = processor.process();

// The `html` now contains the TT reporting scripts.
// The `csp` now contains the 'require-trusted-types-for' directive.
```

**Note on Report-Only Mode:** The `trustedTypes: 'report-only'` option works by injecting a script that simulates this mode on the client-side by creating a **default policy** (`trustedTypes.createPolicy('default', ...)`). This policy intercepts calls to dangerous DOM sinks, reports violations, but ultimately allows them to proceed. This is especially useful for static deployments (e.g., with a meta tag) where you cannot set the standard `Content-Security-Policy-Report-Only` HTTP header.

## Configuration Options

You can pass a configuration object to the `StrictCsp` constructor:

| Option | Type | What it does |
| :--- | :--- | :--- |
| `browserFallbacks` | `boolean` | (Default: `true`) When `true`, enables fallbacks for older browsers. This does not weaken the policy for modern browsers. |
| `trustedTypes` | `boolean` \| `'report-only'` | (Default: `false`) When `true`, enforces [Trusted Types](https://web.dev/trusted-types). When `'report-only'`, it enables violation reporting without enforcement. |
| `reportUri` | `string` | A URL where CSP and Trusted Types violation reports should be sent. |
| `unsafeEval` | `boolean` | (Default: `false`) When `true`, adds `'unsafe-eval'` to the policy in case you cannot remove all uses of `eval()`. |

## How does this library work?

Here's what the library does:

1. It finds all externally sourced scripts (`<script src="...">`) and replaces them with a single inline script that dynamically loads them.
2. It calculates the SHA-256 hash of this new loader script and all other inline scripts in the document.
3. It uses these hashes to generate a strict, hash-based CSP string.

This CSP efficiently helps protect your site against XSS.

**TL;DR: this library automates the steps to [add a hash-based CSP to your site](https://web.dev/strict-csp/#adopting-a-strict-csp).**

## Resources

- [Mitigate cross-site scripting (XSS) with a strict Content Security Policy (CSP)](https://web.dev/strict-csp/)