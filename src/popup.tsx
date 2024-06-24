import "./styles.css"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { FiExternalLink } from "react-icons/fi"

const IndexPopup = () => {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleTabChange = () => {
      getCurrentTabUrl();
    };

    getCurrentTabUrl();

    chrome.tabs.onUpdated.addListener(handleTabChange);
    chrome.tabs.onActivated.addListener(handleTabChange);

    return () => {
      chrome.tabs.onUpdated.removeListener(handleTabChange);
      chrome.tabs.onActivated.removeListener(handleTabChange);
    };
  }, []);

  const getCurrentTabUrl = () => {
    if (chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url) {
          setCurrentUrl(tabs[0].url);
        }
      });
    }
  };

  const toggleSidebar = () => {
    console.log("Sidebar toggled")
  }

  const openHuggingFaceDatasets = () => {
    window.open("https://huggingface.co/datasets", "_blank")
  }

  return (
    <div className="p-4 bg-white shadow-lg w-72 rounded-lg flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-gray-800">Data Explorer</h1>
      <p>Explore Hugging Face datasets interactively.</p>
      <div className="flex mt-10 flex-col space-y-2">
        {currentUrl?.startsWith("https://huggingface.co/datasets") ? (
          currentUrl === "https://huggingface.co/datasets" ? (
            <p className="text-lg text-center">Open a dataset to get started.</p>
          ) : (
            <Button variant="outline" onClick={toggleSidebar}>
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
