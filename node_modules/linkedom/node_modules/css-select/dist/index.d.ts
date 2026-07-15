import { type Selector } from "css-what";
import type { Adapter, CompiledQuery, Options, Query } from "./types.js";
/**
 * Compiles a selector to an executable function.
 *
 * The returned function checks if each passed node is an element. Use
 * `_compileUnsafe` to skip this check.
 * @param selector Selector to compile.
 * @param options Compilation options.
 * @param context Optional context for the selector.
 */
export declare function compile<Node, ElementNode extends Node>(selector: string | Selector[][], options?: Options<Node, ElementNode>, context?: Node[] | Node): CompiledQuery<Node>;
/**
 * Like `compile`, but does not add a check if elements are tags.
 * @param selector Selector used to match elements.
 * @param options Options that control this operation.
 * @param context Context nodes used to scope selector matching.
 */
export declare function _compileUnsafe<Node, ElementNode extends Node>(selector: string | Selector[][], options?: Options<Node, ElementNode>, context?: Node[] | Node): CompiledQuery<ElementNode>;
/**
 * Normalize a query context and optionally include next siblings.
 * @param elements Elements to test against sibling-dependent selectors.
 * @param adapter Adapter implementation used for DOM operations.
 * @param shouldTestNextSiblings Whether sibling combinators should include following siblings.
 */
export declare function prepareContext<Node, ElementNode extends Node>(elements: Node | Node[], adapter: Adapter<Node, ElementNode>, shouldTestNextSiblings?: boolean): Node[];
/**
 * @template Node The generic Node type for the DOM adapter being used.
 * @template ElementNode The Node type for elements for the DOM adapter being used.
 * @param elems Elements to query. If it is an element, its children will be queried.
 * @param query can be either a CSS selector string or a compiled query function.
 * @param [options] options for querying the document.
 * @see compile for supported selector queries.
 * @returns All matching elements.
 */
export declare const selectAll: <Node, ElementNode extends Node>(query: Query<ElementNode>, elements: Node | Node[], options?: Options<Node, ElementNode> | undefined) => ElementNode[];
/**
 * @template Node The generic Node type for the DOM adapter being used.
 * @template ElementNode The Node type for elements for the DOM adapter being used.
 * @param elems Elements to query. If it is an element, its children will be queried.
 * @param query can be either a CSS selector string or a compiled query function.
 * @param [options] options for querying the document.
 * @see compile for supported selector queries.
 * @returns the first match, or null if there was no match.
 */
export declare const selectOne: <Node, ElementNode extends Node>(query: Query<ElementNode>, elements: Node | Node[], options?: Options<Node, ElementNode> | undefined) => ElementNode | null;
/**
 * Tests whether or not an element is matched by query.
 * @template Node The generic Node type for the DOM adapter being used.
 * @template ElementNode The Node type for elements for the DOM adapter being used.
 * @param element The element to test if it matches the query.
 * @param query can be either a CSS selector string or a compiled query function.
 * @param [options] options for querying the document.
 * @see compile for supported selector queries.
 * @returns Whether the element matches the query.
 */
export declare function is<Node, ElementNode extends Node>(element: ElementNode, query: Query<ElementNode>, options?: Options<Node, ElementNode>): boolean;
/**
 * Alias for selectAll(query, elems, options).
 * @see [compile] for supported selector queries.
 */
export default selectAll;
export type { Options } from "./types.js";
//# sourceMappingURL=index.d.ts.map