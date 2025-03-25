import NftContract_config from "@/contract/Nftname_transfer.json";
import Marketplace_config from "@/contract/Market_place.json";
import { ethers } from "ethers";

export async function useContract() {
  const Nft = async () => {
    if (!NftContract_config) throw new Error("contract");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    try {
      if (!signer) {
        throw new Error("signer not seen! please connect your wallet");
      }

      return new ethers.Contract(
        NftContract_config.address,
        NftContract_config.abi,
        signer
      );
    } catch (error) {
      throw new Error("failed to create instance");
    }
  };

  const Instance = async () => {
    if (!Marketplace_config) throw new Error("contract");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      if (!signer) {
        throw new Error("signer not seen! please connect your wallet");
      }

      return new ethers.Contract(
        Marketplace_config.address,
        Marketplace_config.abi,
        signer
      );
    } catch (error) {
      throw new Error("failed to create instance");
    }
  };

  const callContract = () => {
    const NameTransfer = async (contractAddress, tokenId) => {
      const contractInstance = await Nft();
      const tx = await contractInstance.NameTransfer(contractAddress, tokenId, {
        gasLimit: 300000,
      });
      await tx.wait();
    };

    const GetProducts = async () => {
      const contractInstance = await Instance();
      const count = contractInstance.store({
        gasLimit: 300000,
      });
      await count.wait();

      console.log(count);
    };

    //typeOfPayment = boolean
    const PlaceOrder = async (id, typeofPayment) => {
      const contract = await Instance();
      const res = await contract.buyProduct(id, typeofPayment, {
        gasLimit: 300000,
      });
      await res.wait();

      console.log(res);
    };

    return { NameTransfer, GetProducts, PlaceOrder };
  };

  return { Nft, Instance, callContract };
}
