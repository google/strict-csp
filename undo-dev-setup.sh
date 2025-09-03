#!/bin/bash

cd strict-csp-html-webpack-plugin && npm unlink 'strict-csp' && cd ..
cd strict-csp && rm -rf node_modules && cd ..
cd strict-csp-html-webpack-plugin && rm -rf node_modules && cd ..