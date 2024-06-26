// Currently Selected Chain
var selectedChain = 'ETH'
var selectedChainId = 1

// Info of tokens avaliable on the selected chain.  array of objects
var chainTokens = new Array();

// Operator contract
var spenderAddress


// Token Information
var payTokenPrice, receiveTokenPrice, isPriceFetched, isPayPriceFetched, isReceivePriceFetched

var payTokenAddress, payTokenDecimals, receiveTokenAddress, receiveTokenDecimals


// Token Price information
var currentPrice = 0
var currentPayToken = ''
var currentReceiveToken = ''
var isFirstPaySet = true;
var isFirstReceiveSet = true; 

// Number of calls for price data
var tryfetchPairPrice = 0;

function setChainTokns() {
      console.log('setChainTokns => Start')
      chainTokens = BSCTokens;

      setPayDropdown()
      setTimeout(() => {
            setReceiveDropdown()
      }, 200);
}

function setPayDropdown() {
      console.log('setPayDropdown => Start')
      var menuItems = '';
      for (let i = 0; i < chainTokens.length; i++) {
            var symbol = chainTokens[i].symbol

            if (isFirstPaySet && i == 0) {
                  payTokenSelect(symbol)
                  isFirstPaySet = false
                  console.log('defult pay set to: ' + symbol)
            }
            else if (symbol !== currentReceiveToken && symbol !== currentPayToken) {
                  menuItems += ` <span class="tokenListOpt" onclick="payTokenSelect('${symbol}')">
                                          <img src="assets/images/coin/${symbol}.png" class="menuImg" alt="">
                                          <span class="tokenSym">
                                          <span>${symbol}</span></span>
                                    </span>`

            }
      }
      document.getElementById('payDropdown').innerHTML = menuItems;
}

function setReceiveDropdown() {
      console.log('setReceiveDropdown Start')
      var menuItems = '';
      for (let i = 0; i < chainTokens.length; i++) {
            var symbol = chainTokens[i].symbol

            if (i == 1 && isFirstReceiveSet) {
                  receiveTokenSelect(symbol)
                  isFirstReceiveSet = false
                  setTimeout(() => {
                        setPayDropdown()
                  }, 1000);
            }
            else if (symbol !== currentReceiveToken && symbol !== currentPayToken) {
                  menuItems += ` <span class="tokenListOpt" onclick="receiveTokenSelect('${symbol}')">
                                          <img src="assets/images/coin/${symbol}.png" class="menuImg" alt="">
                                          <span class="tokenSym">
                                          <span>${symbol}</span></span>
                                    </span>`
                  // menuItems += ` <span class="tokenListOpt" onclick="receiveTokenSelect('${symbol}')">
                  //                         <span class="tokenImg">
                  //                         <img src="assets/images/coin/${symbol}.png" class="menuImg" alt=""></span>
                  //                         <span class="tokenSym">
                  //                         <span>${symbol}</span></span>
                  //                   </span>`
            }
      }
      document.getElementById('receiveDropdown').innerHTML = menuItems;

}




