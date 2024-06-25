import { useState } from "react";
import { useDuckDB } from "@/hooks/useDuckDB";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Content = () => {
    const [query, setQuery] = useState<string>("");
    const { loading, executeQuery, queryResult, isQueryRunning, cancelQuery } = useDuckDB();

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div className="flex h-screen">
            <div className="w-1/4 p-4 bg-white shadow-lg rounded-lg">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">HF Data Explorer</h1>
                <div className="space-y-4">
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Enter your SQL query"
                        className="w-full"
                    />
                    <Button onClick={() => executeQuery(query)} className="w-full">
                        {isQueryRunning ? "Running..." : "Run Query"}
                    </Button>
                    {isQueryRunning && (
                        <Button onClick={cancelQuery} className="w-full">
                            Cancel Query
                        </Button>
                    )}
                    <div className="mt-4">
                        <h2 className="text-xl font-semibold mb-2">Query Result:</h2>
                        {queryResult ? (
                            <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-60">
                                {JSON.stringify(queryResult, null, 2)}
                            </pre>
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