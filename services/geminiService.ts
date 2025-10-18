
import { GoogleGenAI, Type } from "@google/genai";
import { CitationData } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const citationSchema = {
  type: Type.OBJECT,
  properties: {
    referenceType: { 
      type: Type.STRING, 
      description: "The type of reference (e.g., 'Journal Article', 'Book', 'Web Page', 'Conference Paper')." 
    },
    title: { 
      type: Type.STRING, 
      description: 'The main title of the work.' 
    },
    authors: {
      type: Type.ARRAY,
      items: { 
        type: Type.STRING, 
        description: 'An author of the work. Format as "Lastname F" or "Lastname Firstname".'
      },
      description: 'A list of all authors.'
    },
    journalName: { 
      type: Type.STRING, 
      description: 'The name of the journal or periodical.' 
    },
    year: { 
      type: Type.STRING, 
      description: 'The year of publication.' 
    },
    volume: { 
      type: Type.STRING, 
      description: 'The volume number of the journal.' 
    },
    issue: { 
      type: Type.STRING, 
      description: 'The issue number of the journal.' 
    },
    pages: { 
      type: Type.STRING, 
      description: 'The page range (e.g., "123-145").' 
    },
    url: { 
      type: Type.STRING, 
      description: 'The URL to access the work.' 
    },
    accessDate: { 
      type: Type.STRING, 
      description: 'The date the source was accessed or cited (e.g., "2025 Oct 18").' 
    },
    publisher: {
        type: Type.STRING,
        description: "The publisher of the work, relevant for books."
    },
    publicationPlace: {
        type: Type.STRING,
        description: "The city or place of publication, relevant for books."
    }
  },
};

export const parseCitation = async (citationText: string): Promise<CitationData> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Parse the following citation text and extract its components based on the provided schema. Be as accurate as possible. Citation: "${citationText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: citationSchema,
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
        throw new Error("API returned an empty response.");
    }
    
    const parsedData: CitationData = JSON.parse(jsonText);
    return parsedData;

  } catch (error) {
    console.error("Error parsing citation with Gemini API:", error);
    throw new Error("Failed to parse citation. The format might be unsupported or there was an API issue.");
  }
};
