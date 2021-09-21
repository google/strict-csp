# strict-csp-html-webpack-plugin

[Available on npm](https://www.npmjs.com/package/strict-csp-html-webpack-plugin).

⚠️ This is experimental. Do not use in production. Make sure to check [what's not supported](https://github.com/google/strict-csp/issues?q=is%3Aissue+is%3Aopen+label%3Afeature). Keep in mind that the `Report-Only` mode is not supported here since the policy is added via a meta tag (`Content-Security-Policy-Report-Only` is unfortunatelt not supported in meta tags).

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



## FAQ

### Does this plugin protect my users from XSS attacks?

It helps, but it's not enough.

To protect your site from XSS, first of all, make sure to sanitize user input. Some frameworks do this by default.
A strict CSP is an extra security layer (also called "defense-in-depth" technique) that helps mitigate XSS attacks in case there's a sanitization bug, or other XSS bug, in your application or dependency. A strict CSP prevents the execution of malicious scripts in case they make it to your application.

### Where should I use this plugin?

This plugin is best-suited for single-page applications. 
If you have server-side logics, use a [nonce-based strict CSP](https://web.dev/strict-csp/#step-1:-decide-if-you-need-a-nonce-or-hash-based-csp) instead.

### How does this plugin differ from [csp-html-webpack-plugin](https://www.npmjs.com/package/csp-html-webpack-plugin)?

This plugin focuses on one thing: it sets up a [strict CSP](https://web.dev/strict-csp), that is, an efficient defense-in-depth mechanism against XSS attacks.

csp-html-webpack-plugin is more flexible. If you're using a CSP for other purposes than XSS mitigation, check out [csp-html-webpack-plugin](https://www.npmjs.com/package/csp-html-webpack-plugin).

### I already have a CSP on my site, with an allowlist*. Should I consider using this plugin?
*An allowlist CSP looks as follows: `default-src https://cdn.example https://site1.example https://site2.example;`.

It depends.

If you're using your allowlist CSP purely to load scripts coming from a certain origin, you can keep using it.

But if you're relying on your allowlist CSP for XSS protection: migrate to the more secure strict CSP approach, and consider using this plugin to help you do so.

Allowlist-based CSP are not recommended anymore for XSS protection, because don't efficiently protect sites against XSS attacks: [research has shown that they can be bypassed](https://research.google/pubs/pub45542/). 🥲
They're also harder to maintain!

Instead, strict CSPs are now recommended, because they're both [more secure and easier to maintain than allowlist-based CSPs](https://web.dev/strict-csp/#why-a-strict-csp-is-recommended-over-allowlist-csps).

This plugin automatically adds a strict CSP to your application.

### Can this plugin slow down my site?

See [issue #15](https://github.com/google/strict-csp/issues/15).

### How does a strict CSP compare with subresource integrity (SRI)?

SRI works well for static resources hosted on a CDN. 

But it won't work anymore if scripts are changing, e.g. if they contain custom data, for example a twitter plugin or google analytics: in this case, you can't really use SRI because you don't know if/when they'll change their scripts.

### Why should sourced scripts be replaced by an inline script?

A strict hash-based CSP allows certain scripts based on their hash.
However, Firefox ([bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1409200)) and Safari (bug) do not support hashes for externally-sourced scripts⏤only for inline scripts.
Because this plugin aims at setting a CSP that helps protect your users in all browsers, it first transforms your externally-sourced scripts into an inline script.

### How does this plugin work?

strict-csp-webpack-plugin uses the [strict-csp](https://github.com/google/strict-csp/tree/main/strict-csp) custom library to form a strict CSP and hooks into `HtmlWebpackPlugin` to set up this CSP as a `meta` HTML tag.

Here's what the plugin does:
- It replaces sourced scripts with an inline script that dynamically loads all sourced scripts. It calculates the hash of this script.
- It calculates the hash of other inline scripts
- It creates a strict hash-based CSP, that includes the hashes calculates in (1) and (2). This CSP efficiently helps protect your site against XSS. This CSP is set in a meta tag. It looks like this: `script-src {HASH-INLINE-SCRIPT} 'strict-dynamic'; object-src 'none'; base-uri 'none';`. `{HASH-INLINE-SCRIPT}` is the hash on the inline script that dynamically loads all sourced scripts.

It essentially automates the steps to [add a hash-based CSP to your site](https://web.dev/strict-csp/#:~:text=Option%20B%3A%20Hash-based%20CSP%20Response%20Header).


