export default function<T extends Record<string, any>>(source: T): T {
    const copy = {} as Record<string, any>;
    for (const prop in source) {
        copy[prop.toString()] = source[prop.toString()];
    }
    return copy as T;
}
