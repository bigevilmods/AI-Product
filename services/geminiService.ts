
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { ImageFile, ConsistencyResult, LanguageCode, ImageModel, VideoModel } from '../types';

if (!process.env.API_KEY) {
    // In a real app, you might want to handle this more gracefully.
    // For this context, we assume the key is provided in the environment.
    console.warn("API_KEY environment variable not set. Using a placeholder which will likely fail.");
}

// NOTE: For non-Google models, API keys would be sourced from environment variables.
// Example:
// const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// const GROK_API_KEY = process.env.GROK_API_KEY;


const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
const model = "gemini-2.5-flash";

const fileToGenerativePart = (imageFile: ImageFile) => {
  return {
    inlineData: {
      data: imageFile.base64,
      mimeType: imageFile.mimeType,
    },
  };
};

const languageMap: Record<LanguageCode, string> = {
    en: 'English',
    pt: 'Portuguese (Brazil)',
    fr: 'French',
    es: 'Spanish',
    it: 'Italian',
    af: 'Afrikaans',
    zh: 'Chinese',
    ja: 'Japanese',
    ar: 'Arabic',
};

const createPromptTemplate = (language: LanguageCode): string => {
  const languageName = languageMap[language] || 'English';
  const dialogueInstruction = `Generate a short, natural-sounding, and persuasive line of dialogue **to be spoken *directly by the influencer* shown in the video, not as a separate narrator or voice-over**. The dialogue MUST be in **${languageName}**. It must achieve three things:
1.  **Sound authentic:** Use a conversational and engaging tone, as if the influencer is speaking directly to their audience. This should feel like a personal recommendation, not a script.
2.  **Highlight benefits:** Briefly talk about the key benefits of the product.
3.  **Call to action:** Conclude by telling viewers the purchase link is in the description or a pinned comment.`;

  return `
You are an expert creative director specializing in short-form video content for social media, with a paramount focus on perfect brand representation.
Analyze the images provided.
The first image contains an influencer. The subsequent images show a single product from multiple angles and in different contexts. Synthesize information from ALL product images to build a complete, detailed understanding of it.

Based on your analysis, generate a detailed prompt for a video generation AI. The video should feature the influencer using or showcasing the product in a compelling way.

The output must be a single block of Markdown text.

The prompt must be structured exactly as follows:

**Video Concept:** A brief, engaging concept for a 15-second vertical video.

**Scene Description:** Describe the scene, the influencer's actions, and how they interact with the product.

**Influencer Details:**
- **Appearance:** Describe the influencer's key visual characteristics from the image (hair color, style, facial features). The description must be photographic and precise to ensure an identical recreation.
- **Style:** Describe the influencer's clothing and overall style.
- **Vibe:** Describe the influencer's mood or personality as perceived from the image (e.g., energetic, calm, sophisticated).

**Product Details (CRITICAL - BE EXTREMELY PRECISE):**
- **Negative Prompt:** List elements to avoid. **CRITICAL:** Include 'generic logos', 'inaccurate branding', 'stylized or altered logos', 'mismatched fonts'. For example: 'no scratches, no reflections, no blurry text, no generic logos'.
- **Style References:** Suggest visual styles for the video (e.g., 'cinematic, golden hour lighting', 'vibrant and poppy, high-energy', 'minimalist, clean aesthetic').
- **Branding, logos, and text (ABSOLUTE CRITICAL REQUIREMENT - HIGHEST PRIORITY):**
    1.  **Identify Brand:** Identify the brand from the product image.
    2.  **Internet Research Simulation:** Based on the brand identified, simulate an internet search to find the official logo, brand colors (including hex codes if possible), and typography/fonts.
    3.  **Meticulous Description with Weighted Elements:** Describe the logo in extreme detail. **Recognize that logos are graphical images, not just text.** Your description must treat the logo as a visual entity. The video AI must treat the following elements with the highest priority, considering them weighted instructions for generation:
        - **Logo Integrity (Weight: 2.0):** NO DEVIATIONS FROM REFERENCE. Describe the logo's shapes, symbols, and graphical elements. For example, if the logo is a swoosh, describe its curve, thickness, and orientation. The logo must be a perfect, 1:1 graphical replication of the official brand logo.
        - **Colors (Weight: 1.8):** Exact color matching is mandatory. Specify official brand colors (with hex codes if found). Pay attention to gradients and shades within the logo's graphic.
        - **Transparency (Weight: 1.5):** If the logo's graphic has transparent or negative space elements, describe them precisely.
        - **Style (Weight: 1.5):** Replicate the logo's specific graphical style (e.g., flat, 3D, minimalist, illustrative).
        - **Typography (Weight: 1.7, if applicable):** **ONLY if the logo includes text**, all text must use the correct, official brand font. If the logo is purely graphical, this is not applicable. No substitute fonts are acceptable.
    Any failure to adhere to these weighted instructions for the official branding is a failure of the entire task.
- **Colors:** All visible colors on the product. Use specific, descriptive names if possible (e.g., 'cerulean blue body', 'off-white cap', 'rose gold trim').
- **Materials, textures, and finish:** Describe the product's physical textures (e.g., 'matte plastic body', 'glossy screen', 'brushed aluminum accents', 'soft-touch rubber grip').
- **Design, shape, and form factor:** Describe the product's physical shape and design language (e.g., 'ergonomic and curved', 'sleek and angular', 'compact and portable').
- **Subject details:** Exact match to reference. All details, proportions, and placements of features on the product must be perfectly replicated.

**Shot List & Camera Angles:** Suggest 2-3 dynamic shots for the video (e.g., 'Extreme close-up on the product logo', 'Medium shot of the influencer smiling while using the product', 'Dynamic slow-motion tracking shot as the product is revealed').

**Lighting:** Suggest a lighting style that complements the mood (e.g., 'Soft, natural window light', 'Dramatic studio lighting with colored gels', 'Bright, even lighting').

**Dialogue/Speech:** ${dialogueInstruction}
`;
};


