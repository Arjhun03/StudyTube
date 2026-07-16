import { getAI, getGenerativeModel } from 'firebase/ai';
import app from '../config/firebase';

// Helper to determine if we are in mock mode (using placeholder config)
const isMockMode = (): boolean => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  return !apiKey || apiKey.startsWith('mock') || apiKey.includes('here');
};

// Initialize Firebase AI if not in mock mode
let aiInstance: any = null;
if (!isMockMode()) {
  try {
    aiInstance = getAI(app);
  } catch (err) {
    console.warn('Failed to initialize Firebase AI, defaulting to mock mode:', err);
  }
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface StudyGuide {
  summary: string;
  keyConcepts: { title: string; explanation: string }[];
}

const buildFallbackVideoNotes = (title: string, url: string): string => {
  const cleanTitle = title.replace(/\s+/g, ' ').trim() || 'Study Guide';
  const keywords = cleanTitle
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 6);

  return [
    cleanTitle,
    '',
    'Quick Summary',
    `This note is prepared for "${cleanTitle}". Start by understanding the main topic, then use the sections below to organize the most important ideas from the video into clear revision notes.`,
    '',
    'Learning Goals',
    '- Understand the main problem or concept explained in the video.',
    '- Identify the important terms, steps, examples, and takeaways.',
    '- Convert the video into short points that are easy to revise later.',
    '',
    'Main Concepts To Focus On',
    ...(keywords.length > 0
      ? keywords.map((keyword) => `- ${keyword}: define this clearly and add the example used in the video.`)
      : ['- Core idea: write the central explanation in one or two clear lines.']),
    '',
    'Clean Notes',
    '1. Main idea:',
    '   - Write the central concept of the video in simple words.',
    '   - Keep this section short enough to revise quickly.',
    '',
    '2. Important explanation:',
    '   - Note the steps, flow, formula, command, or process explained.',
    '   - Add only details that help you solve a question or remember the concept.',
    '',
    '3. Examples:',
    '   - Capture one practical example from the video.',
    '   - Mention why the example matters.',
    '',
    '4. Common mistakes:',
    '   - List confusing points, wrong assumptions, or shortcuts to avoid.',
    '',
    'Revision Questions',
    '- What is the topic mainly about?',
    '- Why is this concept useful?',
    '- What are the key steps or rules?',
    '- What example best explains it?',
    '- What should I remember before a test or interview?',
    '',
    'Final Takeaway',
    'Use this note as a focused study sheet: summary first, concepts next, examples after that, and revision questions at the end.',
    '',
    `Source: ${url}`,
  ].join('\n');
};

export const generateVideoNotesFromMetadata = async (title: string, url: string): Promise<string> => {
  if (isMockMode() || !aiInstance) {
    return buildFallbackVideoNotes(title, url);
  }

  try {
    const model = getGenerativeModel(aiInstance, { model: 'gemini-2.5-flash' });
    const prompt = `Create concise, clean, student-friendly study notes for a YouTube video.

Video title: "${title}"
Video URL: ${url}

Requirements:
- Do not claim you watched the video or have a transcript.
- Infer the likely topic from the title only.
- Keep the notes precise, useful, and easy to revise.
- Use plain text headings, short bullets, and numbered points.
- Include these sections exactly:
  Quick Summary
  Learning Goals
  Core Concepts
  Detailed Notes
  Important Takeaways
  Revision Questions
  Final Memory Hook
- Avoid long paragraphs.
- Avoid filler.
- Make it look like a neat exam revision note.`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const notes = result.response.text().trim();
    return notes || buildFallbackVideoNotes(title, url);
  } catch (error) {
    console.warn('Failed to generate AI video notes, using fallback notes:', error);
    return buildFallbackVideoNotes(title, url);
  }
};

/**
 * Generate a complete study guide summary from a transcript.
 */
