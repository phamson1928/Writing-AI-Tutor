# IELTS Writing AI Tutor – System Requirements & Architecture Specification

> **Mục tiêu hệ thống**: Xây dựng nền tảng hỗ trợ luyện viết IELTS Writing toàn diện, hoạt động cục bộ (Local-first) với AI đồng hành thời gian thực (Real-time AI Companion) theo triết lý sư phạm: **hướng dẫn tư duy, không làm bài hộ**.

---

## 1. Tổng quan & Triết lý cốt lõi

1. **Gia sư đồng hành khi đang viết (In-process Tutoring)**: Không đợi nộp bài mới sửa; hỗ trợ gỡ rối tức thì khi bí ý, kẹt từ, câu gãy gọn hoặc thiếu liên kết.
2. **Không làm hộ (Pedagogical Scaffolding)**:
   - Gợi ý câu hỏi định hướng, cấu trúc mẫu, chỉ ra lỗi và giải thích nguyên tắc (bằng tiếng Việt) để người học tự gõ câu sửa.
   - Chỉ đưa đáp án trực tiếp khi người dùng chủ động yêu cầu xem đáp án (`Reveal Solution`).
3. **Chỉnh sửa & Nâng cấp theo ngữ cảnh (In-line Selection)**:
   - Bôi đen bất kỳ câu/đoạn nào trong bài để gọi AI: Chữa lỗi ngữ pháp, Nâng cấp câu theo Aim Band, Tối ưu độ tự nhiên, Gợi ý Collocation.
4. **Lưu chủ động (User-driven Curation)**:
   - Không làm phiền bằng thông báo AI tự đòi lưu. Người dùng bôi đen cụm từ/câu bất kỳ (trong bài viết hoặc trong khung chat của AI) và bấm **"Lưu vào Notebook"**.
5. **Tương tác đa phương thức (Voice-to-Text)**:
   - Tích hợp Microphone để nói trực tiếp với AI (tiếng Việt / tiếng Anh), giảm thao tác gõ khi đang trao đổi ý tưởng.
6. **Đánh giá & Bản nâng cấp duy nhất (Single Optimized Upgrade)**:
   - Không sinh lãng phí nhiều phiên bản tốn token của máy local.
   - Chỉ xuất **01 Bản viết nâng cấp chuẩn hóa theo Aim Band** + Bảng phân tích sâu:
     - Đánh giá luận điểm: Ý hợp lệ, Ý lạc đề/chưa chặt chẽ, Ý quan trọng bị thiếu.
     - Cách mở rộng & triển khai luận điểm (Elaboration).
     - Bảng lỗi cụ thể: Lỗi ngữ pháp, Collocation gượng gạo, cách diễn đạt chưa tự nhiên (Unnatural phrasing).
7. **Kho đề tự tạo & Xử lý Task 1 qua Vision AI**:
   - Cho phép người dùng tự nhập đề bài trước khi luyện viết.
   - Task 1: Upload ảnh biểu đồ/bản đồ/quy trình. Backend kích hoạt Vision Model phân tích và trích xuất dữ liệu số liệu (Data points & Main trends) làm context chấm bài.

---

## 2. Kiến trúc Kỹ thuật (Technical Architecture)

Hệ thống triển khai theo mô hình Client-Server cục bộ (Local):

```
+--------------------------------------------------------------+
|                     REACT FRONTEND                           |
|  - Writing Editor (TipTap / Slate) with Floating Toolbar     |
|  - Realtime AI Tutor Chat with Voice Input (Web Speech API)  |
|  - Prompt Bank (Tạo đề Task 1/2, upload ảnh đề bài)          |
|  - Personal Notebook & Error Analytics Dashboard            |
+------------------------------+-------------------------------+
                               | REST API & SSE (Streaming)
+------------------------------v-------------------------------+
|                     NESTJS BACKEND                           |
|  - Prompt & Essay Management Module                          |
|  - AI Orchestrator (Mode switching, System Prompt Builder)    |
|  - Vision Extraction Pipeline (Chart & Diagram to JSON)      |
|  - Notebook & Error Memory Tracker                           |
|  - SQLite / PostgreSQL + Prisma ORM                          |
+------------------------------+-------------------------------+
                               | Local HTTP (localhost:11434)
+------------------------------v-------------------------------+
|                      OLLAMA ENGINE                           |
|  - Text LLM: Qwen2.5-7B (Chat, Grammar, Idea, Evaluation)    |
|  - Vision Model: Qwen2.5-VL-7B (Task 1 Chart Analysis)       |
+--------------------------------------------------------------+
```

