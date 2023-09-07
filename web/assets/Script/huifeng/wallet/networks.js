const networks = [
  {
    id: 'testnet',
    name: 'BSC Testnet',
    chainId: '0x61',
    url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    explorer: 'https://api-testnet.bscscan.com/api',
    owner:"0x58e624074be45004a68e8872a28f28b9ec6b3f37",

  },

  {
    id: 'ropsten testnet',
    name: 'Ropsten Testnet',
    chainId: '0x3',
    url: 'https://ropsten.infura.io/v3',
    explorer: 'https://ropsten.etherscan.io',
    owner:"0x58e624074be45004a68e8872a28f28b9ec6b3f37",
  }
]

module.exports = networks