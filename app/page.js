"use client";
import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useContract } from "@/hooks/useContract";
import { ethers } from "ethers";

export default function Home() {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const initializeContract = async () => {
    setLoading(true);
    setError(null);
    try {
      const contractFunctions = await useContract();
      setContract(contractFunctions);
    } catch (err) {
      console.error("Contract initialization error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only initialize when wallet is connected
    if (window.ethereum?.isConnected()) {
      initializeContract();
    }
  }, []);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <ConnectButton onConnect={() => initializeContract()} />

      {error && (
        <div className="text-red-500 p-4 bg-red-50 rounded-lg">
          Error: {error}
        </div>
      )}

      {loading ? (
        <div>Loading contracts...</div>
      ) : (
        <>
          <button
            onClick={async () => {
              if (!contract) return;
              try {
                await contract.GetProducts();
              } catch (error) {
                console.error("Error fetching products:", error);
                setError(error.message);
              }
            }}
            className="px-6 py-3 rounded-xl text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all duration-300 shadow-md"
            disabled={!contract}
          >
            Get Products
          </button>

          <button
            onClick={async () => {
              if (!contract) return;
              try {
                await contract.PlaceOrder(0, true, ethers.parseEther("1"));
              } catch (error) {
                console.error("Error placing order:", error);
                setError(error.message);
              }
            }}
            className="px-6 py-3 rounded-xl text-white bg-green-600 hover:bg-green-700 active:bg-green-800 transition-all duration-300 shadow-md"
            disabled={!contract}
          >
            Place Order
          </button>

          <button
            onClick={async () => {
              if (!contract) return;
              try {
                await contract.NameTransfer(
                  "0x6031c451eb796fcd742dbe6ca344b7d8551928ad",
                  8
                );
              } catch (error) {
                console.error("Error transferring NFT:", error);
                setError(error.message);
              }
            }}
            className="px-6 py-3 rounded-xl text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 transition-all duration-300 shadow-md"
            disabled={!contract}
          >
            NFT Transfer
          </button>
        </>
      )}
    </div>
  );
}
