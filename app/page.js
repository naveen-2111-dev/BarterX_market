"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import marketplaceABI from "@/contract/Market_place.json";
import {
  ShoppingBag,
  Truck,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export default function Marketplace() {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [account, setAccount] = useState("");

  const initializeContract = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!window.ethereum) {
        throw new Error("Please install MetaMask");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractAddress = marketplaceABI.address;

      const marketplaceContract = new ethers.Contract(
        contractAddress,
        marketplaceABI.abi,
        signer
      );

      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);

      setContract(marketplaceContract);

      const productCount = await marketplaceContract.productCount();
      console.log("Total products:", Number(productCount));

      const loadedProducts = [];
      for (let i = 1; i <= Number(productCount); i++) {
        try {
          const product = await marketplaceContract.store(i);

          loadedProducts.push({
            id: i,
            price: ethers.formatUnits(product.price, 18),
            stock: Number(product.stock),
            name: ethers.decodeBytes32String(product.name),
            description: ethers.toUtf8String(product.description),
            image: product.image,
            productType: ethers.decodeBytes32String(product.productType),
            condition: ethers.decodeBytes32String(product.condition),
            seller: product.seller,
          });
        } catch (err) {
          console.error(`Error loading product ${i}:`, err);
        }
      }

      setProducts(loadedProducts);
    } catch (err) {
      console.error("Initialization error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async (productId) => {
    if (!contract || !paymentMethod) {
      setError("Contract not initialized or payment method not selected");
      return;
    }

    try {
      setLoading(true);
      const isPayNow = paymentMethod === "paynow";
      const product = products.find((p) => p.id === productId);

      const priceInWei = ethers.parseUnits(product.price, 18);

      const tx = await contract.buyProduct(productId, isPayNow, {
        value: isPayNow ? priceInWei : 0,
      });

      await tx.wait();
      setShowPaymentModal(false);
      alert(
        `Order placed successfully! Payment: ${
          isPayNow ? "Paid" : "On Delivery"
        }`
      );

      initializeContract();
    } catch (error) {
      console.error("Error placing order:", error);
      setError(error.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      initializeContract();

      window.ethereum.on("accountsChanged", (accounts) => {
        setAccount(accounts[0] || "");
        initializeContract();
      });

      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });

      return () => {
        window.ethereum.removeListener("accountsChanged", () => {});
        window.ethereum.removeListener("chainChanged", () => {});
      };
    }
  }, []);

  const bytesToImageUrl = (bytes) => {
    try {
      // Handle empty or undefined bytes
      if (!bytes || bytes.length === 0) {
        return "/placeholder-product.png";
      }

      const hexString = ethers.hexlify(bytes);

      // 1. Check for common image magic numbers (first few bytes)
      const imageHeaders = {
        "0x89504e47": "data:image/png;base64,", // PNG
        "0xffd8ffe0": "data:image/jpeg;base64,", // JPEG
        "0xffd8ffe1": "data:image/jpeg;base64,", // JPEG
        "0x47494638": "data:image/gif;base64,", // GIF
        "0x52494646": "data:image/webp;base64,", // WEBP
      };

      for (const [header, prefix] of Object.entries(imageHeaders)) {
        if (hexString.startsWith(header)) {
          const base64Data = ethers.toBase64(bytes);
          return `${prefix}${base64Data}`;
        }
      }

      if (hexString.startsWith("0x64617461")) {
        const base64Data = hexString.slice(10);
        if (/^[a-zA-Z0-9+/]+={0,2}$/.test(base64Data)) {
          return `data:image/png;base64,${base64Data}`;
        }
      }

      const potentialCid = hexString.slice(2);

      const ipfsGateways = [
        `https://ipfs.io/ipfs/${potentialCid}`,
        `https://cloudflare-ipfs.com/ipfs/${potentialCid}`,
        `https://dweb.link/ipfs/${potentialCid}`,
        `https://gateway.pinata.cloud/ipfs/${potentialCid}`,
      ];

      return ipfsGateways[0];
    } catch (e) {
      console.error("Image conversion error:", e);
      return "/image.png";
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const StatusBadge = ({ status }) => {
    const statusConfig = {
      Delivered: {
        icon: <CheckCircle2 className="mr-1" />,
        color: "bg-green-100 text-green-800",
      },
      Paid: {
        icon: <DollarSign className="mr-1" />,
        color: "bg-blue-100 text-blue-800",
      },
      Pending: {
        icon: <AlertCircle className="mr-1" />,
        color: "bg-yellow-100 text-yellow-800",
      },
    };

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusConfig[status].color}`}
      >
        {statusConfig[status].icon}
        {status}
      </span>
    );
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="bg-gray-800 rounded-xl overflow-hidden shadow-lg h-full"
              >
                <div className="h-48 bg-gray-700 animate-pulse"></div>
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-gray-700 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-700 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-700 rounded w-1/2 animate-pulse"></div>
                  <div className="h-10 bg-gray-700 rounded mt-4 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900/50 p-4 rounded-lg mb-8">
            <div className="flex items-center">
              <AlertCircle className="mr-2" />
              <span>Error: {error}</span>
            </div>
            <button
              onClick={initializeContract}
              className="mt-3 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold flex items-center">
            <ShoppingBag className="mr-3" />
            BarterX Marketplace
          </h1>
          {account && (
            <div className="bg-gray-800 px-4 py-2 rounded-lg">
              Connected: {formatAddress(account)}
            </div>
          )}
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all h-full flex flex-col"
              >
                <div className="h-48 bg-gray-700 overflow-hidden">
                  <img
                    src={bytesToImageUrl(product.image)}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => (e.target.src = "/image.png")}
                  />
                </div>
                <div className="p-4 flex-grow flex flex-col">
                  <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
                  <p className="text-gray-400 text-sm mb-3 flex-grow">
                    {product.description}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                    <div>
                      <span className="text-gray-400">Price:</span>
                      <span className="text-emerald-400 ml-1">
                        {product.price} BRTX
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Stock:</span>
                      <span className="ml-1">{product.stock}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Type:</span>
                      <span className="ml-1">{product.productType}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Condition:</span>
                      <span className="ml-1">{product.condition}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedProduct(product.id);
                      setShowPaymentModal(true);
                    }}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition-colors mt-auto"
                    disabled={product.stock <= 0}
                  >
                    {product.stock <= 0 ? "Out of Stock" : "Buy Now"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">No products available</div>
            <button
              onClick={initializeContract}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg flex items-center mx-auto"
            >
              <RefreshCw className="mr-2" />
              Refresh Products
            </button>
          </div>
        )}
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">
              Select Payment Method
            </h2>
            <div className="space-y-3 mb-6">
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === "paynow"
                    ? "border-emerald-400 bg-emerald-400/10"
                    : "border-gray-700 hover:border-gray-600"
                }`}
                onClick={() => setPaymentMethod("paynow")}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center mr-3">
                    <DollarSign className="text-gray-900" />
                  </div>
                  <div>
                    <h3 className="font-medium">Pay Now</h3>
                    <p className="text-sm text-gray-400">
                      Instant payment with crypto
                    </p>
                  </div>
                </div>
              </div>
              <div
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === "delivery"
                    ? "border-emerald-400 bg-emerald-400/10"
                    : "border-gray-700 hover:border-gray-600"
                }`}
                onClick={() => setPaymentMethod("delivery")}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center mr-3">
                    <Truck className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">Pay on Delivery</h3>
                    <p className="text-sm text-gray-400">
                      Pay when you receive the product
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePlaceOrder(selectedProduct)}
                disabled={!paymentMethod || loading}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  paymentMethod
                    ? "bg-emerald-500 hover:bg-emerald-600"
                    : "bg-gray-600 cursor-not-allowed"
                }`}
              >
                {loading ? "Processing..." : "Confirm Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
