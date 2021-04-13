**[Available on npm](https://www.npmjs.com/package/strict-csp-html-webpack-plugin).**

⚠️⚠️⚠️⚠️

This is an MVP. Do not use in production.

⚠️⚠️⚠️⚠️

strict-csp-html-webpack-plugin sets up a [strict Content-Security-Policy (CSP)](https://web.dev/strict-csp) to help protect your site against XSS attacks. It's a hash-based CSP.

**This plugin is best-suited for single-page applications. If you have server-side logics, use a nonce-based strict CSP instead.**

## What this plugin does

- It replaces sourced scripts with an inline script that dynamically loads all sourced scripts.
- It creates a strict hash-based CSP that efficiently helps protect your site against XSS. This CSP is set in a meta tag. It looks like this: `script-src {HASH-INLINE-SCRIPT} 'strict-dynamic'; object-src 'none'; base-uri 'none';`. `{HASH-INLINE-SCRIPT}` is the hash on the inline script that dynamically loads all sources scripts.

Note: if you have other inline scripts, the plugin takes care of them too: it adds their hash to the CSP to ensure they can be loaded.

### How it works

strict-csp-webpack-plugin uses the `strict-csp` library to form a strict CSP and hooks into `HtmlWebpackPlugin` to set up this CSP as a `meta` HTML tag.

### Not supported

- XML
- Custom configuration for the hashing algorithm (right now, only sha256)
- `prefetch` scripts

## Quickstart

### Step 1: install the plugin

`npm i --save strict-csp-html-webpack-plugin@beta`

(or with `yarn`)

### Step 2: Configure the plugin

In your site's or app's `webpack.config.js`:

```javascript
const HtmlWebpackPlugin = require('html-webpack-plugin');
const StrictCspHtmlWebpackPlugin = require('strict-csp-html-webpack-plugin');

module.exports = function (webpackEnv) {
  return {
    // ...
    plugins: [
      new HtmlWebpackPlugin(
        Object.assign(
          {}
          // ... HtmlWebpackPlugin config
        )
      ),
      new StrictCspHtmlWebpackPlugin(HtmlWebpackPlugin),
    ],
  };
};
```

⚠️ If you have a React app created with create-react-app, you'll need to `eject` in order to configure and use this plugin (because you need access to the webpack config).

### Step 3: Restart the app

- The app should run without errors (check the console).
- Observe that a `meta` HTML tag has been added to the application's `index.html`, and that one inline script now loads all scripts.

✨ Your app is now protected from many XSS attacks.

## Options

By default, strict-csp-html-webpack-plugin will set up a valid, strict, hash-based CSP.

You can use additional options to configure the plugin:

| Option               | Default | What it does                                                                                                            |
| -------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------- |
| `enabled`            | `true`  | When `true`, activates the plugin.                                                                                      |
| `enableTrustedTypes` | `true`  | When `true`, enables [trusted types](https://web.dev/trusted-types) for additional protections against DOM XSS attacks. |
