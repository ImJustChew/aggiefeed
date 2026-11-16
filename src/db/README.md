# API cache database

`src/db/schema.ts` defines the SQLite schema. Drizzle Kit generates SQL and the Metro migration
bundle in `drizzle/`; the app applies those migrations before rendering routes.

After changing the schema, run:

```sh
bun run db:generate
```

Review and commit the generated SQL, migration bundle, journal, and snapshot with the schema change.
