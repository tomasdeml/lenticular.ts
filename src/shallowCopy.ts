export default function<T>(source: T): T {
    const copy = {};
    for (const prop in source) {
        copy[prop.toString()] = source[prop.toString()];
    }
    return <T>copy;
}