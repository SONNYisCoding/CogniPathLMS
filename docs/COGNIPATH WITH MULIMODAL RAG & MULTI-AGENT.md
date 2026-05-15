Việc nâng cấp CogniPath lên một hệ thống xử lý hàng nghìn trang tài liệu đa phương thức (Multimodal) kết hợp Vector Database và Web Search là một bước tiến đưa dự án lên tầm cỡ Enterprise. Để làm được điều này, chúng ta sẽ chuyển từ kiến trúc sinh văn bản thông thường sang kiến trúc **Multimodal RAG (Retrieval-Augmented Generation) kết hợp Agentic Workflow**.

Dưới đây là bản thiết kế và hướng dẫn tái cấu trúc toàn diện cho CogniPath.

# ---

**HƯỚNG DẪN TÁI KIẾN TRÚC COGNIPATH: MULTIMODAL RAG & MULTI-AGENT**

## **BƯỚC 1: CẬP NHẬT CẤU TRÚC HỆ THỐNG (BỔ SUNG VECTOR DB & TOOLS)**

Cấu trúc Monorepo sẽ được mở rộng để chứa các module xử lý nhúng (Embeddings) và công cụ tìm kiếm.

Plaintext

cognipath-workspace/  
├── frontend/                     \# Next.js App Router  
├── backend/                      \# FastAPI  
│   ├── app/                        
│   │   ├── api/endpoints/          
│   │   ├── models/               \# SQL/NoSQL cho siêu dữ liệu (Metadata)  
│   │   ├── services/               
│   │   │   ├── vector\_store.py   \# Lớp giao tiếp với Vector DB (Qdrant/Milvus)  
│   │   │   └── embedder.py       \# Xử lý Multimodal Embeddings (Gemini Vertex AI)  
│   │   ├── agents/                 
│   │   │   ├── orchestrator.py   \# Điều phối luồng học tập  
│   │   │   └── specialists/        
│   │   │       ├── ingestor.py   \# Agent "nhai" hàng nghìn trang tài liệu & media  
│   │   │       ├── researcher.py \# Agent thực hiện RAG & Web Search  
│   │   │       └── planner.py    \# Agent tổng hợp và vẽ Lộ trình học (CogniPath)  
│   │   ├── tools/                  
│   │   │   ├── web\_search.py     \# Tích hợp Google Search API / Tavily  
│   │   │   └── rag\_retriever.py  \# Truy vấn Vector DB  
│   │   ├── prompts/                
│   ├── main.py                     
│   └── requirements.txt          \# Thêm qdrant-client, google-cloud-aiplatform  
└── docker-compose.yml            \# Bổ sung service Vector DB

## ---

**BƯỚC 2: THIẾT LẬP VECTOR DATABASE VÀ MULTIMODAL EMBEDDINGS**

Khi đối mặt với hàng nghìn trang tài liệu, bảng biểu, video và voice, bạn không thể nhồi tất cả vào Prompt (dù Gemini có context window lớn, chi phí và độ trễ sẽ rất cao). Bạn cần "băm" nhỏ chúng, biến thành các vector toán học và lưu trữ.

**1\. Khởi tạo dịch vụ Vector (Qdrant) trong app/services/vector\_store.py:**

Sử dụng Qdrant vì nó hỗ trợ tốt trong môi trường Docker và cho phép lưu trữ payload (metadata) phong phú.

Python

from qdrant\_client import QdrantClient  
from qdrant\_client.models import VectorParams, Distance

class CogniPathVectorStore:  
    def \_\_init\_\_(self):  
        self.client \= QdrantClient(host="vector\_db", port=6333)  
        self.collection\_name \= "cognipath\_knowledge"  
          
        \# Tạo collection nếu chưa tồn tại (Kích thước vector phụ thuộc model embedding)  
        if not self.client.collection\_exists(self.collection\_name):  
            self.client.create\_collection(  
                collection\_name=self.collection\_name,  
                vectors\_config=VectorParams(size=1408, distance=Distance.COSINE),  
            )

    def upsert\_vectors(self, ids, vectors, payloads):  
        self.client.upsert(  
            collection\_name=self.collection\_name,  
            points=batch\_points(ids, vectors, payloads)  
        )

**2\. Xử lý Multimodal Embedding (app/services/embedder.py):**

Sử dụng model multimodalembedding của Google Vertex AI để tạo vector từ cả hình ảnh, video và văn bản cùng một không gian chiều.

Python

