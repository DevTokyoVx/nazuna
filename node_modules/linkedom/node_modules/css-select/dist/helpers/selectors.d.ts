import { type Traversal } from "css-what";
import type { InternalSelector } from "../types.js";
/**
 * Check whether a selector token performs traversal.
 * @param token Selector token(s) to compile.
 */
export declare function isTraversal(token: InternalSelector): token is Traversal;
/**
 * Sort the parts of the passed selector, as there is potential for
 * optimization (some types of selectors are faster than others).
 * @param array Selector to sort
 */
export declare function sortRules(array: InternalSelector[]): void;
/**
 * Determine the quality of the passed token. The higher the number, the
 * faster the token is to execute.
 * @param token Token to get the quality of.
 * @returns The token's quality.
 */
export declare function getQuality(token: InternalSelector): number;
/**
 * Check whether a token or nested token includes `:scope`.
 * @param t Selector token under inspection.
 */
export declare function includesScopePseudo(t: InternalSelector): boolean;
//# sourceMappingURL=selectors.d.ts.map