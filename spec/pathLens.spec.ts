/// <reference path="./jasmine"/>
import * as sut from '../index';

describe('Path Lens', () => {
    it('does not mutate input object when setting new value', () => {
        const path = sut.pathFromExpression((d: IData, i, j) => d.list.items[i].attributes[j]);
        const lens = sut.lensFromPath(path, [1, 0]);

        const inputData = data();
        const originalData = data();
        lens.set(inputData, 'Updated Attribute 1');
        expect(inputData).toEqual(originalData);
    });

    describe('Lens from path without indexes', () => {
        it('can get value', () => {
            const path = sut.pathFromExpression((d: IData) => d.list.items);
            const lens = sut.lensFromPath(path);

            expect(lens.get(data())).toEqual(data().list.items);
        });

        it('can set value', () => {
            const path = sut.pathFromExpression((d: IData, i, j) => d.list.items);
            const lens = sut.lensFromPath(path);

            const actualData = lens.set(data(), [{ name: 'New item' }]);
            const expectedData = data();
            expectedData.list.items = [{name: 'New item'}];
            expect(actualData).toEqual(expectedData);
        });
    });

    describe('Lens from path with static array indexes', () => {
        it('can get value', () => {
            const path = sut.pathFromExpression((d: IData) => d.list.items[1].attributes[0]);
            const lens = sut.lensFromPath(path);

            expect(lens.get(data())).toEqual('Attribute 1');
        });

        it('can set value', () => {
            const path = sut.pathFromExpression((d: IData) => d.list.items[1].attributes[0]);
            const lens = sut.lensFromPath(path);

            const actualData = lens.set(data(), 'Updated Attribute 1');
            const expectedData = data();
            expectedData.list.items[1].attributes[0] = 'Updated Attribute 1';
            expect(actualData).toEqual(expectedData);
        });
    });

    describe('Lens from path with variable indexes', () => {
        describe('Variable array indexes', () => {
            it('can get value', () => {
                const path = sut.pathFromExpression((d: IData, i, j) => d.list.items[i].attributes[j]);
                const lens = sut.lensFromPath(path, [1, 0]);

                expect(lens.get(data())).toEqual('Attribute 1');
            });

            it('can set value', () => {
                const path = sut.pathFromExpression((d: IData, i, j) => d.list.items[i].attributes[j]);
                const lens = sut.lensFromPath(path, [1, 0]);

                const actualData = lens.set(data(), 'Updated Attribute 1');
                const expectedData = data();
                expectedData.list.items[1].attributes[0] = 'Updated Attribute 1';
                expect(actualData).toEqual(expectedData);
            });
        });

        describe('Variable object properties', () => {
            it('can get value', () => {
                const path = sut.pathFromExpression((d: IData, authorProperty) => d.list[authorProperty].firstName);
                const lens = sut.lensFromPath(path, ['secondAuthor']);

                expect(lens.get(data())).toEqual('John');
            });

            it('can set value', () => {
                const path = sut.pathFromExpression((d: IData, authorProperty) => d.list[authorProperty].firstName);
                const lens = sut.lensFromPath(path, ['secondAuthor']);

                const actualData = lens.set(data(), 'Updated John');
                const expectedData = data();
                expectedData.list.secondAuthor.firstName = 'Updated John';
                expect(actualData).toEqual(expectedData);
            });
        })

        it('throws error on attempt to create a lens without passing values of variable indexes for a path containing variable indexes', () => {
            const path = sut.pathFromExpression((d: IData, i, j) => d.list.items[i].attributes[j]);
            expect(() => sut.lensFromPath(path))
            .toThrow(new Error('The path contains variable indexes however no values for the indexes were passed in the second argument.'));
        });

        it('throws error on attempt to create a lens by passing empty values of variable indexes for a path containing variable indexes', () => {
            const path = sut.pathFromExpression((d: IData, i, j) => d.list.items[i].attributes[j]);
            expect(() => sut.lensFromPath(path, []))
            .toThrow(new Error('The path contains variable indexes however no values for the indexes were passed in the second argument.'));
        });

        it('throws error on attempt to create a lens by passing incomplete values of variable indexes for a path containing variable indexes', () => {
            const path = sut.pathFromExpression((d: IData, i, j) => d.list.items[i].attributes[j]);
            expect(() => sut.lensFromPath(path, [1]))
            .toThrow(new Error('The path contains 2 variable index(es) however 1 value(s) for the indexes were passed in the second argument.'));
        });

        it('throws error on attempt to create a lens by passing incomplete values of variable indexes for a path containing variable indexes', () => {
            const path = sut.pathFromExpression((d: IData, i, j) => d.list.items[i].attributes[j]);
            expect(() => sut.lensFromPath(path, [1, 3, 5]))
            .toThrow(new Error('The path contains 2 variable index(es) however 3 value(s) for the indexes were passed in the second argument.'));
        });
    });

    describe('Lens for root array', () => {
        it('can get value', () => {
            const path = sut.pathFromExpression((items: IItem[]) => items[1].attributes[0]);
            const lens = sut.lensFromPath(path);

            expect(lens.get(data().list.items)).toEqual('Attribute 1');
        });

        it('can set value', () => {
            const path = sut.pathFromExpression((items: IItem[]) => items[1].attributes[0]);
            const lens = sut.lensFromPath(path);

            const actualData = lens.set(data().list.items, 'Updated Attribute 1');
            const expectedData = data().list.items;
            expectedData[1].attributes[0] = 'Updated Attribute 1';
            expect(actualData).toEqual(expectedData);
        });
    });

});

describe('Path Parser', () => {
    it('can create path from an untyped arrow expression', () => {
        const path = sut.pathFromExpression((d, i) => d[2].foo.bar[i].baz[5]);

        const actualPath = JSON.stringify(path); // Workaround for jasmine array comparison bug (https://github.com/jasmine/jasmine/issues/786)
        const expectedPath = JSON.stringify([{index: 2}, {property: 'foo'}, {property: 'bar'}, {variableIndexPosition: 0}, {property: 'baz'}, {index: 5}]);
        expect(actualPath).toEqual(expectedPath);
    });

    it('can create path from an untyped function expression', () => {
        const path = sut.pathFromExpression(function (d, i) { return d[2].foo.bar[i].baz[5]; });

        const actualPath = JSON.stringify(path);
        const expectedPath = JSON.stringify([{index: 2}, {property: 'foo'}, {property: 'bar'}, {variableIndexPosition: 0}, {property: 'baz'}, {index: 5}]);
        expect(actualPath).toEqual(expectedPath);
    });

    it('can create path from an typed arrow expression', () => {
        const path = sut.pathFromExpression((d: IData, i) => d.list.items[i].name);

        const actualPath = JSON.stringify(path);
        const expectedPath = JSON.stringify([{property: 'list'}, {property: 'items'}, {variableIndexPosition: 0}, {property: 'name'}]);
        expect(actualPath).toEqual(expectedPath);
    });
});

interface IData {
    list: IListData;
}

interface IListData {
    items: IItem[];
    firstAuthor: IAuthor;
    secondAuthor: IAuthor;
}

interface IItem {
    name: string;
    attributes?: string[];
}

interface IAuthor {
    firstName: string;
    lastName: string;
}

function data(): IData {
    return {
        list: {
            items: [
                { name: 'First Item Name' },
                { name: 'Second Item Name', attributes: ['Attribute 1', 'Attribute 2'] }
            ],
            firstAuthor: {
                firstName: 'Alice',
                lastName: 'Bar'
            },
            secondAuthor: {
                firstName: 'John',
                lastName: 'Foo'
            }
        }
    };
};
