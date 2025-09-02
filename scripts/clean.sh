#!/usr/bin/env bash

set -euo pipefail

# remove node_modules recursively
find . -name "node_modules" -type d -exec rm -rf {} +

# remove dist recursively
find . -name "dist" -type d -exec rm -rf {} +
