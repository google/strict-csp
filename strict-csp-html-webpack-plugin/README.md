# strict-csp-html-webpack-plugin

[Available on npm](https://www.npmjs.com/package/strict-csp-html-webpack-plugin).

⚠️ This is experimental. Do not use in production. Make sure to check [what's not supported](https://github.com/google/strict-csp/issues?q=is%3Aissue+is%3Aopen+label%3Afeature).

## What this plugin does: defense-in-depth against XSS 🛡


Cross-site scripting (XSS)—the ability to inject malicious scripts into a web application—has been one of the biggest web security vulnerabilities for over a decade.

strict-csp-html-webpack-plugin helps protect your single-page application against XSS attacks. It does so by configuring a [strict Content-Security-Policy (CSP)](https://web.dev/strict-csp) for your application. 

A strict CSP, added in the form of a meta tag, looks as follows:

```html
<meta 
      http-equiv="Content-Security-Policy" 
      content="script-src 'sha256-3uCZp...oQxI=' 'strict-dynamic'; style-src 'self' 'unsafe-inline'"
</meta>
```

## Quickstart 🚀

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


