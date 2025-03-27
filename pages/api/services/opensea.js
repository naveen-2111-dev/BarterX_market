import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { slug } = req.body;

  try {
    const response = await axios.get(
      `https://testnets-api.opensea.io/api/v2/listings/collection/${encodeURIComponent(
        slug
      )}/all`
    );

    if (!response) {
      return res.status(400).json({
        error: "fetch from opensea failed",
      });
    }

    return res.status(200).json({
      message: "success",
      data: {
        out: response.data,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: "internal server error",
    });
  }
}
