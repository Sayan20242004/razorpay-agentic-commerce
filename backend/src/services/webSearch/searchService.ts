import dotenv from "dotenv";
dotenv.config();

export interface Product {
  title: string;
  price: string;
  image: string;
  url: string;
  rating: string | null;
  reviewsCount: number | null;
}

export async function searchAmazon(query: string): Promise<Product[]> {
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    throw new Error("Missing RAPIDAPI_KEY in environment variables.");
  }

  // Encoding query and querying Amazon India (IN)
  const url = `https://real-time-amazon-data.p.rapidapi.com/search?query=${encodeURIComponent(
    query
  )}&country=IN`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "real-time-amazon-data.p.rapidapi.com",
      },
    });

    if (!response.ok) {
      throw new Error(`RapidAPI responded with status: ${response.status}`);
    }

    const json = await response.json();
    const productsList = json?.data?.products || [];

    // Map clean product objects directly
    return productsList.map((item: any) => ({
      title: item.product_title,
      price: item.product_price || "N/A",
      image: item.product_photo,
      url: item.product_url,
      rating: item.product_star_rating || null,
      reviewsCount: item.product_num_ratings || null,
    }));
  } catch (error) {
    console.error("Error fetching products from RapidAPI:", error);
    return [];
  }
}

// Quick Test Execution
(async () => {
  const products = await searchAmazon("ANC headphones under 5000");
  console.log("Fetched Products Count:", products.length);
  console.log("Sample Data:", JSON.stringify(products.slice(0, 2), null, 2));
})();