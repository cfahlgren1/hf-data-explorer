import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ReloadIcon } from "@radix-ui/react-icons"
import React, { useState } from "react"
import type { KeyboardEvent } from "react"

import CommandEnter from "./CommandEnter"

interface QueryInputProps {
    onRunQuery: (query: string) => void
    isRunning: boolean
    isLoading: boolean
    onCancelQuery: () => void
    isCancelling: boolean
}

const QueryInput: React.FC<QueryInputProps> = React.memo(
    ({ onRunQuery, isRunning, isLoading, onCancelQuery, isCancelling }) => {
        const [query, setQuery] = useState<string>("")

        // run query if user hits cmd + enter
        const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                onRunQuery(query)
            }
        }

        return (
            <>
                <Textarea
                    value={query}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setQuery(e.target.value)
                    }
                    onKeyDown={handleKeyDown}
                    placeholder="Enter your SQL query here..."
                    className="w-full p-2 text-sm min-h-[120px] border border-slate-300 rounded resize-none mb-3"
                />
                {isRunning ? (
                    <Button
                        onClick={onCancelQuery}
                        className="w-full"
                        disabled={isCancelling}>
                        {isCancelling ? "Cancelling..." : "Cancel Query"}
                    </Button>
                ) : isLoading ? (
                    <Button className="w-full" disabled>
                        <ReloadIcon className="mr-2 h-4 w-4 animate-[spin_0.5s_linear_infinite]" />
                        Loading Datasets...
                    </Button>
                ) : (
                    <Button
                        onClick={() => onRunQuery(query)}
                        className="w-full">
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
