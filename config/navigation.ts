export const publicNavigation = [
  { href: "/", label: "Inicio" },
  { href: "/editor", label: "Editor" },
  { href: "/colors", label: "Colores" },
  { href: "/objects", label: "Objetos" },
  { href: "/projects", label: "Mis proyectos" },
  { href: "/#como-funciona", label: "Cómo funciona" },
] as const;

export const footerNavigation = [
  ...publicNavigation,
  { href: "/privacy", label: "Privacidad" },
] as const;
