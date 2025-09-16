## Glossary

- CSP (content-security-policy): A layer of security that can be added to web apps as an HTTP header or meta tag. [Source: MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- Strict CSP: A specific set of CSP directives that has been identified as an effective and deployable mitigation against XSS (cross-site scripting). XSS is one of the most widespread sedcurity exploits. [Source: w3c](https://w3c.github.io/webappsec-csp/#strict-csp).
- SPA (single-page application): a web app implementation that loads a single web document. When different content needs to be shown, it updates the body content of that document. [Source: MDN](https://developer.mozilla.org/en-US/docs/Glossary/SPA)

## About this repo

Two codebases are in this repo:

- `strict-csp`: a **bundler-agnostic library**, that can be used to generate a CSP. It now includes support for Trusted Types and violation reporting. [Go to strict-csp](/strict-csp)

- `strict-csp-html-webpack-plugin`: a **webpack plugin** that configures a strict, hash-based CSP for an SPA. It uses the `strict-csp` library to form a CSP and hooks into the popular `HtmlWebpackPlugin` to set up this CSP as a `meta` HTML tag. [Go to strict-csp-html-webpack-plugin](/strict-csp-html-webpack-plugin)

Both of these are available as separate npm packages.

## Setup for development purposes

See [DEVELOP.md](/DEVELOP.md).

## Resources
* [Mitigate cross-site scripting (XSS) with a strict Content Security Policy (CSP)](https://web.dev/strict-csp/)
