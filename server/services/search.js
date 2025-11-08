import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const MEILI_HOST = process.env.MEILI_HOST;
const MEILI_API_KEY = process.env.MEILI_API_KEY;

let index = null;

// Dynamically import Meili client only when MEILI_HOST is configured.
if (MEILI_HOST) {
  try {
    const { MeiliSearch } = await import("meilisearch");
    const client = new MeiliSearch({ host: MEILI_HOST, apiKey: MEILI_API_KEY });
    index = client.index("products");
  } catch (err) {
    console.error(
      "Failed to load MeiliSearch client. Set MEILI_HOST and MEILI_API_KEY in .env to enable indexing.",
      err
    );
    index = null;
  }
}

export async function indexProduct(product) {
  if (!index) return;
  try {
    const doc = {
      id: product._id.toString(),
      title: product.title,
      description: product.description,
      brand: product.brand,
      tags: product.tags,
      slug: product.slug,
    };
    await index.addDocuments([doc]);
  } catch (err) {
    console.error("Meili index error", err);
  }
}

export async function removeProductFromIndex(id) {
  if (!index) return;
  try {
    await index.deleteDocument(id.toString());
  } catch (err) {
    console.error("Meili delete error", err);
  }
}
