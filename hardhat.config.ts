import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-waffle'
import 'hardhat-gas-reporter'
import 'solidity-coverage'

import { HardhatUserConfig } from 'hardhat/types'

import './task/hello'
import './task/market'

export default {
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      forking: {
        url: process.env.ETHEREUM_ARCHIVE_URL,
      },
    },
    hello: {
      url: 'http://104.197.147.133:8545/866e3120-303e-478f-abef-ad51402a1407',
      accounts: [
        '0x62f12a51b88ae9348bc83ba7c7df090a475c8209244c6835b82abf6980c8a4f3',
      ],
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.7.0',
      },
      {
        version: '0.8.0',
      },
      {
        version: '0.5.12',
      },
    ],
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_APIKEY,
  },
  gasReporter: {
    currency: 'ETH',
    enabled: process.env.REPORT_GAS ? true : false,
  },
} as HardhatUserConfig