function getPairPrice(isFor) {

      document.getElementById('fetchedPriceWait').style.display = 'block'
      document.getElementById('fetchedPrice').innerHTML = ''
      var value = Number(document.getElementById('payTokenInput').value) * (10 ** payTokenDecimals);
      if (value == 0) value = (10 ** payTokenDecimals)
      var furl = `${baseURL}pairPrice/${selectedChain}/${getAddressBySymbol(currentPayToken)}/${getAddressBySymbol(currentReceiveToken)}/${value}/0.1`
      console.log('furl: ' + furl)
      console.log('tryfetchPairPrice: ' + tryfetchPairPrice)
      $.ajax({
            url: furl,
            type: 'get',
            success: function (res) {
                  console.log('===####   getPairPrice   ####===')
                  console.info(res)
                  currentPrice = Number(res.data.price)
                  spenderAddress = res.data.allowanceTarget
                  isPriceFetched = true
                  document.getElementById('payTokenInput').addEventListener('input', setPayAmount)
                  document.getElementById('receiveTokenInput').addEventListener('input', setReceiveAmount)
                  if (isFor == 'pay') {
                        isPayPriceFetched = true
                        setReceiveAmount()
                        if (isWalletConnected) {
                              console.log('@@@ check allowance in price get')
                              checkAllowance(payTokenAddress, MyWalletAddress, payTokenDecimals, currentPayToken)
                        }
                  } else {
                        setPayAmount()
                  }

                  var eped = Math.round((currentPrice + Number.EPSILON) * 100) / 100
                  document.getElementById('fetchedPriceWait').style.display = 'none'
                  document.getElementById('fetchedPrice').innerHTML = `
                  1 ${currentPayToken} ≈ ${eped} ${currentReceiveToken}`
                  tryfetchPairPrice = 0;
            },
            error: (err) => {
                  // console.error(err)
                  console.info(err)
                  // console.info(JSON.parse(err.responseText))
                  console.error(JSON.parse(err.responseText))
                  if (err.responseJSON.data == "Client network socket disconnected before secure TLS connection was established") {
                        console.log('catchedddddd')
                        if (tryfetchPairPrice < 5) {
                              setTimeout(() => {
                                    tryfetchPairPrice++
                                    getPairPrice(isFor)
                              }, 3000);
                        } else {

                              errored('Cloud not fetch Price Data.   \nPlease Retry after a minute or change the currency or ')
                        }

                  }
            }
      })
}



function errored(er) {
      waitingOff()
      //#6 record error data
      window.alert('Operation failed with error: \n' + er + '\nPlease reload the page using Ctrl + Shift + R \nor contact support.')
}

function setReceiveAmount() {
      var payInp = document.getElementById('receiveTokenInput').value;
      if (payInp != '' && isPriceFetched) {
            console.log('payInp: ' + payInp + '   -payTokenPrice: ' + payTokenPrice + '   -receiveTokenPrice: ' + receiveTokenPrice)
            payInp = Number(payInp)
            //OLD:
            //var receiveMount = payInp * receiveTokenPrice / payTokenPrice

            //NEW: 
            var receiveMount = payInp / currentPrice
            document.getElementById('payTokenInput').value = receiveMount
            //console.log(receiveMount)
      }
}

function setPayAmount() {
      var payInp = document.getElementById('payTokenInput').value;
      if (payInp != '' && isPriceFetched) {
            console.log('payInp: ' + payInp + '   -payTokenPrice: ' + payTokenPrice + '   -receiveTokenPrice: ' + receiveTokenPrice)
            payInp = Number(payInp)
            // OLD Line:
            // var receiveMount = payInp * payTokenPrice / receiveTokenPrice

            //NEW Line:
            var receiveMount = payInp * currentPrice
            document.getElementById('receiveTokenInput').value = receiveMount
            //document.getElementById('payTokenInput').style.border = 'none';

            waitingOff()
            //console.log(receiveMount)


            //#5 The Check Allowance part
            // if (payInp > allowanceAmount) {
            //       document.getElementById('swapBtn').disabled = true;

            // } else {
            //       document.getElementById('swapBtn').disabled = false;
            // }
      }
}








function getAddressBySymbol(sym) {
      console.log('getAddressBySymbol => Start')
      for (let i = 0; i < chainTokens.length; i++) {
            const element = chainTokens[i];
            //if (element.Chain == selectedChain) {
            // for (let j = 0; j < element.tokens.length; j++) {
            // const ele = element.tokens[j];
            if (element.symbol == sym) {
                  return element.address
            }
            // }
            //}
      }
}

