import { describe, expect, it } from "@jest/globals"

import { isConversation } from "./schemas"

describe("isConversation", () => {
    it("should return true for a valid conversation structure", () => {
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

        expect(isConversation(validConversationType)).toBe(true)
    })

    it("should return false for an invalid conversation structure", () => {
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

        expect(isConversation(invalidConversationType)).toBe(false)
    })
})
