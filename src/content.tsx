import { DataGrid } from "@/components/data-grid"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useDuckDB } from "@/hooks/useDuckDB"
// CSS imports
import cssText from "data-text:~/styles.css"
import agCSS from "data-text:ag-grid-community/styles/ag-grid.css"
import agTheme from "data-text:ag-grid-community/styles/ag-theme-balham.css"
import type { PlasmoCSConfig } from "plasmo"
import React, { useCallback, useRef, useState } from "react"

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

const Explorer = () => {
    const [query, setQuery] = useState<string>("")
    const [rows, setRows] = useState<any[]>([])
    const [columns, setColumns] = useState<any[]>([])
    const [error, setError] = useState<string | null>(null)
    const { client, loading } = useDuckDB()
    const [isStreaming, setIsStreaming] = useState(false)
    const streamRef = useRef<AsyncGenerator<any[], void, unknown> | null>(null)
    const [hasMore, setHasMore] = useState(false)
    const rowsRef = useRef<any[]>([])
    const hasMoreRef = useRef(false)

    const runQuery = useCallback(async () => {
        if (!client || query.trim() === "" || isStreaming) return

        setRows([])
        setColumns([])
        setError(null)
        setIsStreaming(true)
        setHasMore(false)

        try {
            const stream = await client.queryStream(query)
            setColumns(
                stream.schema.map((field) => ({
                    field: field.name,
                    headerName: field.name,
                    type: field.type
                }))
            )

            streamRef.current = stream.readRows()
            const { value: firstBatch, done } = await streamRef.current.next()

            if (firstBatch) {
                rowsRef.current = firstBatch
                hasMoreRef.current = !done
                setRows(firstBatch)
            }
        } catch (err) {
            if (err.message !== "query was canceled") {
                setError(err.message)
            }
        } finally {
            setIsStreaming(false)
        }
    }, [client, query])

    const fetchNextBatch = useCallback(async () => {
        if (!streamRef.current) return { rows: [], hasMore: false }

        try {
            const { value: nextBatch, done } = await streamRef.current.next()

            if (nextBatch) {
                rowsRef.current = [...rowsRef.current, ...nextBatch]
                hasMoreRef.current = !done
                return { rows: nextBatch, hasMore: !done }
            } else {
                hasMoreRef.current = false
                return { rows: [], hasMore: false }
            }
        } catch (err) {
            console.error("Error fetching next batch:", err)
            setError("Error fetching next batch of data")
            hasMoreRef.current = false
            return { rows: [], hasMore: false }
        }
    }, [])

    const handleCancelQuery = useCallback(async () => {
        if (!client) return
        try {
            await client.cancelQuery()
            streamRef.current = null
            setHasMore(false)
        } catch (err) {
            console.error("Error cancelling query:", err)
        }
    }, [client])

    if (loading) return null

    const { isRunning, isCancelling } = client
        ? client.getQueryStatus()
        : { isRunning: false, isCancelling: false }

    return (
        <div className="bg-white border border-slate-200 fixed bottom-10 left-10 w-[480px] rounded-lg shadow-lg z-50 flex flex-col max-h-[80vh]">
            <div className="p-4 flex-shrink-0">
                <h1 className="text-xl font-bold text-slate-800 mb-2">
                    Data Explorer
                </h1>
                <p className="text-xs text-slate-600 mb-3">
                    Write and execute SQL queries in the editor below.
                </p>
                <Textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter your SQL query here..."
                    className="w-full p-2 text-sm min-h-[120px] border border-slate-300 rounded resize-none mb-3"
                />

                {isRunning || isStreaming ? (
                    <Button
                        onClick={handleCancelQuery}
                        className="w-full"
                        disabled={isCancelling}>
                        {isCancelling ? "Cancelling..." : "Cancel Query"}
                    </Button>
                ) : (
                    <Button onClick={runQuery} className="w-full">
                        Run Query
                    </Button>
                )}
                {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
                {rows.length > 0 && (
                    <>
                        <div className="flex-grow overflow-auto p-4">
                            <DataGrid
                                initialData={{ rows: rowsRef.current, columns }}
                                fetchNextBatch={fetchNextBatch}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default Content
