import { ColDef } from "ag-grid-community"
import { AgGridReact } from "ag-grid-react"
import React from "react"

type RowData = Record<string, any>

interface DataGridProps<T extends RowData> {
    rowData: T[]
    columnDefs: ColDef[]
    height?: number
}

export const DataGrid = <T extends RowData>({
    rowData,
    columnDefs,
    height = 300
}: DataGridProps<T>) => {
    return (
        <div className="ag-theme-quartz" style={{ height }}>
            <AgGridReact rowData={rowData} columnDefs={columnDefs} />
        </div>
    )
}
