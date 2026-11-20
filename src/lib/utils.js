export function formatPHP(amount) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(Number(amount || 0));
}

export function numberToWordsPHP(amount) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertChunk(n) {
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += ones[n] + ' ';
    }
    return str.trim();
  }

  const num = Number(amount || 0);
  if (num === 0) return 'Zero Pesos Only';

  const pesos = Math.floor(num);
  const centavos = Math.round((num - pesos) * 100);

  let words = '';
  if (pesos >= 1000000) {
    words += convertChunk(Math.floor(pesos / 1000000)) + ' Million ';
  }
  const thousands = Math.floor((pesos % 1000000) / 1000);
  if (thousands > 0) {
    words += convertChunk(thousands) + ' Thousand ';
  }
  const remainder = pesos % 1000;
  if (remainder > 0) {
    words += convertChunk(remainder);
  }

  words = words.trim() + (pesos === 1 ? ' Peso' : ' Pesos');
  if (centavos > 0) {
    words += ` and ${centavos}/100`;
  }
  return words + ' Only';
}

export function computeAge(dob) {
  if (!dob) return 0;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(0, age);
}
