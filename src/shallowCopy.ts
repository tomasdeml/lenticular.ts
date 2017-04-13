function shallowCopy<T extends { [k: string]: any }>(source: T): T {
    const copy: { [k: string]: any } = {};
    for (const prop in source) {
        copy[prop.toString()] = source[prop.toString()];
    }
    return <T>copy;
}

export { shallowCopy };