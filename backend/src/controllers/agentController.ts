import { Request, Response } from "express";
import { searchAmazon } from "../services/webSearch/searchService"; // or your RapidAPI search function

export const searchProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== "string") {
      res.status(400).json({
        success: false,
        message: "Search query is required",
      });
      return;
    }

    if (query.trim().length < 3) {
      res.status(400).json({
        success: false,
        message: "Search query is too short",
      });
      return;
    }

    // Call RapidAPI or your updated product search service
    const products = await searchAmazon(query.trim());

    res.status(200).json({
      success: true,
      query,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Product search error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to search products",
    });
  }
};