export const generateVideoPrompt = async (
  influencerImage: ImageFile,
  productImages: ImageFile[],
  language: LanguageCode
): Promise<string> => {
  try {
    const influencerPart = fileToGenerativePart(influencerImage);
    const productParts = productImages.map(fileToGenerativePart);
    const promptTemplate = createPromptTemplate(language);

    // FIX: For single-turn requests with multiple parts, `contents` should be a single object, not an array.
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          influencerPart,
          ...productParts,
          { text: promptTemplate },
        ],
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error generating content with Gemini:", error);
    if (error instanceof Error) {
        return `An error occurred: ${error.message}`;
    }
    return "An unknown error occurred while generating the prompt.";
  }
};

const createProductAdPromptTemplate = (language: LanguageCode): string => {
  const languageName = languageMap[language] || 'English';
  const voiceOverInstruction = `Generate a short, persuasive, and professional voice-over script. The script MUST be in **${languageName}**. It must achieve three things:
1.  **Grab attention:** Start with a hook that piques interest.
2.  **Highlight benefits:** Clearly communicate the product's key features and benefits.
3.  **Strong call to action:** Conclude by directing the audience on how to purchase or learn more (e.g., 'Click the link in bio to get yours today!').`;

  return `
You are an expert creative director specializing in short-form video content for social media, with a paramount focus on perfect brand representation.
Analyze the images provided, which show a single product from multiple angles and in different contexts. Synthesize information from ALL product images to build a complete, detailed understanding of it.

Based on your analysis, generate a detailed prompt for a video generation AI. The video should be a compelling 15-second vertical advertisement for the product.

The output must be a single block of Markdown text.

The prompt must be structured exactly as follows:

**Video Concept:** A brief, engaging concept for the 15-second advertisement.

**Scene Description:** Describe a series of dynamic scenes showcasing the product. Focus on visual storytelling, making the product the hero of the video.

**Product Details (CRITICAL - BE EXTREMELY PRECISE):**
- **Negative Prompt:** List elements to avoid. **CRITICAL:** Include 'generic logos', 'inaccurate branding', 'stylized or altered logos', 'mismatched fonts'. For example: 'no scratches, no reflections, no blurry text, no generic logos'.
- **Style References:** Suggest visual styles for the video (e.g., 'cinematic, golden hour lighting', 'vibrant and poppy, high-energy', 'minimalist, clean aesthetic', 'sleek, tech-focused').
- **Branding, logos, and text (ABSOLUTE CRITICAL REQUIREMENT - HIGHEST PRIORITY):**
    1.  **Identify Brand:** Identify the brand from the product image.
    2.  **Internet Research Simulation:** Based on the brand identified, simulate an internet search to find the official logo, brand colors (including hex codes if possible), and typography/fonts.
    3.  **Meticulous Description with Weighted Elements:** Describe the logo in extreme detail. **Recognize that logos are graphical images, not just text.** Your description must treat the logo as a visual entity. The video AI must treat the following elements with the highest priority, considering them weighted instructions for generation:
        - **Logo Integrity (Weight: 2.0):** NO DEVIATIONS FROM REFERENCE. Describe the logo's shapes, symbols, and graphical elements. For example, if the logo is a swoosh, describe its curve, thickness, and orientation. The logo must be a perfect, 1:1 graphical replication of the official brand logo.
        - **Colors (Weight: 1.8):** Exact color matching is mandatory. Specify official brand colors (with hex codes if found). Pay attention to gradients and shades within the logo's graphic.
        - **Transparency (Weight: 1.5):** If the logo's graphic has transparent or negative space elements, describe them precisely.
        - **Style (Weight: 1.5):** Replicate the logo's specific graphical style (e.g., flat, 3D, minimalist, illustrative).
        - **Typography (Weight: 1.7, if applicable):** **ONLY if the logo includes text**, all text must use the correct, official brand font. If the logo is purely graphical, this is not applicable. No substitute fonts are acceptable.
    Any failure to adhere to these weighted instructions for the official branding is a failure of the entire task.
- **Colors:** All visible colors on the product. Use specific, descriptive names if possible (e.g., 'cerulean blue body', 'off-white cap', 'rose gold trim').
- **Materials, textures, and finish:** Describe the product's physical textures (e.g., 'matte plastic body', 'glossy screen', 'brushed aluminum accents', 'soft-touch rubber grip').
- **Design, shape, and form factor:** Describe the product's physical shape and design language (e.g., 'ergonomic and curved', 'sleek and angular', 'compact and portable').
- **Subject details:** Exact match to reference. All details, proportions, and placements of features on the product must be perfectly replicated.

**Shot List & Camera Angles:** Suggest 3-4 dynamic shots for the video (e.g., 'Extreme close-up on the product logo', 'Cinematic panning shot across the product\\'s surface', 'Dynamic slow-motion shot of the product in a relevant environment', 'Product hero shot on a clean background').

**Lighting:** Suggest a lighting style that highlights the product's features (e.g., 'Dramatic studio lighting', 'Bright, clean commercial lighting', 'Soft, natural light').

**Voice-over Script:** ${voiceOverInstruction}
`;
};

