// CSS imports
import cssText from "data-text:~/styles.css"
import agCSS from "data-text:ag-grid-community/styles/ag-grid.css"
import agTheme from "data-text:ag-grid-community/styles/ag-theme-balham.css"
import type { PlasmoCSConfig } from "plasmo"
import React, { useEffect, useState } from "react"
import { FiMaximize2 } from "react-icons/fi"

import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-balham.css"
import "./styles.css"

import { useStorage } from "@plasmohq/storage/hook"

import Explorer from "./explorer"

export const config: PlasmoCSConfig = {
    matches: ["https://huggingface.co/datasets/*/*"]
}

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = cssText + agCSS + agTheme
    return style
}

const Content = () => {
    const [showExplorer, setShowExplorer] = useState(false)
    const [loadViewsOnStartup, setLoadViewsOnStartup] = useStorage(
        "loadViewsOnStartup",
        (v) => (v === undefined ? true : v)
    )

    useEffect(() => {
        const handleError = (event) => {
            event.preventDefault()
            // ignore context invalidated errors, they are normal
            if (!event.message.includes("Extension context invalidated.")) {
                console.error(event.message)
            }
        }

        window.addEventListener("error", handleError)

        return () => {
            window.removeEventListener("error", handleError)
        }
    }, [])

    if (showExplorer) {
        return (
            <Explorer
                onClose={() => setShowExplorer(false)}
                loadViewsOnStartup={loadViewsOnStartup}
            />
        )
    }

    // show minimized explorer button if closed
    return (
        <button
            onClick={() => setShowExplorer(true)}
            className="fixed bottom-10 left-10 bg-slate-800 hover:text-yellow text-white rounded-full p-3 shadow-lg z-50 transition-transform duration-200 ease-in-out hover:scale-110"
            aria-label="Open explorer">
            <FiMaximize2 size={24} />
        </button>
    )
}

export default Content
