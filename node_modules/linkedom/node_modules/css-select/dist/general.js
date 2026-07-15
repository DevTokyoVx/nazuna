import { SelectorType } from "css-what";
import { attributeRules } from "./attributes.js";
import { getElementParent } from "./helpers/querying.js";
import { compilePseudoSelector } from "./pseudo-selectors/index.js";
/*
 * All available rules
 */
/**
 * Compile a single selector token.
 * @param next Matcher to run after this matcher succeeds.
 * @param selector Selector used to match elements.
 * @param options Options that control this operation.
 * @param context Context nodes used to scope selector matching.
 * @param compileToken Function used to compile nested selector tokens.
 * @param hasExpensiveSubselector Whether the selector contains expensive subselectors.
 */
export function compileGeneralSelector(next, selector, options, context, compileToken, hasExpensiveSubselector) {
    const { adapter, equals, cacheResults } = options;
    switch (selector.type) {
        case SelectorType.PseudoElement: {
            throw new Error("Pseudo-elements are not supported by css-select");
        }
        case SelectorType.ColumnCombinator: {
            throw new Error("Column combinators are not yet supported by css-select");
        }
        case SelectorType.Attribute: {
            if (selector.namespace != null) {
                throw new Error("Namespaced attributes are not yet supported by css-select");
            }
            if (!options.xmlMode || options.lowerCaseAttributeNames) {
                selector.name = selector.name.toLowerCase();
            }
            return attributeRules[selector.action](next, selector, options);
        }
        case SelectorType.Pseudo: {
            return compilePseudoSelector(next, selector, options, context, compileToken);
        }
        // Tags
        case SelectorType.Tag: {
            if (selector.namespace != null) {
                throw new Error("Namespaced tag names are not yet supported by css-select");
            }
            let { name } = selector;
            if (!options.xmlMode || options.lowerCaseTags) {
                name = name.toLowerCase();
            }
            return function tag(element) {
                return adapter.getName(element) === name && next(element);
            };
        }
        // Traversal
        case SelectorType.Descendant: {
            if (!hasExpensiveSubselector ||
                cacheResults === false ||
                typeof WeakMap === "undefined") {
                return function descendant(element) {
                    let current = element;
                    while ((current = getElementParent(current, adapter))) {
                        if (next(current)) {
                            return true;
                        }
                    }
                    return false;
                };
            }
            const resultCache = new WeakMap();
            return function cachedDescendant(element) {
                let current = element;
                let result;
                while ((current = getElementParent(current, adapter))) {
                    const cached = resultCache.get(current);
                    if (cached === undefined) {
                        result ??= { matches: false };
                        result.matches = next(current);
                        resultCache.set(current, result);
                        if (result.matches) {
                            return true;
                        }
                    }
                    else {
                        if (result) {
                            result.matches = cached.matches;
                        }
                        return cached.matches;
                    }
                }
                return false;
            };
        }
        case "_flexibleDescendant": {
            // Include element itself, only used while querying an array
            return function flexibleDescendant(element) {
                let current = element;
                do {
                    if (next(current)) {
                        return true;
                    }
                    current = getElementParent(current, adapter);
                } while (current);
                return false;
            };
        }
        case SelectorType.Parent: {
            return function parent(element) {
                return adapter
                    .getChildren(element)
                    .some((element) => adapter.isTag(element) && next(element));
            };
        }
        case SelectorType.Child: {
            return function child(element) {
                const parent = getElementParent(element, adapter);
                return parent !== null && next(parent);
            };
        }
        case SelectorType.Sibling: {
            return function sibling(element) {
                const siblings = adapter.getSiblings(element);
                for (const currentSibling of siblings) {
                    if (equals(element, currentSibling)) {
                        break;
                    }
                    if (adapter.isTag(currentSibling) && next(currentSibling)) {
                        return true;
                    }
                }
                return false;
            };
        }
        case SelectorType.Adjacent: {
            if (adapter.prevElementSibling) {
                return function adjacent(element) {
                    // biome-ignore lint/style/noNonNullAssertion: checked by if statement
                    const previous = adapter.prevElementSibling(element);
                    return previous != null && next(previous);
                };
            }
            return function adjacent(element) {
                const siblings = adapter.getSiblings(element);
                let lastElement;
                for (const currentSibling of siblings) {
                    if (equals(element, currentSibling)) {
                        break;
                    }
                    if (adapter.isTag(currentSibling)) {
                        lastElement = currentSibling;
                    }
                }
                return !!lastElement && next(lastElement);
            };
        }
        case SelectorType.Universal: {
            if (selector.namespace != null && selector.namespace !== "*") {
                throw new Error("Namespaced universal selectors are not yet supported by css-select");
            }
            return next;
        }
    }
}
//# sourceMappingURL=general.js.map