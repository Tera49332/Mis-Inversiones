import Dexie from 'dexie';

export const db = new Dexie('MiInversionETF');

db.version(1).stores({
  etfs: '++id, ticker, nombre',
  compras: '++id, etfId, fecha, importe, participaciones, precioUnitario, comision, notas',
  valoraciones: '++id, etfId, fecha, valorPorParticipacion, valorTotal',
  evaluaciones: '++id, fecha, totalInvertido, valorActual, rentabilidad, notas'
});

// Seed initial ETFs
export async function seedETFs() {
  const count = await db.etfs.count();
  if (count === 0) {
    await db.etfs.bulkAdd([
      { ticker: 'IWDA', nombre: 'iShares Core MSCI World UCITS ETF', moneda: 'EUR', activo: true },
      { ticker: 'EMIM', nombre: 'iShares Core MSCI EM IMI UCITS ETF', moneda: 'EUR', activo: true }
    ]);
  }
}
