export interface ParquetInfo {
    name: string
    view_name: string
    schema: SchemaField[]
}

interface SchemaField {
    name: string
    type: string
    notnull: boolean
    dflt_value: string | null
    pk: boolean
}
