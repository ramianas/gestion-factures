// Fichier: facture-front1/src/app/theme/layouts/admin-layout/navigation/nav-content/nav-content.component.ts

import { Component, OnInit, inject, output, OnDestroy } from '@angular/core';
import { CommonModule, Location, LocationStrategy } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Project import
import { NavigationItem, NavigationItems } from '../navigation';
import { environment } from 'src/environments/environment';
import { AuthService, User } from '../../../../../services/auth.service';

import { NavGroupComponent } from './nav-group/nav-group.component';

// icon
import { IconService } from '@ant-design/icons-angular';
import {
  DashboardOutline,
  CreditCardOutline,
  LoginOutline,
  QuestionOutline,
  ChromeOutline,
  FontSizeOutline,
  ProfileOutline,
  BgColorsOutline,
  AntDesignOutline,
  PlusOutline,
  FileTextOutline,
  CheckOutline,
  CheckCircleOutline,
  DollarOutline,
  BellOutline,
  UserOutline,
  BarChartOutline
} from '@ant-design/icons-angular/icons';
import { NgScrollbarModule } from 'ngx-scrollbar';

@Component({
  selector: 'app-nav-content',
  imports: [CommonModule, RouterModule, NavGroupComponent, NgScrollbarModule],
  templateUrl: './nav-content.component.html',
  styleUrls: ['./nav-content.component.scss']
})
export class NavContentComponent implements OnInit, OnDestroy {
  private location = inject(Location);
  private locationStrategy = inject(LocationStrategy);
  private iconService = inject(IconService);
  private destroy$ = new Subject<void>();

  // public props
  NavCollapsedMob = output();

  navigations: NavigationItem[] = [];
  currentUser: User | null = null;

  // version
  title = 'Demo application for version numbering';
  currentApplicationVersion = environment.appVersion;

  navigation = NavigationItems;
  windowWidth = window.innerWidth;

  // Constructor
  constructor(private authService: AuthService) {
    this.iconService.addIcon(
      ...[
        DashboardOutline,
        CreditCardOutline,
        FontSizeOutline,
        LoginOutline,
        ProfileOutline,
        BgColorsOutline,
        AntDesignOutline,
        ChromeOutline,
        QuestionOutline,
        PlusOutline,
        FileTextOutline,
        CheckOutline,
        CheckCircleOutline,
        DollarOutline,
        BellOutline,
        UserOutline,
        BarChartOutline,
        UserOutline,
        LoginOutline
      ]
    );
  }

  // Life cycle events
  ngOnInit() {
    if (this.windowWidth < 1025) {
      (document.querySelector('.coded-navbar') as HTMLDivElement).classList.add('menupos-static');
    }

    // S'abonner aux changements d'utilisateur
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.updateNavigationBasedOnRole();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateNavigationBasedOnRole(): void {
    if (!this.currentUser) {
      this.navigations = [];
      return;
    }

    // Filtrer la navigation en fonction du rôle de l'utilisateur
    this.navigations = this.filterNavigationByRole(NavigationItems, this.currentUser.role);
  }

  private filterNavigationByRole(items: NavigationItem[], userRole: string): NavigationItem[] {
    return items
      .map(item => {
        const filteredItem = { ...item };

        // Si c'est un groupe, filtrer ses enfants
        if (item.type === 'group' && item.children) {
          const filteredChildren = this.filterNavigationByRole(item.children, userRole);

          // Si aucun enfant n'est visible, ne pas afficher le groupe
          if (filteredChildren.length === 0) {
            return null;
          }

          filteredItem.children = filteredChildren;
        }
        // Si c'est un item avec des rôles spécifiés
        else if (item.type === 'item' && item.roles) {
          // Si l'utilisateur n'a pas le bon rôle, ne pas afficher l'item
          if (!item.roles.includes(userRole)) {
            return null;
          }
        }

        return filteredItem;
      })
      .filter(item => item !== null) as NavigationItem[];
  }

  fireOutClick() {
    let current_url = this.location.path();
    const baseHref = this.locationStrategy.getBaseHref();
    if (baseHref) {
      current_url = baseHref + this.location.path();
    }
    const link = "a.nav-link[ href='" + current_url + "' ]";
    const ele = document.querySelector(link);
    if (ele !== null && ele !== undefined) {
      const parent = ele.parentElement;
      const up_parent = parent?.parentElement?.parentElement;
      const last_parent = up_parent?.parentElement;
      if (parent?.classList.contains('coded-hasmenu')) {
        parent.classList.add('coded-trigger');
        parent.classList.add('active');
      } else if (up_parent?.classList.contains('coded-hasmenu')) {
        up_parent.classList.add('coded-trigger');
        up_parent.classList.add('active');
      } else if (last_parent?.classList.contains('coded-hasmenu')) {
        last_parent.classList.add('coded-trigger');
        last_parent.classList.add('active');
      }
    }
  }

  navMob() {
    if (this.windowWidth < 1025 && document.querySelector('app-navigation.coded-navbar')?.classList.contains('mob-open')) {
      this.NavCollapsedMob.emit();
    }
  }
}
