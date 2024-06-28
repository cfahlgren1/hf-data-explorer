import { useEffect, useState } from "react"

import { DuckDBClient } from "../services/DuckDBClient"
import type { DuckDBClientConfig } from "../services/DuckDBClient"

const useDuckDB = (config: DuckDBClientConfig = {}) => {
    const [client, setClient] = useState<DuckDBClient | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isMounted = true

        const initClient = async () => {
            setLoading(true)
            if (client) {
                await client.close().catch((error) => {
                    console.error(
                        "Error closing previous DuckDB client:",
                        error
                    )
                })
            }

            try {
                const newClient = new DuckDBClient(config)
                await newClient.initialize()
                if (isMounted) {
                    setClient(newClient)
                    setLoading(false)
                }
            } catch (error) {
                console.error("Error initializing DuckDB client:", error)
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        initClient()

        return () => {
            isMounted = false
            if (client) {
                client.close().catch((error) => {
                    console.error("Error closing DuckDB client:", error)
                })
            }
        }
    }, [JSON.stringify(config)]) // Reinitialize when config changes

    return { client, loading }
}

export { DuckDBClient, useDuckDB }
