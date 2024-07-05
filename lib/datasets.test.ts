import { describe, expect, it } from "@jest/globals"

import { getNameFilesAndConfig } from "./datasets"

describe("getNameFilesAndConfig", () => {
    const mockParquetFiles = [
        {
            dataset: "ibm/duorc",
            config: "ParaphraseRC",
            split: "test",
            url: "https://huggingface.co/datasets/ibm/duorc/resolve/refs%2Fconvert%2Fparquet/ParaphraseRC/test/0000.parquet",
            filename: "0000.parquet",
            size: 6136591
        },
        {
            dataset: "ibm/duorc",
            config: "ParaphraseRC",
            split: "train",
            url: "https://huggingface.co/datasets/ibm/duorc/resolve/refs%2Fconvert%2Fparquet/ParaphraseRC/train/0000.parquet",
            filename: "0000.parquet",
            size: 26005668
        },
        {
            dataset: "ibm/duorc",
            config: "ParaphraseRC",
            split: "validation",
            url: "https://huggingface.co/datasets/ibm/duorc/resolve/refs%2Fconvert%2Fparquet/ParaphraseRC/validation/0000.parquet",
            filename: "0000.parquet",
            size: 5566868
        },
        {
            dataset: "ibm/duorc",
            config: "SelfRC",
            split: "test",
            url: "https://huggingface.co/datasets/ibm/duorc/resolve/refs%2Fconvert%2Fparquet/SelfRC/test/0000.parquet",
            filename: "0000.parquet",
            size: 3035736
        },
        {
            dataset: "ibm/duorc",
            config: "SelfRC",
            split: "train",
            url: "https://huggingface.co/datasets/ibm/duorc/resolve/refs%2Fconvert%2Fparquet/SelfRC/train/0000.parquet",
            filename: "0000.parquet",
            size: 14851720
        },
        {
            dataset: "ibm/duorc",
            config: "SelfRC",
            split: "validation",
            url: "https://huggingface.co/datasets/ibm/duorc/resolve/refs%2Fconvert%2Fparquet/SelfRC/validation/0000.parquet",
            filename: "0000.parquet",
            size: 3114390
        }
    ]

    it("should correctly group files by config and split", () => {
        const result = getNameFilesAndConfig(mockParquetFiles)

        expect(result).toHaveLength(8)

        // Check config-split combinations
        expect(result).toContainEqual({
            name: "ParaphraseRC/test",
            files: [mockParquetFiles[0]]
        })
        expect(result).toContainEqual({
            name: "ParaphraseRC/train",
            files: [mockParquetFiles[1]]
        })
        expect(result).toContainEqual({
            name: "ParaphraseRC/validation",
            files: [mockParquetFiles[2]]
        })
        expect(result).toContainEqual({
            name: "SelfRC/test",
            files: [mockParquetFiles[3]]
        })
        expect(result).toContainEqual({
            name: "SelfRC/train",
            files: [mockParquetFiles[4]]
        })
        expect(result).toContainEqual({
            name: "SelfRC/validation",
            files: [mockParquetFiles[5]]
        })

        // Check config views
        expect(result).toContainEqual({
            name: "ParaphraseRC",
            files: [
                mockParquetFiles[0],
                mockParquetFiles[1],
                mockParquetFiles[2]
            ]
        })
        expect(result).toContainEqual({
            name: "SelfRC",
            files: [
                mockParquetFiles[3],
                mockParquetFiles[4],
                mockParquetFiles[5]
            ]
        })

        // Check sorting
        expect(result[0].name).toBe("ParaphraseRC")
        expect(result[1].name).toBe("ParaphraseRC/test")
        expect(result[2].name).toBe("ParaphraseRC/train")
        expect(result[3].name).toBe("ParaphraseRC/validation")
        expect(result[4].name).toBe("SelfRC")
        expect(result[5].name).toBe("SelfRC/test")
        expect(result[6].name).toBe("SelfRC/train")
        expect(result[7].name).toBe("SelfRC/validation")
    })

    it("should handle empty input", () => {
        const result = getNameFilesAndConfig([])
        expect(result).toEqual([])
    })
})
