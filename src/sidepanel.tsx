import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// workers aren't supported in sidepanel or in background script, so we need to use the blocking version
import * as duckdb_blocking from '@duckdb/duckdb-wasm/dist/duckdb-browser-blocking';

import "./styles.css";

const IndexSidePanel = () => {
  const [queryResult, setQueryResult] = useState<string>();
  const [query, setQuery] = useState<string>("SELECT version();");
  const [db, setDb] = useState<any>(null);

  const initializeDuckDB = async () => {
    try {
      const DUCKDB_BUNDLES = duckdb_blocking.getJsDelivrBundles();
      const logger = new duckdb_blocking.ConsoleLogger();
      const newDb = await duckdb_blocking.createDuckDB(DUCKDB_BUNDLES, logger, duckdb_blocking.BROWSER_RUNTIME);
      await newDb.instantiate(() => { });
      setDb(newDb);
    } catch (error) {
      console.error('Error initializing DuckDB:', error);
    }
  };

  const runQuery = async () => {
    if (db) {
      const conn = db.connect();
      try {
        const result = conn.query(query);
        setQueryResult(result.toString());
      } catch (error) {
        console.error('Error executing query:', error);
        setQueryResult(`Error: ${error.message}`);
      } finally {
        conn.close();
      }
    } else {
      setQueryResult("Database not initialized");
    }
  };

  useEffect(() => {
    initializeDuckDB();
  }, []);

  return (
    <div className="p-4 bg-white shadow-lg h-screen rounded-lg">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Data Explorer</h1>
      <div className="space-y-4">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your SQL query"
          className="w-full"
        />
        <Button onClick={runQuery} className="w-full">
          Run Query
        </Button>
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Query Result:</h2>
          <pre className="bg-gray-100 p-2 rounded">{queryResult}</pre>
        </div>
      </div>
    </div>
  )
}

export default IndexSidePanel;