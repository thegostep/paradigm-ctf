import { Contract } from 'ethers'
import { task } from 'hardhat/config'

task('hello')
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
        'contracts/hello/Setup.sol:Setup',
        setupAddress,
      )
    } else {
      setup = await (
        await ethers.getContractFactory('contracts/hello/Setup.sol:Setup')
      ).deploy()
    }
    console.log('Setup')
    console.log('  at', setup.address)

    // init contracts

    const hello = await ethers.getContractAt('Hello', await setup.hello())
    console.log('Hello')
    console.log('  at', hello.address)

    // perform exploit

    await hello.solve()

    // verify

    console.log('Success?', await setup.isSolved())
  })