### Công nghệ đề xuất:
- **Frontend**: React (Vite/Next.js), TailwindCSS, Shadcn/UI, TipTap Editor (hỗ trợ floating bubble menu khi bôi đen text cực tốt), Web Speech API.
- **Backend**: NestJS, Prisma ORM, SQLite (hoặc PostgreSQL local), Server-Sent Events (SSE) cho streaming token từ Ollama.
- **Local AI Engine**:
  - `qwen2.5:7b`: Xử lý ngôn ngữ, tư duy sư phạm, chấm điểm và nâng cấp bài viết.
  - `qwen2.5-vl:7b` (hoặc `minicpm-v:8b`): Chuyên trách đọc ảnh đề bài Task 1 trích xuất số liệu.

---

## 3. Các Module Chức Năng Chi Tiết

### Module 1: Prompt Bank & Task 1 Vision (Quản lý đề & Thị giác máy tính)
- **FR-1.1 Tạo đề tùy chỉnh**:
  - Người dùng có thể tạo đề bài mới: Chọn Task 1 hoặc Task 2, phân loại chủ đề (Education, Environment, Technology,...), mức Band mục tiêu (Aim Band: 6.0, 6.5, 7.0, 7.5, 8.0+).
- **FR-1.2 Xử lý đề Task 1 có ảnh biểu đồ**:
  - Cho phép tải ảnh đề bài (Line graph, Bar chart, Pie chart, Table, Map, Process).
  - Khi lưu đề, NestJS gửi ảnh sang Vision Model (`qwen2.5-vl:7b`) để sinh bản trích xuất:
    ```json
    {
      "chart_type": "Line graph",
      "main_subject": "CO2 emissions per capita in 4 European countries (1967-2007)",
      "key_trends": ["General decrease in country A", "Sharp increase in country B"],
      "significant_data_points": ["Country A peak in 1977 at 10 tonnes", "..."],
      "overview_summary": "Overall, A and B saw downward trends, while C and D increased."
    }
    ```
  - Dữ liệu này được lưu trực tiếp vào cơ sở dữ liệu của đề bài, người dùng có thể xem lại và chỉnh sửa số liệu nếu muốn trước khi bắt đầu viết.

### Module 2: Writing Workspace & Floating Actions (Bàn viết tương tác)
- **FR-2.1 Trình soạn thảo chuyên dụng**:
  - Tách vùng nhập rõ ràng: Đề bài (kèm ảnh biểu đồ zoom được nếu là Task 1), Khung soạn thảo chia đoạn (Intro, Body 1, Body 2, Conclusion), Bộ đếm từ real-time với chỉ báo tiến độ (Task 1: 150+ từ, Task 2: 250+ từ), Tự động lưu bản nháp (Autosave sau mỗi 2 giây dừng gõ).
- **FR-2.2 Bôi đen tương tác trực tiếp (In-line Selection Toolbar)**:
  - Khi bôi đen bất kỳ từ, cụm từ hoặc câu trong bài viết, một Bubble Menu nổi lên với các thao tác nhanh:
    1. **Kiểm tra & Sửa lỗi (Fix & Explain)**: Phân tích lỗi ngữ pháp/từ vựng của câu đó và giải thích nguyên nhân.
    2. **Nâng cấp theo Aim Band (Upgrade Sentence)**: Viết lại câu đó ở mức tự nhiên hơn, chuẩn phong cách học thuật theo Aim Band của bài.
    3. **Gợi ý Collocation (Collocation Ideas)**: Đề xuất các cụm từ kết hợp tự nhiên thay thế cho các từ đơn điệu.
    4. **Lưu vào Notebook**: Mở popup lưu nhanh cụm từ/câu được chọn kèm nghĩa tiếng Việt.

### Module 3: AI Writing Companion (Gia sư thời gian thực & Nhập liệu bằng giọng nói)
- **FR-3.1 Khung tương tác gia sư (Tutor Chat)**:
  - Hiển thị song song bên phải bài viết. Phản hồi streaming từng token.
  - Chế độ phản hồi theo nấc (Scaffolding):
    - *Nấc 1*: Câu hỏi gợi mở + quy tắc ngữ pháp.
    - *Nấc 2*: Cung cấp cấu trúc câu mẫu tương đương.
    - *Nấc 3*: Đưa ra đáp án hoàn chỉnh (chỉ hiện khi bấm `Hiện đáp án`).
