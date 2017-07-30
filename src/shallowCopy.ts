export default function<T>(source: T): T {
    const copy = {} as T & Indexable;
    for (const prop in source) {
        copy[prop.toString()] = (source as Indexable)[prop.toString()];
    }
    return copy;
}

type Indexable = { [key: string]: any };