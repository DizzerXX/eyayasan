import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {

  navItem: any[] = [
    {
      label: "tier 1 item 1",
      children: [
        {
          label: "tier 2 item 1",
          children: [
            {
              label: "tier 3 item 1"
            }
          ]
        },
        {
          label: "tier 2 item 2",
          children: [
          ]
        }
      ]
    },
    {
      label: "tier 1 item 2"
    }
  ]
}
