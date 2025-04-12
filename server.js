const express = require('express');
const cors = require('cors');
const axios = require('axios');
const md5 = require('md5');
require('dotenv').config();

const app = express();

// CORS 配置
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://localhost:5000',
        'https://zcq99.github.io'  // 替换为你的实际域名
    ],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static('.'));

// 从环境变量获取 API 密钥
const BAIDU_APP_ID = process.env.BAIDU_APP_ID;
const BAIDU_KEY = process.env.BAIDU_KEY;

app.post('/translate', async (req, res) => {
    try {
        const { text, from, to } = req.body;
        const salt = new Date().getTime();
        const sign = md5(BAIDU_APP_ID + text + salt + BAIDU_KEY);

        const response = await axios.post('https://fanyi-api.baidu.com/api/trans/vip/translate', null, {
            params: {
                q: text,
                from,
                to,
                appid: BAIDU_APP_ID,
                salt,
                sign
            }
        });

        console.log('Baidu API response:', response.data); // 添加服务器端日志
        res.json(response.data);
    } catch (error) {
        console.error('Translation error:', error.response?.data || error.message);
        res.status(500).json({ error: '翻译服务暂时不可用' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});