from vertexai.vision\_models import MultiModalEmbeddingModel

class CogniPathEmbedder:  
    def \_\_init\_\_(self):  
        self.model \= MultiModalEmbeddingModel.from\_pretrained("multimodalembedding@001")

    def embed\_multimodal\_chunk(self, text=None, image\_path=None, video\_path=None):  
        \# Model này có thể nhận text, ảnh, hoặc video và trả về cùng 1 vector không gian  
        embeddings \= self.model.get\_embeddings(  
            contextual\_text=text,  
            image=image\_path,  
            video=video\_path  
        )  
        return embeddings.image\_embedding or embeddings.text\_embedding or embeddings.video\_embedding

## ---

**BƯỚC 3: XÂY DỰNG CÁC TOOLS (VŨ KHÍ CHO AGENT)**

Các Agents cần công cụ để tương tác với thế giới bên ngoài.

**1\. Web Search Tool (app/tools/web\_search.py):**

Python

import httpx

async def search\_realtime\_knowledge(query: str):  
    \# Sử dụng Tavily API hoặc Google Search API để lấy thông tin mới nhất  
    response \= httpx.get(f"https://api.tavily.com/search?query={query}\&api\_key=YOUR\_API\_KEY")  
    return response.json()\['results'\]

**2\. RAG Retriever Tool (app/tools/rag\_retriever.py):**

Python

def retrieve\_from\_vector\_db(query\_text: str, top\_k: int \= 5):  
    embedder \= CogniPathEmbedder()  
    store \= CogniPathVectorStore()  
      
    query\_vector \= embedder.embed\_multimodal\_chunk(text=query\_text)  
    search\_result \= store.client.search(  
        collection\_name=store.collection\_name,  
        query\_vector=query\_vector,  
        limit=top\_k  
    )  
    \# Trả về text, link ảnh, link video có liên quan nhất  
    return \[hit.payload for hit in search\_result\]

## ---

**BƯỚC 4: NÂNG CẤP HỆ THỐNG AGENT (SPECIALISTS)**

Mỗi Agent đảm nhận một nhiệm vụ cụ thể trong pipeline của CogniPath.

**1\. Ingestion Agent (Kẻ cắn nuốt dữ liệu):**

Đọc hàng nghìn trang PDF, chia nhỏ (chunking), trích xuất bảng biểu, gọi Embedder và lưu vào Vector DB. Nhờ khả năng native multimodal của Gemini, bạn có thể truyền thẳng khung hình video hoặc file ghi âm vào để lấy nội dung.

Python

class IngestorAgent:  
    def process\_materials(self, folder\_path: str):  
        \# 1\. Quét toàn bộ file (PDF, MP4, MP3, JPG)  
        \# 2\. Dùng Gemini phân tích bảng biểu phức tạp trong PDF thành dạng Markdown  
        \# 3\. Chia nhỏ nội dung (Chunking: 1000 tokens/chunk)  
        \# 4\. Gọi CogniPathEmbedder tạo vector  
        \# 5\. Lưu vào CogniPathVectorStore kèm metadata (loại file, số trang, timestamp video)  
        pass

**2\. Researcher Agent (Nhà nghiên cứu RAG):**

Khi sinh viên nhập câu hỏi hoặc yêu cầu tạo lộ trình, Agent này sẽ "search".

Python

from app.tools.rag\_retriever import retrieve\_from\_vector\_db  
from app.tools.web\_search import search\_realtime\_knowledge

class ResearcherAgent:  
    async def gather\_context(self, user\_goal: str):  
        \# 1\. Tìm trong kiến thức nội bộ (RAG)  
        internal\_docs \= retrieve\_from\_vector\_db(query\_text=user\_goal)  
          
        \# 2\. Quyết định xem có cần kiến thức cập nhật không (Web Search)  
        external\_docs \= await search\_realtime\_knowledge(user\_goal)  
          
        return {"internal": internal\_docs, "external": external\_docs}

**3\. Planner Agent (Kiến trúc sư lộ trình):**

Tổng hợp dữ liệu từ Researcher để sinh ra JSON Lộ trình học (CogniPath).

Python

class PlannerAgent:  
    async def create\_path(self, context: dict, user\_goal: str):  
        prompt \= f"""Bạn là một AI thiết kế lộ trình học cá nhân hóa.   
        Mục tiêu học viên: {user\_goal}  
        Nguồn tài liệu nội bộ: {context\['internal'\]}  
        Kiến thức cập nhật internet: {context\['external'\]}  
          
        Hãy thiết kế một lộ trình học chi tiết (JSON). Ở mỗi module, hãy chỉ định chính xác học viên cần đọc tài liệu nào (kèm số trang), xem video nào (kèm phút thứ mấy)."""  
          
        \# Gọi Gemini Model  
        return await gemini\_model.generate\_content\_async(prompt)

