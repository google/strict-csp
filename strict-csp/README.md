# strict-csp

[Available on npm](https://www.npmjs.com/package/strict-csp)

⚠️ This is experimental. Make sure to check [what's not supported](https://github.com/google/strict-csp/issues?q=is%3Aissue+is%3Aopen+label%3Afeature). Keep in mind that the `Report-Only` mode is not supported here since the policy is added via a meta tag (`Content-Security-Policy-Report-Only` is unfortunately not supported in meta tags).

## What this library does: defense-in-depth against XSS 🛡

*💡 Are you using webpack? Head over to [strict-csp-html-webpack-plugin](https://github.com/google/strict-csp/tree/main/strict-csp-html-webpack-plugin) instead. It uses this library under the hood to generate a CSP you can use in your webpack project!*

Cross-site scripting (XSS)—the ability to inject malicious scripts into a web application—has been one of the biggest web security vulnerabilities for over a decade.

strict-csp is a **bundler-agnostic** library that helps protect your single-page application against XSS attacks. It does so by configuring a [strict, hash-based Content-Security-Policy (CSP)](https://web.dev/strict-csp) for your web application. 

A strict CSP, added in the form of an HTML `meta` tag, looks as follows:

```html
<meta 
      http-equiv="Content-Security-Policy" 
      content="script-src 'sha256-3uCZp...oQxI=' 'strict-dynamic'; style-src 'self' 'unsafe-inline'">
</meta>
```

## Example usage

Let's say that `htmlString` is your SPA's html as a string.

```javascript
  const s = new StrictCsp(htmlString);
  // Refactor sourced scripts so that we can set a strict hash-based CSP
  s.refactorSourcedScriptsForHashBasedCsp();
  // Hash inline scripts from this html file, if there are any
  const scriptHashes = s.hashAllInlineScripts();
  // Generate a strict CSP as a string
  const strictCsp = StrictCsp.getStrictCsp(scriptHashes, false, true);
  // Set this CSP via a meta tag
  s.addMetaTag(strictCsp);
  const htmlStringWithCsp = s.serializeDom();
```

**TL;DR: this library automates the steps to [add a hash-based strict CSP to your site](https://web.dev/strict-csp/#adopting-a-strict-csp).**

## Arguments for `getStrictCsp`

By default, strict-csp will generate up a valid, strict, hash-based CSP.

You can use additional options to configure it:

| Option               | What it does                                                                                                            |
| -------------------- |  ----------------------------------------------------------------------------------------------------------------------- |
| `enableTrustedTypes` | When `true`, enables [trusted types](https://web.dev/trusted-types) for additional protections against DOM XSS attacks. |
| `enableBrowserFallbacks` | When `true`, enables fallbacks for older browsers. This does not weaken the policy. |
| `enableUnsafeEval`   | When `true`, enables [unsafe-eval](https://web.dev/strict-csp/) in case you cannot remove all uses of `eval()`.         |

## How does this library work?

Here's what the library does:
1. It replaces sourced scripts with an inline script that dynamically loads all sourced scripts. It calculates the hash of this script.
2. It calculates the hash of other inline scripts.
3. It creates a strict hash-based CSP, that includes the hashes calculated in (1) and (2). 

This CSP efficiently helps protect your site against XSS. This CSP is set in a `meta` tag. It looks like this: 

`script-src {HASH-INLINE-SCRIPT} 'strict-dynamic'; object-src 'none'; base-uri 'none';`. 

`{HASH-INLINE-SCRIPT}` is the hash on the inline script that dynamically loads all sourced scripts.

**TL;DR: this library automates the steps to [add a hash-based CSP to your site](https://web.dev/strict-csp/#:~:text=Option%20B%3A%20Hash-based%20CSP%20Response%20Header).**

## Resources
* [Mitigate cross-site scripting (XSS) with a strict Content Security Policy (CSP)](https://web.dev/strict-csp/)