function payTokenSelect(inp) {
      //waitingOn()
      console.log('call for payTokenSelect: ' + inp)
      document.getElementById('payTokenName').innerHTML = inp;
      document.getElementById('payTokenImg').src = `./assets/images/coin/${inp}.png`
      currentPayToken = inp
      payTokenAddress = chainTokens.find(t => t.symbol == currentPayToken).address
      payTokenDecimals = chainTokens.find(t => t.symbol == currentPayToken).decimal
      console.log('Find pay address: ' + payTokenAddress)
      console.log('Find pay payTokenDecimals: ' + payTokenDecimals)
      if (!isFirstPaySet) {
            setPayDropdown()
            setReceiveDropdown()
            if (!swithching) {
                  getPairPrice('pay')
            }
      }
}

function receiveTokenSelect(inp) {
      //waitingOn()
      console.log('call for receiveTokenSelect' + inp)

      document.getElementById('receiveTokenName').innerHTML = inp;
      document.getElementById('receiveTokenImg').src = `./assets/images/coin/${inp}.png`
      currentReceiveToken = inp
      if (!isFirstReceiveSet) {
            setPayDropdown()
            setReceiveDropdown()
      }
      //getPrice(getAddressBySymbol(inp), 'receive')//isPayPriceFetched
      getPairPrice()
      //waitingOff()
}




var firstPayFocus = true;
var firstReceiveFocus = true;
document.getElementById('payTokenInput').addEventListener('focus', () => {
      if (firstPayFocus) {
            document.getElementById('payTokenInput').value = '';
            firstPayFocus = false
            firstReceiveFocus = false
      }
      else {
            document.getElementById('payTokenInput').select();
      }
})
document.getElementById('receiveTokenInput').addEventListener('focus', () => {
      if (firstReceiveFocus) {
            document.getElementById('receiveTokenInput').value = '';
            firstReceiveFocus = false
            firstPayFocus = false
      } else {
            document.getElementById('receiveTokenInput').select();
      }
})

//#region SELECT CHAIN and TOKEN selectoer open BUTTONS
function openChainSelect() {
      setTimeout(() => {
            document.getElementById("myDropdown").classList.toggle("show");
      }, 100);
}

// Close the dropdown if the user clicks outside of it
window.onclick = function (event) {
      if (!event.target.matches('.dropbtn')) {
            var dropdowns = document.getElementsByClassName("dropdown-content");
            var i;
            for (i = 0; i < dropdowns.length; i++) {
                  var openDropdown = dropdowns[i];
                  if (openDropdown.classList.contains('show')) {
                        openDropdown.classList.remove('show');
                  }
            }
      }
}

function resetFormState() {
      isFirstPaySet = true
      isFirstReceiveSet = true
      firstReceiveFocus = true
      firstPayFocus = true
      isPriceFetched = false
      isPayPriceFetched = false
      isReceivePriceFetched = false
}

// Need to update ( be like the ChsinSelectBSC())
function ChsinSelectETH() {
      console.log('ETH SELECTED')
      waitingOn()
      resetFormState()
      selectedChain = 'ETH'

      getSpender.then((rr) => {
            spenderAddress = rr
            document.getElementById('selectedChainImg').src = "./assets/images/ETHCH.png"
            document.getElementById('selectedChainImg').alt = "ETH logo"
            document.getElementById('selectedChainName').innerHTML = "Ethereum"
            setChainTokns()
      })
}

function ChsinSelectBSC() {
      console.log('BSC SELECTED')
      waitingOn()
      resetFormState()
      selectedChain = 'BSC'
      selectedChainId = 56
      checkForWallet(false)
      spenderAddress = '0xdef1c0ded9bec7f1a1670819833240f027b25eff' //#4 Staticspender!!
      document.getElementById('selectedChainImg').src = "./assets/images/BSCCH.png"
      document.getElementById('selectedChainImg').alt = "BSC logo"
      document.getElementById('selectedChainName').innerHTML = "BSC"
      setChainTokns()

}

