#!/bin/bash

cd strict-csp-html-webpack-plugin && npm unlink 'strict-csp' && cd ..
cd react-app && npm unlink 'strict-csp-html-webpack-plugin' && cd ..
cd strict-csp && rm -rf node_modules && cd ..
cd react-app && rm -rf node_modules && cd ..
cd strict-csp-html-webpack-plugin && rm -rf node_modules && cd ..