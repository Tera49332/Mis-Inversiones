// Helper for precision: Convert to cents
export function toCents(value) {
  const parsed = parseFloat(value);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

// Helper for precision: Convert from cents
export function fromCents(cents) {
  return cents / 100;
}

// Calculate total invested for a list of purchases (in EUR)
export function calcularTotalInvertido(compras) {
  if (!compras || compras.length === 0) return 0;
  // importe is already stored in the database in the target currency, but if we assume it's in EUR (or converted),
  // wait, the spec says to calculate always in EUR for the global summary.
  // If a purchase was in USD, 'importe' should represent what we actually paid in EUR if possible, or we need to convert it.
  // We'll assume 'importe' stored is what they actually spent in EUR, or we use exchangeRate.
  // For simplicity, let's assume 'importe' is the total in the base currency (EUR) because they use a Spanish bank.
  // If 'importe' is in USD, we use the saved tipoCambioAEUR.
  let totalCents = 0;
  for (const compra of compras) {
    let imp = parseFloat(compra.importe) || 0;
    if (compra.divisa && compra.divisa !== 'EUR' && compra.tipoCambioAEUR) {
      imp = imp * parseFloat(compra.tipoCambioAEUR);
    }
    totalCents += toCents(imp);
  }
  return fromCents(totalCents);
}

// Calculate total shares for a list of purchases
export function calcularTotalParticipaciones(compras) {
  if (!compras || compras.length === 0) return 0;
  // Shares don't suffer from cent issues, but float precision is nice.
  return compras.reduce((total, compra) => total + (parseFloat(compra.participaciones) || 0), 0);
}

// Calculate weighted average price (in EUR)
export function calcularPrecioMedio(compras) {
  const totalInvertido = calcularTotalInvertido(compras);
  const totalParticipaciones = calcularTotalParticipaciones(compras);
  if (totalParticipaciones === 0) return 0;
  return totalInvertido / totalParticipaciones;
}

// Calculate current value given shares and current price per share
// Note: If precioActual is not in EUR, it should have been converted before passing here,
// or we pass tipoCambioAEUR.
export function calcularValorActual(totalParticipaciones, precioActual, tipoCambioAEUR = 1) {
  if (!totalParticipaciones || !precioActual) return 0;
  const val = (parseFloat(totalParticipaciones) || 0) * (parseFloat(precioActual) || 0) * (parseFloat(tipoCambioAEUR) || 1);
  return fromCents(toCents(val)); // round to 2 decimals using cents logic
}

// Calculate profit/loss (in EUR)
export function calcularGanancia(valorActual, totalInvertido) {
  return fromCents(toCents(valorActual) - toCents(totalInvertido));
}

// Calculate return percentage
export function calcularRentabilidad(valorActual, totalInvertido) {
  const invertidoCents = toCents(totalInvertido);
  if (invertidoCents === 0) return 0;
  return (toCents(calcularGanancia(valorActual, totalInvertido)) / invertidoCents) * 100;
}

// Calculate the third value given two of: importe, participaciones, precioUnitario
export function calcularCampoFaltante(importe, participaciones, precioUnitario) {
  const imp = parseFloat(importe);
  const part = parseFloat(participaciones);
  const precio = parseFloat(precioUnitario);

  if (isNaN(imp) && !isNaN(part) && !isNaN(precio)) {
    return (part * precio).toFixed(2);
  }
  if (!isNaN(imp) && isNaN(part) && !isNaN(precio)) {
    return precio === 0 ? "0" : (imp / precio).toFixed(4);
  }
  if (!isNaN(imp) && !isNaN(part) && isNaN(precio)) {
    return part === 0 ? "0" : (imp / part).toFixed(4);
  }
  return null;
}

// Validate rounding tolerance between importe and (participaciones * precioUnitario) + comision
export function validarCuadreConTolerancia(importe, participaciones, precioUnitario, comision, tolerancia = 0.05) {
  const imp = parseFloat(importe) || 0;
  const part = parseFloat(participaciones) || 0;
  const precio = parseFloat(precioUnitario) || 0;
  const comi = parseFloat(comision) || 0;

  const calculado = (part * precio) + comi;
  const diferencia = Math.abs(imp - calculado);
  
  return diferencia <= tolerancia;
}

// Format currency to EUR
export function formatearMoneda(valor, divisa = 'EUR') {
  const val = parseFloat(valor) || 0;
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: divisa }).format(val);
}

// Format percentage with explicit sign (+/-)
export function formatearPorcentaje(valor) {
  const val = parseFloat(valor) || 0;
  const formatted = new Intl.NumberFormat('es-ES', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(val) / 100);
  return val >= 0 ? `+${formatted}` : `-${formatted}`;
}

// Format date to Spanish locale
export function formatearFecha(fecha) {
  if (!fecha) return '';
  const date = new Date(fecha);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

// Export data to CSV
export function exportarCSV(compras, etfs) {
  if (!compras || compras.length === 0) return;

  const etfMap = (etfs || []).reduce((acc, etf) => {
    acc[etf.id] = etf.ticker;
    return acc;
  }, {});

  const headers = ['ID', 'ETF', 'Fecha', 'Divisa', 'Importe', 'Participaciones', 'Precio Unitario', 'Comision', 'Notas'];
  const rows = compras.map(c => [
    c.id,
    etfMap[c.etfId] || c.etfId,
    c.fecha,
    c.divisa || 'EUR',
    c.importe,
    c.participaciones,
    c.precioUnitario,
    c.comision || 0,
    `"${(c.notas || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  downloadFile(csvContent, `exportacion_compras_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
}

// Export Full JSON Backup
export async function exportarBackupCompleto(db) {
  const etfs = await db.etfs.toArray();
  const compras = await db.compras.toArray();
  const valoraciones = await db.valoraciones.toArray();
  const evaluaciones = await db.evaluaciones.toArray();
  
  const backup = {
    version: 2,
    fecha: new Date().toISOString(),
    datos: { etfs, compras, valoraciones, evaluaciones }
  };
  
  downloadFile(JSON.stringify(backup, null, 2), `backup_mi_inversion_etf_${new Date().toISOString().split('T')[0]}.json`, 'application/json;charset=utf-8;');
}

function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