// Need to update ( be like the ChsinSelectBSC())
function ChsinSelectTBSC() {
      console.log('TBSC SELECTED')
      waitingOn()
      resetFormState()
      selectedChain = 'TBSC'
      getSpender.then((rr) => {
            spenderAddress = rr
            document.getElementById('selectedChainImg').src = "./assets/images/BSCCH.png"
            document.getElementById('selectedChainImg').alt = "BSC logo"
            document.getElementById('selectedChainName').innerHTML = "Test BSC"
            setChainTokns()
      })
}

function payTokenOpen() {
      setTimeout(() => {
            document.getElementById("payDropdownFrm").classList.toggle("show");
      }, 100);
}

function receiveTokenOpen() {
      setTimeout(() => {
            document.getElementById("receiveDropdownFrm").classList.toggle("show");
      }, 100);
}
function waitingOn() {
      document.getElementById("overlay").style.display = "flex";
}

function waitingOff() {
      document.getElementById("overlay").style.display = "none";
}
//#endregion


var slippage = 2
function slippageSelect(inp) {
      slippage = inp
      document.getElementById('s1').classList.remove('active')
      document.getElementById('s2').classList.remove('active')
      document.getElementById('s5').classList.remove('active')
      document.getElementById('s' + inp).classList.add('active')
}


// adds the UX effect into the slippage choosing div
function addEf() {
      console.log('pppp')
      $('#os').on("click", function () {
            if ($("#cdiv").first().is(":hidden")) {
                  $("#cdiv").show("slow");
            } else {
                  $("#cdiv").slideUp();
            }
      });
}


// checks if the connection to the server is OK
function checkHealth() {
      var myURL = baseURL + 'health';
      console.log(myURL)
      $.ajax({
            url: myURL,
            type: 'get',
            success: () => {
                  console.log('Health OK-------------')
                  ChsinSelectBSC()
            },
            error: (res) => {
                  console.info(res)
                  errored('\nCould Not Connect to the SEVRER.\n')
            }
      })
}
var healthy = false;

function checkAllowance(contract, owner, decimals, symbol) {
      console.log('Token Address: ' + contract)
      document.getElementById('allowTXT').style.display = 'none'
      document.getElementById('allowWaiting').style.display = 'block'
      console.info(spenderAddress)
      balance(contract, owner).then((res) => {
            console.info(res)
            balanceAmount = BigInt(res._hex).toString()
            console.log('wallet balance amount: ' + balanceAmount)
            allowance(contract, owner, spenderAddress).then((res) => {
                  console.info(res)
                  allowanceAmount = BigInt(res._hex).toString()
                  console.log('@@@ Allowance: ' + allowanceAmount)
                  console.log('@@@ balanceAmount: ' + balanceAmount)

                  document.getElementById('allowTXT').style.display = 'block'
                  document.getElementById('allowWaiting').style.display = 'none'
                  document.getElementById('allowanceBtn').addEventListener('click', doApprove)

                  if (Number(allowanceAmount) > 0) {
                        console.log('@@@ allowanceAmount > 0');
                        var amount = allowanceAmount;
                        if (Number(balanceAmount) < Number(allowanceAmount)) { amount = balanceAmount }
                        document.getElementById('allowTXT').innerHTML = `You can Swap up to ${showAmount(amount, decimals) + ' ' + symbol + 's'}`
                        document.getElementById('swapBtn').disabled = false;
                        document.getElementById('swapBtn').addEventListener('click', doSwap)
                        document.getElementById('allowanceBtn').innerHTML = `+`
                  } else {
                        document.getElementById('allowTXT').innerHTML = `You need to Set Allowance
                                          <br> for the Operator Contract
                                          <br> On the Paying Currency.`
                        document.getElementById('swapBtn').disabled = true;
                        document.getElementById('allowanceBtn').innerHTML = `Approve`
                  }
            })


      })



}

function getChainId() {
      console.log(selectedChain)
      if (selectedChain == "BSC") {
            return '56'
      }
      if (selectedChain == "ETH") {
            return '1'
      }
      else {
            errored("Could not find Chain ID. Selected chain not detected.")
      }
}

