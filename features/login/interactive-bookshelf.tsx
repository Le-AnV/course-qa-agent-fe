"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, BookOpen, X } from "lucide-react";

export interface BookVolumeData {
  id: string;
  tag: string;
  title: string;
  romanNum: string;
  coverColor: string; // Viền bìa cứng
  spineColor: string; // Màu gáy sách mini
  accentColor: string;
  textColor: string;
  spreads: {
    leftPage: {
      title: string;
      pageNumber: number;
      diagramType:
        | "python"
        | "decorator"
        | "oop"
        | "collections"
        | "flowchart"
        | "memory"
        | "erd"
        | "joins"
        | "api"
        | "eventbus";
      points: { label: string; text: string }[];
    };
    rightPage: {
      title: string;
      pageNumber: number;
      summaryLines: string[];
      conceptNote?: { title: string; text: string };
    };
  }[];
}

export const BOOK_VOLUMES: BookVolumeData[] = [
  {
    id: "python",
    tag: "Python",
    title: "Core & Data Models",
    romanNum: "VOL. I",
    coverColor: "#1E3A5F", // Deep Oxford Sapphire Blue
    spineColor: "bg-gradient-to-b from-[#24456F] to-[#162C47]",
    accentColor: "#60A5FA",
    textColor: "text-[#93C5FD]",
    spreads: [
      {
        leftPage: {
          title: "Python Data Model",
          pageNumber: 1,
          diagramType: "python",
          points: [
            {
              label: "Dynamic Typing",
              text: "Variables hold direct Heap object references; memory is reclaimed via reference counting and cyclic GC.",
            },
            {
              label: "List vs Tuple",
              text: "Lists are mutable and dynamic; Tuples are immutable, cache-friendly, and hashable when elements allow.",
            },
          ],
        },
        rightPage: {
          title: "Pythonic Idioms",
          pageNumber: 2,
          summaryLines: [
            "List Comprehensions deliver expressive syntax with fast C-level iteration performance.",
            "Context Managers (with) guarantee deterministic cleanup of file handles and network sockets.",
            "Generators (yield) evaluate elements on-demand, preventing peak memory spikes on large sets.",
          ],
          conceptNote: {
            title: "The Zen of Python",
            text: "Readability counts. Simple is better than complex. Explicit is better than implicit.",
          },
        },
      },
      {
        leftPage: {
          title: "Decorators & OOP",
          pageNumber: 3,
          diagramType: "decorator",
          points: [
            {
              label: "First-Class Functions",
              text: "Functions are first-class citizens, passable as arguments and bindable inside runtime closures.",
            },
            {
              label: "Dunder Protocol",
              text: "Magic methods (__init__, __repr__, __call__) define custom operator semantics and class lifecycles.",
            },
          ],
        },
        rightPage: {
          title: "Async & Ecosystem",
          pageNumber: 4,
          summaryLines: [
            "asyncio Event Loop coordinates thousands of concurrent non-blocking network I/O routines.",
            "Type Hints (PEP 484) power early static analysis, autocompletion, and runtime schema validation.",
            "Robust ecosystem powers modern AI and backend engineering with FastAPI, Pydantic, and PyTorch.",
          ],
          conceptNote: {
            title: "Production Rule",
            text: "Always isolate dependencies using Virtual Environments (venv/uv) to prevent dependency drift.",
          },
        },
      },
    ],
  },
  {
    id: "java",
    tag: "Java",
    title: "Object-Oriented Design",
    romanNum: "VOL. II",
    coverColor: "#6B212E", // Rich Crimson Burgundy
    spineColor: "bg-gradient-to-b from-[#7A2332] to-[#541621]",
    accentColor: "#F4D06F",
    textColor: "text-[#FDE68A]",
    spreads: [
      {
        leftPage: {
          title: "Object-Oriented Design",
          pageNumber: 1,
          diagramType: "oop",
          points: [
            {
              label: "Polymorphism & Contracts",
              text: "Interface abstraction decouples component contracts from concrete implementations.",
            },
            {
              label: "Encapsulation",
              text: "Internal state is guarded through access modifiers and thread-safe accessor methods.",
            },
          ],
        },
        rightPage: {
          title: "JVM & Concurrency",
          pageNumber: 2,
          summaryLines: [
            "Generational Garbage Collection segregates Eden, Survivor, and Tenured memory spaces.",
            "Virtual Threads (Project Loom) handle high-throughput concurrent I/O with minimal overhead.",
            "Atomic primitives (AtomicInteger) guarantee lock-free thread safety under heavy contention.",
          ],
          conceptNote: {
            title: "Architecture Rule",
            text: "Favor composition over inheritance to prevent fragile base-class coupling.",
          },
        },
      },
      {
        leftPage: {
          title: "Collections Framework",
          pageNumber: 3,
          diagramType: "collections",
          points: [
            {
              label: "HashMap Internals",
              text: "Keys distribute across array buckets, treeifying to Red-Black Trees when collisions exceed 8.",
            },
            {
              label: "Stream API",
              text: "Declarative pipelines support functional transformations and effortless parallel processing.",
            },
          ],
        },
        rightPage: {
          title: "Spring & Persistence",
          pageNumber: 4,
          summaryLines: [
            "Inversion of Control (IoC) and Dependency Injection automate Bean lifecycle management.",
            "@Transactional boundaries guarantee ACID rollbacks on unhandled runtime exceptions.",
            "First and second-level Hibernate caching eliminates redundant SQL round-trips.",
          ],
          conceptNote: {
            title: "Query Tuning",
            text: "Eliminate N+1 database queries in JPA using JOIN FETCH or explicit EntityGraphs.",
          },
        },
      },
    ],
  },
  {
    id: "cpp",
    tag: "C / C++",
    title: "Data Structures & Memory",
    romanNum: "VOL. III",
    coverColor: "#2B4C5E", // Classic Denim Slate Blue
    spineColor: "bg-gradient-to-b from-[#33596E] to-[#203947]",
    accentColor: "#7DD3FC",
    textColor: "text-[#BAE6FD]",
    spreads: [
      {
        leftPage: {
          title: "Data Structures",
          pageNumber: 1,
          diagramType: "flowchart",
          points: [
            {
              label: "Node Pointer Mechanics",
              text: "Raw pointers store direct physical memory addresses, enabling dynamic graph links.",
            },
            {
              label: "Traversal Efficiency",
              text: "Binary tree partitioning narrows search time complexity down to logarithmic O(log N).",
            },
          ],
        },
        rightPage: {
          title: "Memory & RAII",
          pageNumber: 2,
          summaryLines: [
            "Deterministic safety: Always bind manual Heap allocations to RAII scope lifetimes.",
            "Boundary guarding: Verify null-pointer checks prior to any dereferencing operation.",
            "Cache locality: Contiguous array indexing maximizes CPU L1/L2 cache hit ratios.",
          ],
          conceptNote: {
            title: "Core Guideline",
            text: "Prefer std::unique_ptr and std::shared_ptr to eliminate memory leaks and dangling pointers.",
          },
        },
      },
      {
        leftPage: {
          title: "Memory Segments",
          pageNumber: 3,
          diagramType: "memory",
          points: [
            {
              label: "Stack Memory",
              text: "Ultra-fast LIFO allocation, automatically reclaimed when function execution exits.",
            },
            {
              label: "Heap Memory",
              text: "Dynamic manual allocation via new/malloc, requiring disciplined release lifecycle.",
            },
          ],
        },
        rightPage: {
          title: "Modern C++ Practices",
          pageNumber: 4,
          summaryLines: [
            "Move semantics (std::move) transfer resource handles without deep copying overhead.",
            "Templates enable zero-cost abstractions, compiled into specialized machine instructions.",
            "Constexpr evaluation computes values at compile-time, boosting runtime throughput.",
          ],
          conceptNote: {
            title: "Optimization Rule",
            text: "Pass large objects by const reference (const T&) to avoid redundant copy construction.",
          },
        },
      },
    ],
  },
  {
    id: "sql",
    tag: "SQL",
    title: "Relational Schemas",
    romanNum: "VOL. IV",
    coverColor: "#8D5B18", // Warm Amber Leather
    spineColor: "bg-gradient-to-b from-[#A0671C] to-[#6E440E]",
    accentColor: "#FDE047",
    textColor: "text-[#FEF08A]",
    spreads: [
      {
        leftPage: {
          title: "Relational Schemas",
          pageNumber: 1,
          diagramType: "erd",
          points: [
            {
              label: "Third Normal Form (3NF)",
              text: "Normalize relational tables to eliminate data redundancy and insertion/deletion anomalies.",
            },
            {
              label: "Foreign Key Integrity",
              text: "Relational constraints enforce referential consistency across distinct entity tables.",
            },
          ],
        },
        rightPage: {
          title: "ACID & Query Tuning",
          pageNumber: 2,
          summaryLines: [
            "ACID guarantees: Atomicity, Consistency, Isolation, and Durability across transactions.",
            "Composite B-Tree Indexes: Order indexed columns by descending cardinality and selectivity.",
            "Execution Plans: Audit EXPLAIN outputs to eliminate full table scans via targeted index seeks.",
          ],
          conceptNote: {
            title: "Performance Rule",
            text: "Never select * on production endpoints; specify exact projected columns for lean serialization.",
          },
        },
      },
      {
        leftPage: {
          title: "SQL Joins & Sets",
          pageNumber: 3,
          diagramType: "joins",
          points: [
            {
              label: "Hash vs Nested Loop",
              text: "Query optimizer selects join algorithm based on table cardinality and statistics.",
            },
            {
              label: "Isolation Levels",
              text: "Read Committed and Repeatable Read shield transactions against dirty and non-repeatable reads.",
            },
          ],
        },
        rightPage: {
          title: "Scale & Reliability",
          pageNumber: 4,
          summaryLines: [
            "Covering indexes supply all query fields directly from B-Tree leaf pages without table lookups.",
            "Write-Ahead Logging (WAL) guarantees crash recovery and durability across sudden outages.",
            "Connection Pooling (HikariCP) minimizes TCP handshake latency under heavy API load.",
          ],
          conceptNote: {
            title: "Security Standard",
            text: "Always utilize parameterized Prepared Statements to systematically prevent SQL Injection.",
          },
        },
      },
    ],
  },
  {
    id: "rest",
    tag: "REST API",
    title: "HTTP & Architecture",
    romanNum: "VOL. V",
    coverColor: "#1E5E4B", // Deep Emerald Teal
    spineColor: "bg-gradient-to-b from-[#25735C] to-[#164739]",
    accentColor: "#6EE7B7",
    textColor: "text-[#A7F3D0]",
    spreads: [
      {
        leftPage: {
          title: "HTTP Contracts",
          pageNumber: 1,
          diagramType: "api",
          points: [
            {
              label: "Idempotency Rules",
              text: "GET, PUT, and DELETE operations maintain identical resource states on retries.",
            },
            {
              label: "Semantic Status Codes",
              text: "Return explicit codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 429 Limited.",
            },
          ],
        },
        rightPage: {
          title: "API Resilience",
          pageNumber: 2,
          summaryLines: [
            "API Gateway: Centralize JWT validation, client rate limiting, and SSL termination.",
            "Circuit Breaker: Fast-fail failing downstream dependencies to prevent worker thread exhaustion.",
            "Idempotency Keys: Enforce deduplication headers on state-mutating billing transactions.",
          ],
          conceptNote: {
            title: "Security Baseline",
            text: "Enforce HTTPS everywhere, define strict CORS domains, and configure secure HTTP headers.",
          },
        },
      },
      {
        leftPage: {
          title: "Event-Driven Messaging",
          pageNumber: 3,
          diagramType: "eventbus",
          points: [
            {
              label: "Asynchronous Decoupling",
              text: "Message brokers (Kafka/RabbitMQ) decouple services for independent horizontal scaling.",
            },
            {
              label: "gRPC & Protobuf",
              text: "Binary serialization drastically accelerates low-latency inter-service communication.",
            },
          ],
        },
        rightPage: {
          title: "Production Observability",
          pageNumber: 4,
          summaryLines: [
            "Distributed Tracing: Propagate Trace-IDs via OpenTelemetry across microservice boundaries.",
            "Structured Logging: Stream JSON-formatted telemetry into centralized collectors for fast triage.",
            "Health Probes: Expose /healthz and /ready endpoints for automated container orchestration.",
          ],
          conceptNote: {
            title: "Architectural Rule",
            text: "Design for graceful failure: assume any external service or dependency can outage unexpectedly.",
          },
        },
      },
    ],
  },
];

