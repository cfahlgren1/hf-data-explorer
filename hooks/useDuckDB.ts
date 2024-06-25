import { useState, useEffect } from 'react';
import * as duckdb from "@duckdb/duckdb-wasm";

export const useDuckDB = () => {
    const [db, setDb] = useState<duckdb.AsyncDuckDB | null>(null);
    const [connection, setConnection] = useState<duckdb.AsyncDuckDBConnection | null>(null);
    const [loading, setLoading] = useState(true);
    const [queryResult, setQueryResult] = useState<any[] | null>(null);
    const [isQueryRunning, setIsQueryRunning] = useState(false);

    useEffect(() => {
        const initializeDuckDB = async () => {
            try {
                const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
                const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

                const worker_url = URL.createObjectURL(
                    new Blob([`importScripts("${bundle.mainWorker!}");`], {
                        type: "text/javascript",
                    })
                );

                const worker = new Worker(worker_url);
                const logger = new duckdb.ConsoleLogger();
                const newDb = new duckdb.AsyncDuckDB(logger, worker);
                await newDb.instantiate(bundle.mainModule, bundle.pthreadWorker);
                URL.revokeObjectURL(worker_url);

                const newConnection = await newDb.connect();
                setDb(newDb);
                setConnection(newConnection);
                setLoading(false);
            } catch (error) {
                console.error("Error initializing DuckDB:", error);
                setLoading(false);
            }
        };

        initializeDuckDB();

        return () => {
            if (connection) {
                connection.close();
            }
            if (db) {
                db.terminate();
            }
        };
    }, []);

    const executeQuery = async (sql: string) => {
        if (!connection) {
            console.error("Database not initialized");
            return;
        }
        setIsQueryRunning(true);
        try {
            const result = await connection.query(sql);
            const resultData = result.toArray().map((row) => row.toJSON());
            console.log(resultData);
            setQueryResult(resultData);
            return resultData;
        } catch (error) {
            console.error('Error executing query:', error);
            setQueryResult([{ error: error.message }]);
        } finally {
            setIsQueryRunning(false);
        }
    };

    const cancelQuery = async (): Promise<boolean> => {
        if (!connection) return false;
        return await connection.cancelSent();
    };

    return { loading, executeQuery, queryResult, isQueryRunning, cancelQuery };
};