// alarm if input field iz empty or zero
function alarmInput(inp) {
      var alOn = false
      var num = 0
      var max = 5
      var payInt = setInterval(() => {
            console.log('num: ' + num)
            if (num >= max) {
                  document.getElementById(inp + 'TokenInput').style.background = '#f1f1f1';
                  clearInterval(payInt)
            } else {
                  if (alOn) {
                        document.getElementById(inp + 'TokenInput').style.background = '#f1f1f1';
                        num++
                        alOn = false;
                  } else {
                        document.getElementById(inp + 'TokenInput').style.background = '#f72262';
                        num++
                        alOn = true;
                  }
            }
      }, 150);
}

function doApprove() {
      inpVal = Number(document.getElementById('payTokenInput').value) * 10 ** payTokenDecimals;
      console.log(inpVal)
      console.log(typeof (inpVal))
      var contract = getAddressBySymbol(currentPayToken)
      var info = {
            contract: contract,
            owner: MyWalletAddress,
            symbol: currentPayToken,
            spenderAddress: spenderAddress,
            allowanceAmount: inpVal,
      }
      recordInfo("Call for approve", 'Allowance', info)
      approve(contract, spenderAddress, inpVal.toString()).then((res) => {
            console.info(res)
            info.result = res
            recordInfo("Results for approve", 'Allowance', info)
            setTimeout(() => {
                  checkAllowance(getAddressBySymbol(currentPayToken), MyWalletAddress, payTokenDecimals, currentPayToken);
            }, 9000);
      }).catch((err) => {
            console.info('approve error')
            console.info(err)
            info.message = err.message
            info.result = err
            recordInfo("Results for approve", 'Allowance', info)
      })
}


