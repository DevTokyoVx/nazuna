import * as boolbase from "boolbase";
import { parse } from "css-what";
import { isTag } from "domhandler";
import * as DomUtils from "domutils";
import { compileToken } from "./compile.js";
import { findAll, findOne, getNextSiblings } from "./helpers/querying.js";
const defaultEquals = (a, b) => a === b;
const defaultOptions = {
    adapter: { ...DomUtils, isTag },
    equals: defaultEquals,
};
function convertOptionFormats(options) {
    /*
     * We force one format of options to the other one.
     */
    // @ts-expect-error Default options may have incompatible `Node` / `ElementNode`.
    const finalOptions = options ?? defaultOptions;
    // @ts-expect-error Same as above.
    finalOptions.adapter ??= defaultOptions.adapter;
    // @ts-expect-error `equals` does not exist on `Options`
    finalOptions.equals ??= finalOptions.adapter?.equals ?? defaultEquals;
    return finalOptions;
}
/**
 * Compiles a selector to an executable function.
 *
 * The returned function checks if each passed node is an element. Use
 * `_compileUnsafe` to skip this check.
 * @param selector Selector to compile.
 * @param options Compilation options.
 * @param context Optional context for the selector.
 */
export function compile(selector, options, context) {
    const convertedOptions = convertOptionFormats(options);
    const next = _compileUnsafe(selector, convertedOptions, context);
    return next === boolbase.falseFunc
        ? boolbase.falseFunc
        : (element) => convertedOptions.adapter.isTag(element) && next(element);
}
/**
 * Like `compile`, but does not add a check if elements are tags.
 * @param selector Selector used to match elements.
 * @param options Options that control this operation.
 * @param context Context nodes used to scope selector matching.
 */
export function _compileUnsafe(selector, options, context) {
    return compileToken(typeof selector === "string" ? parse(selector) : selector, convertOptionFormats(options), context);
}
function getSelectorFunction(searchFunction) {
    return function select(query, elements, options) {
        const convertedOptions = convertOptionFormats(options);
        if (typeof query !== "function") {
            query = _compileUnsafe(query, convertedOptions, elements);
        }
        const filteredElements = prepareContext(elements, convertedOptions.adapter, query.shouldTestNextSiblings);
        return searchFunction(query, filteredElements, convertedOptions);
    };
}
/**
 * Normalize a query context and optionally include next siblings.
 * @param elements Elements to test against sibling-dependent selectors.
 * @param adapter Adapter implementation used for DOM operations.
 * @param shouldTestNextSiblings Whether sibling combinators should include following siblings.
 */
export function prepareContext(elements, adapter, shouldTestNextSiblings = false) {
    /*
     * Add siblings if the query requires them.
     * See https://github.com/fb55/css-select/pull/43#issuecomment-225414692
     */
    if (shouldTestNextSiblings) {
        elements = appendNextSiblings(elements, adapter);
    }
    return Array.isArray(elements)
        ? adapter.removeSubsets(elements)
        : adapter.getChildren(elements);
}
function appendNextSiblings(element, adapter) {
    // Order matters because jQuery seems to check the children before the siblings
    const elements = Array.isArray(element) ? [...element] : [element];
    const elementsLength = elements.length;
    for (let index = 0; index < elementsLength; index++) {
        const nextSiblings = getNextSiblings(elements[index], adapter);
        elements.push(...nextSiblings);
    }
    return elements;
}
/**
 * @template Node The generic Node type for the DOM adapter being used.
 * @template ElementNode The Node type for elements for the DOM adapter being used.
 * @param elems Elements to query. If it is an element, its children will be queried.
 * @param query can be either a CSS selector string or a compiled query function.
 * @param [options] options for querying the document.
 * @see compile for supported selector queries.
 * @returns All matching elements.
 */
export const selectAll = getSelectorFunction((query, elements, options) => query === boolbase.falseFunc || !elements || elements.length === 0
    ? []
    : findAll(query, elements, options));
/**
 * @template Node The generic Node type for the DOM adapter being used.
 * @template ElementNode The Node type for elements for the DOM adapter being used.
 * @param elems Elements to query. If it is an element, its children will be queried.
 * @param query can be either a CSS selector string or a compiled query function.
 * @param [options] options for querying the document.
 * @see compile for supported selector queries.
 * @returns the first match, or null if there was no match.
 */
export const selectOne = getSelectorFunction((query, elements, options) => query === boolbase.falseFunc || !elements || elements.length === 0
    ? null
    : findOne(query, elements, options));
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
export function is(element, query, options) {
    return (typeof query === "function" ? query : compile(query, options))(element);
}
/**
 * Alias for selectAll(query, elems, options).
 * @see [compile] for supported selector queries.
 */
export default selectAll;
//# sourceMappingURL=index.js.map