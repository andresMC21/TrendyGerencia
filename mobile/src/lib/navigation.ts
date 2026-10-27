import { router, type Href } from 'expo-router';

/** Limpia el historial y abre la pantalla indicada (al entrar o salir de la sesión). */
export function resetTo(href: Href) {
  if (router.canDismiss()) router.dismissAll();
  router.replace(href);
}
