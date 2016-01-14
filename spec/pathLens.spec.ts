/// <reference path="./jasmine"/>
import * as pathLens from '../src/pathLens';

describe('pathFromExpression', () => {
    it('can create path from untyped arrow expression', () => {
        const path = pathLens.pathFromExpression((d, i) => d.foo.bar[i].baz[5]);

        const actualPath = JSON.stringify(path);
        const expectedPath = JSON.stringify([{property: 'foo'}, {property: 'bar'}, {variableIndexPosition: 0}, {property: 'baz'}, {staticIndex: 5}]);
        expect(actualPath).toEqual(expectedPath);
    });

    it('can create path from untyped function expression', () => {
        const path = pathLens.pathFromExpression(function (d, i) { return d.foo.bar[i].baz[5]; });

        const actualPath = JSON.stringify(path);
        const expectedPath = JSON.stringify([{property: 'foo'}, {property: 'bar'}, {variableIndexPosition: 0}, {property: 'baz'}, {staticIndex: 5}]);
        expect(actualPath).toEqual(expectedPath);
    });

    it('can create path from typed arrow expression', () => {
        const path = pathLens.pathFromExpression((d: IData, i) => d.list.items[i].name);

        const actualPath = JSON.stringify(path);
        const expectedPath = JSON.stringify([{property: 'list'}, {property: 'items'}, {variableIndexPosition: 0}, {property: 'name'}]);
        expect(actualPath).toEqual(expectedPath);
    });
});

describe('Path Lens', () => {
    it('can get value by simple path without array indexes', () => {
        const path = pathLens.pathFromExpression((d: IData) => d.list.items);
        const lens = pathLens.lensFromPath(path);

        expect(lens.get(data())).toEqual(data().list.items);
    });

    it('can set value by simple path without array indexes', () => {
        const path = pathLens.pathFromExpression((d: IData, i, j) => d.list.items);
        const lens = pathLens.lensFromPath(path);

        const actualData = lens.set(data(), [{ name: 'New item' }]);
        const expectedData = data();
        expectedData.list.items = [{name: 'New item'}];
        expect(actualData).toEqual(expectedData);
    });

    it('can get value by path containing variable array indexes', () => {
        const path = pathLens.pathFromExpression((d: IData, i, j) => d.list.items[i].attributes[j]);
        const lens = pathLens.lensFromPath(path, [1, 0]);

        expect(lens.get(data())).toEqual('Attribute 1');
    });

    it('can set value by path containing variable array indexes', () => {
        const path = pathLens.pathFromExpression((d: IData, i, j) => d.list.items[i].attributes[j]);
        const lens = pathLens.lensFromPath(path, [1, 0]);

        const actualData = lens.set(data(), 'Updated Attribute 1');
        const expectedData = data();
        expectedData.list.items[1].attributes[0] = 'Updated Attribute 1';
        expect(actualData).toEqual(expectedData);
    });

    it('does not mutate input object when setting new value', () => {
        const path = pathLens.pathFromExpression((d: IData, i, j) => d.list.items[i].attributes[j]);
        const lens = pathLens.lensFromPath(path, [1, 0]);

        const inputData = data();
        const originalData = data();
        lens.set(inputData, 'Updated Attribute 1');
        expect(inputData).toEqual(originalData);
    });

    // TODO
});

interface IData {
    list: IListData;
}

interface IListData {
    items: IItem[];
}

interface IItem {
    name: string;
    attributes?: string[];
}

function data(): IData {
    return {
        list: {
            items: [
                { name: 'First Item Name' },
                { name: 'Second Item Name', attributes: ['Attribute 1', 'Attribute 2'] }
            ]
        }
    };
};
