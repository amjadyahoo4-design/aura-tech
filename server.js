import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

/* ================== MIDDLEWARE ================== */
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(__dirname)); // يخدم index.html والملفات الثابتة

/* ================== GEMINI (احتياطي فقط) ================== */
// ⚠️ ملاحظة: الواجهة تستخدم Puter.js افتراضياً ولا تحتاج هذا.
// هذا الـ endpoint متاح كخيار احتياطي فقط.
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;

/* ================== كتالوج المنتجات (للسيرفر) ================== */
// يجب أن يطابق PRODUCTS في index.html
const PRODUCTS = [
  { name: 'iPhone 15 Pro Max',              price: 1199, old: 1299, cat: 'phones'      },
  { name: 'Samsung Galaxy S24 Ultra',       price: 1100, old: 1249, cat: 'phones'      },
  { name: 'Google Pixel 8 Pro',             price: 899,  old: 999,  cat: 'phones'      },
  { name: 'Xiaomi 14 Ultra',                price: 849,  old: 949,  cat: 'phones'      },
  { name: 'MacBook Pro M3 Max',             price: 2499, old: 2799, cat: 'laptops'     },
  { name: 'Dell XPS 15',                    price: 1699, old: 1899, cat: 'laptops'     },
  { name: 'ASUS ROG Zephyrus G14',          price: 1449, old: 1599, cat: 'laptops'     },
  { name: 'Lenovo IdeaPad Slim 5',          price: 649,  old: 749,  cat: 'laptops'     },
  { name: 'شاشة iPhone 14 Pro أصلية',       price: 189,                cat: 'parts'       },
  { name: 'بطارية Samsung S22 Ultra',       price: 59,                 cat: 'parts'       },
  { name: 'منفذ شحن Type-C أصلي',           price: 29,                 cat: 'parts'       },
  { name: 'AirPods Pro الجيل الثاني',       price: 249,  old: 299,  cat: 'accessories' },
  { name: 'Apple Watch Ultra 2',            price: 799,  old: 849,  cat: 'accessories' },
  { name: 'شاحن Anker 65W GaN',             price: 45,                 cat: 'accessories' },
  { name: 'حافظة iPhone 15 شفافة',          price: 19,                 cat: 'accessories' },
  { name: 'بطاقة Apple iTunes',             price: 25,                 cat: 'gift'        },
  { name: 'بطاقة Xbox Game Pass',           price: 19,                 cat: 'gift'        },
  { name: 'بطاقة PlayStation Plus',         price: 29,                 cat: 'gift'        },
  { name: 'بطاقة Google Play',              price: 20,                 cat: 'gift'        },
];

/* ================== HEALTH CHECK ================== */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'LORD CELL',
    time: new Date().toISOString(),
    ai: {
      primary: 'Puter.js (client-side)',
      fallback: genAI ? 'Gemini (server-side)' : 'disabled',
    },
  });
});

/* ================== /api/chat (احتياطي) ================== */
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'الرجاء إرسال نص الرسالة' });
    }

    if (!genAI) {
      return res.status(503).json({
        error: 'خدمة الذكاء الاصطناعي على السيرفر غير مفعّلة. استخدم Puter.js من الواجهة.',
      });
    }

    // بناء كتالوج المنتجات ديناميكياً
    const catalog = PRODUCTS.map(p =>
      `- ${p.name} | القسم: ${p.cat} | السعر: $${p.price}` +
      (p.old ? ` (قبل الخصم $${p.old})` : '')
    ).join('\n');

    const systemInstruction = `أنت "خبير المبيعات الذكي" في متجر LORD CELL. تتحدث العربية فقط.
مهمتك مساعدة الزبون في اختيار المنتج الأنسب حسب ميزانيته ومتطلباته.

الخدمات المتوفرة في المتجر: توصيل سريع، صيانة، خدمة "ابحث عن منتج"، بطاقات شحن، ومقارنة منتجات.

📦 كتالوج المنتجات الحالي (هذا هو المتوفر فقط):
${catalog}

🚨 قواعد صارمة:
1. اقترح فقط المنتجات المذكورة في الكاتالوج أعلاه. لا تخترع منتجات أو أسعاراً.
2. إذا لم يوجد شيء بميزانية الزبون، اقترح الأقرب له واذكر أن السعر أعلى قليلاً.
3. اذكر اسم المنتج + السعر بالدولار في كل اقتراح.
4. كن مختصراً، ودوداً، ومهنياً. لا تكرر ترحيبات.
5. إذا سألك عن الصيانة أو التوصيل، أخبره بالخدمة المتوفرة.
6. إذا سألك عن منتج غير موجود، اقترح عليه خدمة "ابحث عن منتج" من الموقع.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(
      `${systemInstruction}\n\n👤 سؤال الزبون: ${message.trim()}`
    );
    const text = result.response.text();

    res.json({ reply: text });

  } catch (error) {
    console.error('AI Error:', error?.message || error);
    res.status(500).json({ error: 'حدث خطأ في السيرفر أثناء معالجة الطلب' });
  }
});

/* ================== SERVE index.html (SPA fallback) ================== */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

/* ================== START ================== */
app.listen(PORT, () => {
  console.log(`✅ LORD CELL server running on http://localhost:${PORT}`);
  console.log(`   AI primary : Puter.js (client-side, no key needed)`);
  console.log(`   AI fallback: ${genAI ? 'Gemini (server-side) ✅' : 'disabled ❌ (GEMINI_API_KEY missing)'}`);
});

export default app;