//#region ========== SWAP Operation
var onSwapOperation = false
var swapDone = false
var continueTrySwap = false
var swapOperationTry = 0
function doSwap() {
      var inputValue = FixAmount(document.getElementById('payTokenInput').value, payTokenDecimals);
      console.log('doswap inputValue: ' + inputValue)
      console.log('doswap balanceAmount: ' + balanceAmount)
      if (Number(inputValue) > Number(balanceAmount)) {
            // ===> ERROR:   Requested amount is more than the balance
            window.alert("Requested amount is higher than the balance.")
            console.log('doswap inputValue: ' + inputValue)
            console.log('doswap balanceAmount: ' + balanceAmount)
      } else {
            if (Number(inputValue) > Number(allowanceAmount)) {
                  // ===> ERROR:   Requested amount is more than the allowance
                  window.alert("Requested amount is higher than the appproved amount.")
                  console.log('doswap inputValue: ' + inputValue)
                  console.log('doswap allowanceAmount: ' + allowanceAmount)

            } else {
                  if (Number(document.getElementById('payTokenInput').value) == 0) { alarmInput('pay') } else {
                        if (Number(document.getElementById('receiveTokenInput').value) == 0) { alarmInput('receive') } else {

                              // Main swap Operation
                              continueTrySwap = true
                              console.log('Swap Cycle: ' + swapOperationTry)
                              var inpVal = FixAmount(document.getElementById('payTokenInput').value, payTokenDecimals);//Working here
                              var slpg = Number(slippage) * 0.01;
                              var mnmurl = `${baseURL}pairPrice/${selectedChain}/${getAddressBySymbol(currentPayToken)}/${getAddressBySymbol(currentReceiveToken)}/${inpVal}/${slpg}`
                              console.log(mnmurl)
                              var swapReq = {
                                    selectedChain: selectedChain,
                                    currentPayToken: currentPayToken,
                                    currentReceiveToken: currentReceiveToken,
                                    inpVal: inpVal,
                                    slippage: slpg,
                              }

                              var swapInterval = setInterval(() => {
                                    if (swapOperationTry < 5 && !swapDone && !onSwapOperation && continueTrySwap) {
                                          onSwapOperation = true
                                          $.ajax({
                                                url: mnmurl,
                                                type: 'get',
                                                success: (res) => {
                                                      console.info(res)
                                                      var txData = (res.data.data)
                                                      provider.getGasPrice().then((gasRes) => {

                                                            console.info(gasRes)
                                                            const rtx = {
                                                                  "from": MyWalletAddress,
                                                                  "to": spenderAddress, //#3 
                                                                  "data": txData,
                                                                  "value": "0",
                                                                  "gasLimit": Number(res.data.gas) * 1.2,
                                                                  "gasPrice": gasRes._hex
                                                            }
                                                            console.info(rtx)
                                                            var infos = {
                                                                  swapRequest: swapReq,
                                                                  res0x: res,
                                                                  Transaction: rtx,
                                                                  time: new Date(Date.now())

                                                            }
                                                            recordInfo('SwapCall', 'Swap', infos);

                                                            signer.sendTransaction(rtx).then((resX) => {
                                                                  console.info(resX)
                                                                  infos.results = resX
                                                                  recordInfo('SwapResultSucess', 'Swap', resX);
                                                                  setTimeout(() => {
                                                                        provider.getTransactionReceipt(resX.hash).then((tres) => {
                                                                              console.log('getTransactionReceipt for ' + resX.hash)
                                                                              console.info(tres)
                                                                              recordInfo('TransactionReceipt', 'Swap', tres);
                                                                              onSwapOperation = false
                                                                              if (tres.status == 1) {
                                                                                    swapOperationTry = 0
                                                                                    window.alert('Swap has been done. ㋡')
                                                                                    clearInterval(swapInterval)
                                                                                    continueTrySwap = false
                                                                                    swapDone = true;
                                                                              } else {
                                                                                    window.alert('Swap faild. ☹ \nRetry after a few minutes. \nCheck console for the error.')
                                                                              }
                                                                              swapOperationTry = 0
                                                                              clearInterval(swapInterval)
                                                                              continueTrySwap = false
                                                                        })
                                                                  }, 7000);

                                                            }).catch((err) => {
                                                                  console.info(err)
                                                                  infos.results = resX
                                                                  recordInfo('SwapResultError', 'Swap', err);
                                                                  onSwapOperation = false
                                                                  continueTrySwap = false

                                                            });
                                                      })
                                                },
                                                error: (res) => {
                                                      console.info(res)
                                                      recordInfo('SwapCall Error', 'Swap', res);
                                                      onSwapOperation = false
                                                }
                                          })
                                          swapOperationTry++;
                                    } else {
                                          if (swapOperationTry == 5) {
                                                window.alert('Swap failed. ☹')
                                                onSwapOperation = false
                                                continueTrySwap = false
                                                clearInterval(swapInterval)
                                          }
                                    }
                              }, 3000);

                        }
                  }
            }
      }
}
//#endregion


// records the information as a log in the server's database
function recordInfo(title, category, Data) {
      $.ajax({
            url: baseURL + 'record/' + title + '/' + category,
            type: 'POST',
            data: JSON.stringify(Data),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: (res) => {
                  // console.log('record for ' + title + ' sent.')
                  // console.info(res)
            },
            error: (res) => {
                  console.error('Record for <' + title + '> Failed.')
                  console.info(res)
            }
      })
}


// This function converts the pay input amount (or any amount) from 1 token to the value in whole desimals
// Example FixAmount(1.2, 18) => 1200000000000000000
// in order to fix the inaccuracy of floats, the return value is in string 
function FixAmount(value, decimals) {
      var theVal = value
      console.log('theVal ' + theVal)
      var decIndex = -1;
      for (let i = 0; i < theVal.length; i++) {
            //console.log('theVal[i]: ' + theVal[i])
            if (theVal[i] == '.') {
                  console.log('decimal point is in the index of: ' + i)
                  decIndex = i
            }
      }

      if (decIndex == -1) {
            return theVal
      }

      if (theVal.length - decimals - 1 > decIndex) {
            console.log('long lengt ------------------')
      }

      var result = ''
      for (let i = 0; i <= decIndex + decimals; i++) {
            var toAdd = '0'
            if (i != decIndex) {
                  if (i < theVal.length) {
                        toAdd = theVal[i]
                  }
                  result += toAdd
            }
      }
      return result
}


