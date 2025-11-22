
import { Type, Modality, GoogleGenAI } from "@google/genai";
import { getGoogleGenAI, getEffectiveApiKey } from './api';
import type { ImageFile, ConsistencyResult, LanguageCode, ImageModel, VideoModel, AspectRatio, StoryboardScene } from '../types';

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
    const ai = getGoogleGenAI();
    const influencerPart = fileToGenerativePart(influencerImage);
    const productParts = productImages.map(fileToGenerativePart);
    const promptTemplate = createPromptTemplate(language);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
    const ai = getGoogleGenAI();
    const productParts = productImages.map(fileToGenerativePart);
    const promptTemplate = createProductAdPromptTemplate(language);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
- **Vibe:** Describe the influencer's mood or personality as perceived from the image (e.g., energetic, calm, sophisticated).

**Shot List & Camera Angles:** Suggest 2-3 dynamic shots that focus on the influencer and their actions (e.g., 'Medium shot of the influencer laughing', 'Close-up on their expressive reaction', 'Dynamic tracking shot as they move').

**Lighting:** Suggest a lighting style that complements the mood (e.g., 'Soft, natural window light', 'Dramatic studio lighting', 'Golden hour sunlight').

**Dialogue/Speech:** ${dialogueInstruction}
`;
};

export const generateInfluencerOnlyPrompt = async (
  influencerImage: ImageFile,
  actions: string,
  language: LanguageCode
): Promise<string> => {
  try {
    const ai = getGoogleGenAI();
    const influencerPart = fileToGenerativePart(influencerImage);
    const promptTemplate = createInfluencerOnlyPromptTemplate(actions, language);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          influencerPart,
          { text: promptTemplate },
        ],
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error generating influencer-only prompt:", error);
    if (error instanceof Error) {
        return `An error occurred: ${error.message}`;
    }
    return "An unknown error occurred while generating the prompt.";
  }
};

export const testPromptConsistency = async (prompt: string): Promise<ConsistencyResult> => {
    try {
        const ai = getGoogleGenAI();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        text: `Analyze the following video generation prompt for consistency. Check for contradictions between scene descriptions, influencer details, branding, and tone. Provide your analysis as a JSON object with two keys: "consistent" (a boolean) and "reason" (a string explaining your assessment, max 50 words).

Prompt to analyze:
---
${prompt}
---`
                    }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        consistent: { type: Type.BOOLEAN },
                        reason: { type: Type.STRING },
                    },
                    required: ["consistent", "reason"],
                },
            },
        });

        const jsonString = response.text;
        return JSON.parse(jsonString) as ConsistencyResult;

    } catch (error) {
        console.error("Error testing prompt consistency:", error);
        return {
            consistent: false,
            reason: "Could not analyze prompt due to a technical error. Check console for details.",
        };
    }
};

export const generateImage = async (
  prompt: string,
  numberOfImages: number,
  model: ImageModel,
  aspectRatio: AspectRatio
): Promise<string[]> => {
    try {
        const ai = getGoogleGenAI();

        if (model === 'nano-banana') {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });
            const base64ImageBytes = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64ImageBytes) {
                return [`data:image/png;base64,${base64ImageBytes}`];
            }
            throw new Error("Nano Banana model did not return an image.");

        } else if (model === 'imagen-4.0-generate-001') {
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                    numberOfImages,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: aspectRatio,
                },
            });
            
            return response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);
        }
        
        throw new Error(`Unsupported image model: ${model}`);

    } catch (error) {
        console.error("Error generating image with Gemini:", error);
        if (error instanceof Error) {
            throw new Error(`An error occurred while generating the image: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the image.");
    }
};

export const generateVideo = async (
    prompt: string,
    model: VideoModel,
    aspectRatio: '16:9' | '9:16',
    duration: number, // Note: Duration is suggestive for the prompt, not a direct API parameter
    startImage?: ImageFile | null
): Promise<string> => {
    try {
        // For VEO, the API key MUST come from the aistudio selection dialog, which populates process.env.API_KEY.
        // We explicitly use process.env.API_KEY here to avoid conflicts with custom keys set in local storage for other tools.
        // For local Vite development, we allow a fallback to `import.meta.env.VITE_API_KEY`.
        const apiKey = (typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_API_KEY : undefined) || process.env.API_KEY;

        if (!apiKey) {
            // This error will be caught and will prompt the user to re-select a key.
            throw new Error("API key error: The API key is missing. Please select a key.");
        }
        
        const ai = new GoogleGenAI({ apiKey });
        
        const payload: any = {
            model: 'veo-3.1-fast-generate-preview',
            prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio,
            }
        };

        if (startImage) {
            payload.image = {
                imageBytes: startImage.base64,
                mimeType: startImage.mimeType,
            };
        }

        let operation = await ai.models.generateVideos(payload);

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            // Re-create instance for polling to ensure fresh key is used if it was re-selected
            const pollingApiKey = (typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_API_KEY : undefined) || process.env.API_KEY;

             if (!pollingApiKey) {
                throw new Error("API key error: The API key was lost during polling. Please select a key again.");
            }
            const pollingAi = new GoogleGenAI({ apiKey: pollingApiKey });
            operation = await pollingAi.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Video generation completed, but no download link was found.");
        }
        
        // The download also requires the same key.
        const response = await fetch(`${downloadLink}&key=${apiKey}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch video from download link. Status: ${response.status}`);
        }

        const videoBlob = await response.blob();
        return URL.createObjectURL(videoBlob);

    } catch (error) {
        console.error("Error generating video with Gemini:", error);
        if (error instanceof Error) {
            if (error.message.includes("Requested entity was not found")) {
                throw new Error("API key error: The selected API key is invalid or lacks permissions. Please select a different key.");
            }
            throw new Error(`An error occurred: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the video.");
    }
};

export const generateStoryboard = async (prompt: string): Promise<StoryboardScene[]> => {
    try {
        const ai = getGoogleGenAI();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro', // Using a more powerful model for structured generation
            contents: {
                parts: [{
                    text: `Create a 4-scene storyboard for a short video based on this idea: "${prompt}".
For each scene, provide a scene number, a detailed description of the action and visuals, and a concise image generation prompt that captures the essence of the scene.
Return the result as a JSON array of objects.`
                }]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            scene: { type: Type.INTEGER },
                            description: { type: Type.STRING },
                            imagePrompt: { type: Type.STRING },
                        },
                        required: ["scene", "description", "imagePrompt"],
                    }
                }
            }
        });
        const jsonString = response.text;
        const scenes = JSON.parse(jsonString) as Omit<StoryboardScene, 'imageUrl' | 'isGeneratingImage'>[];
        return scenes.map(scene => ({...scene, isGeneratingImage: false}));

    } catch (error) {
        console.error("Error generating storyboard:", error);
        if (error instanceof Error) {
            throw new Error(`An error occurred while generating the storyboard: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the storyboard.");
    }
};

export const generateSpeech = async (text: string, voiceName: string): Promise<string> => {
    try {
        const ai = getGoogleGenAI();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName },
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("The API did not return any audio data.");
        }
        return base64Audio;
        
    } catch (error) {
        console.error("Error generating speech:", error);
        if (error instanceof Error) {
            throw new Error(`An error occurred while generating speech: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating speech.");
    }
};
