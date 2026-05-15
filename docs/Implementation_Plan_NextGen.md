# Implementation Plan: CogniPath NextGen (RAG & Multi-Agent)

Bản kế hoạch này mô tả chiến lược tái cấu trúc toàn diện CogniPath LMS sang kiến trúc Agentic Multimodal RAG, sử dụng Next.js và FastAPI.

## 1. Tầm nhìn & Mục tiêu
Chuyển đổi từ một ứng dụng AI đơn giản sang một hệ thống Learning Engine cấp độ doanh nghiệp, có khả năng xử lý hàng nghìn trang tài liệu đa phương thức và cung cấp lộ trình học cá nhân hóa sâu sắc với trích dẫn chính xác.

## 2. Thay đổi Tech Stack (Migration)
| Thành phần | Hiện tại (Vite/Flask) | NextGen (Next.js/FastAPI) | Lý do thay đổi |
| :--- | :--- | :--- | :--- |
| **Frontend** | Vite (SPA) | **Next.js (App Router)** | Hỗ trợ SSR, tối ưu SEO/Performance và quản lý Layout Workspace phức tạp tốt hơn. |
| **Backend** | Flask (WSGI) | **FastAPI (ASGI)** | Xử lý Async native, cực kỳ quan trọng cho luồng Multi-Agent và Web Search. |
| **Database** | Firestore | **Firestore + Qdrant** | Bổ sung Vector Database để lưu trữ và truy vấn Multimodal Embeddings. |
| **AI Pattern** | Stateless Prompting | **Agentic Multi-Agent** | Chia nhỏ nhiệm vụ (Researcher, Planner, Ingestor) để tăng độ chính xác. |

## 3. Chiến lược triển khai: "New Build with Selective Reuse"
Thay vì cập nhật trực tiếp trên code cũ (Refactoring), chúng ta sẽ **khởi tạo dự án mới hoàn toàn** và thực hiện "lọc" để tái sử dụng các thành phần ổn định.

### Các thành phần tái sử dụng (The Filtered List):
1.  **UI/UX Design System**: Toàn bộ CSS Variables, bảng màu, hiệu ứng Glassmorphism và các component nguyên tử (Button, Card, Input).
2.  **Core Prompts**: Các Prompt hệ thống (Socratic Tutor, Path Generator) đã được tinh chỉnh qua các session trước.
3.  **Data Models**: Các interface đã định nghĩa trong `Schema_Dictionary.md`.
4.  **Business Logic Hooks**: Logic xử lý kết quả trả về từ AI (trước khi lưu Firestore).

## 4. Lộ trình triển khai (Phased Roadmap)

### Phase 1: Infrastructure & Core Setup (The Skeleton)
- Khởi tạo Next.js App Router.
- Thiết lập FastAPI với cấu trúc thư mục mới.
- Cấu hình Docker Compose cho: Backend, Frontend, và Qdrant Vector DB.

### Phase 2: UI Migration & Atom Reuse
- Di chuyển Design System và các Component cơ bản từ Vite sang Next.js.
- Xây dựng lại Layout "Learning Workspace" bằng tính năng Parallel Routes của Next.js.

### Phase 3: Agentic Backend Implementation
- Xây dựng `Ingestor Agent` (Xử lý tài liệu sang Vector DB).
- Xây dựng `Researcher Agent` (RAG + Web Search).
- Xây dựng `Planner Agent` (Sinh lộ trình dựa trên context).

### Phase 4: Integration & "WOW" Polish
- Kết nối luồng dữ liệu từ Backend lên UI Next.js.
- Tối ưu hóa UI để hiển thị trích dẫn (Trang tài liệu, Phút video).
- Thực hiện kiểm thử toàn diện dựa trên "Kim Chỉ Nam".

---
*Kế hoạch này sẽ là tài liệu sống và được cập nhật liên tục trong quá trình thảo luận.*
