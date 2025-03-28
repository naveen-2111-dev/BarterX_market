import axios from "axios";

export default async function GetSlug(walletId) {
  try {
    if (!walletId) {
      console.error("No walletId provided");
      return null;
    }

    const res = await axios.post(
      "/api/getslug",
      { walletId },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (res.data?.error) {
      console.error("API Error:", res.data.error);
      return null;
    }

    const slugs = res.data?.data?.Slug || [];

    if (slugs.length === 0) {
      return { slugs: [], collections: [] };
    }

    const collections = [];
    for (const slug of slugs) {
      try {
        const collectionRes = await axios.get(
          `/api/opensea?slug=${encodeURIComponent(slug)}`
        );

        if (collectionRes.data?.data) {
          collections.push({
            slug,
            data: collectionRes.data.data,
          });
        }
      } catch (error) {
        console.error(
          `Error fetching collection for slug ${slug}:`,
          error.message
        );
        collections.push({
          slug,
          error: error.message,
        });
      }
    }

    // try {
    //   const url = `https://testnets-api.opensea.io/api/v2/chain/sepolia/contract/${address}/nfts`;

    //   const response = await axios.get(url);

    //   console.log("NFT Data:", response.data);
    //   return response.data;
    // } catch (error) {
    //   console.error(
    //     "Error fetching NFTs:",
    //     error.response?.data || error.message
    //   );
    //   return null;
    // }const res = await axios.post("/api/getslug", { walletId });

    return {
      slugs,
      collections,
    };
  } catch (error) {
    console.error(
      "Error fetching slug:",
      error.response?.data || error.message
    );
    return null;
  }
}