- **FR-3.2 Tích hợp Microphone (Voice Input)**:
  - Tích hợp biểu tượng Mic cạnh thanh chat.
  - Sử dụng Web Speech API của trình duyệt (hỗ trợ cả tiếng Việt và tiếng Anh mượt mà, không tốn GPU).
  - Người dùng bấm Mic nói: *"Tôi muốn phản biện lại luận điểm này nhưng không biết bắt đầu câu thế nào"* -> Lời nói chuyển thành text gửi đến AI Tutor.

### Module 4: Personal Notebook (Sổ tay chủ động)
- **FR-4.1 Cơ chế lưu không làm phiền (Zero-Interruption Saving)**:
  - Loại bỏ hoàn toàn các thông báo ép lưu tự động từ AI.
  - Người dùng chủ động bôi đen bất kỳ nội dung nào trong Editor hoặc trong Chat Box -> Chọn **"Lưu vào sổ tay"**.
- **FR-4.2 Phân loại mục lưu**:
  - Phân loại: `Collocation`, `Vocabulary`, `Academic Phrasal Verb`, `Sentence Pattern`, `Refined Sentence`.
  - Lưu kèm: Nghĩa tiếng Việt, Câu ví dụ ngữ cảnh, Đề bài liên quan, Tag chủ đề.
  - Giao diện tra cứu, tìm kiếm, lọc theo đề và xuất file markdown/anki khi cần.

### Module 5: Examiner & Single Upgraded Essay (Chấm bài & 01 Bản nâng cấp toàn diện)
Khi người dùng hoàn thành bài viết và bấm **"Nộp bài & Đánh giá"**:
- **FR-5.1 Ước lượng Band điểm & Nhận xét 4 tiêu chí**:
  - Task Response / Task Achievement (Task 1 đối chiếu với dữ liệu biểu đồ đã trích xuất).
  - Coherence & Cohesion.
  - Lexical Resource.
  - Grammatical Range & Accuracy.
  - Estimated Band Score (ghi rõ: Mang tính chất tham khảo cho model cục bộ).
- **FR-5.2 Phân tích chiều sâu luận điểm (Idea Critique)**:
  - **Ý hợp lệ & phát triển tốt**: Những ý đã được mở rộng bằng dẫn chứng/giải thích rõ ràng.
  - **Ý chưa hợp lệ / lạc đề**: Những lập luận lan man, thiếu logic, hoặc chưa giải quyết triệt để yêu cầu đề bài.
  - **Ý quan trọng nên bổ sung (Key Missing Ideas)**: Các hướng tiếp cận đắt giá mà bài viết chưa đề cập.
  - **Cách triển khai ý (Idea Elaboration Guide)**: Gợi ý cách dùng chuỗi tư duy *"Luận điểm (Point) -> Giải thích (Explain) -> Ví dụ/Hệ quả (Example/Result)"*.
- **FR-5.3 Bảng đối chiếu lỗi sai cụ thể**:
  - Lỗi ngữ pháp & Giải thích cặn kẽ.
  - Cụm từ chưa tự nhiên (Unnatural expressions) -> Cách diễn đạt của người bản xứ (Native-like phrasing).
  - Sai Collocation -> Cụm đúng.
- **FR-5.4 Đúng 01 Bản viết nâng cấp (Single Optimized Essay)**:
  - Nâng cấp chính bài viết của người học đạt đến đúng **Aim Band** đã chọn.
  - Giữ nguyên bố cục và lập luận cốt lõi của người học (không thay thế bằng một bài văn mẫu xa lạ).
  - Chế độ so sánh Side-by-Side (Bản gốc vs Bản nâng cấp) có highlight các điểm thay đổi.

### Module 6: Error Memory (Theo dõi điểm yếu cá nhân)
- **FR-6.1 Tự động phân loại lỗi khi đánh giá**:
  - Phân loại theo Taxonomy chuẩn: `Subject-Verb Agreement`, `Tense`, `Article`, `Preposition`, `Wrong Collocation`, `Word Form`, `Run-on / Fragment Sentence`, `Punctuation`, `Inappropriate Tone`.
