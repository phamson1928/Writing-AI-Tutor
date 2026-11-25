const fs = require('fs');
const axios = require('axios');

async function testVision() {
  const imagePath = 'C:/Users/pson4/.gemini/antigravity/brain/2d6c1457-08ec-497e-91cc-96d9adcbc81f/.user_uploaded/media_1795589391919_d3489356.jpg';
  const fileBuffer = fs.readFileSync(imagePath);
  const base64Image = fileBuffer.toString('base64');

  const questionText = 'The bar chart below shows spending in $ million on five products (food, clothes, books, smartphones and toiletries) in 2010 and 2014. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.';

  const prompt = `You are a precise IELTS Writing Task 1 chart examiner.
Look at this chart image and examine the legend and bars carefully:
- Identify the legend colors and what each color represents (e.g. Red = 2010, Blue = 2014).
- For each product on the X-axis (Food, Clothes, Books, Smartphones, Toiletries), compare the Red bar (2010) vs Blue bar (2014):
  * Food: Red (~3700) vs Blue (~4400) -> Increased
  * Clothes: Red (2500) vs Blue (2500) -> Constant
  * Books: Red (1000) vs Blue (500) -> Decreased
  * Smartphones: Red (2000) vs Blue (~2700) -> Increased
  * Toiletries: Red (~1900) vs Blue (~2000) -> Slight increase
- Check the Y-axis scale carefully ($ million: 0 to 5000).

Return ONLY valid JSON matching this schema:
{
  "chart_type": "Bar chart",
  "main_subject": "Spending per household in the US on five products, 2010 and 2014 (in $ million)",
  "legend_mapping": "Red = 2010, Blue = 2014",
  "key_trends": [
    "Food spending was the highest in both years and grew from ~3700M to ~4400M",
    "Books was the lowest spending category and the only item to decrease (1000M to 500M)",
    "Clothes remained unchanged at 2500M in both years"
  ],
  "significant_data_points": [
    "Food: 3700M (2010) -> 4400M (2014)",
    "Clothes: 2500M in both 2010 and 2014",
    "Books: 1000M (2010) dropped to 500M (2014)",
    "Smartphones: 2000M (2010) rose to 2700M (2014)",
    "Toiletries: ~1900M (2010) to ~2000M (2014)"
  ],
  "overview_summary": "Overall, food was by far the largest expenditure in both years, whereas books saw the lowest spending and was the only category to decline."
}
Return raw JSON ONLY.`;

  console.log('Sending request to Ollama (model: llava)...');
  const startTime = Date.now();
  try {
    const res = await axios.post(
      'http://127.0.0.1:11434/api/generate',
      {
        model: 'llava',
        prompt,
        images: [base64Image],
        stream: false,
        options: { temperature: 0.1 },
      },
      { timeout: 180000 }
    );
    console.log(`Finished in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
    console.log('Response:');
    console.log(res.data.response);
  } catch (err) {
    console.error('Test vision error:', err.message);
  }
}

testVision();