## ---

**BƯỚC 5: ORCHESTRATOR ĐIỀU PHỐI LUỒNG COGNIPATH**

Orchestrator định tuyến các bước chạy từ khi nhận request đến khi trả JSON cho Next.js.

Python

\# app/agents/orchestrator.py  
from app.agents.specialists.researcher import ResearcherAgent  
from app.agents.specialists.planner import PlannerAgent

class CogniPathOrchestrator:  
    def \_\_init\_\_(self):  
        self.researcher \= ResearcherAgent()  
        self.planner \= PlannerAgent()

    async def generate\_learning\_path(self, user\_goal: str):  
        \# Bước 1: Giao Researcher thu thập dữ liệu (Text, Table, Image context, Web)  
        knowledge\_context \= await self.researcher.gather\_context(user\_goal)  
          
        \# Bước 2: Giao Planner tổng hợp thành Lộ trình  
        final\_path\_json \= await self.planner.create\_path(knowledge\_context, user\_goal)  
          
        return final\_path\_json

## ---

**BƯỚC 6: FRONTEND (NEXT.JS UI)**

Giao diện cần hỗ trợ upload folder chứa dữ liệu hỗn hợp và hiển thị biểu đồ lộ trình.

**frontend/app/api/proxy/route.ts (Proxy):**

Chuyển tiếp API sinh lộ trình.

**frontend/app/cognipath/page.tsx:**

TypeScript

'use client';  
import { useState } from 'react';

export default function CogniPathDashboard() {  
  const \[goal, setGoal\] \= useState("");  
  const \[path, setPath\] \= useState(null);  
  const \[loading, setLoading\] \= useState(false);

  const buildPath \= async () \=\> {  
    setLoading(true);  
    // Gửi yêu cầu qua Proxy  
    const res \= await fetch('/api/py/path/generate', {  
      method: 'POST',  
      body: JSON.stringify({ goal: goal })  
    });  
    const data \= await res.json();  
    setPath(data.path);  
    setLoading(false);  
  };

  return (  
    \<div className="flex flex-col items-center p-10"\>  
      \<h1 className="text-3xl font-bold"\>CogniPath \- Multimodal Engine\</h1\>  
      \<input   
        className="border p-2 mt-4 w-1/2"  
        placeholder="Nhập mục tiêu học tập (VD: Học Machine Learning từ bộ tài liệu của trường)"   
        onChange={(e) \=\> setGoal(e.target.value)}   
      /\>  
      \<button onClick={buildPath} className="mt-4 bg-blue-600 text-white p-2 rounded"\>  
        {loading ? "AI đang phân tích hàng nghìn trang & video..." : "Tạo Lộ Trình"}  
      \</button\>  
        
      {/\* Khu vực render React Flow hoặc Tree component hiển thị Lộ trình \*/}  
      {path && \<PathVisualizer data={path} /\>}   
    \</div\>  
  );  
}

## ---

**BƯỚC 7: DOCKER COMPOSE ĐÓNG GÓI HOÀN CHỈNH**

Chạy toàn bộ hệ thống bằng một lệnh docker-compose up \-d.

**docker-compose.yml**:

YAML

version: '3.8'

services:  
  \# 1\. Cơ sở dữ liệu Vector lưu trữ Embeddings  
  vector\_db:  
    image: qdrant/qdrant:latest  
    ports:  
      \- "6333:6333"  
    volumes:  
      \- qdrant\_data:/qdrant/storage  
    networks:  
      \- cognipath\_net

  \# 2\. Khối AI Backend (FastAPI \+ Multi-Agent)  
  backend:  
    build: ./backend  
    ports:  
      \- "8000:8000"  
    depends\_on:  
      \- vector\_db  
    env\_file:  
      \- ./backend/.env  
    networks:  
      \- cognipath\_net

  \# 3\. Khối Frontend UI (Next.js)  
  frontend:  
    build: ./frontend  
    ports:  
      \- "3000:3000"  
    depends\_on:  
      \- backend  
    networks:  
      \- cognipath\_net

networks:  
  cognipath\_net:  
    driver: bridge

volumes:  
  qdrant\_data:

