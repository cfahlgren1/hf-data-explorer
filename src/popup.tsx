import "./styles.css"

import { Button } from "@/components/ui/button"
import React, { useEffect, useState } from "react"
import { FiExternalLink } from "react-icons/fi"

const DATASETS_URL = "https://huggingface.co/datasets"

const IndexPopup = () => {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)

  const userIsOnDatasetPage = currentUrl?.startsWith(DATASETS_URL + "/")

  useEffect(() => {
    const handleTabChange = () => {
      getCurrentTabUrl()
    }

    getCurrentTabUrl()

    chrome.tabs.onUpdated.addListener(handleTabChange)
    chrome.tabs.onActivated.addListener(handleTabChange)

    return () => {
      chrome.tabs.onUpdated.removeListener(handleTabChange)
      chrome.tabs.onActivated.removeListener(handleTabChange)
    }
  }, [])

  const getCurrentTabUrl = async () => {
    if (chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (tabs[0] && tabs[0].url) {
          setCurrentUrl(tabs[0].url)
        }
      })
    }
  }

  const openSidebar = async () => {
    if (userIsOnDatasetPage) {
      try {
        await chrome.sidePanel.open({ tabId: await getCurrentTabId() })
      } catch (error) {
        console.error("Error toggling sidebar:", error)
      }
      // close popup
      window.close()
    }
  }

  const getCurrentTabId = (): Promise<number> => {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0].id)
      })
    })
  }

  const openHuggingFaceDatasets = () => {
    window.open(DATASETS_URL, "_blank")
  }

  return (
    <div className="p-4 bg-white shadow-lg w-72 rounded-lg flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-gray-800">Data Explorer</h1>
      <p>Explore Hugging Face datasets interactively.</p>
      <div className="flex mt-10 flex-col space-y-2">
        {currentUrl?.startsWith(DATASETS_URL) ? (
          currentUrl === DATASETS_URL ? (
            <p className="text-lg text-center">
              Open a dataset to get started.
            </p>
          ) : (
            <Button variant="outline" onClick={openSidebar}>
              Open Data Explorer
            </Button>
          )
        ) : (
          <Button variant="ghost" onClick={openHuggingFaceDatasets}>
            Hugging Face Datasets <FiExternalLink className="ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}

export default IndexPopup
