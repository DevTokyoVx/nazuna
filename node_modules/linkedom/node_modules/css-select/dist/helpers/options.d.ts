import type { InternalOptions } from "../types.js";
/**
 * Create a copy of options, omitting `context` and `rootFunc`.
 *
 * This is used when compiling nested selectors (e.g. inside `:is`, `:not`,
 * `:nth-child(… of S)`) so that the parent compilation state doesn't leak.
 */
export declare function copyOptions<Node, ElementNode extends Node>(options: InternalOptions<Node, ElementNode>): InternalOptions<Node, ElementNode>;
//# sourceMappingURL=options.d.ts.map