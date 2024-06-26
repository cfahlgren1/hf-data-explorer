import React, { useState } from "react";
import { useDuckDB } from "@/hooks/useDuckDB";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { PlasmoCSConfig } from "plasmo"
import cssText from "data-text:~/styles.css"

export const config: PlasmoCSConfig = {
    matches: ["https://huggingface.co/datasets/*/*"],
}

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = cssText
    return style
}

const Content = () => {
    const [query, setQuery] = useState<string>("");
    const [results, setResults] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    const { executeSQL, isQueryRunning, loading } = useDuckDB();

    const MAX_ROWS = 500;

    const runQuery = async () => {
        if (query.trim() === "") {
            return;
        }

        setResults([]);
        setError(null);
        try {
            const { rows } = await executeSQL(query, MAX_ROWS);
            setResults(rows);
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div className="flex h-screen w-full max-w-5xl">
            <div className="p-4 bg-white shadow-lg rounded-lg">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">HF Data Explorer</h1>
                <div className="space-y-4">
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Enter your SQL query"
                        className="w-full"
                    />
                    <Button onClick={runQuery} className="w-full">
                        {isQueryRunning ? "Running..." : "Run Query"}
                    </Button>
                    <div className="mt-4">
                        <h2 className="text-xl font-semibold mb-2">Query Result:</h2>
                        {error ? (
                            <p className="text-red-500">{error}</p>
                        ) : results.length > 0 ? (
                            <div>
                                <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-60">
                                    Returned {results.length} rows
                                    {results.length === MAX_ROWS && " (maximum reached)"}
                                </pre>
                            </div>
                        ) : (
                            <p>No results yet</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Content;