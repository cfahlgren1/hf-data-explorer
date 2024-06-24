import "./styles.css"

import { Button } from "@/components/ui/button"
import { FiExternalLink } from "react-icons/fi"

const IndexPopup = () => {
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
        <Button variant="ghost" onClick={openHuggingFaceDatasets}>
          Hugging Face Datasets <FiExternalLink className="ml-2" />
        </Button>
        <Button variant="outline" onClick={toggleSidebar}>
          Open Data Explorer
        </Button>
      </div>
    </div>
  )
}

export default IndexPopup
