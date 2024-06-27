// https://duckdb.org/docs/sql/data_types/overview
export const getType = (type: string): string => {
    const typeLower = type.toLowerCase()
    switch (typeLower) {
        case "bigint":
        case "int8":
        case "long":
        case "double":
        case "float8":
        case "numeric":
        case "decimal":
        case "decimal(s, p)":
        case "real":
        case "float4":
        case "float":
        case "float32":
        case "float64":
        case "hugeint":
        case "integer":
        case "smallint":
        case "tinyint":
        case "ubigint":
        case "uinteger":
        case "usmallint":
        case "utinyint":
        case "int4":
        case "int":
        case "signed":
        case "int2":
        case "short":
        case "int1":
        case "int64":
        case "int32":
            return "number"
        case "boolean":
        case "bool":
        case "logical":
            return "boolean"
        case "date":
        case "timestamp":
        case "timestamp with time zone":
        case "datetime":
        case "timestamptz":
        case "time":
        case "interval":
            return "date"
        case "uuid":
        case "varchar":
        case "char":
        case "bpchar":
        case "text":
        case "string":
        case "utf8":
            return "text"
        default:
            return "text"
    }
}

export const getDataGridColumnType = (duckDBType: string): string => {
    return getType(duckDBType)
}
