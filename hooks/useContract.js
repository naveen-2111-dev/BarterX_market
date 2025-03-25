import NftContract_config from "@/contract/Nftname_transfer.json";
import Marketplace_config from "@/contract/Market_place.json";
import Erc_config from "@/contract/Erc20.json";
import { ethers } from "ethers";

export async function useContract() {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask or similar wallet extension not detected!");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    if (!signer) {
      throw new Error("Signer not found! Please connect your wallet.");
    }

    const validateAddress = (address, name) => {
      if (!address) {
        throw new Error(`${name} contract address is undefined`);
      }
      if (!ethers.isAddress(address)) {
        throw new Error(`Invalid ${name} contract address: ${address}`);
      }
      return address;
    };

    const nftAddress = validateAddress(NftContract_config.address, "NFT");
    const ercAddress = validateAddress(Erc_config.address, "ERC20");
    const marketplaceAddress = validateAddress(
      Marketplace_config.address,
      "Marketplace"
    );

    const Nft = new ethers.Contract(nftAddress, NftContract_config.abi, signer);
    const BRTX = new ethers.Contract(ercAddress, Erc_config.abi, signer);
    const Marketplace = new ethers.Contract(
      marketplaceAddress,
      Marketplace_config.abi,
      signer
    );

    const NameTransfer = async (contractAddress, tokenId) => {
      try {
        const tx = await Nft.NameTransfer(contractAddress, tokenId, {
          gasLimit: 300000,
        });
        const receipt = await tx.wait();
        console.log("NFT Transfer successful!", receipt);
        return receipt;
      } catch (error) {
        console.error("NFT Transfer failed:", error);
        throw new Error(`NFT Transfer failed: ${error.message}`);
      }
    };

    const GetProducts = async () => {
      try {
        console.log("Fetching products...");
        const count = await Marketplace.ProductCount();
        console.log(`Found ${count} products`);

        const products = [];
        for (let i = 0; i < count; i++) {
          const product = await Marketplace.store(i);
          products.push({
            id: i,
            price: product.price.toString(),
            stock: product.stock.toString(),
            name: product.name,
            description: product.description,
            image: product.image,
            productType: product.productType,
            condition: product.condition,
            seller: product.seller,
          });
        }
        console.log("Products fetched successfully:", products);
        return products;
      } catch (error) {
        console.error("Failed to fetch products:", error);
        throw new Error(`Failed to fetch products: ${error.message}`);
      }
    };

    const PlaceOrder = async (id, isPrepaid) => {
      try {
        console.log(`Placing order for product ${id}, prepaid: ${isPrepaid}`);

        const productData = await Marketplace.store(id);
        if (!productData || productData.price === undefined) {
          throw new Error(`Product ${id} not found or invalid`);
        }

        const productPrice = productData.price;

        if (isPrepaid) {
          const userAddress = await signer.getAddress();
          const currentAllowance = await BRTX.allowance(
            userAddress,
            marketplaceAddress
          );

          if (currentAllowance < productPrice) {
            console.log("Approving ERC20 tokens...");
            const approveTx = await BRTX.approve(
              marketplaceAddress,
              productPrice
            );
            await approveTx.wait();
            console.log("Approval successful");
          }
        }

        console.log("Executing purchase...");
        const tx = await Marketplace.buyProduct(id, isPrepaid, {
          gasLimit: 500000,
        });

        const receipt = await tx.wait();
        console.log("Order placed successfully!", receipt);

        return {
          success: true,
          transactionHash: receipt.hash,
          productId: id,
          amount: productPrice.toString(),
        };
      } catch (error) {
        console.error("Failed to place order:", error);

        let errorMessage = error.message;
        if (error.info && error.info.error) {
          errorMessage += ` (${error.info.error.message})`;
        } else if (error.reason) {
          errorMessage += ` (${error.reason})`;
        }

        throw new Error(`Order failed: ${errorMessage}`);
      }
    };

    return {
      NameTransfer,
      GetProducts,
      PlaceOrder,
      contracts: { Nft, BRTX, Marketplace },
    };
  } catch (error) {
    console.error("Contract initialization failed:", error);
    throw new Error(`Contract initialization failed: ${error.message}`);
  }
}
