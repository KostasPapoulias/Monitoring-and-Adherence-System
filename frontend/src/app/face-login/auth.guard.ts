import { Injectable } from '@angular/core';
import { CanActivate, CanLoad, CanMatch, Route, UrlSegment, UrlTree, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanLoad, CanMatch {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    return this.checkAuth(state.url);
  }

  canLoad(route: Route): boolean | UrlTree {
    const url = `/${route.path || ''}`;
    return this.checkAuth(url);
  }

  canMatch(route: Route, segments: UrlSegment[]): boolean | UrlTree {
    const url = '/' + segments.map((s) => s.path).join('/');
    return this.checkAuth(url);
  }

  private checkAuth(targetUrl: string): boolean | UrlTree {
    if (this.auth.isAuthenticated()) {
      return true;
    }
    return this.router.createUrlTree(['/face-login'], { queryParams: { redirectTo: targetUrl } });
  }
}
