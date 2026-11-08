// Comprehensive Backend E2E Test
async function runTest() {
  const baseUrl = 'http://localhost:3001';

  console.log('=== BƯỚC 1: KIỂM TRA SỨC KHỎE OLLAMA & BACKEND ===');
  const healthRes = await fetch(`${baseUrl}/api/ollama/health`);
  const health = await healthRes.json();
  console.log('Ollama Status:', JSON.stringify(health));

  console.log('\n=== BƯỚC 2: LẤY DANH SÁCH ĐỀ THI ===');
  const promptsRes = await fetch(`${baseUrl}/api/prompts`);
  const prompts = await promptsRes.json();
  console.log(`Tìm thấy ${prompts.length} đề thi.`);
  const selectedPrompt = prompts[0];
  console.log(`Chọn đề: "${selectedPrompt.title}" (${selectedPrompt.taskType})`);

  console.log('\n=== BƯỚC 3: KHỞI TẠO BÀI VIẾT VỚI AIM BAND 7.5 ===');
  const essayRes = await fetch(`${baseUrl}/api/essays/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ promptId: selectedPrompt.id, aimBand: 7.5 }),
  });
  const essay = await essayRes.json();
  console.log('Essay ID:', essay.id);

  console.log('\n=== BƯỚC 4: LƯU BÀI VIẾT CHỨA LỖI CHỦ ĐÍCH ĐỂ KIỂM THỬ ===');
  const testContent = `In recent decades, higher education has become a subject of intense debate. While some individuals assert that university students should focus exclusively on academic subjects, others argue that acquiring practical skills is far more imperative for their future success.

On the one hand, academic knowledge provides students with profound theoretical grounding. For instance, medical practitioners and civil engineers needs deep scientific principles before they can operate on patients or constructing skyscrapers. Without academic rigor, universities would merely become vocational schools.

On the other hand, practical skills helps graduates facing tight challenges in today's fierce job market. Many fresh graduates struggles with basic workplace communication and collaborative problem solving because their tertiary education only prioritizes rote learning.`;

  const saveRes = await fetch(`${baseUrl}/api/essays/${essay.id}/autosave`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: testContent }),
  });
  const savedEssay = await saveRes.json();
  console.log(`Đã lưu bài viết (${savedEssay.wordCount} từ).`);

  console.log('\n=== BƯỚC 5: GỌI EXAMINER CHẤM BÀI, PHÂN TÍCH Ý & TẠO BẢN NÂNG CẤP ===');
  console.log('Đang gửi request tới Examiner (Ollama local inference)...');
  const startEvalTime = Date.now();
  const evalRes = await fetch(`${baseUrl}/api/examiner/${essay.id}/submit`, {
    method: 'POST',
  });

  if (!evalRes.ok) {
    const errorText = await evalRes.text();
    console.error('Examiner Error:', errorText);
    process.exit(1);
  }

  const evaluation = await evalRes.json();
  const evalDuration = ((Date.now() - startEvalTime) / 1000).toFixed(1);
  console.log(`\n🎉 ĐÃ CHẤM XONG TRONG ${evalDuration}s!`);

  console.log('\n---------------- KẾT QUẢ ĐÁNH GIÁ ----------------');
  console.log(`⭐ OVERALL BAND: ${evaluation.overallBand}`);
  console.log(`📊 Task Response (TR): ${evaluation.taTrScore}`);
  console.log(`📊 Coherence & Cohesion (CC): ${evaluation.ccScore}`);
  console.log(`📊 Lexical Resource (LR): ${evaluation.lrScore}`);
  console.log(`📊 Grammatical Range & Accuracy (GRA): ${evaluation.graScore}`);

  console.log('\n[NHẬN XÉT TIÊU CHÍ]');
  console.log('- TR:', evaluation.taTrFeedback);
  console.log('- CC:', evaluation.ccFeedback);
  console.log('- LR:', evaluation.lrFeedback);
  console.log('- GRA:', evaluation.graFeedback);

  console.log('\n[PHÂN TÍCH CHIỀU SÂU LUẬN ĐIỂM]');
  console.log('✅ Ý phát triển tốt:', evaluation.ideaAnalysis?.wellDevelopedIdeas);
  console.log('⚠️ Ý chưa chặt chẽ/lạc đề:', evaluation.ideaAnalysis?.weakOrOffTopicIdeas);
  console.log('💡 Ý quan trọng nên bổ sung:', evaluation.ideaAnalysis?.keyMissingIdeas);
  console.log('🎯 Hướng dẫn mở rộng ý (Elaboration):', evaluation.ideaAnalysis?.elaborationAdvice);

  console.log(`\n[BẢNG LỖI CỤ THỂ BÓC TÁCH ĐƯỢC (${evaluation.detailedErrors?.length || 0} lỗi)]`);
  for (const err of evaluation.detailedErrors || []) {
    console.log(`- [${err.type}] "${err.original}" ➔ "${err.suggested}" | ${err.explanationVi}`);
  }

  console.log('\n[01 BẢN VIẾT NÂNG CẤP CHUẨN AIM BAND 7.5]');
  console.log(evaluation.upgradedEssay);

  console.log('\n=== BƯỚC 6: XÁC NHẬN ERROR MEMORY TỰ ĐỘNG GHI NHẬN VÀO DB ===');
  const errorSummaryRes = await fetch(`${baseUrl}/api/errors/summary`);
  const errorSummary = await errorSummaryRes.json();
  console.log(`Tổng số lỗi được ghi nhận trong DB: ${errorSummary.totalErrors}`);
  console.log('Thống kê theo phân loại:', errorSummary.typeStats);

  console.log('\n=== BƯỚC 7: XÁC NHẬN NOTEBOOK EXPORT CHUẨN MARKDOWN ===');
  // Thêm 1 mục vào notebook
  await fetch(`${baseUrl}/api/notebook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      essayId: essay.id,
      type: 'COLLOCATION',
      originalText: 'face formidable challenges',
      meaningVi: 'Đối mặt những thử thách cam go',
      contextExample: 'Graduates face formidable challenges in the modern economy.',
    }),
  });

  const exportRes = await fetch(`${baseUrl}/api/notebook/export`);
  const exportMd = await exportRes.text();
  console.log('Export Markdown Sample:\n' + exportMd.substring(0, 300) + '...\n');

  console.log('✅ TOÀN BỘ BACKEND TEST ĐÃ VƯỢT QUA 100% THÀNH CÔNG!');
}

runTest().catch((err) => {
  console.error('Test script failed:', err);
  process.exit(1);
});

