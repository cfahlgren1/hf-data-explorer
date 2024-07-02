import {
    getDatasetFromURL,
    getNameFilesAndConfig,
    getParquetInfo
} from "@/lib/datasets"
import type { DuckDBClient } from "@/services/DuckDBClient"
import { useEffect, useState } from "react"

export const useParquetInfo = (
    client: DuckDBClient | null,
    loading: boolean,
    loadViewsOnStartup: boolean
): { views: string[]; viewsLoaded: boolean; error: string | null } => {
    const [views, setViews] = useState<string[]>([])
    const [viewsLoaded, setViewsLoaded] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchParquetInfo = async () => {
            if (!client || loading || !loadViewsOnStartup) return

            setViewsLoaded(false)
            setError(null)

            try {
                const dataset = getDatasetFromURL(window.location.href)
                const data = await getParquetInfo(dataset)
                const nameFilesConfig = getNameFilesAndConfig(
                    data.parquet_files
                )

                const views = nameFilesConfig.reduce((acc, { name, files }) => {
                    acc[name] = files.map((file) => file.url)
                    return acc
                }, {})

                await client.loadConfig({ views })
                const successfulViews = await client.getTables()
                setViews(successfulViews)
            } catch (err) {
                console.error("Error fetching parquet info:", err)
                setError("Error fetching dataset information")
            } finally {
                setViewsLoaded(true)
            }
        }

        fetchParquetInfo()
    }, [client, loading, loadViewsOnStartup])

    return { views, viewsLoaded, error }
}
