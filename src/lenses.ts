import shallowCopy from './shallowCopy';

export interface ILens {
    get: ILensGetter;
    set: ILensSetter;
    modify: ILensModifier;
}

export interface ILensGetter {
    (obj): any;
}

export interface ILensSetter {
    (obj, value): any;
}

export interface ILensModifier {
    (obj, func: (value) => any): any;
}

export function attributeLens(name: string): ILens {
    return newLens(
        (obj) => obj[name],
        (obj, val) => {
            let newObj = shallowCopy(obj);
            newObj[name] = val;
            return newObj;
        }
    );
}

export function arrayIndexLens(index: number): ILens {
    return newLens(
        (arr) => arr[index],
        (arr: any[], val) => {
            let newArr = arr.slice();
            newArr[index] = val;
            return newArr;
        }
    );
}

export function fallbackFor(lens: ILens, getterFallbackValue, setterFallbackValue): ILens {
    return newLens(
            obj => !!obj ? lens.get(obj) : getterFallbackValue,
            (obj, value) => lens.set(obj || setterFallbackValue, value));
}

export function compose(lenses: ILens[]): ILens {
    return lenses.reduce((lens1, lens2) =>
        newLens(
            (obj) => {
                const nextObj = lens1.get(obj);
                return lens2.get(nextObj);
            },
            (obj, val) => {
                const parentObj = lens1.get(obj);
                const newParentObj = lens2.set(parentObj, val);
                return lens1.set(obj, newParentObj);
            }
        ),
        rootLens);
}

const rootLens = newLens(
    (obj) => obj,
    (obj, val) => val
);

function newLens(getter: ILensGetter, setter: ILensSetter): ILens {
    return {
        get: getter,
        set: setter,
        modify: (obj, func) => setter(obj, func(getter(obj)))
    };
}
