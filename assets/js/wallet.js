var provider, signer, MyWalletAddress, walletName, walletNetworkId
var isWalletConnected = false;
var wNames = new Array();
var BUSD = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56'

function connectWallet() {
      console.log('## HERE - 11')

      checkForWallet(true)
}


function checkForWallet(alert) {
      console.log('## HERE - 1')

      if (window.ethereum) {
            console.log('## HERE - 2')

            window.ethereum.enable().then((res) => {
                  console.log('## HERE - 3')
                  console.info(res)

                  console.info(window.ethereum)
                  provider = new ethers.providers.Web3Provider(window.ethereum)
                  console.info(provider)
                  walletName = provider.connection.url
                  console.log('walletName: ' + walletName)
                  provider.getNetwork().then((nres) => {
                        console.log('chain id: ' + nres.chainId)

                        walletNetworkId = nres.chainId
                        signer = provider.getSigner()
                        console.info(signer)
                        signer.getAddress().then((sres) => {
                              console.log('## HERE - 4')
                              MyWalletAddress = sres
                              console.log('## HERE - 4   MyWalletAddress: ' + MyWalletAddress)

                              connectButtonChange(walletName)

                              if (walletNetworkId == selectedChainId) {
                                    console.log('## HERE - 8 same chain id')
                                    isWalletConnected = true
                                    checkAllowance(payTokenAddress, MyWalletAddress, 18, currentPayToken)
                              } else {
                                    console.log('## HERE - 9   diffrent chain id')
                                    window.ethereum.request({
                                          method: "wallet_addEthereumChain",
                                          params: [{
                                                chainId: "0x38",
                                                rpcUrls: ["https://bsc-dataseed.binance.org/"],
                                                chainName: "Binance Smart Chain",
                                                nativeCurrency: {
                                                      name: "BNB",
                                                      symbol: "BNB",
                                                      decimals: 18
                                                },
                                                blockExplorerUrls: ["https://bscscan.com/"]
                                          }]
                                    }).then(() => {
                                          console.log('Network Change Accepted.')
                                          window.location.href = window.location.href
                                    });
                              }
                        })
                  });
            })
            //console.log('## HERE - 5')

      } else {
            console.log('## HERE - 6')

            if (alert) {
                  console.log('## HERE - 7')

                  window.alert('Wallet not faound.')
            }
      }
}

var allowanceAmount = 0;

async function allowance(contractAddress, ownerAddress, spenderAddress) {
      console.log('wallet.js allowance 1' + ' & ' + contractAddress + ' & ' + ownerAddress + ' & ' + spenderAddress)
      var Contract = new ethers.Contract(contractAddress, ERC20ABI, signer);
      console.log('wallet.js allowance 2')
      //return await Contract.allowance(ownerAddress, spenderAddress)
      provider.getCode(contractAddress).then((res) => {
            console.log('wallet.js allowance 3')
            console.info(res.substring(0, 20))
      })

      // Contract.allowance(ownerAddress, spenderAddress).then((res) => {
      //       console.log('wallet.js allowance 4 allowance amount here')
      //       console.info(res)
      //       return  Promise.resolve(res)
      // })
      return await Contract.allowance(ownerAddress, spenderAddress)
}

async function approve(contractAddress, spenderAddress, amount) {
      console.log("Approv req: amount: " + amount + '   spender: ' + spenderAddress + '   contract: ' + contractAddress)
      var Contract = new ethers.Contract(contractAddress, ERC20ABI, signer);
      return await Contract.approve(spenderAddress, ethers.BigNumber.from(amount))
}