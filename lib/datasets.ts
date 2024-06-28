import axios from "axios"

interface ParquetFile {
    dataset: string
    config: string
    split: string
    url: string
    filename: string
    size: number
}

interface ParquetResponse {
    parquet_files: ParquetFile[]
    partial: boolean
    pending?: string[]
    failed?: string[]
}

interface NameFilesInfo {
    name: string
    files: ParquetFile[]
}

/*
We want to group the parquet files by config and split, and then by config
so we can create views for each config and split
*/
export const getNameFilesAndConfig = (
    parquetFiles: ParquetFile[]
): NameFilesInfo[] => {
    const result: NameFilesInfo[] = []
    const configMap: Record<string, ParquetFile[]> = {}

    parquetFiles.forEach((file) => {
        const configSplitName = `${file.config}_${file.split}`
        const configName = file.config

        // Add to config-split combination
        const existingConfigSplit = result.find(
            (entry) => entry.name === configSplitName
        )
        if (existingConfigSplit) {
            existingConfigSplit.files.push(file)
        } else {
            result.push({ name: configSplitName, files: [file] })
        }

        if (!configMap[configName]) {
            configMap[configName] = []
        }
        configMap[configName].push(file)
    })

    // Add config entries to the result list
    Object.entries(configMap).forEach(([config, files]) => {
        result.push({ name: config, files })
    })

    return result.sort((a, b) => a.name.localeCompare(b.name))
}

export async function getParquetInfo(
    dataset: string
): Promise<ParquetResponse> {
    const API_URL = `https://datasets-server.huggingface.co/parquet?dataset=${dataset}`

    try {
        const response = await axios.get<ParquetResponse>(API_URL)
        return response.data
    } catch (error) {
        console.error("Error fetching parquet info:", error)
        throw error
    }
}
