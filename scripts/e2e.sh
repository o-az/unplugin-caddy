#!/usr/bin/env bash

set -euo pipefail

rm -rf dist

bun install
bun run build
bun check
bun typecheck
bun test