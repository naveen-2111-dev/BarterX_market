import ConnectDb from "@/lib/db/connect";

export default async function handler(req, res) {
  const db = await ConnectDb();

  if (req.method !== "POST") {
    return res
      .setHeader("Allow", ["POST"])
      .status(405)
      .json({ error: `Method ${req.method} Not Allowed` });
  }

  const { walletId, slug } = req.body;

  if (!walletId || !slug) {
    return res.status(400).json({ error: "walletId and slug are required" });
  }

  try {
    const wallet = await db.findOneAndUpdate(
      { walletId },
      { $addToSet: { slugs: slug } },
      { upsert: true, new: true }
    );

    return res.status(200).json(wallet);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
