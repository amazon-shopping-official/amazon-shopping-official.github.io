const fs = require('fs');
let code = fs.readFileSync('invoice-pdf.js', 'utf8');

const target = "warehouse: 'Amazon Global Fulfillment Center (Jewelry Vault Hub)'\n      };";
const targetCRLF = "warehouse: 'Amazon Global Fulfillment Center (Jewelry Vault Hub)'\r\n      };";

const addition = `\n    } else if (lower.includes('ps5') || lower.includes('playstation') || lower.includes('sony')) {
      return {
        seller: 'Sony PlayStation Official Store on Amazon',
        operator: 'Amazon.com Services LLC',
        warehouse: 'Amazon Global Fulfillment Center (Sony Interactive Entertainment Hub)'
      };`;

if (code.includes(target)) {
  code = code.replace(target, target + addition);
  fs.writeFileSync('invoice-pdf.js', code, 'utf8');
  console.log('Updated invoice-pdf.js (LF)');
} else if (code.includes(targetCRLF)) {
  code = code.replace(targetCRLF, targetCRLF + addition.replace(/\n/g, '\r\n'));
  fs.writeFileSync('invoice-pdf.js', code, 'utf8');
  console.log('Updated invoice-pdf.js (CRLF)');
} else {
  console.log('Target not found in invoice-pdf.js');
}