- **FR-6.2 Cá nhân hóa gia sư cho các bài viết sau**:
  - Hệ thống thống kê Top 3 lỗi người học mắc phải nhiều nhất trong 5 bài gần nhất.
  - Khi bắt đầu viết bài mới, AI Tutor hiển thị nhắc nhở nhẹ đầu phiên:
    > *"Lưu ý nhỏ: Ở 3 bài gần nhất, bạn hay gặp lỗi về mạo từ (a/an/the) và chia động từ số ít với V-ing. Cùng để ý điểm này trong bài hôm nay nhé!"*

---

## 4. Thiết Kế Cơ Sở Dữ Liệu (Prisma Schema Draft)

```prisma
datasource db {
  provider = "sqlite" // hoặc postgresql
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model TopicPrompt {
  id              String         @id @default(uuid())
  taskType        String         // "TASK_1" | "TASK_2"
  title           String
  questionText    String
  imageUrl        String?        // Đường dẫn ảnh biểu đồ cho Task 1
  chartDataJson   String?        // Dữ liệu trích xuất từ Vision AI cho Task 1
  category        String         // "Education", "Environment", etc.
  createdAt       DateTime       @default(now())
  essays          Essay[]
}

model Essay {
  id              String         @id @default(uuid())
  promptId        String
  prompt          TopicPrompt    @relation(fields: [promptId], references: [id], onDelete: Cascade)
  aimBand         Float          @default(6.5)
  title           String?
  content         String         // Nội dung bài viết hiện tại
  wordCount       Int            @default(0)
  status          String         @default("DRAFT") // "DRAFT" | "SUBMITTED" | "REVIEWED"
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  
  evaluation      Evaluation?
  chatMessages    TutorMessage[]
  errorRecords    ErrorRecord[]
  notebookItems   NotebookItem[]
}

model Evaluation {
  id                  String     @id @default(uuid())
  essayId             String     @unique
  essay               Essay      @relation(fields: [essayId], references: [id], onDelete: Cascade)
  overallBand         Float
  taTrScore           Float      // Task Achievement / Task Response
  ccScore             Float      // Coherence & Cohesion
  lrScore             Float      // Lexical Resource
  graScore            Float      // Grammatical Range & Accuracy
  
  ideaAnalysisJson    String     // Phân tích ý hợp lệ, ý thiếu, cách triển khai
  detailedErrorsJson  String     // Danh sách lỗi ngữ pháp, collocation, un-natural
  upgradedEssay       String     // Đúng 1 bản nâng cấp chuẩn theo aim band
  createdAt           DateTime   @default(now())
}

model TutorMessage {
  id              String         @id @default(uuid())
  essayId         String
  essay           Essay          @relation(fields: [essayId], references: [id], onDelete: Cascade)
  role            String         // "user" | "assistant"
  inputMethod     String         @default("TEXT") // "TEXT" | "VOICE"
  mode            String?        // "HINT" | "INLINE_CHECK" | "UPGRADE"
  selectedText    String?        // Đoạn văn bản bôi đen được hỏi
  content         String
  createdAt       DateTime       @default(now())
}

model NotebookItem {
  id              String         @id @default(uuid())
  essayId         String?
  essay           Essay?         @relation(fields: [essayId], references: [id], onDelete: SetNull)
  type            String         // "COLLOCATION" | "VOCABULARY" | "SENTENCE_STRUCTURE" | "REFINED_PHRASE"
  originalText    String
  meaningVi       String?
  contextExample  String?
  tags            String?        // Phân cách bằng dấu phẩy
  createdAt       DateTime       @default(now())
}

model ErrorRecord {
  id              String         @id @default(uuid())
  essayId         String
  essay           Essay          @relation(fields: [essayId], references: [id], onDelete: Cascade)
  errorType       String         // Taxonomy: SVA, COLLOCATION, TENSE, etc.
  originalSnippet String
  correctedSnippet String
  explanationVi   String
  createdAt       DateTime       @default(now())
}
```

---

## 5. Kế Hoạch Triển Khai Tối Ưu (Step-by-Step Implementation Plan)

### Giai đoạn 1 (Phase 1): Thiết lập Nền tảng & Kho Đề (Core Engine & Prompt Bank)
1. Khởi tạo dự án:
   - Frontend: React (Vite + TailwindCSS + Shadcn/UI + Lucide Icons).
   - Backend: NestJS (REST API + Prisma + SQLite/Postgres).
2. Tích hợp Ollama Service:
   - Service kết nối `localhost:11434` (hỗ trợ gọi stream qua SSE).
   - Test kiểm tra tình trạng chạy của model `qwen2.5:7b`.
