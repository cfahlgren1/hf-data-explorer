import {
    getDatasetFromURL,
    getNameFilesAndConfig,
    getParquetInfo
} from "@/lib/datasets"
import type { DuckDBClient } from "@/services/DuckDBClient"
import { useEffect, useState } from "react"

export const useParquetInfo = (
    client: DuckDBClient | null,
    apiToken: string | null,
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
                const {
                    data,
                    statusCode,
                    error: apiError
                } = await getParquetInfo(dataset, apiToken)

                // user hasn't set their API token
                if (statusCode === 401) {
                    throw new Error(
                        "Please set your Hugging Face API token to access this dataset."
                    )
                }
                if (apiError || !data) {
                    throw new Error(
                        "The explorer is not available for this dataset."
                    )
                }

                const views = getNameFilesAndConfig(data.parquet_files).reduce(
                    (acc, { name, files }) => ({
                        ...acc,
                        [name]: files.map((file) => file.url)
                    }),
                    {}
                )

                await client.loadConfig({ views })
                setViews(await client.getTables())
            } catch (err) {
                setError(
                    err.message ||
                        "The explorer is not available for this dataset."
                )
            } finally {
                setViewsLoaded(true)
            }
        }

        fetchParquetInfo()
    }, [client, loading, loadViewsOnStartup])

    return { views, viewsLoaded, error }
}
