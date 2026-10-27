# Contributing / Contribuir

Issues, reproducible examples and PRs in Portuguese or English are welcome. Start with a concrete workflow and expected observable result. Do not submit private account data, credentials, customer diagrams or billing screenshots.

1. Use Node 22.13+ and `npm ci --ignore-scripts`.
2. Add a strict schema, clear description, explicit external-data boundary and output provenance.
3. Cover useful behavior and failure cases. No live AWS calls in the default tests.
4. Run `npm run typecheck`, `npm test`, `npm run build`, `npm audit --omit=dev`.
5. Update tool docs and changelog. When descriptions/schemas/outputs change, run `npm run examples`, `npm run contracts`, `npm run docs:tools`, rebuild and review the generated diffs before testing again. Keep new account operations local and opt-in.
6. Submit a focused PR with the problem, change, validation and limitations.

Adding a catalog entry does not justify marking an adapter tested. Include provider version, transport, exact tool exercised, date and sanitized evidence. Never claim the project is an official AWS service.
