import axios from "axios"
import cont_config from "@/contract/nftseller.json"
import { ethers } from "ethers";

export  async function POST(req,res){
    try{
        //api fetch [checked]
        //pass to contract

        const {address} = req.json();
        const res = await axios.get(`https://testnets-api.opensea.io/api/v2/chain/sepolia/account/${address}/nfts`,{
            headers:{
                "Content-Type": "application/json"
            }
        })

        const provider = new ethers.JsonRpcProvider("");
        const signer = new ethers.Wallet(provider, privatekey)

        const instance = new ethers.Contract(
            cont_config.address,
            cont_config.abi,
            signer
        )

    }catch(error){
        console.log(error)
    }
}