import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-waffle'
import 'hardhat-gas-reporter'
import 'solidity-coverage'

import { HardhatUserConfig } from 'hardhat/types'

import './task/hello'
import './task/market'
import './task/broker'
import './task/yield'
import './task/farmer'
import './task/upgrade'

export default {
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      forking: {
        url: process.env.ETHEREUM_ARCHIVE_URL,
      },
    },
    paradigm: {
      url: process.env.PARADIGM_RPC,
      accounts: [process.env.PARADIGM_PRIVATE_KEY],
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.8.0',
      },
      {
        version: '0.7.0',
      },
      {
        version: '0.6.12',
      },
      {
        version: '0.5.12',
      },
      {
        version: '0.4.16',
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
