import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'الرجاء إرسال نص الرسالة' });
        }

        const systemInstruction = `
            أنت موظف مبيعات وخبير تقني محترف وودود جداً في متجر "Aura Tech" الرقمي.
            مهمتك هي التحدث مع الزبائن وكأنك إنسان بشري حقيقي يقدم استشارات ونصائح تسويقية وتقنية صادقة ومفيدة باللغة العربية.
            المنتجات المتوفرة في المتجر:
            1. iPhone 15 Pro Max ($1199)
            2. Samsung Galaxy S24 Ultra ($1100)
            3. MacBook Pro M3 Max ($2499)
            
            أجب على سؤال الزبون التالي بشكل طبيعي ومباشر ودون تكرار لجمل ترحيبية محفوظة:
        `;

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        // دمج التعليمات مع رسالة الزبون بوضوح تام ليفهمها الذكاء الاصطناعي
        const prompt = `${systemInstruction}\n\nسؤال الزبون: ${message}`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ reply: text });

    }احصل على الخطأ(error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'حدث خطأ في السيرفر' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
