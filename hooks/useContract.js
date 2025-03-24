import contractConfig from "@/contract/Nftname_transfer.json";
import { ethers } from "ethers";

export async function useContract() {
  const Instance = async () => {
    if (!contractConfig) throw new Error("contract");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      if (!signer) {
        throw new Error("signer not seen! please connect your wallet");
      }

      return new ethers.Contract(
        contractConfig.address,
        contractConfig.abi,
        signer
      );
    } catch (error) {
      throw new Error("failed to create instance");
    }
  };

  const callContract = () => {
    const NameTransfer = async (contractAddress, tokenId) => {
      const contractInstance = await Instance();
      const tx = await contractInstance.NameTransfer(contractAddress, tokenId);
      await tx.wait();
    };

    return NameTransfer;
  };

  return { Instance, callContract };
}
