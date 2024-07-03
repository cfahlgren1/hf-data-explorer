import DOMPurify from "dompurify"
import hljs from "highlight.js"
import { Marked } from "marked"
import { markedHighlight } from "marked-highlight"

const marked = new Marked(
    markedHighlight({
        langPrefix: "hljs language-",
        highlight(code, lang, info) {
            const language = hljs.getLanguage(lang) ? lang : "plaintext"
            return hljs.highlight(code, { language }).value
        }
    })
)

const purifyConfig = {
    ALLOWED_TAGS: [
        "p",
        "br",
        "strong",
        "em",
        "code",
        "pre",
        "blockquote",
        "ul",
        "ol",
        "li",
        "span"
    ],
    ALLOWED_ATTR: ["class"]
}

export function getPurifiedMarkdown(content: string): string {
    return DOMPurify.sanitize(marked.parse(content), purifyConfig)
}
