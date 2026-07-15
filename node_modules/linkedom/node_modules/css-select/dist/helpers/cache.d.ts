import type { CompiledQuery, InternalOptions } from "../types.js";
/**
 * Some selectors such as `:contains` and (non-relative) `:has` will only be
 * able to match elements if their parents match the selector (as they contain
 * a subset of the elements that the parent contains).
 *
 * This function wraps the given `matches` function in a function that caches
 * the results of the parent elements, so that the `matches` function only
 * needs to be called once for each subtree.
 * @param next Matcher to run after this matcher succeeds.
 * @param options Configuration object for cache behavior.
 * @param options.adapter Adapter implementation used for DOM access.
 * @param options.cacheResults Whether results should be memoized by input root.
 * @param matches Compiled matcher function to wrap with caching.
 */
export declare function cacheParentResults<Node, ElementNode extends Node>(next: CompiledQuery<ElementNode>, { adapter, cacheResults }: InternalOptions<Node, ElementNode>, matches: (element: ElementNode) => boolean): CompiledQuery<ElementNode>;
//# sourceMappingURL=cache.d.ts.map