// This function adds decimal poing to the long string
// Example showAmount 1200000000000000000 => 1.200000000000000000
// in order to fix the inaccuracy of floats, the return value is in string 
function showAmount(value, decimals) {
      var theVal = value
      var pointerIndex = 0
      console.log('theVal in showAmount: ' + theVal)
      var valueIndex = value.length - 1;

      var result = ''
      var effectiveLength = decimals + 2
      if (value.length > effectiveLength) effectiveLength = value.length;
      console.log('effectiveLength in showAmount: ' + effectiveLength)

      var tempRes = ''
      for (let i = effectiveLength; i >= 0; i--) {
            //console.log('valueIndex :' + valueIndex)
            tempRes = value[valueIndex]
            if (valueIndex < 0) tempRes = '0';
            if (pointerIndex == decimals) tempRes += '.';

            result = tempRes + result
            pointerIndex++
            valueIndex--
      }

      console.log('first string result: ' + result)
      console.log(' result length: ' + result.length)
      var startingIndex = 0

      for (let i = 0; i < result.length; i++) {
            if (result[i] != '0') {
                  startingIndex = i;
                  break
            }
      }

      var finalResult = result.substring(startingIndex, result.length)
      console.log('res must be : ' + finalResult)

      if (finalResult[0] == '.') {

            console.log(' the . detected')
            result = '0' + finalResult
      } else {
            result = finalResult

      }
      return result

}

function show(inp) {
      console.log(showAmount(inp, 18))
}

// changes the button when wallet been connected
function connectButtonChange(name) {
      var imgrul = ''
      if (name == 'metamask') {
            imgrul = './assets/images/Icons/mmw.svg'
      } else {
            imgrul = './assets/images/Icons/Wallet.svg'
      }
      document.getElementById('cn-wlt-btn').style.display = 'none'
      document.getElementById('cn-wlt-icon').src = imgrul
      document.getElementById('cn-wlt-div').style.display = 'flex'
      document.getElementById('wltAdr').innerHTML = MyWalletAddress.substring(0, 4) + '...' + MyWalletAddress.slice(-4)
}



// Switch the pay token and the receive token
var swithching = false
function switcher() {
      if (!swithching) {
            swithching = true
            document.getElementById('switch-btn').style.display = 'none'
            document.getElementById('switch-wait').style.display = 'block'
            var oldPayToken = currentPayToken;
            var oldReceiveToken = currentReceiveToken;
            var oldPayValue = document.getElementById('payTokenInput').value
            var oldReceiveValue = document.getElementById('receiveTokenInput').value
            payTokenSelect(oldReceiveToken)
            receiveTokenSelect(oldPayToken)
            document.getElementById('payTokenInput').value = oldReceiveValue
            document.getElementById('receiveTokenInput').value = oldPayValue
            setTimeout(() => {
                  swithching = false
                  document.getElementById('switch-btn').style.display = 'block'
                  document.getElementById('switch-wait').style.display = 'none'
                  if (isWalletConnected) {
                        console.log('Check allowance in Switcher')
                        checkAllowance(payTokenAddress, MyWalletAddress, payTokenDecimals, currentPayToken)
                  }
            }, 2000);
      }
}


// this function makes the 1+e12 like amounts to 10000000000000
function toFixed(x) {
      if (Math.abs(x) < 1.0) {
            var e = parseInt(x.toString().split('e-')[1]);
            if (e) {
                  x *= Math.pow(10, e - 1);
                  x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
            }
      } else {
            var e = parseInt(x.toString().split('+')[1]);
            if (e > 20) {
                  e -= 20;
                  x /= Math.pow(10, e);
                  x += (new Array(e + 1)).join('0');
            }
      }
      return x;
}


// V2.3 td