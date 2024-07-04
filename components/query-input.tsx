import { Button } from "@/components/ui/button"
import { ReloadIcon } from "@radix-ui/react-icons"
import React, { useState } from "react"
import { Controlled as CodeMirror } from "react-codemirror2"

import "codemirror/mode/sql/sql"

import CommandEnter from "./CommandEnter"
import { Badge } from "./ui/badge"

interface QueryInputProps {
    onRunQuery: (query: string) => void
    isRunning: boolean
    isLoading: boolean
    onCancelQuery: () => void
    isCancelling: boolean
    views: string[]
}

const QueryInput: React.FC<QueryInputProps> = React.memo(
    ({
        onRunQuery,
        isRunning,
        views,
        isLoading,
        onCancelQuery,
        isCancelling
    }) => {
        const [query, setQuery] = useState<string>("")

        const handleChange = React.useCallback(
            (editor: any, data: any, value: string) => {
                setQuery(value)
            },
            []
        )

        // run query if user hits cmd + enter
        const handleKeyDown = (
            editor: any,
            name: string,
            event: React.KeyboardEvent
        ) => {
            if (name === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault()
                onRunQuery(editor.getValue())
            }
        }
        // helpful auto-fill for preview query
        const handleTableClick = (tableName: string) => {
            const newQuery = `SELECT * FROM ${tableName} LIMIT 500`
            setQuery(newQuery)
        }

        return (
            <>
                <CodeMirror
                    value={query}
                    options={{
                        mode: "sql",
                        theme: "lucario",
                        lineNumbers: true
                    }}
                    onKeyHandled={handleKeyDown}
                    onBeforeChange={handleChange}
                    className="w-full max-h-32 text-sm resize-none overflow-auto mb-3"
                />
                {views.length > 0 && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-800 mb-2">
                            Tables
                        </label>
                        <div
                            className="overflow-x-scroll pb-2"
                            style={{
                                scrollbarWidth: "none",
                                msOverflowStyle: "none",
                                maskImage:
                                    "linear-gradient(to right, transparent, black 8px, black calc(100% - 8px), transparent)",
                                WebkitMaskImage:
                                    "linear-gradient(to right, transparent, black 8px, black calc(100% - 8px), transparent)"
                            }}>
                            <div className="flex gap-1">
                                {views.map((view) => (
                                    <Badge
                                        key={view}
                                        variant="secondary"
                                        className="text-xs cursor-pointer whitespace-nowrap"
                                        onClick={() => handleTableClick(view)}>
                                        {view}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {isRunning ? (
                    <Button
                        onClick={onCancelQuery}
                        className="w-full"
                        variant="outline"
                        disabled={isCancelling}>
                        <ReloadIcon className="mr-2 h-4 w-4 animate-[spin_0.5s_linear_infinite]" />
                        {isCancelling ? "Cancelling..." : "Cancel Query"}
                    </Button>
                ) : isLoading ? (
                    <Button className="w-full" variant="outline" disabled>
                        <ReloadIcon className="mr-2 h-4 w-4 animate-[spin_0.5s_linear_infinite]" />
                        Loading Datasets...
                    </Button>
                ) : (
                    <Button
                        onClick={() => onRunQuery(query)}
                        className="w-full"
                        variant="outline">
                        Run Query
                        <CommandEnter />
                    </Button>
                )}
            </>
        )
    }
)

QueryInput.displayName = "QueryInput"
export default QueryInput
