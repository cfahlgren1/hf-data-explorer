import type { ColDef, GridReadyEvent, IDatasource } from "ag-grid-community"
import { AgGridReact } from "ag-grid-react"
import React, { useCallback, useMemo, useRef, useState } from "react"

type RowData = Record<string, any>

interface DataGridProps<T extends RowData> {
    initialData: {
        rows: T[]
        columns: ColDef[]
    }
    fetchNextBatch: () => Promise<{
        rows: T[]
    }>
    height?: number
}

export const DataGrid = React.memo(
    <T extends RowData>({ initialData, fetchNextBatch }: DataGridProps<T>) => {
        const gridRef = useRef<AgGridReact>(null)
        const [rowCount, setRowCount] = useState<number>(
            initialData.rows.length
        )

        const datasource: IDatasource = useMemo(() => {
            return {
                getRows: async (params) => {
                    const { startRow, successCallback, failCallback } = params

                    try {
                        if (startRow === 0) {
                            successCallback(initialData.rows)
                            setRowCount(initialData.rows.length)
                        } else {
                            const { rows } = await fetchNextBatch()
                            successCallback(rows, startRow + rows.length)
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

        /*
    For small results, we want to use autoHeight to show smaller grid,
    but not for large results as it causes performance issues.
    */
        const isSmallResult = initialData.rows.length < 10

        const defaultColDef = useMemo(() => {
            return {
                flex: 1,
                minWidth: 100,
                sortable: false,
                filter: false
            }
        }, [])

        return (
            <div>
                <div
                    className={`ag-theme-balham ${!isSmallResult ? `h-96` : ""}`}>
                    <AgGridReact
                        ref={gridRef}
                        domLayout={isSmallResult ? "autoHeight" : "normal"}
                        columnDefs={initialData.columns}
                        defaultColDef={defaultColDef}
                        rowModelType="infinite"
                        maxConcurrentDatasourceRequests={1}
                        onGridReady={onGridReady}
                        cacheBlockSize={initialData.rows.length}
                    />
                </div>
                <p className="text-xs text-center text-slate-600 mt-2">
                    Showing {rowCount} rows
                </p>
            </div>
        )
    }
)
