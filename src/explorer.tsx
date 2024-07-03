import { DataGrid } from "@/components/data-grid"
import QueryInput from "@/components/query-input"
import { useDuckDB } from "@/hooks/useDuckDB"
import { useParquetInfo } from "@/hooks/useParquetInfo"
import { useCallback, useMemo, useRef, useState } from "react"
import { FiX } from "react-icons/fi"

import { useStorage } from "@plasmohq/storage/hook"

interface RowData {
    [key: string]: any
}

interface ColumnDef {
    field: string
    headerName: string
}

interface ExplorerProps {
    onClose: () => void
    loadViewsOnStartup: boolean
}

const Explorer: React.FC<ExplorerProps> = ({ onClose, loadViewsOnStartup }) => {
    const [rows, setRows] = useState<RowData[]>([])
    const [columns, setColumns] = useState<ColumnDef[]>([])
    const [error, setError] = useState<string | null>(null)
    const { client, loading } = useDuckDB()
    const [isStreaming, setIsStreaming] = useState<boolean>(false)
    const [isCancelling, setIsCancelling] = useState<boolean>(false)
    const streamRef = useRef<AsyncGenerator<RowData[], void, unknown> | null>(
        null
    )
    const rowsRef = useRef<RowData[]>([])

    const [showViewsError, setShowViewsError] = useState(true)
    const [apiToken, setApiToken] = useStorage("apiToken")

    const {
        views,
        viewsLoaded,
        error: viewsError
    } = useParquetInfo(client, apiToken, loading, loadViewsOnStartup)

    const runQuery = useCallback(
        async (query: string) => {
            if (!client || query.trim() === "" || isStreaming) return

            setRows([])
            setColumns([])
            setError(null)
            setIsStreaming(true)
            setShowViewsError(false) // Hide viewsError when a query is run

            try {
                const stream = await client.queryStream(query)
                setColumns(
                    stream.schema.map((field) => ({
                        field: field.name,
                        headerName: field.name
                    }))
                )

                streamRef.current = stream.readRows()
                const { value: firstBatch, done } =
                    await streamRef.current.next()

                if (firstBatch) {
                    rowsRef.current = firstBatch
                    setRows(firstBatch)
                }
            } catch (err) {
                if (
                    err instanceof Error &&
                    err.message !== "query was canceled"
                ) {
                    setError(err.message)
                }
            } finally {
                setIsStreaming(false)
            }
        },
        [client, isStreaming]
    )

    const fetchNextBatch = useCallback(async () => {
        if (!streamRef.current) return { rows: [] }

        try {
            const { value: nextBatch } = await streamRef.current.next()

            if (nextBatch) {
                rowsRef.current = [...rowsRef.current, ...nextBatch]
                return { rows: nextBatch }
            }
            return { rows: [] }
        } catch (err) {
            console.error("Error fetching next batch:", err)
            setError("Error fetching next batch of data")
            return { rows: [] }
        }
    }, [])

    const handleCancelQuery = useCallback(async () => {
        if (!client) return
        setIsCancelling(true)
        try {
            await client.cancelQuery()
            streamRef.current = null
        } catch (err) {
            console.error("Error cancelling query:", err)
        } finally {
            setIsCancelling(false)
        }
    }, [client])

    const memoizedDataGrid = useMemo(
        () =>
            rows.length > 0 && (
                <div className="flex-grow overflow-auto p-4">
                    <DataGrid
                        initialData={{ rows: rowsRef.current, columns }}
                        fetchNextBatch={fetchNextBatch}
                    />
                </div>
            ),
        [rows.length, columns, fetchNextBatch]
    )

    return (
        <div className="bg-white border border-slate-200 fixed bottom-10 left-10 w-[480px] rounded-lg shadow-lg z-50 flex flex-col max-h-[80vh]">
            <div className="p-4 flex-shrink-0">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-xl font-bold text-slate-800">
                        Data Explorer
                    </h1>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-700"
                        aria-label="Close explorer">
                        <FiX size={20} />
                    </button>
                </div>
                <p className="text-xs text-slate-600 mb-3">
                    Query datasets with SQL 🤗
                </p>
                <QueryInput
                    onRunQuery={runQuery}
                    isCancelling={isCancelling}
                    isLoading={loading || (loadViewsOnStartup && !viewsLoaded)}
                    isRunning={isStreaming}
                    views={views || []}
                    onCancelQuery={handleCancelQuery}
                />
                {(error || (showViewsError && viewsError)) && (
                    <p className="text-xs text-red-500 mt-2">
                        {error || viewsError}
                    </p>
                )}
                {
                    // Show a message if there are no views
                    viewsLoaded &&
                        !viewsError &&
                        showViewsError &&
                        views.length === 0 && (
                            <p className="text-xs italic text-slate-600 mt-2">
                                Sorry there wasn't a parquet conversion for this
                                dataset.
                            </p>
                        )
                }
                {memoizedDataGrid}
            </div>
        </div>
    )
}

export default Explorer
