const stylesContent = `
html, body {
  margin: 0px;
  min-height: 100%;
  height: 100%;
}

* {
  box-sizing: border-box;
}`;

const appComponentTemplateContent = `<app-layoutName title={{title}}>
<router-outlet></router-outlet>

<app-footer>
    Copyright © 2011-2018 Developer Express Inc.
    <br/>
    All trademarks or registered trademarks are property of their respective owners.
</app-footer>
</app-layoutName>
`;

const appComponentContent = `import { Component } from '@angular/core';

@Component({
    selector: 'app-root',
    templateUrl: './componentName.component.html',
    styleUrls: ['./componentName.component.scss']
})
export class exportComponentNameComponent  {
  title = titleValue;
}
`;

const e2eTestContet = `import { AppPage } from './app.po';

describe('workspace-project App', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to appName!');
  });
});
`;

const testUtilsContent = `import { browser, by, element } from 'protractor';

export class AppPage {
  navigateTo() {
    return browser.get('/');
  }

  getParagraphText() {
    return element(by.css('app-root .dx-drawer-content .dx-card p:nth-child(2)')).getText();
  }
}
`;

export {
  stylesContent,
  appComponentTemplateContent,
  appComponentContent,
  e2eTestContet,
  testUtilsContent
};
