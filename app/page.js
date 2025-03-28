"use client";
import { useEffect, useState } from "react";
import { useContract } from "@/hooks/useContract";
import { ethers } from "ethers";

export default function Home() {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [products, setProducts] = useState([]);

  const initializeContract = async () => {
    setLoading(true);
    setError(null);
    try {
      const contractFunctions = await useContract();
      setContract(contractFunctions);

      // Fetch products from contract
      if (contractFunctions && contractFunctions.GetProducts) {
        const productCount = await contractFunctions.GetProducts();
        const loadedProducts = [];

        // Temporary placeholder - replace with actual contract data fetching
        for (let i = 0; i < Math.min(productCount, 5); i++) {
          loadedProducts.push({
            id: i,
            name: "Loading product...",
            price: 0.1,
            stock: 10,
            description: "Product description loading...",
            image: "/placeholder-product.jpg",
            productType: "Electronics",
            condition: "New",
          });
        }

        setProducts(loadedProducts);
      }
    } catch (err) {
      console.error("Contract initialization error:", err);
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
      const isPayNow = paymentMethod === "paynow";
      const product = products.find((p) => p.id === productId);

      await contract.PlaceOrder(
        productId,
        isPayNow,
        ethers.parseEther(product.price.toString())
      );

      setShowPaymentModal(false);
      alert(
        `Order placed successfully! Payment: ${
          isPayNow ? "Paid" : "On Delivery"
        }`
      );
    } catch (error) {
      console.error("Error placing order:", error);
      setError(error.message);
    }
  };

  useEffect(() => {
    if (window.ethereum?.isConnected()) {
      initializeContract();
    }
  }, []);

  const ProductCard = ({ product }) => (
    <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all h-full flex flex-col">
      <div className="h-48 bg-gray-700 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => (e.target.src = "/placeholder-product.jpg")}
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
              {ethers.formatEther(product.price)} ETH
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
          disabled={loading}
        >
          {loading ? "Loading..." : "Place Order"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
      {error && (
        <div className="text-red-300 p-4 bg-red-900/50 rounded-lg mb-8">
          Error: {error}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {loading ? (
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.length > 0 ? (
              products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 mb-4">No products available</div>
                <button
                  onClick={initializeContract}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg"
                >
                  Refresh Products
                </button>
              </div>
            )}
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-900"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1a1 1 0 011-1h2a1 1 0 011 1v1a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H19a1 1 0 001-1V5a1 1 0 00-1-1H3zM3 5h2v2h2.25a.75.75 0 01.75.75v6.5a.75.75 0 01-.75.75H5v2h10v-2h-2.25a.75.75 0 01-.75-.75v-6.5a.75.75 0 01.75-.75H15V5h2v2h2V5H3z" />
                    </svg>
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
                disabled={!paymentMethod}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  paymentMethod
                    ? "bg-emerald-500 hover:bg-emerald-600"
                    : "bg-gray-600 cursor-not-allowed"
                }`}
              >
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
