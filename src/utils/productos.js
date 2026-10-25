// Datos y formatos compartidos por Catálogo, Producido / Compras e Inventario.
// Los valores (UNIDAD, KG...) son los mismos que los enums del backend.

export const UNIDADES = [
  { valor: 'UNIDAD', etiqueta: 'Unidad', corta: 'un' },
  { valor: 'KG', etiqueta: 'Kilogramo', corta: 'kg' },
  { valor: 'GRAMO', etiqueta: 'Gramo', corta: 'g' },
  { valor: 'LITRO', etiqueta: 'Litro', corta: 'l' },
  { valor: 'ML', etiqueta: 'Mililitro', corta: 'ml' },
];

export const MODALIDADES = [
  { valor: 'PRODUCIDO', etiqueta: 'Producido' },
  { valor: 'COMPRADO', etiqueta: 'Comprado' },
];

export function unidadCorta(valor) {
  return UNIDADES.find(u => u.valor === valor)?.corta ?? valor?.toLowerCase() ?? '';
}

export function etiquetaModalidad(valor) {
  return MODALIDADES.find(m => m.valor === valor)?.etiqueta ?? valor ?? '';
}

// 1500 -> "$ 1.500" ; 1500.5 -> "$ 1.500,50"
export function formatearPrecio(numero) {
  const n = Number(numero) || 0;
  return '$ ' + n.toLocaleString('es-AR', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });
}

// 12 -> "12" ; 2.5 -> "2,5"
export function formatearCantidad(numero) {
  return (Number(numero) || 0).toLocaleString('es-AR', { maximumFractionDigits: 3 });
}

// "2026-10-25" -> "Domingo, 25 de octubre"
export function formatearFechaLarga(fechaISO) {
  const [a, m, d] = fechaISO.split('-').map(Number);
  const texto = new Date(a, m - 1, d).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Fecha de hoy en formato AAAA-MM-DD según la hora local (no UTC)
export function hoyISO() {
  return new Date().toLocaleDateString('en-CA');
}
