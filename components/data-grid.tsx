import type { ColDef, GridReadyEvent, IDatasource } from "ag-grid-community"
import { AgGridReact } from "ag-grid-react"
import { useCallback, useMemo, useRef, useState } from "react"

type RowData = Record<string, any>

interface DataGridProps<T extends RowData> {
    initialData: {
        rows: T[]
        columns: ColDef[]
        hasMore: boolean
    }
    fetchNextBatch: () => Promise<{
        rows: T[]
        hasMore: boolean
    }>
    height?: number
}

export const DataGrid = <T extends RowData>({
    initialData,
    fetchNextBatch,
    height = 400
}: DataGridProps<T>) => {
    const gridRef = useRef<AgGridReact>(null)
    const [columnDefs, setColumnDefs] = useState<ColDef[]>(initialData.columns)
    const [rowCount, setRowCount] = useState<number>(initialData.rows.length)

    const datasource: IDatasource = useMemo(() => {
        return {
            getRows: async (params) => {
                const { startRow, successCallback, failCallback } = params
                try {
                    if (startRow === 0) {
                        successCallback(
                            initialData.rows,
                            initialData.hasMore
                                ? undefined
                                : initialData.rows.length
                        )
                        setRowCount(initialData.rows.length)
                    } else {
                        const { rows, hasMore } = await fetchNextBatch()
                        successCallback(
                            rows,
                            hasMore ? undefined : startRow + rows.length
                        )
                        setRowCount((prevCount) => prevCount + rows.length)
                    }
                } catch (error) {
                    failCallback()
                    console.error("Error fetching data:", error)
                }
            }
        }
    }, [initialData, fetchNextBatch])

    const onGridReady = useCallback(
        (params: GridReadyEvent) => {
            params.api.setGridOption("datasource", datasource)
        },
        [datasource]
    )

    return (
        <div>
            <div className="ag-theme-quartz" style={{ height }}>
                <AgGridReact
                    ref={gridRef}
                    columnDefs={columnDefs}
                    rowModelType="infinite"
                    maxConcurrentDatasourceRequests={1}
                    onGridReady={onGridReady}
                />
            </div>
            <p className="text-xs text-center text-slate-600 mt-2">
                Showing {rowCount} rows
            </p>
        </div>
    )
}
