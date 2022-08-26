import React, { useState } from "react";
import Web3 from "web3";
require('dotenv').config();

//get .env params
const Account       = process.env.REACT_APP_ACCOUNT;
const PrivateKey    = process.env.REACT_APP_PRIVATE_KEY;
const RpcHttpUrl    = process.env.REACT_APP_RPC_HTTP_URL; //Infura
//create web3 connection
const web3          = new Web3(new Web3.providers.HttpProvider(RpcHttpUrl));  
//get contract abi
const abi   = JSON.parse('[{"inputs":[{"internalType":"string","name":"name_","type":"string"},{"internalType":"string","name":"symbol_","type":"string"},{"internalType":"uint256","name":"initialBalance_","type":"uint256"},{"internalType":"address payable","name":"feeReceiver_","type":"address"}],"stateMutability":"payable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"generator","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"version","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}]');

//this is temp list. Should use some storage (database)
let tokenList = [];
let trxList   = [];

function Main(props){
    //set params
    const [receiverAddress, setReceiverAddress]     = useState("");
    const [transferAmount, setTransferAmount]       = useState("");
    const [tokenAddress, setTokenAddress]           = useState("");
    const [etherBalance, setEtherBalance]           = useState("");
    const [addAssetAddress, setAddAssetAddress]     = useState("");
    const [assetList, setAssetList]                 = useState([]);
    const [activityList, setActivityList]           = useState([]);
    const [transferType, setTransferType]           = useState("eth_transfer");
    const [tokenFieldDisable, setTokenFieldDisable] = useState(true);
    
    //get ether balance
    async function getAccountBalance(){
        const balance       = await web3.eth.getBalance(Account); //return in wei
        const etherBalance  = web3.utils.fromWei(balance.toString(), 'Ether');
        setEtherBalance(etherBalance); 
    }
    getAccountBalance();

    //add token asset for wallet
    async function addAsset(){
        //create token contract
        const tokenContract = new web3.eth.Contract(abi, addAssetAddress);
        const balance       = await tokenContract.methods.balanceOf(Account).call();
        const tokenBalance  = web3.utils.fromWei(balance.toString(), 'Ether');

        const asset = {
            'assetNumber': tokenList.length + 1,
            'tokenAddress': addAssetAddress,
            'tokenBalance': tokenBalance
        }
        // this is per session temp list. you should use database to store and retrive 
        tokenList.push(asset);
        setAssetList([]);
        setAssetList(tokenList); 
    }

    //transfer eth from one account to other
    async function transfer(){
        //get nonce
        const nonce = await web3.eth.getTransactionCount(Account, "latest");
        //convert Eth to wei
        const value = web3.utils.toWei(transferAmount.toString(), 'Ether');

        let transaction;
        if(transferType === 'token_transfer'){
            //create token contract
            const tokenContract = new web3.eth.Contract(abi, tokenAddress);
            //create transaction data
            const data  = tokenContract.methods.transfer(receiverAddress, value).encodeABI();

            //prepare transaction. fields - to, value, gasPrice, gasLimit, nonce
            transaction = {
                'to': tokenAddress,
                'value': "0x00", //used only for eth transfer else 0
                'gasLimit': 6721975, //changed after EIP-1559 upgrade
                'gasPrice': 20000000000, //changed after EIP-1559 upgrade
                'nonce': nonce,
                'data': data //transaction data
            }
        } else if(transferType === 'eth_transfer'){
            //prepare transaction. fields - to, value, gasPrice, gasLimit, nonce
            transaction = {
                'to': receiverAddress,
                'value': value, //used only for eth transfer else 0
                'gasLimit': 6721975, //changed after EIP-1559 upgrade
                'gasPrice': 20000000000, //changed after EIP-1559 upgrade
                'nonce': nonce
            }
        }
        //create signed transaction
        const signTrx = await web3.eth.accounts.signTransaction(transaction, PrivateKey);
        //send signed transaction
        web3.eth.sendSignedTransaction(signTrx.rawTransaction, function(error, hash){
            if(error){
                console.log('Something went wrong', error);
            } else{
                console.log('transaction submitted ', hash);
                //window.alert('Transaction submitted. Hash : '+hash);
                const ref = "https://rinkeby.etherscan.io/tx/"+hash;
                const trx = {
                    'activityNumber': trxList.length + 1,
                    'tokenAddress': tokenAddress ? tokenAddress : 'ETH',
                    'transferAmount': transferAmount,
                    'trxHash': <a href={ref} target="_blank">0x..........</a>
                }
                //temp list
                trxList.push(trx);
                setActivityList([]);
                setActivityList(trxList);
            }
        })
    }

    return(
        <div>
            <br/>
            <div style={{color:"blue", fontSize:"1.5rem"}}>
                Welcome to DappBlocks!
            </div>
            <div style={{color:"blue", fontSize:"1.0rem"}}>
                {Account} : {etherBalance} ETH
            </div>
            <div>
                ------------------------------------------------------------------------------------------------------------
            </div>
            <div style={{color:"blue", fontSize:"1.1rem"}}>
                <b>Assets</b>
            </div>
            <div align="center">
                <table>
                    <thead>
                        <tr>
                            <th scope="col" style={{border: "1px solid black"}}> Token Address </th>
                            <th scope="col" style={{border: "1px solid black"}}> Balance </th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            //using asset list and iterate to create dynamic table rows
                            assetList.map((item) => {
                                return(
                                    <tr key={item.assetNumber}>
                                        <td style={{border: "1px solid black"}}>{item.tokenAddress}</td>
                                        <td style={{border: "1px solid black"}}>{item.tokenBalance}</td>
                                    </tr>
                                )
                            })
                        }
                    </tbody>
                </table>
            </div>
            <div style={{fontSize:"1.0rem"}}>
                Add Asset (Token) :
            </div>
            <div>
                <input
                    type="text"
                    style={{height:"1.4vw", width:"30vw"}}
                    onChange={(event) =>
                        setAddAssetAddress(event.target.value)
                    }
                    placeholder="0x0000....."
                />
            </div>
            <div>
                <button
                    type="submit"
                    onClick={() => addAsset()}
                >Add Asset</button>
            </div>
            <div>
                ------------------------------------------------------------------------------------------------------------
            </div>
            <div>
                <span>
                    <input type="radio" name="radio-group" value="eth_transfer"
                        onChange={(event) => {
                            setTransferType(event.target.value);
                            setTokenFieldDisable(true);
                        }}
                        defaultChecked
                    /> <b>ETH</b>
                </span>
                <span>
                    <input type="radio" name="radio-group" value="token_transfer"
                        onChange={(event) => {
                            setTransferType(event.target.value);
                            setTokenFieldDisable(false);
                        }}
                    /> <b>TOKEN</b>
                </span>
            </div>
            <div style={{fontSize:"1.0rem"}}>
                Token Address :
            </div>
            <div>
                <input
                    type="text"
                    style={{height:"1.5vw", width:"30vw"}}
                    onChange={(event) =>
                        setTokenAddress(event.target.value)
                    }
                    placeholder="0x0000....."
                    disabled={tokenFieldDisable}
                />
            </div>
            <div style={{fontSize:"1.0rem"}}>
                Send to :
            </div>
            <div>
                <input
                    type="text"
                    style={{height:"1.5vw", width:"30vw"}}
                    onChange={(event) =>
                        setReceiverAddress(event.target.value)
                    }
                    placeholder="0x0000....."
                />
            </div>
            <div style={{fontSize:"1.0rem"}}>
                Amount :
            </div>
            <div>
                <input
                    type="text"
                    style={{height:"1.5vw", width:"5vw"}}
                    onChange={(event) =>
                        setTransferAmount(event.target.value)
                    }
                    placeholder="0.0" 
                />
            </div>
            <div>
                <button
                    type="submit"
                    onClick={() => transfer()}
                >Send</button>
            </div>
            <div>
                ------------------------------------------------------------------------------------------------------------
            </div>
            <div style={{color:"blue", fontSize:"1.1rem"}}>
                <b>Activity</b>
            </div>
            <div align="center">
                <table className="table">
                    <thead>
                        <tr>
                            <th scope="col" style={{border: "1px solid black"}}> Token Address </th>
                            <th scope="col" style={{border: "1px solid black"}}> Transfer Amount </th>
                            <th scope="col" style={{border: "1px solid black"}}> Trx Hash </th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            //using activity list and iterate to create dynamic table rows
                            activityList.map((item) => {
                                return(
                                    <tr key={item.activityNumber}>
                                        <td style={{border: "1px solid black"}}>{item.tokenAddress}</td>
                                        <td style={{border: "1px solid black"}}>{item.transferAmount}</td>
                                        <td style={{border: "1px solid black"}}>{item.trxHash}</td>
                                    </tr>
                                )
                            })
                        }
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Main;