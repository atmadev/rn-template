export const getLast = <T>(a: T[]) => (a.length > 0 ? a[a.length - 1] : null)
export const capitalized = (string: string) => string.charAt(0).toUpperCase() + string.slice(1)
