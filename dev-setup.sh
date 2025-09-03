#!/bin/bash

cd strict-csp && npm install && npm run-script build && cd ..
cd strict-csp && npm link && cd ..
cd strict-csp-html-webpack-plugin && npm link 'strict-csp' && cd ..
cd strict-csp-html-webpack-plugin && npm link && cd ..