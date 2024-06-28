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

import { useStorage } from "@plasmohq/storage/hook"

import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-balham.css"
import "./styles.css"

export const config: PlasmoCSConfig = {
    matches: ["https://huggingface.co/datasets/*/*"]
}

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = cssText + agCSS + agTheme
    return style
}

const Content = () => {
    const [showExplorer] = useStorage("showExplorer")

    if (!showExplorer) return null

    return <Explorer />
}

interface RowData {
    [key: string]: any
}

interface ColumnDef {
    field: string
    headerName: string
}

const Explorer = () => {
    const [rows, setRows] = useState<RowData[]>([])
    const [columns, setColumns] = useState<ColumnDef[]>([])
    const [error, setError] = useState<string | null>(null)
    const { client, loading } = useDuckDB()
    const [isStreaming, setIsStreaming] = useState<boolean>(false)
    const streamRef = useRef<AsyncGenerator<RowData[], void, unknown> | null>(
        null
    )
    const rowsRef = useRef<RowData[]>([])
    const [viewsLoaded, setViewsLoaded] = useState<boolean>(false)

    useEffect(() => {
        const fetchParquetInfo = async () => {
            if (!client || loading) return

            setViewsLoaded(false)
            try {
                const dataset = getDatasetFromURL(window.location.href)
                const data = await getParquetInfo(dataset)
                const nameFilesConfig = getNameFilesAndConfig(
                    data.parquet_files
                )

                // create views for each config and split
                const views: { [key: string]: string[] } = {}
                nameFilesConfig.forEach(({ name, files }) => {
                    views[name] = files.map((file) => file.url)
                })

                // load views
                await client.loadConfig({ views })
            } catch (err) {
                console.error("Error fetching parquet info:", err)
                setError("Error fetching dataset information")
            } finally {
                setViewsLoaded(true)
            }
        }

        fetchParquetInfo()
    }, [client, loading])

    const runQuery = useCallback(
        async (query: string) => {
            if (!client || query.trim() === "" || isStreaming) return

            setRows([])
            setColumns([])
            setError(null)
            setIsStreaming(true)

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
            } else {
                return { rows: [] }
            }
        } catch (err) {
            console.error("Error fetching next batch:", err)
            setError("Error fetching next batch of data")
            return { rows: [] }
        }
    }, [])

    const handleCancelQuery = useCallback(async () => {
        if (!client) return
        try {
            await client.cancelQuery()
            streamRef.current = null
        } catch (err) {
            console.error("Error cancelling query:", err)
        }
    }, [client])

    const { isRunning, isCancelling } = client
        ? client.getQueryStatus()
        : { isRunning: false, isCancelling: false }

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
                <>
                    <h1 className="text-xl font-bold text-slate-800 mb-2">
                        Data Explorer
                    </h1>
                    <p className="text-xs text-slate-600 mb-3">
                        Write and execute SQL queries in the editor below.
                    </p>
                    <QueryInput
                        onRunQuery={runQuery}
                        isLoading={loading || !viewsLoaded}
                        isRunning={isRunning || isStreaming}
                        isCancelling={isCancelling}
                        onCancelQuery={handleCancelQuery}
                    />
                    {error && (
                        <p className="text-xs text-red-500 mt-2">{error}</p>
                    )}
                    {memoizedDataGrid}
                </>
            </div>
        </div>
    )
}
export default Content
