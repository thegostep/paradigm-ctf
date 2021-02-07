import { Contract } from 'ethers'
import { formatEther, formatUnits, parseUnits } from 'ethers/lib/utils'
import { task } from 'hardhat/config'

task('upgrade')
  .addOptionalPositionalParam('setupAddress')
  .setAction(async ({ setupAddress }, { run, ethers, network }) => {
    await run('compile')

    // get signer

    const signer = (await ethers.getSigners())[0]
    console.log('Signer', signer.address)

    // setup problem

    let setup: Contract
    if (setupAddress) {
      setup = await ethers.getContractAt(
        'contracts/upgrade/Setup.sol:Setup',
        setupAddress,
      )
    } else {
      setup = await (
        await ethers.getContractFactory('contracts/upgrade/Setup.sol:Setup')
      ).deploy()
    }
    console.log('Setup')
    console.log('  at', setup.address)

    // init contracts

    const v2 = await ethers.getContractAt(
      'FiatTokenV2',
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    )
    console.log('FiatTokenV2')
    console.log('  at', v2.address)

    const v3 = await ethers.getContractAt(
      'FiatTokenV3',
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    )
    console.log('FiatTokenV3')
    console.log('  at', v3.address)

    // perform exploit

    const logBalances = async () => {
      console.log()
      console.log('USDC')
      console.log(
        '  setup',
        formatUnits(await v3.balanceOf(setup.address), '6'),
      )
      console.log('  supply', formatUnits(await v3.totalSupply(), '6'))
    }

    await logBalances()

    // verify

    console.log('Success?', await setup.isSolved())
  })
