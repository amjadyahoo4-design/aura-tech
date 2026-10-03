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
        if (!message) return res.status(400).json({ error: 'الرجاء إرسال رسالة' });

        const systemInstruction = `
            أنت موظف مبيعات وخبير تقني محترف وودود جداً في متجر "Aura Tech" الرقمي.
            تحدث مع الزبائن وكأنك إنسان بشري حقيقي يقدم استشارات وننصائح تسويقية وتقنية صادقة.
            المنتجات المتوفرة:
            1. iPhone 15 Pro Max ($1199)
            2. Samsung Galaxy S24 Ultra ($1100)
            3. MacBook Pro M3 Max ($2499)
            4. Sony WH-1000XM5 ($399)
            تحدث بلغة عربية فصحى مبسطة وطبيعية ودافئة.
        `;

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(systemInstruction + "\n\nسؤال الزبون: " + message);
        const response = await result.response;
        const text = response.text();

        res.json({ reply: text || "أهلاً بك، تفضل بطرح استفسارك." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'خطأ في السيرفر' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
