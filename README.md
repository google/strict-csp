⚠️⚠️⚠️⚠️

**This is an MVP. Work in Progress. 
Do not use in production!**

⚠️⚠️⚠️⚠️

Head over to the [plugin](https://github.com/google/strict-csp/tree/main/strict-csp-html-webpack-plugin)

# strict-csp-webpack-plugin 🦌

Glossary:

- CSP: content-security-policy
- SPA: single-page application

Three codebases are in this repo:

- `strict-csp-html-webpack-plugin`: a **webpack plugin** that configures a strict, hash-based CSP for an SPA. It uses the `strict-csp` library to form a CSP and hooks into the famous `HtmlWebpackPlugin` to set up this CSP as a meta tag.
- `strict-csp`: a bundler-agnostic **library**, that's used as a dependency by `strict-csp-html-webpack-plugin`. It does most of the work of creating a CSP: adds the attributes, calculates the hashes. It creates a strict CSP of form `object-src 'none'; base-uri 'none'; script-src {HASH1} {HASH1} {HASH3} 'strict-dynamic';`.
- `react-app`: a basic React **SPA**, ejected and bundled with webpack. It's used to test the functionality of `strict-csp-html-webpack-plugin`.

## Setup for development purposes

See [DEVELOP.md](/DEVELOP.md).

## How this was built

- The React app was built with create-react-app and then ejected.
- The code structure from `strictCspWebpackPlugin.js` was copied from [csp-html-webpack-plugin](https://github.com/slackhq/csp-html-webpack-plugin/issues/76).
