import Groq from "groq-sdk";
import { WebProduct } from "../webSearch/types";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const extractJson = (content: string): string => {
  const cleaned = content
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("AI response did not contain valid JSON");
  }

  return cleaned.substring(firstBrace, lastBrace + 1);
};

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export const rankProductsWithAI = async (
  userQuery: string,
  searchResults: SearchResult[]
): Promise<WebProduct[]> => {
  const response = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",

    messages: [
      {
        role: "system",
        content: `
You are an AI shopping assistant.

You are given web search results that have already been discovered by a search engine.

Your job is ONLY to:
1. Identify products relevant to the user's request.
2. Remove irrelevant and duplicate results.
3. Rank the best matching products.
4. Extract only information explicitly present in the search result.
5. Return up to 5 products.

Do NOT perform web searches.
Do NOT invent missing information.

Return ONLY valid JSON:

{
  "products": [
    {
      "name": "product name",
      "price": null,
      "currency": "INR",
      "image": null,
      "rating": null,
      "reviewCount": null,
      "specifications": {},
      "description": "short description",
      "sourceName": "website name",
      "sourceUrl": "product URL"
    }
  ]
}

RULES:

- Return 3-5 products when enough relevant results exist.
- Return fewer if fewer relevant products exist.
- Maximum 5 products.
- Prefer genuinely different products.
- Prefer different brands when possible.
- Respect the user's budget.
- Match the user's requested specifications.
- Do not invent prices.
- Do not invent ratings.
- Do not invent review counts.
- Do not invent specifications.
- Do not invent images.
- Do not invent URLs.
- Use null when information is unavailable.
- Keep descriptions under 20 words.
- Use only information contained in the supplied search results.
- sourceUrl must be the URL supplied by the search engine.
- Do not return Markdown.
- Do not include explanations.
- Return only the JSON object.

These are discovery results only.
No purchase or payment has occurred.
`,
      },
      {
        role: "user",
        content: `
USER REQUEST:
${userQuery}

WEB SEARCH RESULTS:

${searchResults
  .map(
    (result, index) => `
RESULT ${index + 1}
Title: ${result.title}
URL: ${result.url}
Snippet: ${result.snippet}
`
  )
  .join("\n")}
`,
      },
    ],

    temperature: 0,
    reasoning_effort: "low",
    max_completion_tokens: 1400,
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("AI returned an empty response");
  }

  const json = extractJson(content);

  let parsed: {
    products?: WebProduct[];
  };

  try {
    parsed = JSON.parse(json);
  } catch (error) {
    console.error("Invalid AI JSON:", content);
    throw new Error("AI returned invalid product JSON");
  }

  if (!Array.isArray(parsed.products)) {
    throw new Error("AI response does not contain a products array");
  }

  return parsed.products.slice(0, 5);
};