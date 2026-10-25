## What and why

<!-- What changes, which problem it solves, link to the issue. -->

## Tests run

- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm audit --omit=dev`
- [ ] Other (describe):

<!-- Paste relevant output. No live AWS calls in the default tests. -->

## Docs updated

- [ ] `npm run docs:tools` (regenerates docs/tools.md) if a schema or description changed
- [ ] `node scripts/examples.mjs` if a tool output changed
- [ ] docs/tools-guide.md, CHANGELOG.md or other docs as needed
- [ ] Not applicable

## Limitations stated

- [ ] New or changed tools return a `limitations` field and their description states the boundary
- [ ] External calls, if any, are marked `external: true` with a fixed destination and timeout
- [ ] New account operations stay local and opt-in

## Safety

- [ ] No secrets, credentials, account IDs, customer data or billing screenshots in code, tests, fixtures or this description
