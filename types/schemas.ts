import { z } from "zod"

export const ConversationSchema = z.object({
    children: z.array(
        z.object({
            name: z.literal("l"),
            type: z.object({
                children: z.array(
                    z.object({
                        name: z.union([
                            z.literal("from"),
                            z.literal("value"),
                            z.literal("role"),
                            z.literal("content")
                        ]),
                        type: z.object({}).optional()
                    })
                )
            })
        })
    )
})

export type Conversation = z.infer<typeof ConversationSchema>

export function isConversation(data: unknown): data is Conversation {
    return ConversationSchema.safeParse(data).success
}
