export default function<T>(source: T): T {
    const copy = {};
    for (const prop in source) {
        copy[prop] = source[prop];
    }
    return <T>copy;
}
