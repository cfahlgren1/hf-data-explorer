import type { ICellRendererParams } from "ag-grid-community"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { z } from "zod"

import { ConversationCell } from "../components/cells/conversations/conversation-cell"
import { ConversationSchema } from "../types/schemas"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

type CellRenderer = React.ComponentType<ICellRendererParams> | string

const cellRegistry = new Map<z.ZodType<any>, CellRenderer>([
    [ConversationSchema, ConversationCell]
])

export function getCellRenderer(dataType: object): CellRenderer {
    for (const [schema, Component] of cellRegistry) {
        if (schema.safeParse(dataType).success) {
            return Component
        }
    }
    return null
}
