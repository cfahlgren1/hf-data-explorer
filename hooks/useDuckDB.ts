import { getDataGridColumnType } from "@/utils/databaseUtils"
import * as duckdb from "@duckdb/duckdb-wasm"
import type { ColDef } from "ag-grid-community"
import { useCallback, useEffect, useRef, useState } from "react"

export const useDuckDB = () => {
    const [db, setDb] = useState<duckdb.AsyncDuckDB | null>(null)
    const [loading, setLoading] = useState(true)
    const [isQueryRunning, setIsQueryRunning] = useState(false)
    const [isCancelling, setIsCancelling] = useState(false)
    const [currentConnection, setCurrentConnection] =
        useState<duckdb.AsyncDuckDBConnection | null>(null)
    const currentResultSet = useRef(null)
    const currentColumns = useRef<ColDef[]>([])

    useEffect(() => {
        const initializeDuckDB = async () => {
            try {
                const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles()
                const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES)

                const worker_url = URL.createObjectURL(
                    new Blob([`importScripts("${bundle.mainWorker!}");`], {
                        type: "text/javascript"
                    })
                )

                const worker = new Worker(worker_url)
                const logger = new duckdb.ConsoleLogger()
                const newDb = new duckdb.AsyncDuckDB(logger, worker)
                await newDb.instantiate(bundle.mainModule, bundle.pthreadWorker)
                URL.revokeObjectURL(worker_url)

                setDb(newDb)
                setLoading(false)
            } catch (error) {
                console.error("Error initializing DuckDB:", error)
                setLoading(false)
            }
        }

        initializeDuckDB()

        return () => {
            if (db) {
                db.terminate()
            }
        }
    }, [])

    const executeSQL = useCallback(
        async (query: string, params?: any[]) => {
            if (!db) throw new Error("Database not initialized")

            setIsQueryRunning(true)
            const connection = await db.connect()
            setCurrentConnection(connection)

            try {
                const resultSet = params?.length
                    ? await (await connection.prepare(query)).send(...params)
                    : await connection.send(query)

                currentResultSet.current = resultSet
                const rows: Record<string, any>[] = []

                // Read the first batch
                const batch = await resultSet.next()

                if (batch && !batch.done && batch.value.schema) {
                    currentColumns.current = batch.value.schema.fields.map(
                        (field) => ({
                            field: field.name,
                            headerName: field.name,
                            type: getDataGridColumnType(
                                String(field.type).toLowerCase()
                            )
                        })
                    )
                }

                if (batch && !batch.done) {
                    rows.push(
                        ...batch.value.toArray().map((row) => row.toJSON())
                    )
                }

                return {
                    rows,
                    columns: currentColumns.current
                }
            } finally {
                setIsQueryRunning(false)
            }
        },
        [db]
    )

    const fetchNextBatch = useCallback(async () => {
        if (!currentResultSet.current) {
            // if no query is running, return empty result
            return { rows: [], columns: currentColumns.current, hasMore: false }
        }

        const result = await currentResultSet.current.next()
        const rows = result.done
            ? []
            : result.value.toArray().map((row) => row.toJSON())
        const hasMore = !result.done

        console.log(`Added ${rows.length} rows`)

        // if no more rows, close the connection to free up resources
        if (!hasMore) {
            await currentConnection?.close()
            setCurrentConnection(null)
            currentResultSet.current = null
        }

        return { rows, columns: currentColumns.current, hasMore }
    }, [currentConnection])

    const cancelQuery = useCallback(async () => {
        if (currentConnection && isQueryRunning) {
            setIsCancelling(true)
            try {
                await currentConnection.cancelSent()
            } finally {
                await currentConnection.close()
                setCurrentConnection(null)
                setIsQueryRunning(false)
                setIsCancelling(false)
                currentResultSet.current = null
            }
        }
    }, [currentConnection, isQueryRunning])

    return {
        loading,
        executeSQL,
        fetchNextBatch,
        isQueryRunning,
        isCancelling,
        cancelQuery
    }
}
