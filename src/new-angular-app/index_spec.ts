import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import * as path from 'path';


const collectionPath = path.join(__dirname, '../collection.json');


describe('devextreme-template', () => {
  it('works', () => {
    const runner = new SchematicTestRunner('schematics', collectionPath);
    const tree = runner.runSchematic('new-angular-app', { name: "testApp"}, Tree.empty());

    expect(tree.files).toContain("/testApp/angular.json");
    expect(tree.files).toContain("/testApp/src/app/app.module.ts");
  });
});
