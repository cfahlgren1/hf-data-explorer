import "./styles.css"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import React, { useEffect, useState } from "react"
import { FaGithub } from "react-icons/fa"
import { FiExternalLink } from "react-icons/fi"

import { useStorage } from "@plasmohq/storage/hook"

const DATASETS_URL = "https://huggingface.co/datasets"

const IndexPopup = () => {
    const [currentUrl, setCurrentUrl] = useState<string | null>(null)

    // set default visibility to false and persist it to storage
    const [showExplorer, setShowExplorer] = useStorage("showExplorer", (v) =>
        v === undefined ? false : v
    )

    useEffect(() => {
        getCurrentTabInfo()
    }, [])

    const getCurrentTabInfo = async () => {
        if (chrome.tabs && chrome.tabs.query) {
            chrome.tabs.query(
                { active: true, currentWindow: true },
                async (tabs) => {
                    if (tabs[0] && tabs[0].url && tabs[0].id) {
                        setCurrentUrl(tabs[0].url)
                    }
                }
            )
        }
    }

    return (
        <div className="p-2 bg-white shadow-lg w-72 rounded-lg flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold text-gray-800">Data Explorer</h1>
            <p>Explore Hugging Face datasets interactively.</p>
            <div className="flex mt-10 flex-col space-y-2">
                {currentUrl?.startsWith(DATASETS_URL) ? (
                    currentUrl === DATASETS_URL ? (
                        <p className="text-lg text-center">
                            Open a dataset to get started.
                        </p>
                    ) : (
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="data-explorer"
                                checked={showExplorer}
                                onCheckedChange={(checked) =>
                                    setShowExplorer(checked)
                                }
                            />
                            <Label htmlFor="data-explorer">Show Explorer</Label>
                        </div>
                    )
                ) : (
                    <Button
                        variant="ghost"
                        onClick={() => window.open(DATASETS_URL, "_blank")}>
                        Datasets 🤗 <FiExternalLink className="ml-2" />
                    </Button>
                )}
            </div>
            <Button
                variant="link"
                className="text-xs italic mt-4 text-slate-800"
                onClick={() =>
                    window.open(
                        "https://github.com/cfahlgren1/hf-data-explorer",
                        "_blank"
                    )
                }>
                Contribute <FaGithub className="ml-2" />
            </Button>
        </div>
    )
}

export default IndexPopup
