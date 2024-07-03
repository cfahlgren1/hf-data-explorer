import * as duckdb from "@duckdb/duckdb-wasm"

export interface DuckDBClientConfig {
    views?: { [key: string]: string[] }
}

type SchemaField = {
    name: string
    type: string
}

function sanitizeViewName(name: string): string {
    // Replace invalid characters with underscores
    let sanitized = name.replace(/[^a-zA-Z0-9_]/g, "_")
    sanitized = sanitized.toLowerCase()

    return sanitized
}

export class DuckDBClient {
    private db: duckdb.AsyncDuckDB | null = null
    private currentConnection: duckdb.AsyncDuckDBConnection | null = null
    private currentResultSet: any = null
    private isQueryRunning: boolean = false
    private isCancelling: boolean = false

    constructor(private config: DuckDBClientConfig) {}

    async initialize(): Promise<void> {
        const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles()
        const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES)

        const worker_url = URL.createObjectURL(
            new Blob([`importScripts("${bundle.mainWorker!}");`], {
                type: "text/javascript"
            })
        )

        const worker = new Worker(worker_url)
        const logger = new duckdb.ConsoleLogger()
        this.db = new duckdb.AsyncDuckDB(logger, worker)
        await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker)
        URL.revokeObjectURL(worker_url)

        await this.loadConfig(this.config || {})
    }

    private async getConnection(): Promise<duckdb.AsyncDuckDBConnection> {
        if (!this.db) {
            throw new Error("Database not initialized")
        }
        if (!this.currentConnection) {
            this.currentConnection = await this.db.connect()
        }
        return this.currentConnection
    }

    async loadConfig(config: DuckDBClientConfig): Promise<void> {
        if (!this.db) {
            throw new Error("Database not initialized")
        }

        if (config.views) {
            const connection = await this.getConnection()
            try {
                const keywordsResult = await connection.query(
                    "SELECT keyword_name FROM duckdb_keywords() WHERE keyword_category = 'reserved';"
                )
                const invalidKeywords = keywordsResult
                    .toArray()
                    .map((row) => row.keyword_name)

                for (const [viewName, filePaths] of Object.entries(
                    config.views
                )) {
                    const filePathsString = filePaths
                        .map((path) => `'${path}'`)
                        .join(", ")

                    let sanitizedViewName = sanitizeViewName(viewName)

                    // Check if the sanitized name is a duckdb reserved keyword
                    if (invalidKeywords.includes(sanitizedViewName)) {
                        sanitizedViewName += "_view"
                    }

                    await connection.query(
                        `CREATE OR REPLACE VIEW ${sanitizedViewName} AS SELECT * FROM read_parquet([${filePathsString}]);`
                    )
                }
            } finally {
                await connection.close()
                this.currentConnection = null
            }
        }
    }

    async queryStream(query: string, params?: any[]) {
        if (this.isQueryRunning) {
            throw new Error("A query is already running")
        }

        this.isQueryRunning = true
        const conn = await this.getConnection()

        try {
            let resultSet
            if (params?.length) {
                const stmt = await conn.prepare(query)
                resultSet = await stmt.send(...params)
            } else {
                resultSet = await conn.send(query)
            }

            this.currentResultSet = resultSet

            // Read the first batch to get the schema
            const firstBatch = await resultSet.next()
            let schema: SchemaField[] = []

            if (firstBatch?.value?.schema) {
                schema = firstBatch.value.schema.fields.map(
                    ({ name, type }) => ({ name, type })
                )
            }

            return {
                schema,
                async *readRows() {
                    if (firstBatch && !firstBatch.done) {
                        yield firstBatch.value
                            .toArray()
                            .map((row) => row.toJSON())
                    }

                    while (true) {
                        const batch = await resultSet.next()
                        if (batch.done) break
                        yield batch.value.toArray().map((row) => row.toJSON())
                    }
                }
            }
        } finally {
            this.isQueryRunning = false
        }
    }

    async cancelQuery(): Promise<void> {
        if (this.currentConnection && this.isQueryRunning) {
            this.isCancelling = true
            try {
                await this.currentConnection.cancelSent()
            } finally {
                // Clean up after cancellation
                await this.currentConnection.close()
                this.currentConnection = null
                this.isQueryRunning = false
                this.isCancelling = false
                this.currentResultSet = null
            }
        }
    }

    getQueryStatus(): { isRunning: boolean; isCancelling: boolean } {
        return {
            isRunning: this.isQueryRunning,
            isCancelling: this.isCancelling
        }
    }

    async close(): Promise<void> {
        // Close the current connection if it exists
        if (this.currentConnection) {
            await this.currentConnection.close()
            this.currentConnection = null
        }
        // Terminate the DuckDB instance if it exists
        if (this.db) {
            await this.db.terminate()
            this.db = null
        }
    }

    async getTables(): Promise<string[]> {
        if (!this.db) {
            throw new Error("Database not initialized")
        }

        const conn = await this.getConnection()
        try {
            const result = await conn.query("PRAGMA SHOW_TABLES")
            return result.toArray().map((row) => row.name as string)
        } finally {
            await this.currentConnection.close()
            this.currentConnection = null
        }
    }
}
