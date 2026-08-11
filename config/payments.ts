export interface PaymentMethod {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  logoPath: string;
  color: string;
  accountId: string;
  accountName: string;
  network?: string;
  instructions: string[];
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'binance',
    name: 'Binance Pay',
    subtitle: 'Cryptocurrency (Binance Pay ID)',
    badge: 'Instant & Global',
    logoPath: '/assets/payments/binance.png',
    color: 'rgba(240, 185, 11, 0.25)',
    accountId: '891029481',
    accountName: 'AI Store Merchant',
    network: 'Binance Pay',
    instructions: [
      'Open your Binance App.',
      'Go to Binance Pay and enter Pay ID listed below.',
      'Enter the exact order total in USDT.',
      'Tap "I\'ve Paid" below once transferred.'
    ]
  },
  {
    id: 'usdt-crypto',
    name: 'USDT (BEP20 / TRC20)',
    subtitle: 'USDT Crypto Wallet Transfer',
    badge: 'BEP20 / TRC20',
    logoPath: '/assets/payments/usdt.png',
    color: 'rgba(38, 161, 123, 0.25)',
    accountId: '0x71C76543219876543210BEP20',
    accountName: 'AI Store Crypto Wallet',
    network: 'USDT (BEP20 / TRC20)',
    instructions: [
      'Open your Trust Wallet, Metamask, or Crypto Exchange.',
      'Send exact USDT total to the BEP20 address below.',
      'Double check network selection before sending.',
      'Tap "I\'ve Paid" below after broadcasting transaction.'
    ]
  },
  {
    id: 'telebirr',
    name: 'Telebirr',
    subtitle: 'Mobile payment service',
    badge: 'Popular',
    logoPath: '/assets/payments/telebirr.jpg',
    color: 'rgba(0, 168, 232, 0.25)',
    accountId: '0911223344',
    accountName: 'AI Store Telebirr Business',
    instructions: [
      'Open Telebirr Mobile App or dial *127#.',
      'Select Transfer Money or Pay Merchant.',
      'Enter the Telebirr phone number listed below.',
      'Enter the exact amount and confirm transaction.',
      'Press "I\'ve Paid" below once transferred.'
    ]
  }
];
