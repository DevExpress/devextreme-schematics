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
  title = 'titleValue';
}
`;

export {
  stylesContent,
  appComponentTemplateContent,
  appComponentContent
};
