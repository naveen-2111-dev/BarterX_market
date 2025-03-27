import ConnectDb from "@/lib/db/connect";

export default async function handler(req, res) {
  const db = await ConnectDb();

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { walletId } = req.body;

  if (!walletId) {
    return res.status(400).json({ error: "walletId required!" });
  }

  try {
    const user = await db.findOne({ walletId });
    if (!user) {
      return res.status(404).json({ error: "wallet id not found!" });
    }

    return res.status(200).json({
      message: "data slugs",
      data: { Slug: user.slugs },
    });
  } catch (error) {
    console.error("Database query error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
