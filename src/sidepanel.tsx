import { useEffect, useState } from "react"
import "./styles.css"

const IndexSidePanel = () => {

  const getCurrentTabId = (): Promise<number> => {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0].id)
      })
    })
  }

  const [tabId, setTabId] = useState<number>()

  useEffect(() => {
    getCurrentTabId().then(setTabId)
  }, [])

  return (
    <div className="p-4 bg-white shadow-lg h-screen rounded-lg">
      <h1 className="text-5xl font-bold text-gray-800">Data Explorer</h1>
      <p>Tab ID: {tabId}</p>
    </div>
  )
}

export default IndexSidePanel
