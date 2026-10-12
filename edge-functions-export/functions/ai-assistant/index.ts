import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, role } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build system prompt based on user role
    let systemPrompt = "You are a helpful AI assistant for an educational academy platform. ";
    
    switch (role) {
      case 'admin':
        systemPrompt += `You are assisting an administrator. You can help with:
- Managing students, teachers, and cohorts
- Understanding payment statuses and financial reports
- Platform settings and configuration
- Generating reports and analytics insights
- Answering questions about the platform's features
Keep responses professional and concise.`;
        break;
      case 'teacher':
        systemPrompt += `You are assisting a teacher/instructor. You can help with:
- Managing lessons and course content
- Tracking student progress and attendance
- Grading assignments and providing feedback
- Scheduling and managing online meetings
- Creating engaging learning materials
- Tips for effective online teaching
Keep responses helpful and educational.`;
        break;
      case 'student':
        systemPrompt += `You are assisting a student. You can help with:
- Understanding course materials and assignments
- Study tips and learning strategies
- Navigating the platform and accessing resources
- Preparing for exams and quizzes
- Time management and organization
- Answering general academic questions
Keep responses encouraging and supportive.`;
        break;
      default:
        systemPrompt += "Keep answers clear and concise.";
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please contact support." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI assistant error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
