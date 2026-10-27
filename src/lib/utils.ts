/**
 * Common utility functions for the Wedora application.
 */

/**
 * Combines conditional CSS class names into a single string.
 */
export function cn(...classes: (string | undefined | null | false | 0)[]): string {
  return classes.filter(Boolean).join(" ");
}
