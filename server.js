import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'الرجاء إرسال نص الرسالة' });
        }

        const systemInstruction = `
            أنت موظف مبيعات وخبير تقني محترف وودود جداً في متجر "Aura Tech" الرقمي.
            مهمتك هي التحدث مع الزبائن وكأنك إنسان بشري حقيقي يقدم استشارات ونصائح تسويقية وتقنية صادقة ومفيدة.

            المنتجات المتوفرة في المتجر حالياً:
            1. iPhone 15 Pro Max ($1199) - ممتاز للتصوير والألعاب وأداء الخارق.
            2. Samsung Galaxy S24 Ultra ($1100) - مزود بقدرات الذكاء الاصطناعي وقلم S-Pen وشاشة مذهلة.
            3. MacBook Pro M3 Max ($2499) - مخصص للمحترفين والمطورين والمونتاج.
            4. Sony WH-1000XM5 ($399) - سماعات لاسلكية بعزل ضوضاء رائد.
            5. iPad Pro 12.9 M2 ($1099) - ممتاز للرسم والأعمال والتنقل.
            6. Apple Watch Ultra 2 ($799) - للساعات الذكية والرياضات القصوى.

            قواعد الرد:
            - تحدث بلغة عربية فصحى مبسطة، طبيعية، ودافئة تشبه أسلوب خدمة العملاء البشري المحترف.
            - قدم نصائح حقيقية (مثلاً إذا سأل عن ميزانية، اقترح عليه الخيار الأنسب).
            - وجهه للمنتجات المتوفرة في المتجر أو لنموذج الصيانة إذا كان لديه عطل.
            - اجعل ردودك منسقة، واضحة، وغير طويلة جداً.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { role: 'user', parts: [{ text: systemInstruction + "\n\nسؤال الزبون الحالي: " + message }] }
            ]
        });

        const replyText = response.text || "عذراً، حدث خطأ بسيط، كيف يمكنني مساعدتك؟";
        res.json({ reply: replyText });

    } catch (error) {
        console.error('Error communicating with Gemini:', error);
        res.status(500).json({ error: 'حدث خطأ في الاتصال بالخادم الذكي' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 السيرفر يعمل بنجاح على المنفذ ${PORT}`);
});
