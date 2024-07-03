import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet"
import { getPurifiedMarkdown } from "@/lib/markdown"
import type { ICellRendererParams } from "ag-grid-community"
import React, { useState } from "react"

export const ConversationCell: React.FC<ICellRendererParams> = (props) => {
    const [isHovered, setIsHovered] = useState(false)

    if (!props.value) {
        return null
    }

    const messages = JSON.parse(JSON.stringify(props.value))

    return (
        <div
            className="relative w-full h-full"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}>
            <Sheet>
                <SheetTrigger asChild>
                    <a
                        className={`text-xs font-semibold text-black underline hover:cursor-pointer text-center mx-auto ${isHovered ? "block" : "hidden"}`}>
                        View
                    </a>
                </SheetTrigger>
                <SheetContent className="lg:min-w-[600px]">
                    <SheetHeader>
                        <SheetTitle>Conversation Details</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-4 mt-4 max-h-[calc(100vh-120px)] overflow-y-auto">
                        {messages.length > 0 &&
                            messages.map((message, index) => (
                                <div key={index} className="border rounded p-4">
                                    <p className="font-semibold text-sm mb-2">
                                        {message.from || message.role}:
                                    </p>
                                    <div className="prose">
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: getPurifiedMarkdown(
                                                    message.value ||
                                                        message.content ||
                                                        ""
                                                )
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                    </div>
                </SheetContent>
            </Sheet>
            <div
                className={`text-xs text-black ${isHovered ? "hidden" : "block"}`}>
                {JSON.stringify(props.value)}
            </div>
        </div>
    )
}

export default ConversationCell
