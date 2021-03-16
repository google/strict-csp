# strict-csp-webpack-plugin 🦌

Glossary:

- CSP: content-security-policy
- SPA: single-page application

## What it is

Three codebases are in this repo:

- `strict-csp-html-webpack-plugin`: a **webpack plugin** that configures a strict, hash-based CSP for an SPA. It uses the `strict-csp` library to form a CSP and hooks into the famous `HtmlWebpackPlugin` to set up this CSP as a meta tag.
- `strict-csp`: a bundler-agnostic **library**, that's used as a dependency by `strict-csp-html-webpack-plugin`. It does most of the work of creating a CSP: adds the attributes, calculates the hashes. It creates a strict CSP of form `object-src 'none'; base-uri 'none'; script-src {HASH1} {HASH1} {HASH3} 'strict-dynamic';`.
- `react-app`: a basic React **SPA**, ejected and bundled with webpack. It's used to test the functionality of `strict-csp-html-webpack-plugin`.

## How it works

![image](https://user-images.githubusercontent.com/9762897/110346153-91087180-802f-11eb-96f9-fa79e9068dfb.png)

Note: the **exact `html-webpack-plugin` instance** that `strict-csp-webpack-plugin` hooks into **must be referenced** by `strict-csp-webpack-plugin`, otherwise the hooking won't work and the CSP won't be set. It's a known thing with webpack and it's also the way other plugins that use `html-webpack-plugin` work. [Details](https://github.com/jantimon/html-webpack-plugin/issues/1091).

## Setup for development purposes

### (only once) Step 1/3: link the library strict-csp where needed

- Build the library, so that there's something to link to:
  `cd strict-csp && npm install && npm run-script build && cd ..`
- Create a link to the library:
  `cd strict-csp && npm link && cd ..`
- Link to the library where needed:
  `cd strict-csp-html-webpack-plugin && npm link 'strict-csp' && cd ..`

You need to do this only once.

🧐 Troubleshooting: if you get an error like "linked library not found", ensure that `main` in strict-csp's `package.json` points to a file that exists.

### (only once) Step 2/3: link the plugin strict-csp-webpack-plugin where needed

- Create a link to the plugin:
  `cd strict-csp-html-webpack-plugin && npm link && cd ..`
- (only once) Install the dependencies in the React app, so that we can link to the plugin:
  `cd react-app && npm install && cd ..`
- Link to the plugin where needed:
  `cd react-app && npm link 'strict-csp-html-webpack-plugin' && cd ..`

### Step 3/3: startup

- `cd react-app && npm start && cd ..`

✨ That's it.
Open `http://localhost:{port}` and inspect `index.html`. Observe that `index.html` includes a valid hash-based CSP in a meta tag.

### Developing

#### When changing the library code (strict-csp)

🚨 Every time you change strict-csp code, you need to **rebuild it** so that the changes are picked up by the strict csp webpack plugin. Build like this:

`cd strict-csp && npm run-script build && cd ..`

Note:

- If you've added new dependencies to strict-csp, also run `npm install` (as follows: `cd strict-csp && npm i && npm run-script build && cd ..`).
- No need to `link` again here, this only needs to be done once.

#### When changing the plugin code

Every time you change the plugin code (`strictCspWebpackPlugin.js`), you need to restart the react app with `npm start` to see the changes.

#### Tips

To troubleshoot linking issues:
`npm uninstall`
`npm ls --depth=0 --link=true`

## How this was built

- The React app was built with create-react-app and then ejected.
- The code structure from `strictCspWebpackPlugin.js` was copied from [csp-html-webpack-plugin](https://github.com/slackhq/csp-html-webpack-plugin/issues/76).
