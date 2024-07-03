import { describe, expect, it, jest } from "@jest/globals"

import { getCellRenderer } from "./utils"

jest.mock("../components/cells/conversations/conversation-cell", () => ({
    ConversationCell: "ConversationCell"
}))

describe("getCellRenderer", () => {
    it("should return ConversationCell for a valid conversation structure", () => {
        const validConversationType = {
            children: [
                {
                    name: "l",
                    type: {
                        children: [
                            {
                                name: "from",
                                type: {},
                                nullable: true,
                                metadata: {}
                            },
                            {
                                name: "value",
                                type: {},
                                nullable: true,
                                metadata: {}
                            }
                        ]
                    },
                    nullable: true,
                    metadata: {}
                }
            ]
        }

        expect(getCellRenderer(validConversationType)).toBe("ConversationCell")
    })

    it("should return agGroupCellRenderer for an invalid conversation structure", () => {
        const invalidConversationType = {
            children: [
                {
                    name: "invalid",
                    type: {
                        children: [
                            {
                                name: "invalidField",
                                type: {},
                                nullable: true,
                                metadata: {}
                            }
                        ]
                    },
                    nullable: true,
                    metadata: {}
                }
            ]
        }

        expect(getCellRenderer(invalidConversationType)).toBe(null)
    })
})