3. Xây dựng Module Quản lý đề bài (Prompt Bank):
   - Tạo đề Task 2 (nhập câu hỏi, chủ đề).
   - Tạo đề Task 1 (tải ảnh biểu đồ).
   - Tích hợp endpoint gọi model Vision (`qwen2.5-vl:7b`) trích xuất số liệu/xu hướng chính từ ảnh và lưu vào `chartDataJson`.

### Giai đoạn 2 (Phase 2): Editor Thông Minh & Tương Tác Bôi Đen (Interactive Workspace)
1. Xây dựng Writing Workspace:
   - Tích hợp Rich-text Editor (TipTap) với tính năng đếm từ, lưu tự động (debounce 2s).
   - Hiển thị đề bài và xem ảnh biểu đồ (với Task 1) bên cạnh trình soạn thảo.
2. Tích hợp Floating Menu khi bôi đen (In-line Bubble Menu):
   - Bắt sự kiện chọn văn bản -> Hiển thị menu nổi:
     - `Sửa lỗi & Giải thích`
     - `Nâng cấp câu theo Aim Band`
     - `Gợi ý Collocation`
     - `Lưu vào Notebook`
3. Tích hợp AI Tutor Chat:
   - Cửa sổ chat bên phải hỗ trợ stream phản hồi.
   - Gắn nút **Microphone (Web Speech API)** để nhập câu hỏi bằng giọng nói.

### Giai đoạn 3 (Phase 3): Chấm Bài & 01 Bản Nâng Cấp Toàn Diện (Examiner & Single Upgrade)
1. Thiết lập Prompt System chuẩn cho Examiner:
   - Định dạng output JSON nghiêm ngặt (validate bằng Zod).
   - Prompt phân tích: Band 4 tiêu chí, Nhận xét ý (ý tốt, ý lạc, ý thiếu), Bảng lỗi diễn đạt tự nhiên + collocation + ngữ pháp.
   - Tạo **01 Bản viết nâng cấp** (giữ nguyên hướng lập luận, nâng cấp từ vựng & cấu trúc theo đúng Aim Band).
2. Giao diện xem kết quả:
   - Thẻ điểm 4 tiêu chí.
   - Bảng phân tích luận điểm trực quan.
   - Chế độ so sánh Side-by-Side giữa bài của người học và bản nâng cấp.

### Giai đoạn 4 (Phase 4): Sổ Tay Cá Nhân & Trí Nhớ Lỗi (Notebook & Error Analytics)
1. Hoàn thiện giao diện Notebook:
   - Danh sách Collocation / Vocabulary / Cấu trúc câu đã lưu.
   - Tìm kiếm, lọc theo tag, sửa nghĩa tiếng Việt.
2. Error Memory System:
   - Tự động thống kê các lỗi thường gặp sau các lần chấm bài.
   - Đưa danh sách Top 3 lỗi vào System Prompt của AI Tutor khi mở phiên viết mới.

---

## 6. Tiêu Chí Nghiệm Thu Kỹ Thuật (Acceptance Criteria)
1. **Hoạt động 100% Cục bộ**: Không gửi dữ liệu bài viết ra internet, toàn bộ AI inference chạy qua Ollama trên máy cá nhân.
2. **Task 1 đọc được ảnh**: Upload ảnh Task 1 -> Vision AI trích xuất được dạng số liệu có cấu trúc và sử dụng làm ngữ cảnh khi chấm bài.
3. **Thao tác nhanh bằng chuột & giọng nói**:
   - Bôi đen là có thể gọi AI sửa/nâng cấp câu ngay tại chỗ.
   - Bấm Mic nói chuyện mượt mà bằng tiếng Việt/tiếng Anh mà không bị giật lag máy.
   - Bôi đen lưu vào Notebook tức thì mà không bị popup AI làm phiền.
4. **Tiết kiệm Token & Thời gian**: Mỗi lần chấm bài chỉ sinh đúng 1 bản viết nâng cấp chất lượng cao thay vì 3 bản thừa thãi.

---

## 7. Yêu Cầu Thiết Kế Giao Diện (Retro Pixel Art & Neo-Brutalism Style)

Dựa trên hình mẫu tham khảo (The IELTS Dictionary), giao diện được định hình theo phong cách **Retro RPG Pixel Art kết hợp Neo-Brutalist Web** – biến việc luyện thi IELTS khô khan thành một hành trình học tập sinh động, ấm cúng như một tựa game nhập vai cổ điển (Stardew Valley / Pokemon).

