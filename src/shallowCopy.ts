export interface INameToValueMap { 
    [key: string]: any;
}
export default function<T>(source: T): T {
    const copy: INameToValueMap = {};
    for (const prop in source) {
        let sourceAsDict = objectAsDict(source);
        copy[prop.toString()] = sourceAsDict[prop.toString()];
    }
    return <T>copy;
}

export function objectAsDict(item: any): INameToValueMap {
    return item as any as INameToValueMap;
}