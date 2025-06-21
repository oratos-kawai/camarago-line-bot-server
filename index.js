const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.CHANNEL_ACCESS_TOKEN;

app.use(bodyParser.json());

app.post("/webhook", async (req, res) => {
  console.log("✅ Webhook受信:", JSON.stringify(req.body, null, 2));
  const events = req.body.events;

  for (const event of events) {
    if (event.type === "message" && event.message.type === "text") {
      const userMessage = event.message.text.trim(); 
      console.log("🗣 ユーザー発言:", userMessage);
      

      const flexTrigger = "この商品が気になっているので、詳細について相談したいです。";

      // ✅ Flex Messageを返すトリガー文
      if (userMessage.includes(flexTrigger)) {
        const flexMessage = {
          type: "flex",
          altText: "お問い合わせありがとうございます。以下の当てはまるものを選択してください。",
          contents: {
            type: "bubble",
            body: {
              type: "box",
              layout: "vertical",
              spacing: "md",
              contents: [
                {
                  type: "text",
                  text: "お問い合わせありがとうございます。以下の当てはまるものを選択してください。",
                  weight: "bold",
                  size: "md",
                  wrap: true
                },
                {
                  type: "button",
                  action: { type: "message", label: "現地調査の依頼", text: "現地調査の依頼" }
                },
                {
                  type: "button",
                  action: { type: "message", label: "設置に関する相談", text: "設置に関する相談" }
                },
                {
                  type: "button",
                  action: { type: "message", label: "商品に関する相談", text: "商品に関する相談" }
                },
                {
                  type: "button",
                  action: { type: "message", label: "その他", text: "その他" }
                }
              ]
            }
          }
        };

        // Flex Message を送信
        await axios.post(
          "https://api.line.me/v2/bot/message/reply",
          {
            replyToken: event.replyToken,
            messages: [flexMessage],
          },
          {
            headers: {
              Authorization: `Bearer ${TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        ).catch((err) => {
          console.error("❌ Flexメッセージ送信エラー:", err.response?.data || err.message);
        });

        continue; // 他の応答処理スキップ
      }

      // 無視キーワードの処理
      const ignoreKeywords = ["価格","その他", "防犯", "現地調査の依頼", "設置に関する相談","商品に関する相談","来店者の動線確認","店舗や従業員の様子の把握","工場などの業務管理"];
      if (ignoreKeywords.some(keyword => userMessage.includes(keyword))) {
        console.log("🚫 無視キーワードに一致したため、Botからの返信はスキップします");
        continue;
      }
      
      // 通常のシンプルな応答
      let replyText = "お問い合わせありがとうございます！";


      await axios.post(
        "https://api.line.me/v2/bot/message/reply",
        {
          replyToken: event.replyToken,
          messages: [{ type: "text", text: replyText }],
        },
        {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      ).catch((err) => {
        console.error("❌ テキスト応答エラー:", err.response?.data || err.message);
      });
    }
  }

  res.status(200).end();
});

app.listen(PORT, () => {
  console.log(`🚀 Bot サーバー起動中：http://localhost:${PORT}`);
});
