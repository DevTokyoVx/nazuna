import * as boolbase from "boolbase";
import { parse } from "css-what";
import getNCheck from "nth-check";
import { cacheParentResults } from "../helpers/cache.js";
import { copyOptions } from "../helpers/options.js";
import { getElementParent } from "../helpers/querying.js";
/**
 * RFC 4647 extended filtering with pre-split subtags.
 * @param tag - Lowercased subtags of the element's language value.
 * @param range - Lowercased subtags of the language range to match against.
 */
function extendedFilter(tag, range) {
    if (range[0] !== "*" && range[0] !== tag[0])
        return false;
    let tagIndex = 1;
    for (let rangeIndex = 1; rangeIndex < range.length; rangeIndex++) {
        if (range[rangeIndex] === "*")
            continue;
        // Skip non-singleton tag subtags until we find a match.
        while (tagIndex < tag.length && tag[tagIndex] !== range[rangeIndex]) {
            if (tag[tagIndex++].length <= 1)
                return false;
        }
        if (tagIndex >= tag.length)
            return false;
        tagIndex++;
    }
    return true;
}
/** @see {@link https://www.w3.org/TR/selectors-4/#the-nth-child-pseudo} */
const nthOfRegex = /^(.+?)\s+of\s+(.+)$/is;
function compileNth(reverse, ofType) {
    return function nth(next, rule, options, context, compileToken) {
        const { adapter, equals } = options;
        const ofMatch = ofType ? null : rule.match(nthOfRegex);
        const nthCheck = getNCheck(ofMatch ? ofMatch[1].trim() : rule);
        if (nthCheck === boolbase.falseFunc)
            return boolbase.falseFunc;
        const ofSelector = ofMatch && compileToken
            ? compileToken(parse(ofMatch[2].trim()), copyOptions(options), context)
            : undefined;
        if (ofSelector === boolbase.falseFunc)
            return boolbase.falseFunc;
        if (nthCheck === boolbase.trueFunc && !ofSelector) {
            return (element) => getElementParent(element, adapter) !== null && next(element);
        }
        const shouldCount = ofSelector
            ? (_element, sibling) => ofSelector(sibling)
            : ofType
                ? (element, sibling) => adapter.getName(sibling) === adapter.getName(element)
                : boolbase.trueFunc;
        if (reverse) {
            return function nthLast(element) {
                if (ofSelector && !ofSelector(element))
                    return false;
                const siblings = adapter.getSiblings(element);
                let pos = 0;
                for (let index = siblings.length - 1; index >= 0; index--) {
                    const sibling = siblings[index];
                    if (equals(element, sibling))
                        break;
                    if (adapter.isTag(sibling) && shouldCount(element, sibling))
                        pos++;
                }
                return nthCheck(pos) && next(element);
            };
        }
        return function nth(element) {
            if (ofSelector && !ofSelector(element))
                return false;
            const siblings = adapter.getSiblings(element);
            let pos = 0;
            for (const sibling of siblings) {
                if (equals(element, sibling))
                    break;
                if (adapter.isTag(sibling) && shouldCount(element, sibling))
                    pos++;
            }
            return nthCheck(pos) && next(element);
        };
    };
}
/**
 * Pre-compiled pseudo filters.
 */
export const filters = {
    contains(next, text, options) {
        const { getText } = options.adapter;
        return cacheParentResults(next, options, (element) => getText(element).includes(text));
    },
    icontains(next, text, options) {
        const itext = text.toLowerCase();
        const { getText } = options.adapter;
        return cacheParentResults(next, options, (element) => getText(element).toLowerCase().includes(itext));
    },
    // Location specific methods
    "nth-child": compileNth(false, false),
    "nth-last-child": compileNth(true, false),
    "nth-of-type": compileNth(false, true),
    "nth-last-of-type": compileNth(true, true),
    // TODO determine the actual root element
    root(next, _rule, { adapter }) {
        return (element) => getElementParent(element, adapter) === null && next(element);
    },
    scope(next, rule, options, context) {
        const { equals } = options;
        if (!context || context.length === 0) {
            // Equivalent to :root
            return filters["root"](next, rule, options);
        }
        if (context.length === 1) {
            // NOTE: can't be unpacked, as :has uses this for side-effects
            return (element) => equals(context[0], element) && next(element);
        }
        return (element) => context.includes(element) && next(element);
    },
    lang(next, code, { adapter }) {
        const ranges = code
            .split(",")
            .map((r) => r.trim())
            .filter((r) => r.length > 0)
            .map((r) => r
            .replace(/^['"]|['"]$/g, "")
            .toLowerCase()
            .split("-"));
        return function lang(element) {
            let node = element;
            while (node != null) {
                const value = adapter.getAttributeValue(node, "xml:lang") ??
                    adapter.getAttributeValue(node, "lang");
                if (value != null) {
                    if (!value) {
                        return ranges.some((r) => r[0] === "") && next(element);
                    }
                    const tag = value.toLowerCase().split("-");
                    return (ranges.some((r) => extendedFilter(tag, r)) &&
                        next(element));
                }
                const parent = adapter.getParent(node);
                node =
                    parent != null && adapter.isTag(parent)
                        ? parent
                        : null;
            }
            return ranges.some((r) => r[0] === "") && next(element);
        };
    },
    hover: dynamicStatePseudo("isHovered"),
    visited: dynamicStatePseudo("isVisited"),
    active: dynamicStatePseudo("isActive"),
};
/**
 * Dynamic state pseudos. These depend on optional Adapter methods.
 * @param name The name of the adapter method to call.
 * @returns Pseudo for the `filters` object.
 */
function dynamicStatePseudo(name) {
    return function dynamicPseudo(next, _rule, { adapter }) {
        const filterFunction = adapter[name];
        if (typeof filterFunction !== "function") {
            return boolbase.falseFunc;
        }
        return function active(element) {
            return filterFunction(element) && next(element);
        };
    };
}
//# sourceMappingURL=filters.js.map