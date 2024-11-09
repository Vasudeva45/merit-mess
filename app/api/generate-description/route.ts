import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { projectName, domain, specialization } = await req.json();

    // Initialize the model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Create a prompt that will generate a relevant project description
    const prompt = `Generate a concise but detailed project description (2-3 paragraphs) for a ${domain} project named "${projectName}" with specialization in ${specialization}. 
    The description should include:
    - The main purpose and objectives of the project
    - Key technical components or methodologies involved
    - Potential impact or applications
    Please keep it professional and academic-focused.`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const description = response.text();

    return NextResponse.json({ description }, { status: 200 });
  } catch (error) {
    console.error("Error generating description:", error);
    return NextResponse.json(
      { error: "Failed to generate description" },
      { status: 500 }
    );
  }
}
