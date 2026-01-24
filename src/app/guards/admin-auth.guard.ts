import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { AdminSessionService } from '../core/admin-session';

export const adminAuthGuard: CanActivateChildFn = (_route, state) => {
  const session = inject(AdminSessionService);
  const router = inject(Router);

  if (session.isLoggedIn()) {
    if (state.url.includes('/admin/login')) {
      return router.createUrlTree(['/admin/texts']);
    }
    return true;
  }

  if (state.url.includes('/admin/login')) {
    return true;
  }

  return router.createUrlTree(['/admin/login']);
};