export const generateProductAdPrompt = async (
  productImages: ImageFile[],
  language: LanguageCode
): Promise<string> => {
  try {
    const productParts = productImages.map(fileToGenerativePart);
    const promptTemplate = createProductAdPromptTemplate(language);

    // FIX: For single-turn requests with multiple parts, `contents` should be a single object, not an array.
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          ...productParts,
          { text: promptTemplate },
        ],
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error generating content with Gemini:", error);
    if (error instanceof Error) {
        return `An error occurred: ${error.message}`;
    }
    return "An unknown error occurred while generating the prompt.";
  }
};


const createInfluencerOnlyPromptTemplate = (actions: string, language: LanguageCode): string => {
  const languageName = languageMap[language] || 'English';
  const dialogueInstruction = `Generate a short, natural-sounding line of dialogue **to be spoken *directly by the influencer***. The dialogue MUST be in **${languageName}**. It should be authentic, engaging, and relevant to the actions described.`;

  return `
You are an expert creative director specializing in short-form video content for social media.
Analyze the image of the influencer provided. The user has also provided a description of the actions the influencer should perform.

**User-provided actions:** "${actions}"

Based on your analysis and the user's instructions, generate a detailed prompt for a video generation AI. The video should be a compelling 15-second vertical video focused entirely on the influencer.

The output must be a single block of Markdown text.

The prompt must be structured exactly as follows:

**Video Concept:** A brief, engaging concept for a 15-second vertical video, based on the user-provided actions.

**Scene Description:** Describe the scene, setting, and the influencer's actions in detail. You must expand creatively on the user's input: "${actions}". Make it visually interesting and dynamic.

**Influencer Details:**
- **Appearance:** Describe the influencer's key visual characteristics from the image (hair color, style, facial features). The description must be photographic and precise to ensure an identical recreation.
- **Style:** Describe the influencer's clothing and overall style from the image.
- **Vibe:** Describe the influencer's mood or personality as perceived from the image and the requested actions (e.g., energetic, thoughtful, joyful).

**Shot List & Camera Angles:** Suggest 3-4 dynamic shots for the video that effectively capture the influencer's performance and the specified actions (e.g., 'Medium shot of the influencer smiling', 'Dynamic tracking shot following the influencer', 'Expressive close-up on the influencer's face').

**Lighting:** Suggest a lighting style that complements the mood and actions (e.g., 'Golden hour lighting for a warm, happy feel', 'Dramatic studio lighting for a powerful look', 'Bright, natural daylight for an authentic vibe').

**Dialogue/Speech:** ${dialogueInstruction}
`;
};

export const generateInfluencerOnlyPrompt = async (
  influencerImage: ImageFile,
  actions: string,
  language: LanguageCode
): Promise<string> => {
  try {
    const influencerPart = fileToGenerativePart(influencerImage);
    const promptTemplate = createInfluencerOnlyPromptTemplate(actions, language);
    
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          influencerPart,
          { text: promptTemplate },
        ],
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error generating influencer-only prompt with Gemini:", error);
    if (error instanceof Error) {
        return `An error occurred: ${error.message}`;
    }
    return "An unknown error occurred while generating the prompt.";
  }
};