```
+-----------------------------------------------------------------------------------------+
| [D] IELTS AI TUTOR (Pixel Logo)   [VI] [Cộng đồng] [🔔1] (Avatar Sơn) [📖 Sổ tay]       |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  <<< NỀN CỎ PIXEL XANH LÁ (#48a74c) VỚI TEXTURE ĐỐM 8-BIT >>>                           |
|                                                                                         |
|   +---------------------------------------+   +---------------------------------------+ |
|   | 🍊 10 - TEST 1               [CAM 10] |   | 🤖 AI WRITING TUTOR         [ONLINE]  | |
|   | ★ TARGET BAND: 7.0   [VIẾT TRỰC TIẾP] |   | Gia sư đồng hành cục bộ (Ollama)      | |
|   |---------------------------------------|   |---------------------------------------| |
|   | ĐỀ BÀI (Question Prompt):             |   | (Pixel Tutor Mascot: "Chào Sơn! Hôm   | |
|   | Some people believe that university   |   | nay mình tiếp tục luyện Body 1 nhé!")  | |
|   | students should focus on academic...  |   |                                       | |
|   |---------------------------------------|   | 💬 Hộp chat gợi ý & phản biện         | |
|   | [1] INTRO   [2] BODY 1   [3] BODY 2   |   | - Gợi ý hướng triển khai ý            | |
|   | ✍️ Writing Canvas (Giấy ngà, viền đen) |   | - Giải thích ngữ pháp tiếng Việt      | |
|   | (Bôi đen câu -> [Sửa] [Nâng cấp] [Lưu]|   |                                       | |
|   |                                       |   | [🎤 Bấm Mic nói] [ Nhập tin nhắn... ] | |
|   | Từ: 185/250   [💾 Đã tự động lưu]     |   |                                       | |
|   | [ LUYỆN TẬP ]         [ NỘP BÀI ➔ ]  |   | [ ⭐ Xem gợi ý ]     [ 💡 Collocations]| |
|   +---------------------------------------+   +---------------------------------------+ |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
```

### 7.1 Bảng màu & Ngôn ngữ Thị giác (Design Tokens):
- **Phông nền chính (Pixel Meadow Canvas)**:
  - Sắc xanh đồng cỏ cổ điển `#48A74C` kết hợp các điểm pixel xanh thẫm `#38903C` tạo cảm giác bình yên, giải tỏa căng thẳng cho người học.
- **Thẻ Card & Khung chứa (Retro Ivory Cards)**:
  - Nền giấy kem ngà cổ điển (`#FFFDF2` hoặc `#FAF6E9`), không dùng màu trắng tinh gắt mắt.
  - **Đường viền (Borders)**: Viền đen tuyền dày dặn `border-2 border-black` hoặc `border-[2.5px] border-[#18181B]`.
  - **Hiệu ứng đổ bóng cứng (Hard Drop Shadow - Neo-Brutalist)**: `shadow-[4px_4px_0px_#000000]` hoặc `shadow-[3px_3px_0px_#18181B]`, tạo cảm giác thẻ bài vật lý xúc giác (tactile cards).
  - Bo góc mềm mại: `rounded-2xl` hoặc `rounded-3xl` tạo sự thân thiện, ấm áp.
  - Ribbon tab góc phải (như tab `CAM 10` vàng cam `#F59E0B` gắn nổi trên card).
- **Hệ thống Nút bấm tương tác (Arcade / Tactile Buttons)**:
  - **Nút hành động chính (Primary / Nộp bài / Đi thi)**: Màu xanh Navy đậm (`#1C2559`), chữ trắng in hoa đậm, bo viền đen 2px, kèm mũi tên pixel.
  - **Nút phụ (Secondary / Luyện tập / Nháp)**: Nền trắng ngà, chữ đen đậm, viền đen 2px.
  - **Hiệu ứng nhấn (Push-down click effect)**: Khi click, nút thụt xuống `active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`.
- **Badges & Tags danh mục**:
  - Pill badges bo tròn viền đen 1.5px, màu pastel phân loại:
    - Văn hóa/Nghệ thuật: Hồng pastel (`#FCE7F3` - text `#9D174D`)
    - Xã hội/Giao thông: Cam pastel (`#FFEDD5` - text `#C2410C`)
    - Giáo dục/Khoa học: Xanh ngọc pastel (`#D1FAE5` - text `#065F46`)
    - Badge số đoạn [1], [2], [3] bo viền đen phong cách arcade.

