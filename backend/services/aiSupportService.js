const { KNOWLEDGE_BASE_FACTS, SYSTEM_GUIDELINES } = require('./aiKnowledgeBase');

class AISupportService {
    /**
     * Build grounded context from knowledge base
     */
    static buildContext() {
        return KNOWLEDGE_BASE_FACTS.map(fact => 
            `### ${fact.title} [قسم: ${fact.category}]\n${fact.content}`
        ).join('\n\n');
    }

    /**
     * Local semantic/keyword search fallback
     */
    static searchLocalKnowledge(query) {
        const normalized = (query || '').toLowerCase().trim();
        if (!normalized) return null;

        // Check for financial advice / stock / prohibited requests
        const financialKeywords = ['سهم', 'أسهم', 'بورصة', 'تداول العملات', 'فوركس', 'استثمار مضمون', 'ربح مضمون', 'توصيات', 'stocks', 'forex', 'guaranteed profit'];
        for (const fk of financialKeywords) {
            if (normalized.includes(fk)) {
                return {
                    matched: false,
                    answer: `تنبيه: منصة Nexyvora هي أكاديمية تعليمية متخصصة ومجتمع تشاركي، ولا تقدم المنصة أو المساعد الذكي أي نصائح مالية، استثمارية، أو توصيات تداول، ولا تعد بأي أرباح تلقائية. جميع العمولات ترتبط بالاشتراكات والتسويق الفعلي وفق خطة المكافآت الرسمية. يمكنك فتح تذكرة دعم فني إذا كان لديك أي استفسار آخر.`,
                    canEscalate: true,
                    suggestEscalate: false
                };
            }
        }

        const stopWords = new Set([
            'ما', 'هو', 'هي', 'في', 'من', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'اليوم', 
            'أين', 'كيف', 'هل', 'كم', 'متى', 'لماذا', 'أريد', 'أود', 'لو', 'سمحت',
            'the', 'is', 'are', 'of', 'in', 'to', 'a', 'an', 'and', 'what', 'how'
        ]);

        const words = normalized
            .replace(/[^\p{L}\p{N}\s]/gu, ' ')
            .split(/\s+/)
            .filter(w => w.length > 1 && !stopWords.has(w));

        let bestMatch = null;
        let highestScore = 0;

        for (const fact of KNOWLEDGE_BASE_FACTS) {
            let score = 0;
            // Check direct keyword phrase matches (highest weight)
            for (const kw of fact.keywords) {
                const cleanKw = kw.toLowerCase();
                if (normalized.includes(cleanKw)) {
                    score += 10;
                }
            }

            // Check significant word matches in title or content
            for (const word of words) {
                if (fact.title.toLowerCase().includes(word)) score += 3;
                if (fact.content.toLowerCase().includes(word)) score += 1;
            }

            if (score > highestScore) {
                highestScore = score;
                bestMatch = fact;
            }
        }

        // Return best match if confident enough (score >= 8 ensures meaningful relevance)
        if (bestMatch && highestScore >= 8) {
            return {
                matched: true,
                category: bestMatch.category,
                title: bestMatch.title,
                answer: `بناءً على دليل منصة Nexyvora المعتمد:\n\n${bestMatch.content}\n\nإذا كنت بحاجة إلى تفاصيل إضافية أو واجهت أي استفسار خاص بحسابك، يمكنك النقر على "تحويل إلى تذكرة دعم فني" لمتابعة طلبك مع الإدارة.`,
                canEscalate: true
            };
        }

        return {
            matched: false,
            answer: `عذراً، لم أجد إجابة مؤكدة لهذا الاستفسار في دليل استخدام منصة Nexyvora. حرصاً على دقة المعلومات وتقديم المساعدة الصحيحة، يرجى فتح تذكرة دعم فني وسيقوم فريق خدمة العملاء بالتواصل معك ومساعدتك فوراً.`,
            canEscalate: true,
            suggestEscalate: true
        };
    }

    /**
     * Process member message via Gemini API or Local Knowledge Base
     */
    static async handleQuery({ message, history = [] }) {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

        // If no API key configured, use the local grounded engine
        if (!apiKey) {
            const localResult = this.searchLocalKnowledge(message);
            return {
                source: 'local_kb',
                answer: localResult.answer,
                canEscalate: true,
                suggestEscalate: !!localResult.suggestEscalate,
                category: localResult.category || 'general'
            };
        }

        // If API key is available, call Google Gemini with strict grounding
        try {
            const systemInstruction = `${SYSTEM_GUIDELINES}\n\n--- قاعدة المعرفة المعتمدة لمنصة Nexyvora ---\n${this.buildContext()}`;

            // Prepare Gemini contents payload
            const contents = [];

            // Add previous conversational turns (up to 6 recent messages)
            const recentHistory = history.slice(-6);
            for (const turn of recentHistory) {
                if (turn.role === 'user') {
                    contents.push({ role: 'user', parts: [{ text: turn.content }] });
                } else if (turn.role === 'assistant' || turn.role === 'model') {
                    contents.push({ role: 'model', parts: [{ text: turn.content }] });
                }
            }

            // Add current message
            contents.push({ role: 'user', parts: [{ text: message }] });

            // Call Gemini 2.0 Flash (with 1.5 Flash fallback)
            const modelNames = ['gemini-2.0-flash', 'gemini-1.5-flash'];
            let responseText = null;

            for (const model of modelNames) {
                try {
                    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                    const res = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            system_instruction: {
                                parts: [{ text: systemInstruction }]
                            },
                            contents,
                            generationConfig: {
                                temperature: 0.2, // Low temperature for high factual accuracy
                                maxOutputTokens: 800,
                            }
                        })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (candidate) {
                            responseText = candidate;
                            break;
                        }
                    } else {
                        console.warn(`[AISupportService] Gemini ${model} failed with HTTP ${res.status}`);
                    }
                } catch (subErr) {
                    console.warn(`[AISupportService] Error calling ${model}:`, subErr.message);
                }
            }

            if (responseText) {
                const lower = responseText.toLowerCase();
                const suggestEscalate = lower.includes('تذكرة') || lower.includes('ticket') || lower.includes('خدمة العملاء') || lower.includes('فتح تذكرة');

                return {
                    source: 'gemini',
                    answer: responseText,
                    canEscalate: true,
                    suggestEscalate
                };
            }

            // If Gemini calls failed or returned empty, fallback to local KB
            const fallback = this.searchLocalKnowledge(message);
            return {
                source: 'local_fallback',
                answer: fallback.answer,
                canEscalate: true,
                suggestEscalate: !!fallback.suggestEscalate,
                category: fallback.category || 'general'
            };
        } catch (err) {
            console.error('[AISupportService] Fatal error:', err);
            const fallback = this.searchLocalKnowledge(message);
            return {
                source: 'local_fallback',
                answer: fallback.answer,
                canEscalate: true,
                suggestEscalate: true,
                category: 'general'
            };
        }
    }
}

module.exports = AISupportService;