export const generateStudyGuide = async (transcript: string, title: string): Promise<StudyGuide> => {
  if (isMockMode()) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2500));
    return {
      summary: `Here is an AI-generated summary of the video "${title}". It covers the essential parts of the discussion, breaking down complex theories into actionable notes.`,
      keyConcepts: [
        {
          title: 'Core Concept Definition',
          explanation: 'The primary underlying theory introduced in the video, detailing how the foundational concepts interlink.',
        },
        {
          title: 'Practical Application',
          explanation: 'How the concepts covered are applied in industry settings, including real-world developer tools and examples.',
        },
        {
          title: 'Common Pitfalls',
          explanation: 'Areas where beginners frequently make mistakes, and key heuristics for avoiding them during tests or coding tasks.',
        }
      ]
    };
  }

  const model = getGenerativeModel(aiInstance, { model: 'gemini-2.5-flash' });
  const prompt = `You are an expert tutor. Analyze the following transcript of the educational video titled "${title}" and generate a structured study guide containing a summary and key concepts list.
  
  Transcript:
  ${transcript}
  
  Respond strictly in JSON format matching this schema:
  {
    "summary": "detailed summary text",
    "keyConcepts": [
      {
        "title": "concept name",
        "explanation": "clear and simple explanation"
      }
    ]
  }`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' }
  });

  return JSON.parse(result.response.text()) as StudyGuide;
};

/**
 * Generate flashcards from a transcript.
 */
export const generateFlashcards = async (transcript: string, title: string): Promise<Flashcard[]> => {
  if (isMockMode()) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return [
      { front: 'Primary Term', back: 'The definition of the primary term explained in the video.' },
      { front: 'Secondary Formula/Syntax', back: 'The syntax or mathematical representation of the concept.' },
      { front: 'Best Practice Heuristic', back: 'The guideline for optimizing solutions related to this topic.' },
    ];
  }

  const model = getGenerativeModel(aiInstance, { model: 'gemini-2.5-flash' });
  const prompt = `Based on this transcript for "${title}":
  ${transcript}
  
  Generate a set of 5 educational study flashcards.
  
  Respond strictly in JSON format matching this schema:
  [
    {
      "front": "question or term",
      "back": "answer or definition"
    }
  ]`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' }
  });

  return JSON.parse(result.response.text()) as Flashcard[];
};

/**
 * Generate a practice quiz from a transcript.
 */
export const generateQuiz = async (transcript: string, title: string): Promise<QuizQuestion[]> => {
  if (isMockMode()) {
    await new Promise((resolve) => setTimeout(resolve, 2800));
    return [
      {
        question: 'What is the primary topic discussed in the tutorial?',
        options: ['Alternative Theory A', 'The main topic of this session', 'Unrelated subject C', 'Introduction to next module'],
        correctAnswerIndex: 1,
        explanation: 'The tutorial sets this up as the primary topic during the introduction section.',
      },
      {
        question: 'Which of the following is highlighted as a common beginner pitfall?',
        options: ['Writing too many tests', 'Ignoring styling systems', 'Incorrect state tracking or scope management', 'Using old React version'],
        correctAnswerIndex: 2,
        explanation: 'In the middle of the lecture, the speaker emphasizes state and scope management errors.',
      }
    ];
  }

  const model = getGenerativeModel(aiInstance, { model: 'gemini-2.5-flash' });
  const prompt = `Based on this transcript for "${title}":
  ${transcript}
  
  Generate 3 multiple choice questions for a quiz.
  
  Respond strictly in JSON format matching this schema:
  [
    {
      "question": "question text",
      "options": ["option 1", "option 2", "option 3", "option 4"],
      "correctAnswerIndex": 0,
      "explanation": "why this is the correct answer"
    }
  ]`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' }
  });

  return JSON.parse(result.response.text()) as QuizQuestion[];
};

/**
 * Chat with AI about the video context.
 */
export const getAIChatResponse = async (
  transcript: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  newMessage: string
): Promise<string> => {
  if (isMockMode()) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return `That is a great question! Based on the video, the speaker mentions that this pattern is useful because it decouples dependencies. Let me know if you would like me to unpack that further!`;
  }

  const model = getGenerativeModel(aiInstance, {
    model: 'gemini-2.5-flash',
    systemInstruction: `You are a helpful AI learning assistant for StudyTube AI. You are helping a student understand a video. Here is the transcript of the video:
    ${transcript}
    
    Answer the student's questions accurately based ONLY on the video transcript provided. If the information isn't in the transcript, use general knowledge but clearly state that it was not directly mentioned in the video.`
  });

  const chat = model.startChat({
    history: history
  });

  const result = await chat.sendMessage(newMessage);
  return result.response.text();
};
