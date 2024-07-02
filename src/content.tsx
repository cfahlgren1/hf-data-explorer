import { DataGrid } from "@/components/data-grid"
import QueryInput from "@/components/query-input"
import { useDuckDB } from "@/hooks/useDuckDB"
import {
    getDatasetFromURL,
    getNameFilesAndConfig,
    getParquetInfo
} from "@/lib/datasets"
// CSS imports
import cssText from "data-text:~/styles.css"
import agCSS from "data-text:ag-grid-community/styles/ag-grid.css"
import agTheme from "data-text:ag-grid-community/styles/ag-theme-balham.css"
import type { PlasmoCSConfig } from "plasmo"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { FiMaximize2, FiX } from "react-icons/fi"

import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-balham.css"
import "./styles.css"

import { useStorage } from "@plasmohq/storage/hook"

export const config: PlasmoCSConfig = {
    matches: ["https://huggingface.co/datasets/*/*"]
}

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = cssText + agCSS + agTheme
    return style
}

interface RowData {
    [key: string]: any
}

interface ColumnDef {
    field: string
    headerName: string
}

const useParquetInfo = (client, loading, loadViewsOnStartup) => {
    const [views, setViews] = useState([])
    const [viewsLoaded, setViewsLoaded] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchParquetInfo = async () => {
            if (!client || loading || !loadViewsOnStartup) return

            setViewsLoaded(false)
            setError(null)

            try {
                const dataset = getDatasetFromURL(window.location.href)
                const data = await getParquetInfo(dataset)
                const nameFilesConfig = getNameFilesAndConfig(
                    data.parquet_files
                )

                const views = nameFilesConfig.reduce((acc, { name, files }) => {
                    acc[name] = files.map((file) => file.url)
                    return acc
                }, {})

                await client.loadConfig({ views })
                const successfulViews = await client.getTables()
                setViews(successfulViews)
            } catch (err) {
                console.error("Error fetching parquet info:", err)
                setError("Error fetching dataset information")
            } finally {
                setViewsLoaded(true)
            }
        }

        fetchParquetInfo()
    }, [client, loading, loadViewsOnStartup])

    return { views, viewsLoaded, error }
}

const Explorer = ({ onClose }) => {
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
    const [loadViewsOnStartup, setLoadViewsOnStartup] = useState(true)

    // load views on startup from storage, in the case of context invalidation, just show views
    useEffect(() => {
        const loadStorageValue = async () => {
            try {
                const [loadViewsOnStartup] = useStorage(
                    "loadViewsOnStartup",
                    (v) => (v === undefined ? true : v)
                )
                setLoadViewsOnStartup(loadViewsOnStartup)
            } catch (error) {
                setLoadViewsOnStartup(true)
            }
        }

        loadStorageValue()
    }, [])

    const {
        views,
        viewsLoaded,
        error: viewsError
    } = useParquetInfo(client, loading, loadViewsOnStartup)

    const [showViewsError, setShowViewsError] = useState(true)

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

const Content = () => {
    const [showExplorer, setShowExplorer] = useState(false)

    const handleOpenExplorer = () => {
        setShowExplorer(true)
    }

    const handleCloseExplorer = () => {
        setShowExplorer(false)
    }

    useEffect(() => {
        const handleError = (event) => {
            event.preventDefault()

            // ignore context invalidated errors, they are normal
            if (!event.message.includes("Extension context invalidated.")) {
                console.error(event.message)
            }
        }

        window.addEventListener("error", handleError)

        return () => {
            window.removeEventListener("error", handleError)
        }
    }, [])

    if (showExplorer) {
        return <Explorer onClose={handleCloseExplorer} />
    }

    // show minimized explorer button if closed
    return (
        <button
            onClick={handleOpenExplorer}
            className="fixed bottom-10 left-10 bg-slate-800 hover:text-yellow text-white rounded-full p-3 shadow-lg z-50 transition-transform duration-200 ease-in-out hover:scale-110"
            aria-label="Open explorer">
            <FiMaximize2 size={24} />
        </button>
    )
}

export default Content
