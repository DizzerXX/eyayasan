import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { SidebarComponent } from '../core/sidebar/sidebar.component';
import { TableComponent } from '../core/table/table.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';



@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    DashboardComponent,
    SidebarComponent,
    TableComponent,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    DashboardComponent,
    SidebarComponent,
    FormsModule,
    TableComponent
  ]
})
export class DashboardModule { }
