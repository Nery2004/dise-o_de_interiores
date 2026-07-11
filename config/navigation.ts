export const publicNavigation = [
  { href: "/", label: "Inicio" },
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/colors", label: "Colores" },
  { href: "/projects", label: "Mis proyectos" },
  { href: "/editor", label: "Editor" },
] as const;

export const footerNavigation = [
  ...publicNavigation,
  { href: "/privacy", label: "Privacidad" },
] as const;
