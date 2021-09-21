## You may be looking for the webpack plugin >> Head over to the [plugin](https://github.com/google/strict-csp/tree/main/strict-csp-html-webpack-plugin).

⚠️⚠️⚠️⚠️

**This is an MVP. Work in Progress. 
Do not use in production!**

⚠️⚠️⚠️⚠️

## About this repo

Glossary:

- CSP: content-security-policy
- SPA: single-page application

Two codebases are in this repo:

- `strict-csp-html-webpack-plugin`: a **webpack plugin** that configures a strict, hash-based CSP for an SPA. It uses the `strict-csp` library to form a CSP and hooks into the famous `HtmlWebpackPlugin` to set up this CSP as a meta tag.
- `strict-csp`: a bundler-agnostic **library**, that's used as a dependency by `strict-csp-html-webpack-plugin`. It does most of the work of creating a CSP: adds the attributes, calculates the hashes. It creates a strict CSP of form `object-src 'none'; base-uri 'none'; script-src {HASH1} {HASH1} {HASH3} 'strict-dynamic';`.

## Setup for development purposes

See [DEVELOP.md](/DEVELOP.md).

## How this was built

The React app was built with create-react-app and then ejected.
