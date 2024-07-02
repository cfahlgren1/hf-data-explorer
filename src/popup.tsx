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
    const [loadViewsOnStartup, setLoadViewsOnStartup] =
        useStorage("loadViewsOnStartup")

    const [apiToken, setApiToken] = useStorage("apiToken")

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

    const handleSetApiToken = () => {
        const token = prompt("Enter your Hugging Face API token")
        if (token) {
            setApiToken(token)
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.reload()
            })
        }
    }

    return (
        <div className="p-3 bg-white shadow-lg w-80 rounded-lg flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold text-gray-800">Data Explorer</h1>
            <p>Explore Hugging Face datasets interactively.</p>
            <div className="flex mt-10 flex-col space-y-4 w-full">
                {currentUrl?.startsWith(DATASETS_URL) ? (
                    currentUrl === DATASETS_URL ? (
                        <p className="text-lg text-center">
                            Open a dataset to get started.
                        </p>
                    ) : (
                        <div className="space-y-4 mb-6 w-full">
                            <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
                                <div className="flex items-center space-x-3">
                                    <Switch
                                        id="load-views"
                                        checked={loadViewsOnStartup}
                                        onCheckedChange={(checked) =>
                                            setLoadViewsOnStartup(checked)
                                        }
                                    />
                                    <div>
                                        <Label
                                            htmlFor="load-views"
                                            className="text-sm font-medium text-gray-800">
                                            Load Datasets on Startup
                                        </Label>
                                        <p className="text-xs text-gray-500">
                                            Automatically load configs and
                                            splits as views on startup
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-100 p-4 text-center rounded-lg shadow-sm">
                                <Label className="text-sm font-medium text-gray-800">
                                    Hugging Face API Token 🤗
                                </Label>
                                <p className="text-xs text-gray-500 mb-2">
                                    Add your API token to access private
                                    datasets.
                                </p>
                                <Button
                                    variant="outline"
                                    className="w-full text-slate-800"
                                    onClick={handleSetApiToken}>
                                    {apiToken
                                        ? "Update API Token"
                                        : "Set API Token"}
                                </Button>
                            </div>
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