const consistencySchema = {
  type: Type.OBJECT,
  properties: {
    consistent: {
      type: Type.BOOLEAN,
      description: "Is the prompt free of ambiguities that could cause visual deviation from a reference image?"
    },
    reason: {
      type: Type.STRING,
      description: "A brief explanation for the consistency rating. If inconsistent, identify the ambiguous part."
    },
  },
  required: ['consistent', 'reason'],
};

export const testPromptConsistency = async (prompt: string): Promise<ConsistencyResult> => {
  const systemInstruction = `You are a meticulous AI prompt auditor. Your task is to analyze the following prompt, which is intended for a video generation AI. Your sole focus is to determine if the prompt's descriptions will lead to a **visually consistent** output that is **identical** to the reference images it was based on.

Check for any ambiguity or creative language in the 'Influencer Details' and 'Product Details' sections that could cause the video AI to deviate from the source material. Pay special attention to the brand logo, colors, materials, design, and the influencer's appearance. The prompt must demand an exact, photorealistic match, not an 'inspired by' or 'similar to' version.

Based on your audit, respond with the specified JSON format indicating if the prompt is consistent and provide a brief reason for your assessment. If inconsistent, point out the specific part of the prompt that is ambiguous. A good prompt is one that leaves no room for creative interpretation on critical features.`;

  try {
     const response = await ai.models.generateContent({
      model: model,
      // FIX: For simple text-only prompts, `contents` can be a string directly.
      contents: `Audit this prompt:\n\n---\n\n${prompt}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: consistencySchema,
      },
    });

    const jsonText = response.text.trim();
    // In case the model returns markdown with the json
    const jsonMatch = jsonText.match(/```json\n([\s\S]*?)\n```/);
    const parsableText = jsonMatch ? jsonMatch[1] : jsonText;

    const result = JSON.parse(parsableText);
    return result as ConsistencyResult;
  } catch (error) {
    console.error("Error testing prompt consistency:", error);
    if (error instanceof Error) {
      return {
        consistent: false,
        reason: `Failed to test consistency: ${error.message}`,
      };
    }
    return {
      consistent: false,
      reason: "An unknown error occurred during the consistency test.",
    };
  }
};

export const generateImage = async (prompt: string, numberOfImages: number, model: ImageModel): Promise<string[]> => {
  try {
    switch (model) {
      case 'imagen-4.0-generate-001':
        const responseImagen = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: numberOfImages,
              outputMimeType: 'image/jpeg',
              aspectRatio: '1:1',
            },
        });

        if (responseImagen.generatedImages && responseImagen.generatedImages.length > 0) {
            return responseImagen.generatedImages.map(
                (img) => `data:image/jpeg;base64,${img.image.imageBytes}`
            );
        } else {
            throw new Error("No images were generated by the API.");
        }

      case 'nano-banana':
        const responseNano = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: prompt }],
          },
          config: {
              responseModalities: [Modality.IMAGE],
          },
        });

        for (const part of responseNano.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return [`data:image/png;base64,${base64ImageBytes}`];
          }
        }
        throw new Error("Nano Banana model did not return an image.");

      case 'grok-imagine':
        // Placeholder for Grok Imagine API call.
        // Would use something like: const grokClient = new Grok({ apiKey: GROK_API_KEY });
        throw new Error("Grok Imagine model is not yet integrated.");

      default:
        throw new Error(`Unsupported image model: ${model}`);
    }
  } catch (error) {
    console.error("Error generating image:", error);
    if (error instanceof Error) {
        throw new Error(`An error occurred while generating the image: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the image.");
  }
};

export const generateVideo = async (prompt: string, model: VideoModel): Promise<string> => {
  try {
    if (model !== 'gemini-veo') {
      // Placeholder for other models like OpenAI Sora.
      // An API call for Sora would look something like:
      // const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
      // const response = await openai.video.generations.create(...)
      throw new Error(`Model '${model}' is not supported for video generation yet.`);
    }

    // Create a new instance right before the call to ensure the latest API key is used.
    const localAi = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    let operation = await localAi.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '9:16'
      }
    });

    while (!operation.done) {
      // Poll every 10 seconds.
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await localAi.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation completed, but no download link was found.");
    }
    
    // Fetch the video data using the download link and the API key.
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch video file: ${response.statusText}`);
    }

    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);

  } catch (error) {
    console.error("Error generating video:", error);
    if (error instanceof Error) {
        // Re-throw specific errors to be handled by the UI
        if (error.message.includes("Requested entity was not found")) {
            throw new Error("API key error. Please re-select your API key and try again.");
        }
        throw new Error(`An error occurred while generating the video: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the video.");
  }
};