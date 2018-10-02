import { Component } from '@angular/core';
import { Service } from './<%= dasherize(name) %>.service';

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
