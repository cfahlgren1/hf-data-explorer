import * as duckdb from "@duckdb/duckdb-wasm"
import { useCallback, useEffect, useState } from "react"

export const useDuckDB = () => {
  const [db, setDb] = useState<duckdb.AsyncDuckDB | null>(null)
  const [loading, setLoading] = useState(true)
  const [isQueryRunning, setIsQueryRunning] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [currentConnection, setCurrentConnection] =
    useState<duckdb.AsyncDuckDBConnection | null>(null)

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
    async (query: string, limit: number = 100000, params?: any[]) => {
      if (!db) throw new Error("Database not initialized")

      setIsQueryRunning(true)
      const connection = await db.connect()
      setCurrentConnection(connection)

      try {
        const resultSet = params?.length
          ? await (await connection.prepare(query)).send(...params)
          : await connection.send(query)

        const rows = []

        // read batches until we get to the limit or the end of the result set
        // TODO: see if there is a way to set batch size in RecordBatchStreamReader
        for await (const batch of resultSet) {
          rows.push(...batch.toArray())
          if (rows.length >= limit) break
        }

        return { rows: rows.slice(0, limit) }
      } finally {
        await connection.close()
        setCurrentConnection(null)
        setIsQueryRunning(false)
      }
    },
    [db]
  )

  // cancel a query in progress
  const cancelQuery = useCallback(async () => {
    if (currentConnection && isQueryRunning) {
      setIsCancelling(true)
      try {
        await currentConnection.cancelSent()
      } finally {
        setIsQueryRunning(false)
        setIsCancelling(false)
      }
    }
  }, [currentConnection, isQueryRunning])

  return { loading, executeSQL, isQueryRunning, isCancelling, cancelQuery }
}
