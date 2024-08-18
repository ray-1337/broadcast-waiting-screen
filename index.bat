@echo off
pnpm concurrently "pnpm start" "pnpm node ./medialive/start.js"
pause