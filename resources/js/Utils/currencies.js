const currencies = [
    { code: 'USD', symbol: '$',  name: 'US Dollar',        country: 'United States' },
    { code: 'JPY', symbol: '¥',  name: 'Japanese Yen',     country: 'Japan' },
    { code: 'PHP', symbol: '₱',  name: 'Philippine Peso',  country: 'Philippines' },
    { code: 'EUR', symbol: '€',  name: 'Euro',             country: 'European Union' },
    { code: 'GBP', symbol: '£',  name: 'British Pound',    country: 'United Kingdom' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', country: 'Australia' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar',  country: 'Canada' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', country: 'Singapore' },
    { code: 'CNY', symbol: '¥',  name: 'Chinese Yuan',     country: 'China' },
    { code: 'KRW', symbol: '₩',  name: 'South Korean Won', country: 'South Korea' },
    { code: 'THB', symbol: '฿',  name: 'Thai Baht',        country: 'Thailand' },
    { code: 'VND', symbol: '₫',  name: 'Vietnamese Dong',  country: 'Vietnam' },
    { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', country: 'Malaysia' },
    { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', country: 'Indonesia' },
    { code: 'INR', symbol: '₹',  name: 'Indian Rupee',     country: 'India' },
];

export default currencies;

export function getCurrency(code) {
    return currencies.find(c => c.code === code) ?? currencies[0];
}

export function formatMoney(amount, currencyCode = 'USD') {
    const cur = getCurrency(currencyCode);
    const num = Number(amount ?? 0);
    // JPY, KRW, VND, IDR — no decimals
    const noDecimals = ['JPY', 'KRW', 'VND', 'IDR'].includes(cur.code);
    return cur.symbol + num.toLocaleString(undefined, {
        minimumFractionDigits: noDecimals ? 0 : 0,
        maximumFractionDigits: noDecimals ? 0 : 2,
    });
}
