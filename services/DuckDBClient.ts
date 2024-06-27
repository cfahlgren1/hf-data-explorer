import * as duckdb from "@duckdb/duckdb-wasm"

export interface DuckDBClientConfig {
    views?: { [key: string]: string[] }
}

type SchemaField = {
    name: string
    type: string
    databaseType: string
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

        if (this.config.views) {
            const connection = await this.db.connect()
            try {
                for (const [viewName, filePaths] of Object.entries(
                    this.config.views
                )) {
                    const filePathsString = filePaths
                        .map((path) => `'${path}'`)
                        .join(", ")
                    await connection.query(
                        `CREATE VIEW ${viewName} AS SELECT * FROM read_parquet([${filePathsString}]);`
                    )
                }
            } finally {
                await connection.close()
            }
        }
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

            if (firstBatch && !firstBatch.done && firstBatch.value.schema) {
                schema = firstBatch.value.schema.fields.map((field) => ({
                    name: field.name,
                    databaseType: String(field.type)
                }))
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
}
