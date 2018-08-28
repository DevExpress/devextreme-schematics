import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';
import { Schema as ComponentOptions } from '@schematics/angular/component/schema';
import * as path from 'path';

const collectionPath = path.join(__dirname, '../collection.json');


describe('view', () => {
  const appOptions: any = {
      name: 'testApp',
      inlineStyle: false,
      inlineTemplate: false,
      routing: false,
      style: 'css',
      skipTests: false,
      skipPackageJson: false
  };

    const workspaceOptions: WorkspaceOptions = {
        name: 'workspace',
        newProjectRoot: 'projects',
        version: '6.0.0'
    };

    const defaultOptions: ComponentOptions = {
        name: 'test',
        inlineStyle: false,
        inlineTemplate: false,
        changeDetection: 'Default',
        styleext: 'css',
        skipImport: true,
        module: undefined,
        export: false,
        project: 'testApp'
    };

    const schematicRunner = new SchematicTestRunner('@schematics/angular', require.resolve('../../node_modules/@schematics/angular/collection.json'));
    let appTree: UnitTestTree;


    beforeEach(() => {
      appTree = schematicRunner.runSchematic('workspace', workspaceOptions);
      appTree = schematicRunner.runSchematic('application', appOptions, appTree);
    });

    it('should create view in pages folder', () => {
      const runner = new SchematicTestRunner('schematics', collectionPath);
      const tree = runner.runSchematic('view', defaultOptions, appTree);

      expect(tree.files).toContain("/src/app/pages/test/test.component.ts");
      expect(tree.files).toContain("/src/app/pages/test/test.component.html");
    });
});
