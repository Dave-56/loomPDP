import { GoogleGenAI } from "@google/genai";
import { AspectRatio } from "../types";

export async function generateFashionImage(
  prompt: string,
  config: {
    aspectRatio: AspectRatio;
    referenceImage?: string;
    brandStyle?: string;
  }
): Promise<string> {
  // Create a new instance right before the call to use the latest selected key
  // We use direct process.env access which Vite will replace during build
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
  
  if (!apiKey) {
    throw new Error("API Key is missing. Please select an API key using the key icon in the header.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const model = "gemini-3.1-flash-image-preview";
  
  const systemPrompt = `You are a professional e-commerce fashion photographer. 
Your goal is to create store-ready PDP (Product Detail Page) assets.
Style Guidelines: ${config.brandStyle || 'Clean, minimalist studio background, professional high-key lighting, sharp focus on fabric texture.'}
Consistency: Maintain a consistent background and lighting across all generations.
Product: The clothing should be the central focus.

CRITICAL DETAIL PRESERVATION:
- You MUST preserve the EXACT placement, color, and design of all graphics, patches, embroidery, and textures from the SKU reference.
- Do not simplify or alter unique design elements.
- The garment on the model must look identical to the flatlay SKU provided.`;

  const contents = {
    parts: [
      { text: `${systemPrompt}\n\nTask: ${prompt}` },
    ] as any[],
  };

  if (config.referenceImage) {
    const base64Data = config.referenceImage.split(',')[1];
    contents.parts.push({
      inlineData: {
        data: base64Data,
        mimeType: "image/png",
      },
    });
    contents.parts[0].text += "\n\nCRITICAL: Use the provided SKU image as the exact clothing item. Preserve its color, texture, and design details perfectly.";
  }

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      imageConfig: {
        aspectRatio: config.aspectRatio,
        imageSize: "1K"
      },
    },
  });

  if (!response.candidates || response.candidates.length === 0) {
    throw new Error("The model did not return any images. This might be due to safety filters or a temporary service issue.");
  }

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image generated in response");
}

export async function analyzeSKU(base64Image: string): Promise<string> {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
  
  if (!apiKey) {
    return "Professional model wearing this clothing item";
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const model = "gemini-3.1-flash-preview";
  const base64Data = base64Image.split(',')[1];

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/png",
          },
        },
        {
          text: "Analyze this clothing item and provide a concise, professional e-commerce description (max 15 words) that would be used as a prompt for a fashion model shoot. Focus on the garment type, material, and key design features.",
        },
      ],
    },
  });

  if (!response.candidates || response.candidates.length === 0) {
    return "Professional model wearing this clothing item";
  }

  return response.text || "Professional model wearing this clothing item";
}