### 7.2 Tính công thái học (Ergonomics – Cân bằng giữa Retro & Trải nghiệm viết):
- **Khu vực soạn thảo (Writing Editor Canvas)**:
  - Mặc dù khung viền ngoài mang phong cách pixel/neo-brutalist, nhưng **vùng chữ viết bên trong** phải đảm bảo công thái học tối đa:
    - Bề mặt giấy ngà dịu mắt (`#FFFDF7`).
    - Font chữ học thuật rõ ràng, sắc nét (như `Plus Jakarta Sans`, `Inter`, hoặc serif `Merriweather`), kích thước chữ 16px, line-height 1.75 để người học đọc và soát bài trong 40-60 phút mà không mỏi mắt.
- **Linh vật Gia sư Pixel (Pixel Tutor Mascot)**:
  - Một chú mascot pixel nhỏ (Robot học giả / Cú mèo / Mèo pixel) xuất hiện ở góc AI Tutor.
  - Có các trạng thái hoạt ảnh pixel vui nhộn:
    - *Vẫy tay chào* khi mở bài viết.
    - *Đeo kính suy nghĩ* khi model Ollama đang stream câu trả lời.
    - *Bắn pháo hoa pixel* khi người học đạt mốc 250 từ hoặc hoàn thành bài nộp.

---

## 8. Kế Hoạch & Biện Pháp Kiểm Thử Xác Nhận Thành Công (Testing & Verification Matrix)

Để đảm bảo hệ thống đạt chuẩn sư phạm, hoạt động ổn định và chính xác trên môi trường máy cá nhân, hệ thống kiểm thử được chia thành 4 nhóm biện pháp nghiệm thu:

### 8.1 Kiểm thử Đánh giá AI & Tính Sư Phạm (Pedagogical & LLM Benchmarking)

| Mã kiểm thử | Tình huống thử nghiệm | Kết quả mong đợi (Tiêu chuẩn Đạt) |
|---|---|---|
| **TEST-AI-01** | **Nguyên tắc "Không làm hộ"**: Học viên hỏi *"Câu này sai ở đâu?"* hoặc *"Body 1 viết sao?"* | AI giải thích quy tắc ngữ pháp bằng tiếng Việt, đưa câu hỏi dẫn dắt hoặc gợi ý 2 hướng tư duy. **Tuyệt đối không tự ý viết nguyên một đoạn văn hoàn chỉnh hộ người học.** |
| **TEST-AI-02** | **Độ chính xác chấm Band (Benchmark với đề thi Cambridge thật)**: Đưa 3 bài mẫu đã công bố điểm chính thức (Band 5.0, Band 6.5, Band 7.5). | AI chấm điểm 4 tiêu chí (TR/TA, CC, LR, GRA) có độ lệch tuyệt đối **$\le 0.5$ Band** so với kết quả chấm thi chính thức của Cambridge Examiner. |
| **TEST-AI-03** | **Độ toàn vẹn của Bản nâng cấp duy nhất (Single Upgrade)**: Người học nộp bài viết với các luận điểm cá nhân. | Bản nâng cấp giữ nguyên $100\%$ hệ thống luận điểm và cách phân đoạn của học viên; chỉ nâng cấp từ vựng C1/C2, collocation chuẩn và cấu trúc ngữ pháp; **không được tự chế một bài văn mẫu hoàn toàn xa lạ.** |
| **TEST-AI-04** | **Phát hiện Luận điểm Lạc đề / Thiếu ý (Idea Critique)**: Cố tình viết 1 đoạn Body lạc đề hoặc bỏ qua 1 số liệu lớn trong Task 1. | AI Examiner phải liệt kê chính xác luận điểm đó vào mục `weakOrOffTopicIdeas` và cảnh báo số liệu bị bỏ sót trong `keyMissingIdeas`. |
| **TEST-AI-05** | **Tính chuẩn xác của JSON Schema**: Gọi hàm Examiner chấm bài 10 lần liên tiếp. | 10/10 lần output JSON trả về hợp lệ, parse thành công không lỗi syntax và lưu trọn vẹn vào DB. |

### 8.2 Kiểm thử Chức Năng & Trải Nghiệm Tương Tác (Functional & UX Verification)

