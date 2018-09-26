import { Component, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Service } from './<%= dasherize(name) %>.service';

import { Dx<%= componentOptions.controlToScaffold %>Module } from 'devextreme-angular';

@Component({
  selector: '<%= name %>',
  templateUrl: './<%= dasherize(name) %>.component.html',
  styleUrls: ['./<%= dasherize(name) %>.component.css'],
  providers: [Service]
})

export class <%= name %>Component {
  dataSource: any;
<% const lookups = getDataLookups(apiSpec);
   for(let i = 0; i < lookups.length; i++) {
%>  <%= camelize(lookups[i].name) %>Data: any;
<% } %>
  constructor(service: Service) {
    this.dataSource = service.get<%= getDbName(apiSpec) %>();
<%  for(let i = 0; i < lookups.length; i++) {
%>    this.<%= camelize(lookups[i].name) %>Data = service.get<%= lookups[i].name %>();
<% } %>
  }
}
