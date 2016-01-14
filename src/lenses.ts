import shallowCopy from './shallowCopy';

export interface ILens<TInValue, TOutValue> {
    get: ILensGetter<TOutValue>;
    set: ILensSetter<TInValue>;
    modify: ILensModifier<TInValue, TOutValue>;
}

export interface ILensGetter<TValue> {
    (obj): TValue;
}

export interface ILensSetter<TValue> {
    (obj, value: TValue);
}

export interface ILensModifier<TInValue, TOutValue> {
    (obj, func: (value: TOutValue) => TInValue);
}

export function attributeLens(name: string): ILens<any, any> {
    return newLens(
        (obj) => obj[name],
        (obj, val) => {
            let newObj = shallowCopy(obj);
            newObj[name] = val;
            return newObj;
        }
    );
}

export function arrayIndexLens(index: number): ILens<any, any> {
    return newLens(
        (arr) => arr[index],
        (arr: any[], val) => {
            let newArr = arr.slice();
            newArr[index] = val;
            return newArr;
        }
    );
}

export function fallbackFor(lens: ILens<any, any>, getterFallbackValue, setterFallbackValue): ILens<any, any> {
    return newLens(
            obj => !!obj ? lens.get(obj) : getterFallbackValue,
            (obj, value) => lens.set(obj || setterFallbackValue, value));
}

export function compose(lenses: ILens<any, any>[]): ILens<any, any> {
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

function newLens(getter: ILensGetter<any>, setter: ILensSetter<any>): ILens<any, any> {
    return {
        get: getter,
        set: setter,
        modify: (obj, func) => setter(obj, func(getter(obj)))
    };
}
