import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { destination, duration, people, style, type = 'recommendation' } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API Key tidak dikonfigurasi');
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'recommendation') {
      systemPrompt = `Kamu adalah travel planner AI profesional yang ahli dalam merencanakan liburan.
Berikan rekomendasi dalam format JSON dengan struktur berikut:
{
  "itinerary": [
    {
      "day": 1,
      "activities": [
        {
          "time": "09:00",
          "location": "Nama Tempat",
          "activity": "Aktivitas",
          "estimatedCost": 100000
        }
      ]
    }
  ],
  "costBreakdown": {
    "transportation": 2000000,
    "accommodation": 3500000,
    "food": 1500000,
    "activities": 1000000,
    "total": 8000000
  },
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "alternatives": [
    {
      "destination": "Nama Destinasi",
      "estimatedCost": 5000000,
      "reason": "Alasan mengapa alternatif ini menarik"
    }
  ]
}`;

      userPrompt = `Pengguna ingin berlibur ke ${destination} selama ${duration} hari untuk ${people} orang, dengan gaya liburan ${style}.
      
Gaya liburan:
- Hemat: budget minimal, hostel/penginapan murah, makanan lokal, transportasi umum
- Standar: budget menengah, hotel 3 bintang, mix antara restoran dan warung, transportasi campuran
- Premium: budget tinggi, hotel 4-5 bintang, restoran bagus, transportasi private

Berikan rekomendasi lengkap dalam format JSON.`;
    } else if (type === 'suggestion') {
      systemPrompt = `Kamu adalah AI assistant yang memberikan saran destinasi berdasarkan preferensi user.
Berikan 3 rekomendasi destinasi dalam format JSON:
{
  "suggestions": [
    {
      "destination": "Nama Destinasi",
      "estimatedCost": 5000000,
      "duration": 3,
      "reason": "Alasan mengapa cocok dengan preferensi user",
      "highlights": ["Highlight 1", "Highlight 2"]
    }
  ]
}`;

      userPrompt = `User memiliki preferensi gaya liburan: ${style}.
Berikan 3 rekomendasi destinasi menarik di Indonesia yang sesuai dengan budget dan gaya tersebut.`;
    }

    let retryCount = 0;
    let response;
    
    while (retryCount < 2) {
      try {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
          }),
        });

        if (response.ok) {
          break;
        }
        
        retryCount++;
        if (retryCount < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        retryCount++;
        if (retryCount >= 2) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!response || !response.ok) {
      const errorText = await response?.text();
      console.error('OpenAI API error:', errorText);
      throw new Error('Gagal mendapatkan rekomendasi dari AI');
    }

    const data = await response.json();
    const aiResponse = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(aiResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-travel-recommendation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses permintaan';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        retry: true
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
