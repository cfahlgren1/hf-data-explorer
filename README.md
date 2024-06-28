# HF Data Explorer

A Chrome Extension for exploring and query Hugging Face datasets with SQL.

<video controls src="https://private-user-images.githubusercontent.com/13546028/344057018-27215e01-9bfa-4d32-ad17-1217a0b63067.mp4?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3MTk1NTYxNDUsIm5iZiI6MTcxOTU1NTg0NSwicGF0aCI6Ii8xMzU0NjAyOC8zNDQwNTcwMTgtMjcyMTVlMDEtOWJmYS00ZDMyLWFkMTctMTIxN2EwYjYzMDY3Lm1wND9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNDA2MjglMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjQwNjI4VDA2MjQwNVomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPWQwZGJkZTIxYTRhYmZjZWI5YTZlY2U2NDI0MGRlZDI3ZDQyODY3MzU3MTYzOTJjZTc1MTYzNmU4YjEwOWU3NGYmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0JmFjdG9yX2lkPTAma2V5X2lkPTAmcmVwb19pZD0wIn0.8onEuE0bdJWa8MwdsTYtMsPOvav41aLTcZ4KGLTr98M" title="Demo"></video>

## Getting Started

#### Installing

1. Download the latest release from the [Releases page](https://github.com/cfahlgren1/hf-data-explorer/releases).
2. Unzip the downloaded file.
3. Open Google Chrome and navigate to `chrome://extensions/`.
4. Enable "Developer mode" by toggling the switch in the top right corner.
5. Click on "Load unpacked" button.
6. Select the unzipped folder containing the extension files.
7. The HF Data Explorer extension should now be installed and visible in your Chrome toolbar.

#### Limitations

DuckDB WASM can only use ~ 4GB of memory (_more like 3.4GB with duckdb memory limit_). Since DuckDB WASM can't spill extra data to disk like the other clients, it may not be able to perform very large or advanced queries. However, DuckDB WASM is still **very** fast, performant, and can work for most workloads.

## Contributing

This is a [Plasmo extension](https://docs.plasmo.com/) project bootstrapped with [`plasmo init`](https://www.npmjs.com/package/plasmo).

First, run the development server:

```bash
pnpm dev
# or
npm run dev
```

Open your browser and load the appropriate development build. For example, if you are developing for the chrome browser, using manifest v3, use: `build/chrome-mv3-dev`.

You can start editing the popup by modifying `popup.tsx`. It should auto-update as you make changes. To add an options page, simply add a `options.tsx` file to the root of the project, with a react component default exported. Likewise to add a content page, add a `content.ts` file to the root of the project, importing some module and do some logic, then reload the extension on your browser.

For further guidance, [visit our Documentation](https://docs.plasmo.com/)

## Making production build

Run the following:

```bash
pnpm build
# or
npm run build
```

This should create a production bundle for your extension, ready to be zipped and published to the stores.