export function InteractiveBookshelf() {
  // Mặc định mở cuốn đầu tiên: Python (VOL. I)
  const [activeVolumeId, setActiveVolumeId] = useState<string | null>("python");
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState<number>(0);

  const activeVolume =
    BOOK_VOLUMES.find((v) => v.id === activeVolumeId) || null;
  const currentSpread =
    activeVolume ? (activeVolume.spreads[currentSpreadIndex] || activeVolume.spreads[0]) : null;

  const handleSelectVolume = (volumeId: string) => {
    if (volumeId === activeVolumeId) {
      // Bấm vào cuốn sách đang mở -> Đóng sách lại rớt xuống kệ
      setActiveVolumeId(null);
      return;
    }
    setActiveVolumeId(volumeId);
    setCurrentSpreadIndex(0);
  };

  const handlePrevPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentSpreadIndex > 0) {
      setCurrentSpreadIndex(currentSpreadIndex - 1);
    }
  };

  const handleNextPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeVolume && currentSpreadIndex < activeVolume.spreads.length - 1) {
      setCurrentSpreadIndex(currentSpreadIndex + 1);
    }
  };

  return (
    <div
      role="region"
      aria-label="Interactive academic study desk"
      className="relative w-full h-full overflow-hidden select-none"
    >
      {/* ============================================================== */}
      {/* 1. MÀU NỀN & TEXTURE NOISE (MẶT BÀN GỖ SÁNG)                   */}
      {/* ============================================================== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden bg-gradient-to-br from-[#F8F1E9] via-[#F5EBE1] to-[#EBDBC7]">
        {/* Lớp texture noise cực mỏng (opacity 2%) */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Vân gỗ nhẹ & vệt sáng tự nhiên */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.12) 40%, rgba(90,65,40,0.04) 100%)",
          }}
        />
      </div>

      {/* ============================================================== */}
      {/* 2. KHỐI TEXT TYPOGRAPHY (HERO TEXT)                            */}
      {/* Vị trí: top-[2.5%] left-1/2 -translate-x-1/2 w-[80%] text-center */}
      {/* ============================================================== */}
      <header className="absolute top-[2.5%] left-1/2 -translate-x-1/2 w-[80%] text-center z-20 pointer-events-none">
        <h1
          className="font-serif text-[26px] sm:text-[30px] lg:text-[32px] font-bold text-[#3A2A1A] leading-tight tracking-tight drop-shadow-xs"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Turn course materials
          <br />
          into understanding.
        </h1>
        <p
          className="font-serif italic text-[14px] sm:text-[15px] text-[#5A4A3A] mt-1 tracking-normal"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Ask questions. Find answers. Learn with clarity.
        </p>
      </header>

      {/* ============================================================== */}
      {/* 3. TÁCH CÀ PHÊ (COFFEE CUP ON COASTER)                         */}
      {/* Vị trí: top-[3%] right-[4%] w-[115px] aspect-square            */}
      {/* ============================================================== */}
      <div
        className="absolute top-[3%] right-[4%] w-[115px] aspect-square pointer-events-none z-10 transition-transform duration-300 hover:scale-105"
        style={{ filter: "drop-shadow(4px 6px 12px rgba(0,0,0,0.12))" }}
      >
        <img
          src="/image/props/coffee-cup.png"
          alt="Coffee mug on square wooden coaster"
          className="w-full h-full object-contain select-none"
          draggable={false}
        />
      </div>

      {/* ============================================================== */}
      {/* 4. BÚT MÁY (FOUNTAIN PEN)                                      */}
      {/* Vị trí: top-[7%] left-[3.5%] w-[135px] Xoay 5deg               */}
      {/* ============================================================== */}
      <div
        className="absolute top-[7%] left-[3.5%] w-[135px] pointer-events-none z-10 transition-transform duration-300"
        style={{
          transform: "rotate(5deg)",
          filter: "drop-shadow(4px 6px 10px rgba(0,0,0,0.1))",
        }}
      >
        <img
          src="/image/props/fountain-pen.png"
          alt="Elegant fountain pen"
          className="w-full h-auto object-contain select-none"
          draggable={false}
        />
      </div>

      {/* ============================================================== */}
      {/* 5. NHÁNH LÁ (GREEN LEAVES)                                     */}
      {/* Vị trí: bottom-[4%] left-[3%] w-[105px] Xoay -5deg opacity-90  */}
      {/* ============================================================== */}
      <div
        className="absolute bottom-[4%] left-[3%] w-[105px] pointer-events-none z-10 opacity-90 transition-transform duration-300"
        style={{
          transform: "rotate(-5deg)",
          filter: "drop-shadow(3px 5px 8px rgba(0,0,0,0.08))",
        }}
      >
        <img
          src="/image/props/leaf-branch.png"
          alt="Green leafy branch"
          className="w-full h-auto object-contain select-none"
          draggable={false}
        />
      </div>

      {/* ============================================================== */}
      {/* 5B. KẸP GIẤY KIM LOẠI (PAPERCLIPS)                             */}
      {/* Vị trí: bottom-[5.5%] right-[5%] w-[75px] Xoay -8deg           */}
      {/* ============================================================== */}
      <div
        className="absolute bottom-[5.5%] right-[5%] w-[75px] pointer-events-none z-10 opacity-90 transition-transform duration-300"
        style={{
          transform: "rotate(-8deg)",
          filter: "drop-shadow(2px 3px 6px rgba(0,0,0,0.08))",
        }}
      >
        <img
          src="/image/props/paperclips.png"
          alt="Metallic paperclips"
          className="w-full h-auto object-contain select-none"
          draggable={false}
        />
      </div>

      {/* ============================================================== */}
      {/* 6. CUỐN SÁCH LỚN ĐANG MỞ (MAIN OPENED BOOK - FRAMER MOTION)    */}
      {/* Vị trí: top-[51%] left-1/2 -translate-x-1/2 -translate-y-1/2    */}
      {/* Kích thước: w-[85%] max-w-[620px] aspect-[1.5/1]               */}
      {/* Viền màu #2B4C5E, nền trang giấy #FDFBF7, đổ bóng gáy sách     */}
      {/* ============================================================== */}
      <div
        className="absolute top-[51%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] max-w-[620px] aspect-[1.5/1] z-20 pointer-events-auto"
        style={{ perspective: 1200 }}
      >
        <AnimatePresence mode="wait">
          {activeVolume && currentSpread && (
            <motion.div
              key={activeVolume.id}
              variants={{
                initial: {
                  y: "42vh",
                  opacity: 0,
                },
                animate: {
                  y: 0,
                  opacity: 1,
                  transition: {
                    // GIAI ĐOẠN 1 (OPEN): Thanh dọc trắng ngà trượt từ kệ lên giữa tâm (Slide Up: 0.3s)
                    y: { duration: 0.3, ease: "easeOut" },
                    opacity: { duration: 0.12 },
                  },
                },
                exit: {
                  // GIAI ĐOẠN 3 (CLOSE): Sau khi đã gập thành thanh dọc trắng (sau 0.5s), trượt thẳng xuống kệ (Slide Down: 0.3s)
                  y: "42vh",
                  opacity: 0,
                  transition: {
                    y: { delay: 0.5, duration: 0.3, ease: "easeIn" },
                    opacity: { delay: 0.72, duration: 0.08 },
                  },
                },
              }}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ transformStyle: "preserve-3d" }}
              className="w-full h-full relative"
            >
              {/* ============================================================== */}
              {/* 1. THANH DỌC MÀU TRẮNG NGÀ (CLOSED BOOK PAPER BLOCK FORE-EDGE) */}
              {/* Yêu cầu: Bắt buộc màu trắng ngà (#FDFBF7) mô phỏng xấp giấy,    */}
              {/* không dùng màu bìa tối. Viền xám mỏng & box-shadow inset 3D.   */}
              {/* ============================================================== */}
              <motion.div
                variants={{
                  initial: {
                    opacity: 1,
                    scaleX: 1,
                  },
                  animate: {
                    opacity: 0,
                    scaleX: 0,
                    transition: {
                      delay: 0.3,
                      duration: 0.35,
                      ease: [0.25, 1, 0.5, 1],
                    },
                  },
                  exit: {
                    opacity: 1,
                    scaleX: 1,
                    transition: {
                      delay: 0.15,
                      duration: 0.35,
                      ease: [0.4, 0, 0.2, 1],
                    },
                  },
                }}
                className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-10 sm:w-11 z-40 pointer-events-none flex items-stretch"
                style={{
                  transformOrigin: "center center",
                  filter: "drop-shadow(0 12px 24px rgba(45,30,15,0.22))",
                }}
              >
                {/* THANH BÌA TRÁI (BÌA TRƯỚC - FRONT HARDCOVER EDGE) */}
                <div
                  className="w-1.5 sm:w-2 -my-0.5 rounded-l-[3px] border-l border-t border-b border-black/20 flex-shrink-0 relative overflow-hidden"
                  style={{
                    backgroundColor: activeVolume.coverColor,
                    boxShadow:
                      "inset 1px 0 2px rgba(255,255,255,0.3), inset -1px 0 2px rgba(0,0,0,0.35)",
                  }}
                >
                  {/* Ánh sáng bóng nhẹ cạnh bìa */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-black/25 pointer-events-none" />
                </div>

                {/* XẤP GIẤY TRẮNG NGÀ Ở GIỮA (PAPER BLOCK / RUỘT SÁCH) */}
                <div
                  className="flex-1 h-full relative overflow-hidden border-t border-b border-[#D5C9B8]"
                  style={{
                    backgroundColor: "#FDFBF7",
                    boxShadow: "inset 0 0 5px rgba(0,0,0,0.12)",
                  }}
                >
                  {/* Nẹp viền vải gáy trên và dưới (Headband & Tailband) */}
                  <div className="absolute top-0 inset-x-0 h-1 bg-[#E2D5C3] border-b border-[#C8B8A2]/60" />
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-[#E2D5C3] border-t border-[#C8B8A2]/60" />

                  {/* Dải vân các lớp trang giấy xếp chồng */}
                  <div
                    className="w-full h-full my-1 opacity-80"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(to right, #FDFBF7, #FDFBF7 2px, #ECE0D0 2px, #ECE0D0 3px)",
                    }}
                  />

                  {/* Chiều sâu 3D hình khối trụ của xấp giấy */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/12 via-transparent to-black/12 pointer-events-none" />
                </div>

                {/* THANH BÌA PHẢI (BÌA SAU - BACK HARDCOVER EDGE) */}
                <div
                  className="w-1.5 sm:w-2 -my-0.5 rounded-r-[3px] border-r border-t border-b border-black/20 flex-shrink-0 relative overflow-hidden"
                  style={{
                    backgroundColor: activeVolume.coverColor,
                    boxShadow:
                      "inset -1px 0 2px rgba(255,255,255,0.3), inset 1px 0 2px rgba(0,0,0,0.35)",
                  }}
                >
                  {/* Ánh sáng bóng nhẹ cạnh bìa */}
                  <div className="absolute inset-0 bg-gradient-to-l from-white/20 via-transparent to-black/25 pointer-events-none" />
                </div>
              </motion.div>

              {/* ============================================================== */}
              {/* 2. KHE GÁY SÁCH TỰ NHIÊN KHI MỞ PHẲNG (OPEN BOOK CENTER SEAM)  */}
              {/* Bóng đổ mềm mại giữa 2 trang sách mở, không che chữ hay che bìa*/}
              {/* ============================================================== */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-4 z-30 pointer-events-none flex items-center justify-center">
                <div className="w-full h-full bg-gradient-to-r from-black/15 via-black/5 to-black/15 opacity-50" />
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-[#3A2A1A]/20" />
              </div>

              {/* ============================================================== */}
              {/* TRANG TRÁI 3D (LEFT PAGE) - Trục xoay: right center            */}
              {/* Gập sách: rotateY(90deg), Mở sách: rotateY(0deg)               */}
              {/* ============================================================== */}
              <motion.div
                variants={{
                  initial: { rotateY: 90, opacity: 0 },
                  animate: {
                    rotateY: 0,
                    opacity: 1,
                    transition: {
                      delay: 0.3, // Giai đoạn 2: Bắt đầu mở sách khi thanh dọc chạm tâm (0.3s)
                      duration: 0.35,
                      ease: [0.25, 1, 0.5, 1],
                    },
                  },
                  exit: {
                    rotateY: 90, // Khi đóng: LeftPage xoay 90deg úp vào gáy
                    opacity: 0,
                    transition: {
                      delay: 0.15, // Chờ chữ mờ đi trước (0.15s)
                      duration: 0.35,
                      ease: [0.4, 0, 0.2, 1],
                    },
                  },
                }}
                style={{
                  transformOrigin: "right center",
                  transformStyle: "preserve-3d",
                }}
                className="absolute top-0 bottom-0 left-0 w-1/2 z-20"
              >
                {/* Viền Bìa Nửa Trái */}
                <div
                  className="w-full h-full rounded-l-[18px] p-2 sm:p-2.5 pr-0 border-l border-t border-b border-black/15 shadow-[-8px_20px_35px_rgba(58,42,26,0.18)] overflow-hidden"
                  style={{ backgroundColor: activeVolume.coverColor }}
                >
                  {/* Mặt Giấy Nửa Trái */}
                  <div
                    className="w-full h-full rounded-l-[12px] bg-[#FDFBF7] text-[#2C1A0C] overflow-hidden relative border-r border-[#E8DAC9]/80"
                    style={{
                      boxShadow:
                        "inset -8px 0 16px rgba(0,0,0,0.06), inset 0 2px 4px rgba(255,255,255,0.6)",
                    }}
                  >
                    {/* Bóng đổ 3D gập sách */}
                    <motion.div
                      variants={{
                        initial: { opacity: 0.5 },
                        animate: {
                          opacity: 0,
                          transition: { delay: 0.32, duration: 0.35 },
                        },
                        exit: {
                          opacity: 0.5,
                          transition: { delay: 0.15, duration: 0.35 },
                        },
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent to-black/25 pointer-events-none z-30"
                    />

                    {/* GIAI ĐOẠN 3: Nội dung Text & Sơ đồ Trang Trái */}
                    <motion.div
                      variants={{
                        initial: { opacity: 0, y: 8 },
                        animate: {
                          opacity: 1,
                          y: 0,
                          transition: {
                            delay: 0.65, // 0.3s + 0.35s = 0.65s
                            duration: 0.2,
                            ease: "easeOut",
                          },
                        },
                        exit: {
                          opacity: 0,
                          y: 4,
                          transition: { duration: 0.15, ease: "easeIn" },
                        },
                      }}
                      className="w-full h-full flex flex-col justify-between p-4 sm:p-5 sm:pr-6 bg-gradient-to-r from-[#FDFBF7] via-[#FCFAF4] to-[#F7F2E7]"
                    >
                      <div>
                        {/* Tiêu đề Trang Trái */}
                        <h3
                          className="font-serif text-xl sm:text-2xl font-bold text-[#2C1A0C] tracking-tight leading-tight mb-2 sm:mb-2.5"
                          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                        >
                          {currentSpread.leftPage.title}
                        </h3>

                        {/* Sơ đồ 2D Vector Tối giản */}
                        <div className="w-full flex items-center justify-center my-1 sm:my-1.5">
                          {currentSpread.leftPage.diagramType === "python" && (
                            <svg viewBox="0 0 200 86" className="w-44 sm:w-52 h-auto">
                              <rect x="15" y="15" width="68" height="26" rx="4" fill="#FFFDF9" stroke="#3D2E1E" strokeWidth="1.8" />
                              <text x="49" y="31" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#3D2E1E">dict[&quot;key&quot;]</text>
                              <line x1="83" y1="28" x2="110" y2="28" stroke="#3D2E1E" strokeWidth="1.8" />
                              <polygon points="110,24 118,28 110,32" fill="#3D2E1E" />
                              <rect x="118" y="10" width="70" height="66" rx="4" fill="#FFFDF9" stroke="#3D2E1E" strokeWidth="1.6" />
                              <text x="153" y="24" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#705642">HASH BUCKET</text>
                              <line x1="118" y1="28" x2="188" y2="28" stroke="#3D2E1E" strokeWidth="1" />
                              <text x="153" y="42" textAnchor="middle" fontSize="8" fill="#3D2E1E">hash(&quot;key&quot;) % 8</text>
                              <text x="153" y="58" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#1E3A5F">0x7F2A4C</text>
                            </svg>
                          )}

                          {currentSpread.leftPage.diagramType === "decorator" && (
                            <svg viewBox="0 0 200 86" className="w-44 sm:w-52 h-auto">
                              <rect x="15" y="12" width="70" height="28" rx="4" fill="#FFFDF9" stroke="#3D2E1E" strokeWidth="1.8" />
                              <text x="50" y="29" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#3D2E1E">@decorator</text>
                              <line x1="85" y1="26" x2="108" y2="26" stroke="#3D2E1E" strokeWidth="1.8" />
                              <polygon points="108,22 115,26 108,30" fill="#3D2E1E" />
                              <rect x="115" y="8" width="72" height="38" rx="4" fill="#FFFDF9" stroke="#3D2E1E" strokeWidth="1.8" />
                              <text x="151" y="23" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#3D2E1E">wrapper(*args)</text>
                              <text x="151" y="36" textAnchor="middle" fontSize="7.5" fill="#705642">before &amp; after</text>
                              <line x1="151" y1="46" x2="151" y2="58" stroke="#3D2E1E" strokeWidth="1.6" />
                              <rect x="117" y="58" width="68" height="22" rx="3" fill="#FFFDF9" stroke="#3D2E1E" strokeWidth="1.6" />
                              <text x="151" y="72" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#1E3A5F">func(*args)</text>
                            </svg>
                          )}

                          {currentSpread.leftPage.diagramType === "flowchart" && (
                            <svg viewBox="0 0 200 86" className="w-44 sm:w-52 h-auto">
                              <circle cx="100" cy="18" r="12" fill="#FFFDF9" stroke="#3D2E1E" strokeWidth="1.8" />
                              <text x="100" y="22" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#3D2E1E">Root</text>
                              <line x1="91" y1="26" x2="65" y2="48" stroke="#3D2E1E" strokeWidth="1.8" />
                              <line x1="109" y1="26" x2="135" y2="48" stroke="#3D2E1E" strokeWidth="1.8" />
                              <circle cx="60" cy="56" r="11" fill="#FFFDF9" stroke="#3D2E1E" strokeWidth="1.8" />
                              <text x="60" y="60" textAnchor="middle" fontSize="8" fill="#3D2E1E">Left</text>
                              <circle cx="140" cy="56" r="11" fill="#FFFDF9" stroke="#3D2E1E" strokeWidth="1.8" />
                              <text x="140" y="60" textAnchor="middle" fontSize="8" fill="#3D2E1E">Right</text>
                              <line x1="53" y1="64" x2="35" y2="78" stroke="#3D2E1E" strokeWidth="1.5" />
                              <line x1="67" y1="64" x2="85" y2="78" stroke="#3D2E1E" strokeWidth="1.5" />
                              <circle cx="30" cy="80" r="4" fill="#FFFDF9" stroke="#3D2E1E" strokeWidth="1.5" />
                              <circle cx="90" cy="80" r="4" fill="#FFFDF9" stroke="#3D2E1E" strokeWidth="1.5" />
                            </svg>
                          )}

                          {currentSpread.leftPage.diagramType === "memory" && (
                            <svg viewBox="0 0 200 86" className="w-44 sm:w-52 h-auto">
                              <rect x="25" y="8" width="65" height="70" rx="4" fill="#FFFDF9" stroke="#3D2E1E" strokeWidth="1.8" />
                              <text x="57" y="22" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#3D2E1E">STACK</text>
                              <line x1="25" y1="27" x2="90" y2="27" stroke="#3D2E1E" strokeWidth="1.2" />
                              <rect x="30" y="32" width="55" height="15" rx="2" fill="#EAE2D7" stroke="#3D2E1E" strokeWidth="1" />
                              <text x="57" y="43" textAnchor="middle" fontSize="7.5" fill="#3D2E1E">Frame 2 (LIFO)</text>
                              <rect x="30" y="52" width="55" height="15" rx="2" fill="#EAE2D7" stroke="#3D2E1E" strokeWidth="1" />
                              <text x="57" y="63" textAnchor="middle" fontSize="7.5" fill="#3D2E1E">Frame 1 (main)</text>
                              <line x1="90" y1="40" x2="110" y2="40" stroke="#3D2E1E" strokeWidth="1.6" strokeDasharray="3 2" />
                              <rect x="110" y="8" width="65" height="70" rx="4" fill="#FFFDF9" stroke="#3D2E1E" strokeWidth="1.8" />
                              <text x="142" y="22" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#3D2E1E">HEAP</text>
                              <line x1="110" y1="27" x2="175" y2="27" stroke="#3D2E1E" strokeWidth="1.2" />
                              <rect x="116" y="35" width="53" height="34" rx="3" fill="#F4EFE6" stroke="#3D2E1E" strokeWidth="1" />
                              <text x="142" y="50" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#2B4C5E">new T()</text>
                              <text x="142" y="62" textAnchor="middle" fontSize="7.5" fill="#705642">RAII Managed</text>
                            </svg>
                          )}

                          {currentSpread.leftPage.diagramType === "oop" && (
                            <svg viewBox="0 0 200 86" className="w-44 sm:w-52 h-auto">
                              <rect x="65" y="4" width="70" height="20" rx="4" fill="#FFFDF9" stroke="#3D2E1E" strokeWidth="1.8" />
                              <text x="100" y="18" textAnchor="middle" fontSize="10" fontFamily="'Playfair Display', serif" fill="#3D2E1E" fontWeight="bold">Shape (Base)</text>
                              <line x1="100" y1="24" x2="100" y2="40" stroke="#3D2E1E" strokeWidth="1.8" />
                              <line x1="45" y1="40" x2="155" y2="40" stroke="#3D2E1E" strokeWidth="1.8" />
                              <line x1="45" y1="40" x2="45" y2="52" stroke="#3D2E1E" strokeWidth="1.8" />
                              <line x1="100" y1="40" x2="100" y2="52" stroke="#3D2E1E" strokeWidth="1.8" />
                              <line x1="155" y1="40" x2="155" y2="52" stroke="#3D2E1E" strokeWidth="1.8" />
                              <rect x="20" y="52" width="50" height="20" rx="3" fill="#FFFDF9" stroke="#3D2E1E" strokeWidth="1.6" />
                              <text x="45" y="66" textAnchor="middle" fontSize="9" fill="#3D2E1E">Circle</text>
                              <rect x="75" y="52" width="50" height="20" rx="3" fill="#FFFDF9" stroke="#3D2E1E" strokeWidth="1.6" />
                              <text x="100" y="66" textAnchor="middle" fontSize="9" fill="#3D2E1E">Rectangle</text>
                              <rect x="130" y="52" width="50" height="20" rx="3" fill="#FFFDF9" stroke="#3D2E1E" strokeWidth="1.6" />
                              <text x="155" y="66" textAnchor="middle" fontSize="9" fill="#3D2E1E">Polygon</text>
                            </svg>
                          )}

                          {currentSpread.leftPage.diagramType === "collections" && (
                            <svg viewBox="0 0 200 86" className="w-44 sm:w-52 h-auto">
                              <rect x="62" y="4" width="76" height="20" rx="4" fill="#FFFDF9" stroke="#3D2E1E" strokeWidth="1.8" />
                              <text x="100" y="17" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#3D2E1E">Collection &lt;E&gt;</text>
                              <line x1="100" y1="24" x2="100" y2="40" stroke="#3D2E1E" strokeWidth="1.8" />
                              <line x1="38" y1="40" x2="162" y2="40" stroke="#3D2E1E" strokeWidth="1.8" />
                              <line x1="38" y1="40" x2="38" y2="52" stroke="#3D2E1E" strokeWidth="1.8" />
                              <line x1="100" y1="40" x2="100" y2="52" stroke="#3D2E1E" strokeWidth="1.8" />
                              <line x1="162" y1="40" x2="162" y2="52" stroke="#3D2E1E" strokeWidth="1.8" />
                              <rect x="14" y="52" width="48" height="22" rx="3" fill="#FFFDF9" stroke="#3D2E1E" strokeWidth="1.6" />
                              <text x="38" y="66" textAnchor="middle" fontSize="9" fill="#3D2E1E">List</text>
                              <rect x="76" y="52" width="48" height="22" rx="3" fill="#FFFDF9" stroke="#3D2E1E" strokeWidth="1.6" />
                              <text x="100" y="66" textAnchor="middle" fontSize="9" fill="#3D2E1E">Set</text>
                              <rect x="138" y="52" width="48" height="22" rx="3" fill="#FFFDF9" stroke="#3D2E1E" strokeWidth="1.6" />
                              <text x="162" y="66" textAnchor="middle" fontSize="9" fill="#3D2E1E">Map</text>
                            </svg>
                          )}

                          {currentSpread.leftPage.diagramType === "erd" && (
                            <svg viewBox="0 0 200 86" className="w-44 sm:w-52 h-auto">
                              <rect x="15" y="10" width="55" height="34" rx="4" fill="#FFFDF9" stroke="#3D2E1E" strokeWidth="1.8" />
                              <line x1="15" y1="22" x2="70" y2="22" stroke="#3D2E1E" strokeWidth="1.2" />
                              <text x="42" y="19" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#3D2E1E">USERS</text>
                              <line x1="70" y1="27" x2="125" y2="27" stroke="#3D2E1E" strokeWidth="1.8" strokeDasharray="3 2" />
                              <text x="97" y="24" textAnchor="middle" fontSize="8" fill="#3D2E1E">1 : N</text>
                              <rect x="125" y="10" width="60" height="34" rx="4" fill="#FFFDF9" stroke="#3D2E1E" strokeWidth="1.8" />
                              <line x1="125" y1="22" x2="185" y2="22" stroke="#3D2E1E" strokeWidth="1.2" />
                              <text x="155" y="19" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#3D2E1E">ORDERS</text>
                              <rect x="70" y="52" width="60" height="24" rx="4" fill="#FFFDF9" stroke="#3D2E1E" strokeWidth="1.6" />
                              <text x="100" y="68" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#3D2E1E">ITEMS</text>
                              <line x1="155" y1="44" x2="155" y2="64" stroke="#3D2E1E" strokeWidth="1.4" />
                              <line x1="155" y1="64" x2="130" y2="64" stroke="#3D2E1E" strokeWidth="1.4" />
                            </svg>
                          )}

                          {currentSpread.leftPage.diagramType === "joins" && (
                            <svg viewBox="0 0 200 86" className="w-44 sm:w-52 h-auto">
                              <circle cx="75" cy="43" r="30" fill="#FAF6EE" stroke="#3D2E1E" strokeWidth="1.8" />
                              <circle cx="125" cy="43" r="30" fill="#FAF6EE" stroke="#3D2E1E" strokeWidth="1.8" />
                              <path d="M 100,20 A 30,30 0 0,1 100,66 A 30,30 0 0,1 100,20 Z" fill="#E8DEC8" stroke="#3D2E1E" strokeWidth="1.8" />
                              <text x="56" y="46" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#3D2E1E">Table A</text>
                              <text x="144" y="46" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#3D2E1E">Table B</text>
                              <text x="100" y="46" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#8D5B18">INNER</text>
                            </svg>
                          )}

                          {currentSpread.leftPage.diagramType === "api" && (
                            <svg viewBox="0 0 200 86" className="w-44 sm:w-52 h-auto">
                              <rect x="10" y="26" width="42" height="26" rx="4" fill="#FFFDF9" stroke="#3D2E1E" strokeWidth="1.8" />
                              <text x="31" y="42" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#3D2E1E">Client</text>
                              <line x1="52" y1="39" x2="80" y2="39" stroke="#3D2E1E" strokeWidth="1.8" />
                              <rect x="80" y="18" width="48" height="42" rx="4" fill="#FFFDF9" stroke="#3D2E1E" strokeWidth="1.8" />
                              <text x="104" y="36" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#3D2E1E">GATEWAY</text>
                              <text x="104" y="47" textAnchor="middle" fontSize="7" fill="#705642">Auth &amp; SSL</text>
                              <line x1="128" y1="30" x2="148" y2="18" stroke="#3D2E1E" strokeWidth="1.6" />
                              <line x1="128" y1="48" x2="148" y2="60" stroke="#3D2E1E" strokeWidth="1.6" />
                              <rect x="148" y="8" width="44" height="22" rx="3" fill="#FFFDF9" stroke="#3D2E1E" strokeWidth="1.6" />
                              <text x="170" y="22" textAnchor="middle" fontSize="8" fill="#3D2E1E">Auth API</text>
                              <rect x="148" y="50" width="44" height="22" rx="3" fill="#FFFDF9" stroke="#3D2E1E" strokeWidth="1.6" />
                              <text x="170" y="64" textAnchor="middle" fontSize="8" fill="#3D2E1E">Data API</text>
                            </svg>
                          )}

                          {currentSpread.leftPage.diagramType === "eventbus" && (
                            <svg viewBox="0 0 200 86" className="w-44 sm:w-52 h-auto">
                              <rect x="10" y="26" width="38" height="26" rx="4" fill="#FFFDF9" stroke="#3D2E1E" strokeWidth="1.8" />
                              <text x="29" y="42" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#3D2E1E">Client</text>
                              <line x1="48" y1="39" x2="68" y2="39" stroke="#3D2E1E" strokeWidth="1.8" />
                              <rect x="68" y="16" width="55" height="46" rx="4" fill="#FFFDF9" stroke="#3D2E1E" strokeWidth="1.8" />
                              <text x="95" y="34" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1E5E4B">EVENT BUS</text>
                              <text x="95" y="46" textAnchor="middle" fontSize="7" fill="#705642">Kafka / PubSub</text>
                              <line x1="123" y1="28" x2="145" y2="16" stroke="#3D2E1E" strokeWidth="1.6" />
                              <line x1="123" y1="50" x2="145" y2="62" stroke="#3D2E1E" strokeWidth="1.6" />
                              <rect x="145" y="6" width="46" height="22" rx="3" fill="#FFFDF9" stroke="#3D2E1E" strokeWidth="1.6" />
                              <text x="168" y="20" textAnchor="middle" fontSize="8" fill="#3D2E1E">Worker 1</text>
                              <rect x="145" y="52" width="46" height="22" rx="3" fill="#FFFDF9" stroke="#3D2E1E" strokeWidth="1.6" />
                              <text x="168" y="66" textAnchor="middle" fontSize="8" fill="#3D2E1E">Worker 2</text>
                            </svg>
                          )}
                        </div>

                        {/* Điểm nhấn khái niệm trang trái */}
                        <div className="space-y-1.5 mt-2">
                          {currentSpread.leftPage.points.map((pt, idx) => (
                            <div key={idx} className="flex items-start gap-1.5">
                              <span className="text-[#A58667] text-[10px] mt-0.5">✦</span>
                              <p className="text-[11px] sm:text-[11.5px] text-[#423122] font-serif leading-snug">
                                <strong className="text-[#2C1A0C] font-semibold">{pt.label}: </strong>
                                {pt.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Chân trang trái */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-[#D8C5AF]/40">
                        <button
                          type="button"
                          onClick={handlePrevPage}
                          disabled={currentSpreadIndex === 0}
                          className={`inline-flex items-center gap-0.5 text-xs font-serif italic ${
                            currentSpreadIndex === 0
                              ? "opacity-30 cursor-not-allowed text-[#9C8775]"
                              : "text-[#7C5335] hover:text-[#4A2E1A] cursor-pointer"
                          } font-semibold transition-colors`}
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Previous page</span>
                        </button>
                        <span className="text-xs font-serif text-[#9C8775] tracking-widest">
                          — Page {currentSpread.leftPage.pageNumber} of 4 —
                        </span>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* ============================================================== */}
              {/* TRANG PHẢI 3D (RIGHT PAGE) - Trục xoay: left center           */}
              {/* Gập sách: rotateY(-90deg), Mở sách: rotateY(0deg)              */}
              {/* ============================================================== */}
              <motion.div
                variants={{
                  initial: { rotateY: -90, opacity: 0 },
                  animate: {
                    rotateY: 0,
                    opacity: 1,
                    transition: {
                      delay: 0.3, // Giai đoạn 2: Bắt đầu mở sách khi thanh dọc chạm tâm (0.3s)
                      duration: 0.35,
                      ease: [0.25, 1, 0.5, 1],
                    },
                  },
                  exit: {
                    rotateY: -90, // Khi đóng: RightPage xoay -90deg úp vào gáy
                    opacity: 0,
                    transition: {
                      delay: 0.15, // Chờ chữ mờ đi trước (0.15s)
                      duration: 0.35,
                      ease: [0.4, 0, 0.2, 1],
                    },
                  },
                }}
                style={{
                  transformOrigin: "left center",
                  transformStyle: "preserve-3d",
                }}
                className="absolute top-0 bottom-0 left-1/2 w-1/2 z-20"
              >
                {/* Viền Bìa Nửa Phải */}
                <div
                  className="w-full h-full rounded-r-[18px] p-2 sm:p-2.5 pl-0 border-r border-t border-b border-black/15 shadow-[8px_20px_35px_rgba(58,42,26,0.18)] overflow-hidden relative"
                  style={{ backgroundColor: activeVolume.coverColor }}
                >
                  {/* Subtle Close button in top-right corner */}
                  <button
                    type="button"
                    onClick={() => setActiveVolumeId(null)}
                    aria-label="Close book to shelf"
                    className="absolute top-3 right-3 z-40 p-1 text-[#8C6B4F] hover:text-[#3D2513] hover:bg-black/5 rounded-full transition-colors cursor-pointer"
                    title="Close book to shelf"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {/* Mặt Giấy Nửa Phải */}
                  <div
                    className="w-full h-full rounded-r-[12px] bg-[#FDFBF7] text-[#2C1A0C] overflow-hidden relative"
                    style={{
                      boxShadow:
                        "inset 8px 0 16px rgba(0,0,0,0.06), inset 0 2px 4px rgba(255,255,255,0.6)",
                    }}
                  >
                    {/* Bóng đổ 3D gập sách */}
                    <motion.div
                      variants={{
                        initial: { opacity: 0.5 },
                        animate: {
                          opacity: 0,
                          transition: { delay: 0.32, duration: 0.35 },
                        },
                        exit: {
                          opacity: 0.5,
                          transition: { delay: 0.15, duration: 0.35 },
                        },
                      }}
                      className="absolute inset-0 bg-gradient-to-l from-transparent to-black/25 pointer-events-none z-30"
                    />

                    {/* GIAI ĐOẠN 3: Nội dung Text & Tóm tắt Trang Phải */}
                    <motion.div
                      variants={{
                        initial: { opacity: 0, y: 8 },
                        animate: {
                          opacity: 1,
                          y: 0,
                          transition: {
                            delay: 0.65, // 0.3s + 0.35s = 0.65s
                            duration: 0.2,
                            ease: "easeOut",
                          },
                        },
                        exit: {
                          opacity: 0,
                          y: 4,
                          transition: { duration: 0.15, ease: "easeIn" },
                        },
                      }}
                      className="w-full h-full flex flex-col justify-between p-4 sm:p-5 sm:pl-6 bg-gradient-to-r from-[#F7F2E7] via-[#FCFAF4] to-[#FDFBF7]"
                    >
                      <div>
                        {/* Tiêu đề Trang Phải */}
                        <h3
                          className="font-serif text-xl sm:text-2xl font-bold text-[#2C1A0C] tracking-tight leading-tight mb-2.5"
                          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                        >
                          {currentSpread.rightPage.title}
                        </h3>

                        {/* Gạch đầu dòng tóm tắt trang phải */}
                        <div className="space-y-1.5 mt-2">
                          {currentSpread.rightPage.summaryLines.map((line, idx) => (
                            <div key={idx} className="flex items-start gap-1.5">
                              <span className="text-[#A58667] text-[10px] mt-0.5">✦</span>
                              <p className="text-[11px] sm:text-[11.5px] text-[#423122] font-serif leading-snug">
                                {line}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Hộp ghi chú nguyên tắc cốt lõi */}
                        {currentSpread.rightPage.conceptNote && (
                          <div className="mt-2.5 p-2 bg-[#F4EDE2]/85 rounded-[6px] border border-[#E0D3C1]">
                            <span className="text-[9px] sm:text-[9.5px] font-bold uppercase tracking-wider text-[#7C5335] block mb-0.5">
                              📌 {currentSpread.rightPage.conceptNote.title}
                            </span>
                            <p className="text-[10.5px] sm:text-[11px] text-[#3D2E1E] font-serif italic leading-relaxed">
                              &ldquo;{currentSpread.rightPage.conceptNote.text}&rdquo;
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Chân trang phải */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-[#D8C5AF]/40">
                        <span className="text-xs font-serif text-[#9C8775] tracking-widest ml-auto sm:ml-0">
                          — Page {currentSpread.rightPage.pageNumber} of 4 —
                        </span>
                        <button
                          type="button"
                          onClick={handleNextPage}
                          disabled={!activeVolume || currentSpreadIndex >= activeVolume.spreads.length - 1}
                          className={`inline-flex items-center gap-0.5 text-xs font-serif italic ${
                            !activeVolume || currentSpreadIndex >= activeVolume.spreads.length - 1
                              ? "opacity-30 cursor-not-allowed text-[#9C8775]"
                              : "text-[#7C5335] hover:text-[#4A2E1A] cursor-pointer"
                          } font-semibold transition-colors`}
                        >
                          <span>Next page</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ============================================================== */}
      {/* 7. KỆ SÁCH MINI (BOTTOM 5 SUBJECT VOLUMES)                      */}
      {/* Gồm 5 cuốn sách: Python, Java, C/C++, SQL, REST API            */}
      {/* ============================================================== */}
      <nav
        aria-label="Select subject volume"
        className="absolute bottom-[3%] left-1/2 -translate-x-1/2 flex gap-2.5 sm:gap-3.5 z-30"
      >
        {BOOK_VOLUMES.map((vol) => {
          const isActive = activeVolumeId === vol.id;

          return (
            <motion.div
              key={vol.id}
              onClick={() => handleSelectVolume(vol.id)}
              whileHover={{ y: -8 }}
              whileTap={{ scale: 0.96 }}
              className={`relative w-[54px] sm:w-[62px] h-[78px] sm:h-[86px] rounded-sm ${vol.spineColor} border border-white/20 shadow-[0_8px_16px_rgba(58,42,26,0.22)] cursor-pointer overflow-hidden flex flex-col justify-between p-1.5 transition-all duration-300 ${
                isActive
                  ? "ring-2 ring-[#3A2A1A] -translate-y-2 shadow-[0_12px_22px_rgba(58,42,26,0.32)]"
                  : "opacity-90 hover:opacity-100"
              }`}
            >
              {/* Dải vân dập nổi gáy sách 3D */}
              <div className="absolute top-0 bottom-0 left-1 w-0.5 bg-black/25 pointer-events-none" />
              <div className="absolute top-1 inset-x-1.5 h-[1px] bg-white/25 pointer-events-none" />
              <div className="absolute bottom-1 inset-x-1.5 h-[1px] bg-white/25 pointer-events-none" />

              {/* Tên tập & số La Mã */}
              <div className="flex items-center justify-between text-[7.5px] sm:text-[8px] font-serif font-bold text-white/90">
                <span>{vol.romanNum}</span>
                <BookOpen className="w-2.5 h-2.5 text-white/70" />
              </div>

              {/* Tên môn học */}
              <div className="text-center my-auto px-0.5">
                <span className={`text-[9.5px] sm:text-[10px] font-serif font-extrabold tracking-wider leading-tight block ${vol.textColor} drop-shadow-xs`}>
                  {vol.tag}
                </span>
              </div>

              {/* Chỉ báo đang mở */}
              <div className="text-center">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    isActive ? "bg-amber-300 shadow-[0_0_6px_#fde047]" : "bg-white/30"
                  }`}
                />
              </div>
            </motion.div>
          );
        })}
      </nav>
    </div>
  );
}

export default InteractiveBookshelf;
