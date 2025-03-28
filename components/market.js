"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Market() {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buying, setBuying] = useState(null);
  const router = useRouter();

  const fetchNFTs = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        "/api/mystore",
        { walletAddress: process.env.NEXT_PUBLIC_WALLET },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const nftsWithKeys = response.data.map((nft, index) => ({
        ...nft,
        uniqueKey: `${nft.contract}-${nft.identifier || index}`,
        price:
          nft.price || generateStableCryptoPrice(nft.contract, nft.identifier),
        currency: nft.currency || "ETH",
        image_url: nft.image_url || "/image.png",
        token_id: nft.identifier,
      }));

      setNfts(nftsWithKeys);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch NFTs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateStableCryptoPrice = (contract, tokenId) => {
    const hash = `${contract}-${tokenId}`.split("").reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);

    const patterns = [
      0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5,
    ];
    const selectedPattern = patterns[hash % patterns.length];
    const variation = 0.9 + (hash % 20) / 100;

    return Math.round(selectedPattern * variation * 10 ** 18);
  };

  const handleBuy = async (nft) => {
    setBuying(nft.uniqueKey);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const nftDataString = JSON.stringify(nft);
      const encodedNftData = btoa(encodeURIComponent(nftDataString));

      router.push(`/purchase/success?nft=${encodedNftData}`);
    } catch (err) {
      setError("Purchase failed. Please try again.");
    } finally {
      setBuying(null);
    }
  };

  useEffect(() => {
    fetchNFTs();
  }, []);

  const formatPrice = (price, currency) => {
    if (!price) return "No price set";

    const parsedPrice = parseFloat(price) / 10 ** 18;
    if (isNaN(parsedPrice)) return "Invalid price";

    let decimals = parsedPrice < 0.01 ? 4 : parsedPrice < 1 ? 3 : 2;
    const formattedPrice = parsedPrice.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    return `${formattedPrice} ${currency}`;
  };

  const SkeletonCard = () => (
    <div className="bg-[#000] rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow animate-pulse">
      <div className="aspect-square bg-[#111]"></div>
      <div className="p-4 space-y-3">
        <div className="h-5 bg-[#111] rounded w-3/4"></div>
        <div className="h-4 bg-[#111] rounded w-1/2"></div>
        <div className="h-9 bg-[#b2ff00] bg-opacity-20 rounded mt-2"></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#000] text-[#fff]">
      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-900 border-l-4 border-red-500 text-red-100 p-4 mb-8 rounded">
            <div className="font-bold">Error:</div>
            <div>{error}</div>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={`skeleton-${i}`} />
            ))}
          </div>
        ) : nfts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {nfts.map((nft) => (
              <div
                key={nft.uniqueKey}
                className="bg-[#000] rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-[#222] hover:border-[#b2ff00]"
              >
                <div className="relative aspect-square group">
                  <img
                    src={nft.image_url}
                    alt={nft.name || `NFT #${nft.identifier}`}
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                    onError={(e) => (e.target.src = "/image.png")}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-[#b2ff00] text-sm font-medium">
                      View Details
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold truncate">
                    {nft.name || `#${nft.identifier}`}
                  </h3>
                  <p className="text-[#b2ff00] text-sm mt-1 truncate">
                    {nft.collection_name ||
                      nft.collection ||
                      "Unnamed Collection"}
                  </p>
                  <div className="mt-4 flex justify-between items-center">
                    <div className="font-medium text-[#b2ff00]">
                      {formatPrice(nft.price, nft.currency)}
                    </div>
                    <button
                      onClick={() => handleBuy(nft)}
                      disabled={buying === nft.uniqueKey}
                      className={`px-3 py-2 text-sm rounded-lg font-medium transition-colors ${
                        buying === nft.uniqueKey
                          ? "bg-[#b2ff00] bg-opacity-50 text-[#000] cursor-not-allowed"
                          : "bg-[#b2ff00] hover:bg-[#9ae000] text-[#000]"
                      }`}
                    >
                      {buying === nft.uniqueKey ? "Processing..." : "Buy"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-xl mb-4 text-[#b2ff00]">
              No NFTs found in collection
            </div>
            <button
              onClick={fetchNFTs}
              className="px-6 py-2 bg-[#b2ff00] hover:bg-[#9ae000] text-[#000] rounded-lg font-medium transition-colors"
            >
              Refresh Collection
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
