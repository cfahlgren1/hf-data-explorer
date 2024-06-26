import { DataGrid } from "@/components/data-grid"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useDuckDB } from "@/hooks/useDuckDB"
// CSS imports
import cssText from "data-text:~/styles.css"
import agCSS from "data-text:ag-grid-community/styles/ag-grid.css"
import agTheme from "data-text:ag-grid-community/styles/ag-theme-quartz.css"
import type { PlasmoCSConfig } from "plasmo"
import React, { useState } from "react"

import { useStorage } from "@plasmohq/storage/hook"

import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-quartz.css"
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

    console.log("showExplorer", showExplorer)

    if (!showExplorer) return null

    return <Explorer />
}

const Explorer = () => {
    const [query, setQuery] = useState<string>("")
    const [rows, setRows] = useState<any[]>([])
    const [columns, setColumns] = useState<any[]>([])
    const [error, setError] = useState<string | null>(null)
    const { executeSQL, isQueryRunning, loading, isCancelling, cancelQuery } =
        useDuckDB()

    const MAX_ROWS = 500

    const runQuery = async () => {
        // if query is empty or already running ignore
        if (query.trim() === "" || isQueryRunning) return
        setRows([])
        setColumns([])
        setError(null)
        try {
            const { rows: resultRows, columns: resultColumns } =
                await executeSQL(query, MAX_ROWS)
            setRows(resultRows)
            setColumns(resultColumns)
        } catch (err) {
            if (err.message !== "Query was cancelled") {
                setError(err.message)
            }
        }
    }

    const handleCancelQuery = async () => {
        try {
            await cancelQuery()
        } catch (err) {
            console.error("Error cancelling query:", err)
        }
    }

    if (loading) return null

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

                {isQueryRunning ? (
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
                            <DataGrid rowData={rows} columnDefs={columns} />
                        </div>
                        <p className="text-xs text-center text-gray-600 mt-2">
                            Returned {rows.length} rows
                            {rows.length === MAX_ROWS && " (truncated)"}
                        </p>
                    </>
                )}
            </div>
        </div>
    )
}

export default Content
