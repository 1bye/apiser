export type ModelDialect = SqlLiteDialect | MySqlDialect | SingleStoreDialect | PgDialect | MssqlDialect | CockroachDbDialect;

export type SqlLiteDialect = "SQLite";
export type MySqlDialect = "MySQL";
export type SingleStoreDialect = "SingleStore";
export type PgDialect = "PostgreSQL";
export type MssqlDialect = "MSSQL";
export type CockroachDbDialect = "CockroachDB";

export type ReturningIdDialects = MySqlDialect | SingleStoreDialect | CockroachDbDialect;
