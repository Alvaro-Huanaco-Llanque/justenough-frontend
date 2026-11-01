// Datos y formatos compartidos por las pantallas.
// Los valores (UNIDAD, KG...) son los mismos que los enums del backend.

export const UNIDADES = [
  { valor: 'UNIDAD', etiqueta: 'Unidad', corta: 'unidades' },   // siempre "unidades", sin abreviar, para que no haya confusión
  { valor: 'KG', etiqueta: 'Kilogramo', corta: 'kg' },
  { valor: 'GRAMO', etiqueta: 'Gramo', corta: 'g' },
  { valor: 'LITRO', etiqueta: 'Litro', corta: 'l' },
  { valor: 'ML', etiqueta: 'Mililitro', corta: 'ml' },
];

export const MODALIDADES = [
  { valor: 'PRODUCIDO', etiqueta: 'Producido' },
  { valor: 'COMPRADO', etiqueta: 'Comprado' },
];

// Motivos de Desechos (enum MotivoDesecho)
export const MOTIVOS_DESECHO = [
  { valor: 'VENCIMIENTO', etiqueta: 'Fin de vida útil' },
  { valor: 'DANIADO', etiqueta: 'Producto dañado' },
  { valor: 'DEFECTO_ELABORACION', etiqueta: 'Defecto de cocción' },
  { valor: 'OTRO', etiqueta: 'Otro' },
];

// Motivos para ajustar una sugerencia (enum MotivoAjuste)
export const MOTIVOS_AJUSTE = [
  { valor: 'FERIADO', etiqueta: 'Feriado' },
  { valor: 'EVENTO', etiqueta: 'Evento' },
  { valor: 'PROMOCION', etiqueta: 'Promoción' },
  { valor: 'CLIMA', etiqueta: 'Clima' },
  { valor: 'OTRO', etiqueta: 'Otro' },
];

export const RUBROS = [
  { valor: 'PANADERIA', etiqueta: 'Panadería' },
  { valor: 'CAFETERIA', etiqueta: 'Cafetería' },
  { valor: 'RESTAURANTE', etiqueta: 'Restaurante' },
];

export function unidadCorta(valor) {
  return UNIDADES.find(u => u.valor === valor)?.corta ?? valor?.toLowerCase() ?? '';
}

export function etiquetaModalidad(valor) {
  return MODALIDADES.find(m => m.valor === valor)?.etiqueta ?? valor ?? '';
}

export function etiquetaMotivoAjuste(valor) {
  return MOTIVOS_AJUSTE.find(m => m.valor === valor)?.etiqueta ?? valor ?? '';
}

// "ALTA" -> "Alta"
export function etiquetaConfianza(nivel) {
  if (nivel === 'ALTA') return 'Alta';
  if (nivel === 'MEDIA') return 'Media';
  return 'Baja';
}

// Colores de la etiqueta de confianza (Alta verde, Media amarilla, Baja roja)
export function colorConfianza(nivel) {
  if (nivel === 'ALTA') return { bg: '#E6F4EA', color: '#137333' };
  if (nivel === 'MEDIA') return { bg: '#FEF7E0', color: '#B06000' };
  return { bg: '#FCE8E6', color: '#C5221F' };
}

// 1500 -> "$ 1.500" ; 1500.5 -> "$ 1.500,50"
export function formatearPrecio(numero) {
  const n = Number(numero) || 0;
  return '$ ' + n.toLocaleString('es-AR', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });
}

// 1800000 -> "$ 1,8 M" ; 18600 -> "$ 18.600"
export function formatearPrecioCorto(numero) {
  const n = Number(numero) || 0;
  if (Math.abs(n) >= 1000000) return '$ ' + (n / 1000000).toLocaleString('es-AR', { maximumFractionDigits: 1 }) + ' M';
  return '$ ' + Math.round(n).toLocaleString('es-AR');
}

// 12 -> "12" ; 2.5 -> "2,5"
export function formatearCantidad(numero) {
  return (Number(numero) || 0).toLocaleString('es-AR', { maximumFractionDigits: 3 });
}

// 87.5 -> "87,5%"
export function formatearPorcentaje(numero) {
  return (Number(numero) || 0).toLocaleString('es-AR', { maximumFractionDigits: 1 }) + '%';
}

// "2026-10-25" -> "Domingo, 25 de octubre"
export function formatearFechaLarga(fechaISO) {
  const [a, m, d] = fechaISO.split('-').map(Number);
  const texto = new Date(a, m - 1, d).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// "2026-10-25" -> "Dom"
export function diaCorto(fechaISO) {
  const [a, m, d] = fechaISO.split('-').map(Number);
  const texto = new Date(a, m - 1, d).toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// "2026-10-25" -> "25/10"
export function fechaCorta(fechaISO) {
  const [, m, d] = fechaISO.split('-');
  return `${d}/${m}`;
}

// "2026-10-31T09:30:00" -> "Hoy, 09:30" / "Ayer, 18:40" / "28/10, 11:05"
export function formatearMomento(fechaHoraISO) {
  if (!fechaHoraISO) return '';
  const [fecha, hora = ''] = fechaHoraISO.split('T');
  const hhmm = hora.slice(0, 5);
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  if (fecha === hoyISO()) return `Hoy, ${hhmm}`;
  if (fecha === ayer.toLocaleDateString('en-CA')) return `Ayer, ${hhmm}`;
  return `${fechaCorta(fecha)}, ${hhmm}`;
}

// Fecha de hoy en formato AAAA-MM-DD según la hora local (no UTC)
export function hoyISO() {
  return new Date().toLocaleDateString('en-CA');
}

// Suma días a una fecha AAAA-MM-DD sin pasar por UTC
export function sumarDias(fechaISO, dias) {
  const [a, m, d] = fechaISO.split('-').map(Number);
  return new Date(a, m - 1, d + dias).toLocaleDateString('en-CA');
}
