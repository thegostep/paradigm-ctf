import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-waffle'
import 'hardhat-gas-reporter'
import 'solidity-coverage'

import { Wallet } from 'ethers'
import { HardhatUserConfig } from 'hardhat/config'

export default {
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    goerli: {
      url: 'https://goerli.infura.io/v3/' + process.env.INFURA_ID,
      accounts: {
        mnemonic:
          process.env.DEV_MNEMONIC || Wallet.createRandom().mnemonic.phrase,
      },
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.7.6',
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
