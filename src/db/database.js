import Dexie from 'dexie';

export const db = new Dexie('MiInversionETF');

// Version 1 (Legacy)
db.version(1).stores({
  etfs: '++id, ticker, nombre',
  compras: '++id, etfId, fecha, importe, participaciones, precioUnitario, comision, notas',
  valoraciones: '++id, etfId, fecha, valorPorParticipacion, valorTotal',
  evaluaciones: '++id, fecha, totalInvertido, valorActual, rentabilidad, notas'
});

// Version 2 (New fields for divisas, isin, and historical valuation)
db.version(2).stores({
  etfs: '++id, ticker, nombre, isin',
  compras: '++id, etfId, fecha, divisa',
  valoraciones: '++id, etfId, fechaHora, fecha',
  evaluaciones: '++id, fecha, periodo'
}).upgrade(tx => {
  // Migrate existing ETFs to add default ISIN and currency
  return tx.etfs.toCollection().modify(etf => {
    if (etf.ticker === 'IWDA') {
      etf.isin = 'IE00B4L5Y983';
      etf.divisaCotizacion = 'EUR';
    } else if (etf.ticker === 'EMIM') {
      etf.isin = 'IE00BKM4GZ66';
      etf.divisaCotizacion = 'EUR';
    }
  });
});

// Seed initial ETFs
export async function seedETFs() {
  const count = await db.etfs.count();
  if (count === 0) {
    await db.etfs.bulkAdd([
      { ticker: 'IWDA', nombre: 'iShares Core MSCI World UCITS ETF', isin: 'IE00B4L5Y983', moneda: 'EUR', divisaCotizacion: 'EUR', activo: true },
      { ticker: 'EMIM', nombre: 'iShares Core MSCI EM IMI UCITS ETF', isin: 'IE00BKM4GZ66', moneda: 'EUR', divisaCotizacion: 'EUR', activo: true }
    ]);
  }
}
