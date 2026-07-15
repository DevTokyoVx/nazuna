import type { AnyNode } from "domhandler";
/**
 * Options for DOM serialization.
 */
export interface DomSerializerOptions {
    /**
     * Print an empty attribute's value.
     * @default xmlMode
     * @example With <code>emptyAttrs: false</code>: <code>&lt;input checked&gt;</code>
     * @example With <code>emptyAttrs: true</code>: <code>&lt;input checked=""&gt;</code>
     */
    emptyAttrs?: boolean;
    /**
     * Print self-closing tags for tags without contents. If `xmlMode` is set,
     * this will apply to all tags. Otherwise, only tags that are defined as
     * self-closing in the HTML specification will be printed as such.
     * @default xmlMode
     * @example With <code>selfClosingTags: false</code>: <code>&lt;foo&gt;&lt;/foo&gt;&lt;br&gt;&lt;/br&gt;</code>
     * @example With <code>xmlMode: true</code> and <code>selfClosingTags: true</code>: <code>&lt;foo/&gt;&lt;br/&gt;</code>
     * @example With <code>xmlMode: false</code> and <code>selfClosingTags: true</code>: <code>&lt;foo&gt;&lt;/foo&gt;&lt;br /&gt;</code>
     */
    selfClosingTags?: boolean;
    /**
     * Treat the input as an XML document; enables the `emptyAttrs` and
     * `selfClosingTags` options.
     *
     * If the value is `"foreign"`, it will try to correct mixed-case attribute
     * names.
     * @default false
     */
    xmlMode?: boolean | "foreign";
    /**
     * Encode characters reserved in HTML or XML in text and attribute values.
     *
     * If `xmlMode` is set or the value is not `'utf8'`, characters outside the
     * ASCII range will also be encoded as numeric entities.
     *
     * **Security:** Setting this to `false` disables encoding of `<`, `>`, `&`,
     * and (in attribute values) `'` — only `"` in attribute values is escaped.
     * This is safe for the round-trip case (DOM was parsed with
     * `decodeEntities: false`, so any markup characters in text or attribute
     * values exist only as entity references), and unsafe otherwise. If text
     * or attribute values in the DOM contain raw `<`, `>`, or `&`, those
     * characters will appear literally in the output.
     * @default `decodeEntities`
     */
    encodeEntities?: boolean | "utf8";
    /**
     * Default for `encodeEntities`. Named to match the parser option of the
     * same name so a single options object can be threaded through parse and
     * serialize for a faithful round-trip — for example, cheerio parses with
     * `decodeEntities: false` to preserve entity references and passes the
     * same option here so they are not re-encoded.
     *
     * Despite the name, on the serializer this option controls *encoding*.
     * Setting it to `false` carries the same caveat as `encodeEntities: false`
     * — see that option.
     * @default true
     */
    decodeEntities?: boolean;
}
/**
 * Renders a DOM node or an array of DOM nodes to a string.
 *
 * Can be thought of as the equivalent of the `outerHTML` of the passed
 * node(s).
 * @param node Node to be rendered.
 * @param options Changes serialization behavior
 */
export declare function render(node: AnyNode | ArrayLike<AnyNode>, options?: DomSerializerOptions): string;
export default render;
//# sourceMappingURL=index.d.ts.map