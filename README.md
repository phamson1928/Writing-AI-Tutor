# 🍊 The IELTS Writing AI Tutor (Local-first AI Companion)

Ứng dụng gia sư AI đồng hành luyện viết IELTS Writing chạy **100% cục bộ (Local-first)** trên máy tính của bạn với Ollama, lưu trữ SQLite an toàn, bảo mật dữ liệu tuyệt đối và không phát sinh chi phí API.

Giao diện được thiết kế theo phong cách **Retro RPG Pixel Art / Neo-Brutalist** lấy cảm hứng trực tiếp từ *"The IELTS Dictionary"* (nền đồng cỏ xanh pixel, thẻ bài thi Cambridge, nút bấm arcade tương tác nảy lực, animation pháo hoa và âm thanh mic trực quan).

---

## 🚀 Hướng Dẫn Khởi Chạy Nhanh

### 1. Khởi động Ollama (Local LLM)
Đảm bảo Ollama đã được bật trên máy của bạn với model Qwen:
```bash
# Khuyến nghị chạy cực nhanh trên GPU (VRAM ~2.2GB):
ollama run qwen2.5:3b

# Hoặc nếu máy bạn có GPU VRAM >= 8GB:
ollama run qwen2.5:7b
```

### 2. Khởi chạy đồng thời Backend & Frontend
Từ thư mục gốc dự án:
```bash
# Terminal 1: Chạy NestJS Backend (Port 3001)
npm run dev:server

# Terminal 2: Chạy React Vite Frontend (Port 5173)
npm run dev:client
```
Mở trình duyệt truy cập: **`http://localhost:5173`**

---

## 🎮 Các Tính Năng Nổi Bật Đã Hoàn Thiện

### 1. 📚 Kho Đề Thi Chuẩn Cambridge & Tạo Đề Mới (Prompt Bank)
- Mô phỏng thẻ bài thi **`CAM 10 - TEST 1`** và **`CAM 10 - TEST 2`** với các tag pastel (`CULTURE`, `TRANSPORTATION`, `EDUCATION`, `PSYCHOLOGY`, `HISTORY`).
- Bộ nút bấm Arcade kinh điển: **`LUYỆN TẬP`** & **`ĐI THI ▶`**.
- Cho phép tự thêm đề thi mới, hỗ trợ **Upload ảnh biểu đồ Task 1** và bóc tách dữ liệu số liệu bằng Vision AI cục bộ.

### 2. ✍️ Bàn Soạn Thảo Thông Minh (Writing Workspace)
- **Aim Band Picker**: Tùy chọn mục tiêu Aim Band (6.0 - 8.5) để AI cá nhân hóa toàn bộ gợi ý và bản nâng cấp.
- **Đồng hồ đếm ngược**: Bộ đếm thời gian thi thật (40 phút cho Task 2, 20 phút cho Task 1) có nút tạm dừng/tiếp tục.
- **Đếm số từ & Thanh tiến độ thời gian thực**: Tự động chuyển màu xanh khi đạt mốc chuẩn 150/250 từ.
- **Autosave Debounced**: Tự động lưu bản nháp ngầm sau mỗi 1.5s người dùng dừng gõ.
- **Floating Bubble Menu (TipTap Editor)**: Khi bôi đen câu bất kỳ bằng chuột:
  - 🔍 **Sửa lỗi**: Kiểm tra ngữ pháp và cấu trúc câu
  - ✨ **Nâng cấp**: Nâng cấp câu theo Aim Band đã chọn
  - 💡 **Collocation**: Gợi ý cụm từ kết hợp tự nhiên chuẩn C1/C2
  - 💾 **Lưu Sổ Tay**: Bật modal lưu nhanh vào sổ tay cá nhân

### 3. 🤖 Gia Sư AI Đồng Hành (AI Tutor Companion Sidecar)
- **Không viết hộ học viên**: Định hướng tư duy, gợi ý mở bài, tháo gỡ bế tắc phần thân bài theo phương pháp Socrates.
- **SSE Real-time Streaming**: Phản hồi chạy chữ mượt mà từng từ từ Ollama.
- **Microphone Voice Input (Web Speech API)**: Bấm nút Mic để nói tiếng Việt hoặc tiếng Anh, có hiệu ứng sóng âm (soundwave) sinh động.
- **Trí nhớ lỗi cá nhân hóa (Error Memory Injection)**: AI Tutor tự động đọc lịch sử các lỗi học viên hay mắc phải trong SQLite để chủ động nhắc nhở trong lúc viết.

### 4. 🏆 AI Examiner Chấm Điểm & Phân Tích Luận Điểm Sâu (Evaluation Result)
- **Hiệu ứng pháo hoa (Confetti celebration)** khi hoàn thành chấm bài.
- **Chấm điểm chuẩn 4 tiêu chí IELTS**: Task Response / Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy.
- **Công thức làm tròn điểm chuẩn Cambridge** (overall band rounding to .0 / .5).
- **Phân tích chiều sâu luận điểm (Idea Critique)**:
  - ✅ *Ý phát triển tốt & thuyết phục*
  - ⚠️ *Ý chưa chặt chẽ / Nguy cơ lạc đề*
  - 💡 *Ý quan trọng nên bổ sung*
  - 🎯 *Hướng dẫn triển khai & dẫn chứng (Elaboration advice)*
- **Bảng bóc tách lỗi cụ thể**: Phân loại taxonomy (`SVA`, `TENSE`, `COLLOCATION`, `PUNCTUATION`, `SENTENCE_STRUCTURE`), gạch đỏ câu sai, xanh lá câu đúng, kèm nút **Lưu Sổ Tay 1-click**.
- **01 Bản Viết Nâng Cấp Master**: Nâng cấp bài làm chuẩn xác theo Aim Band, hỗ trợ chế độ so sánh song song (*Side-by-Side Comparison*) và nút copy nhanh.

### 5. 📖 Sổ Từ Vựng & Xuất Markdown (Personal Notebook & Export)
- Quản lý từ vựng, Collocations, cấu trúc câu với bộ lọc nhanh và tìm kiếm tức thì.
- **Nút "Xuất File Markdown"**: Tải về file `.md` đầy đủ danh mục để học viên import vào Notion, Obsidian hoặc in ra ôn tập.

### 6. 🧠 Trí Nhớ Lỗi (Error Memory Dashboard)
- Biểu đồ thống kê tỷ lệ các nhóm lỗi thường gặp.
- Giúp người học nhận diện điểm yếu cố hữu để khắc phục triệt để.

---

## 🛠️ Công Nghệ Sử Dụng
- **Frontend**: React 18, Vite, TypeScript, TailwindCSS, TipTap Rich Text Editor, Lucide Icons, Canvas-Confetti, Web Speech API.
- **Backend**: NestJS, Prisma ORM, SQLite (`server/prisma/dev.db`), Axios, Server-Sent Events (SSE).
- **Local AI Engine**: Ollama (`qwen2.5:3b` / `qwen2.5:7b`, `qwen2.5-vl:7b`).
