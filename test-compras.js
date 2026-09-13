import assert from 'node:assert';

function calculateThird(impStr, partStr, preStr, editedFields) {
    const imp = parseFloat(impStr);
    const part = parseFloat(partStr);
    const pre = parseFloat(preStr);
    
    let res = { importe: impStr, participaciones: partStr, precioUnitario: preStr };

    if (!editedFields.includes('importe') && !isNaN(part) && !isNaN(pre)) {
        res.importe = (part * pre).toFixed(2);
    } else if (!editedFields.includes('participaciones') && !isNaN(imp) && !isNaN(pre) && pre !== 0) {
        res.participaciones = (imp / pre).toFixed(6);
    } else if (!editedFields.includes('precioUnitario') && !isNaN(imp) && !isNaN(part) && part !== 0) {
        res.precioUnitario = (imp / part).toFixed(2);
    }
    return res;
}

// Test 1: Importe 100, Participaciones 0.67 -> Precio Unitario 149.25
{
    const res = calculateThird(100, 0.67, '', ['importe', 'participaciones']);
    assert.strictEqual(res.precioUnitario, '149.25');
    console.log('✅ Test 1 Passed: 100 / 0.67 = 149.25');
}

// Test 2: Importe 100, Precio Unitario 149.25 -> Participaciones 0.670017
{
    const res = calculateThird(100, '', 149.25, ['importe', 'precioUnitario']);
    // Wait, 100 / 149.253731 = 0.67
    // If they typed 149.25 exactly, it's 0.670017
    assert.strictEqual(res.participaciones, '0.670017');
    console.log('✅ Test 2 Passed: 100 / 149.25 = 0.670017');
}

// Test 3: Participaciones 0.67, Precio Unitario 149.25 -> Importe 100.00
{
    const res = calculateThird('', 0.67, 149.25, ['participaciones', 'precioUnitario']);
    assert.strictEqual(res.importe, '100.00');
    console.log('✅ Test 3 Passed: 0.67 * 149.25 = 100.00');
}
