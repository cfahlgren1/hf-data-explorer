import { useEffect, useState } from "react"

import { DuckDBClient } from "../services/DuckDBClient"
import type { DuckDBClientConfig } from "../services/DuckDBClient"

const useDuckDB = (config: DuckDBClientConfig = {}) => {
    const [client, setClient] = useState<DuckDBClient | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const initClient = async () => {
            try {
                const newClient = new DuckDBClient(config)
                await newClient.initialize()
                setClient(newClient)
            } catch (error) {
                console.error("Error initializing DuckDB client:", error)
            } finally {
                setLoading(false)
            }
        }

        initClient()

        return () => {
            if (client) {
                client.close().catch((error) => {
                    console.error("Error closing DuckDB client:", error)
                })
            }
        }
    }, [])

    return { client, loading }
}

export { DuckDBClient, useDuckDB }
