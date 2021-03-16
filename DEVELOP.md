# DEVELOP

## Quickstart

1. Dev setup:

   ```bash
   sh ./scripts/dev-setup.sh
   ```

   This will create all local symlinks you need (see details below).

2. Startup:

   ```bash
   cd react-app && npm start && cd ..
   ```

✨ That's it. Open `http://localhost:{port}` and inspect `index.html`. Observe that `index.html` includes a valid hash-based CSP in a meta tag.

### Developing

#### When changing the library code (strict-csp)

🚨 Every time you change strict-csp code, you need to **rebuild it** so that the changes are picked up by the strict csp webpack plugin. Build like this:

`cd strict-csp && npm run-script build && cd ..`

Note:

- If you've added new dependencies to strict-csp, also run `npm install` (as follows: `cd strict-csp && npm i && npm run-script build && cd ..`).
- No need to `link` again here, this only needs to be done once.

#### When changing the plugin code

Every time you change the plugin code (`strictCspWebpackPlugin.js`), you need to restart the react app with `npm start` to see the changes.

## How the development setup works

To develop this plugin locally, you need to create the symlinks as illustrated below. `dev-setup.sh` does this for you.
`undo-dev-setup.sh` undoes this (this is convenient if you need to debug `dev-setup.sh` itself).

![image](https://user-images.githubusercontent.com/9762897/110346153-91087180-802f-11eb-96f9-fa79e9068dfb.png)

Note: the **exact `html-webpack-plugin` instance** that `strict-csp-webpack-plugin` hooks into **must be referenced** by `strict-csp-webpack-plugin`, otherwise the hooking won't work and the CSP won't be set. It's a known thing with webpack and it's also the way other plugins that use `html-webpack-plugin` work. [Details](https://github.com/jantimon/html-webpack-plugin/issues/1091).

## What `dev-setup.sh` does

### Link the library strict-csp where needed

- Builds the library, so that there's something to link to:
  `cd strict-csp && npm install && npm run-script build && cd ..`
- Creates a link to the library:
  `cd strict-csp && npm link && cd ..`
- Link sto the library where needed:
  `cd strict-csp-html-webpack-plugin && npm link 'strict-csp' && cd ..`

This is done only once.

🧐 Troubleshooting: if you get an error like "linked library not found", ensure that `main` in strict-csp's `package.json` points to a file that exists.

### Links the plugin strict-csp-webpack-plugin where needed

- Creates a link to the plugin:
  `cd strict-csp-html-webpack-plugin && npm link && cd ..`
- (only once) Installs the dependencies in the React app, so that we can link to the plugin:
  `cd react-app && npm install && cd ..`
- Links to the plugin where needed:
  `cd react-app && npm link 'strict-csp-html-webpack-plugin' && cd ..`

## To reset linking

`sh ./scripts/undo-dev-setup.sh`

## To troubleshoot individual linking issues

`npm uninstall`
`npm ls --depth=0 --link=true`
