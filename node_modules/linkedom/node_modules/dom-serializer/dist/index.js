import * as ElementType from "domelementtype";
import { encodeXML, escapeAttribute, escapeText } from "entities";
import { attributeNames, elementNames } from "./foreign-names.js";
// ── Constants ────────────────────────────────────────────────────────
/** Elements whose text content is never entity-encoded. */
const unencodedElements = new Set("style script xmp iframe noembed noframes plaintext noscript".split(" "));
/** HTML void elements — they cannot have children. */
const voidElements = new Set("area base basefont br col command embed frame hr img input isindex keygen link meta param source track wbr".split(" "));
/** Elements that switch the parser into foreign (XML-like) mode. */
const foreignElements = new Set(["svg", "math"]);
/**
 * Foreign-mode integration points: children of these elements are parsed
 * as HTML again, not as foreign content.
 */
const foreignModeIntegrationPoints = new Set("mi mo mn ms mtext annotation-xml foreignObject desc title".split(" "));
// ── Public API ───────────────────────────────────────────────────────
/**
 * Renders a DOM node or an array of DOM nodes to a string.
 *
 * Can be thought of as the equivalent of the `outerHTML` of the passed
 * node(s).
 * @param node Node to be rendered.
 * @param options Changes serialization behavior
 */
export function render(node, options = {}) {
    const nodes = "length" in node ? node : [node];
    /*
     * `xmlMode` is threaded as a separate argument through the internal
     * functions so that foreign-mode transitions (svg/mathml ↔ html) can
     * adjust it without copying the options object on every element.
     */
    const xmlMode = options.xmlMode ?? false;
    let output = "";
    // eslint-disable-next-line unicorn/no-for-loop
    for (let index = 0; index < nodes.length; index++) {
        output += renderNode(nodes[index], options, xmlMode);
    }
    return output;
}
export default render;
// ── Internal rendering ───────────────────────────────────────────────
/**
 * Render an array of child nodes (skips the single-node wrapping in `render`).
 * @param children The child nodes to render.
 * @param options The serialization options.
 * @param xmlMode The XML mode to use.
 */
function renderChildren(children, options, xmlMode) {
    let output = "";
    // eslint-disable-next-line unicorn/no-for-loop
    for (let index = 0; index < children.length; index++) {
        output += renderNode(children[index], options, xmlMode);
    }
    return output;
}
function renderNode(node, options, xmlMode) {
    switch (node.type) {
        case ElementType.Root: {
            return renderChildren(node.children, options, xmlMode);
        }
        case ElementType.Directive: {
            return `<${node.data}>`;
        }
        case ElementType.Comment: {
            return `<!--${node.data}-->`;
        }
        case ElementType.CDATA: {
            return `<![CDATA[${node.children[0].data}]]>`;
        }
        case ElementType.Script:
        case ElementType.Style:
        case ElementType.Tag: {
            return renderTag(node, options, xmlMode);
        }
        case ElementType.Text: {
            const element = node;
            const data = element.data || "";
            /*
             * Skip encoding when entities weren't decoded on input, or when
             * inside a raw-text element (script, style, etc.) in HTML mode.
             */
            if ((options.encodeEntities ?? options.decodeEntities) !== false &&
                !(!xmlMode &&
                    element.parent &&
                    unencodedElements.has(element.parent.name))) {
                // `xmlMode: "foreign"` is truthy
                return xmlMode || options.encodeEntities !== "utf8"
                    ? encodeXML(data)
                    : escapeText(data);
            }
            return data;
        }
    }
}
function renderTag(element, options, xmlMode) {
    if (xmlMode === "foreign") {
        // Correct lowercase element names back to their canonical mixed-case form
        element.name = elementNames.get(element.name) ?? element.name;
        // Integration points exit foreign mode: their children are HTML
        if (element.parent &&
            foreignModeIntegrationPoints.has(element.parent.name)) {
            xmlMode = false;
        }
    }
    if (!xmlMode && foreignElements.has(element.name)) {
        xmlMode = "foreign";
    }
    const { name, children } = element;
    // Cache the void-element check — used for both self-closing and closing-tag logic
    const isVoid = !xmlMode && voidElements.has(name);
    let tag = `<${name}${formatAttributes(element.attribs, options, xmlMode)}`;
    if (children.length === 0 &&
        (xmlMode
            ? options.selfClosingTags !== false
            : options.selfClosingTags && isVoid)) {
        // XML: `<br/>`, HTML: `<br />`
        tag += xmlMode ? "/>" : " />";
    }
    else {
        tag += ">";
        if (children.length > 0) {
            tag += renderChildren(children, options, xmlMode);
        }
        if (!isVoid) {
            tag += `</${name}>`;
        }
    }
    return tag;
}
// ── Attribute formatting ─────────────────────────────────────────────
function replaceQuotes(value) {
    return value.replaceAll('"', "&quot;");
}
/**
 * Serialize an element's attribute map to a string.
 *
 * Returns a string with a leading space before each attribute, or an
 * empty string if there are no attributes. This convention lets the
 * caller unconditionally concatenate the result onto the tag name.
 * @param attributes
 * @param options
 * @param xmlMode
 */
function formatAttributes(attributes, options, xmlMode) {
    if (!attributes)
        return "";
    /*
     * Pick the right encoder:
     *  - Encoding disabled → only escape double-quotes (for valid attributes)
     *  - XML / non-utf8    → full numeric entity encoding (encodeXML)
     *  - HTML + utf8       → minimal escaping (escapeAttribute)
     */
    const encode = (options.encodeEntities ?? options.decodeEntities) === false
        ? replaceQuotes
        : xmlMode || options.encodeEntities !== "utf8"
            ? encodeXML
            : escapeAttribute;
    const isForeign = xmlMode === "foreign";
    const showEmpty = !!(options.emptyAttrs ?? xmlMode);
    let result = "";
    for (const key in attributes) {
        if (!Object.hasOwn(attributes, key))
            continue;
        const value = attributes[key];
        const k = isForeign ? (attributeNames.get(key) ?? key) : key;
        result +=
            !showEmpty && (value == null || value === "")
                ? ` ${k}`
                : ` ${k}="${encode(value == null ? "" : String(value))}"`;
    }
    return result;
}
//# sourceMappingURL=index.js.map