| Mã kiểm thử | Thao tác người dùng | Kết quả mong đợi (Tiêu chuẩn Đạt) |
|---|---|---|
| **TEST-FN-01** | **In-line Selection Toolbar**: Bôi đen một câu trong Editor. | Bubble toolbar màu Navy nổi lên ngay phía trên đoạn chọn trong vòng < 0.2s; bấm *Sửa lỗi / Nâng cấp / Collocation* kích hoạt phản hồi AI tương ứng. |
| **TEST-FN-02** | **Voice Input (Web Speech API)**: Bấm nút Mic và nói bằng tiếng Việt/tiếng Anh. | Biểu tượng Mic đổi sang màu đỏ có hiệu ứng sóng âm; giọng nói được chuyển thành văn bản tức thì trong ô chat; không gây đơ/treo tab trình duyệt. |
| **TEST-FN-03** | **Task 1 Vision Pipeline**: Tải ảnh biểu đồ Cambridge (định dạng JPG/PNG). | Backend lưu file vào `/uploads`, gọi model thị giác trích xuất thành công JSON số liệu (`chart_type`, `key_trends`, `data_points`) lưu vào database của đề. |
| **TEST-FN-04** | **Sổ tay chủ động (Zero-Interruption Notebook)**: Bôi đen cụm từ trong bài -> Bấm *Lưu Sổ Tay*. | Modal lưu xuất hiện nhanh, bấm Lưu -> Dữ liệu lưu ngay vào SQLite bảng `NotebookItem`; vào trang Notebook thấy ngay mục vừa lưu và tìm kiếm được. |
| **TEST-FN-05** | **Autosave & Chống mất bài**: Đang gõ dở bài viết 200 từ, đột ngột tắt tab hoặc F5 reload trang. | Mở lại bài viết: $100\%$ nội dung và số từ được khôi phục nguyên vẹn từ cơ sở dữ liệu SQLite (thời gian debounce lưu 1.5s). |

### 8.3 Kiểm thử Hiệu Năng Cục Bộ & Khả Năng Phục Hồi Lỗi (Performance & Fault Tolerance)

| Tiêu chí | Ngưỡng mục tiêu chấp nhận | Phương pháp đo lường |
|---|---|---|
| **Thời gian sinh chữ đầu tiên (TTFT)** | **$\le 2.5$ giây** | Đo thời gian từ lúc bấm gửi câu hỏi gia sư đến khi chữ đầu tiên xuất hiện qua SSE Stream. |
| **Thời gian Chấm toàn diện (Full Evaluation)** | **$\le 45$ giây (GPU)** / **$\le 90$ giây (CPU)** | Đo thời gian chạy toàn bộ pipeline Examiner (chấm 4 tiêu chí + phân tích ý + bảng lỗi + 1 bản nâng cấp). |
| **Khả năng chạy 100% Offline** | **Hoạt động bình thường khi ngắt mạng** | Rút dây mạng / tắt Wifi hoàn toàn: Soạn thảo, chat gia sư, bôi đen sửa lỗi và lưu sổ tay vẫn hoạt động trơn tru. |
| **Khả năng phục hồi khi Ollama tắt** | **Hiển thị Banner cảnh báo thân thiện** | Khi service Ollama chưa bật: Giao diện hiển thị pill `[OFFLINE]`, chat hiển thị hướng dẫn bật Ollama, không bị crash trắng trang (White Screen of Death). |

### 8.4 Biên Bản Nghiệm Thu Tổng Thể (Acceptance Sign-off Checklist)
- [ ] 1. Khởi động backend (`server`) và frontend (`client`) bằng 2 lệnh đơn giản, không lỗi phụ thuộc.
- [ ] 2. Database SQLite `dev.db` tự động tạo, di chuyển máy chỉ cần copy file là giữ nguyên bài học.
- [ ] 3. Đã thử nghiệm thành công 1 bài Task 1 (có ảnh biểu đồ) và 1 bài Task 2.
- [ ] 4. Đã thử nghiệm Voice Input bằng giọng nói qua Mic.
- [ ] 5. Đã thử nghiệm bôi đen câu để sửa lỗi và nâng cấp câu theo Aim Band.
- [ ] 6. Nộp bài -> Nhận bảng điểm 4 tiêu chí, phân tích ý hợp lệ/lạc đề và đúng 01 bản nâng cấp bài viết.
- [ ] 7. Giao diện đúng chuẩn Retro RPG Pixel Art & Neo-Brutalist theo hình mẫu tham khảo.


