export interface BookPage {
  pageNumber: number;
  chapterTitle: string;
  summary: string;
  codeSnippet?: string;
  keyPoints: string[];
  proTip: string;
}

export interface ProgrammingBook {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  author: string;
  colorName: string;
  spineGradient: string;
  coverGradient: string;
  accentColor: string;
  tagColor: string;
  edition: string;
  pages: BookPage[];
}

export const PROGRAMMING_BOOKS: ProgrammingBook[] = [
  {
    id: "python",
    title: "Python 3 & AI Architecture",
    subtitle: "From Language Core to LLM Agent Engineering",
    tag: "Python",
    author: "Guido van Rossum & Community",
    colorName: "Emerald & Gold",
    spineGradient: "from-sky-600 via-blue-700 to-indigo-900",
    coverGradient: "from-sky-800 via-blue-900 to-slate-950",
    accentColor: "text-amber-400",
    tagColor: "bg-amber-400/20 text-amber-300 border-amber-400/40",
    edition: "Python 3.12+ Standard",
    pages: [
      {
        pageNumber: 1,
        chapterTitle: "Chapter 1: Idiomatic Syntax & Pattern Matching",
        summary:
          "Python emphasizes readability and clarity (The Zen of Python). Modern Python 3.12 introduces structural pattern matching, strict type hinting, and compiler optimizations for rapid AI prototyping.",
        codeSnippet: `# Modern Python Type Hints & Pattern Matching
from dataclasses import dataclass

@dataclass
class Query:
    prompt: str
    tokens: int = 128

def handle_query(q: Query) -> str:
    match q:
        case Query(prompt="", _):
            return "Empty prompt rejected"
        case Query(p, t) if t > 2048:
            return f"Processing large batch: {len(p)} chars"
        case _:
            return f"Dispatching response: {q.prompt}"`,
        keyPoints: [
          "List comprehensions & generator expressions minimize RAM usage.",
          "Type annotations enable static analyzers (mypy/pyright) to catch defects before runtime.",
          "Massive AI ecosystem: PyTorch, LangChain, NumPy, and FastAPI.",
        ],
        proTip:
          "💡 Senior Pro Tip: Never use mutable objects (like [] or {}) as default parameter values in functions.",
      },
      {
        pageNumber: 2,
        chapterTitle: "Chapter 2: Concurrency & AsyncIO Architecture",
        summary:
          "When engineering high-throughput AI agents or web APIs handling thousands of concurrent queries, AsyncIO and context managers maximize system I/O throughput without blocking.",
        codeSnippet: `import asyncio
import httpx

async def fetch_syllabus(course_id: str) -> dict:
    async with httpx.AsyncClient(timeout=5.0) as client:
        res = await client.get(f"https://api.edu/course/{course_id}")
        return res.json()

# Execute multiple I/O bound tasks concurrently
async def main():
    courses = ["cs101", "cs201", "ai301"]
    results = await asyncio.gather(*(fetch_syllabus(c) for c in courses))
    print(f"Loaded {len(results)} course syllabi concurrently.")`,
        keyPoints: [
          "Async/await yields the Event Loop during network and database I/O waits.",
          "Use modern tooling like 'uv' or 'poetry' for deterministic virtual environments.",
          "Context managers ('with' statement) guarantee reliable socket and file cleanup.",
        ],
        proTip:
          "💡 Senior Pro Tip: Profile execution bottlenecks with cProfile or py-spy before premature optimization.",
      },
    ],
  },
  {
    id: "java",
    title: "Modern Java & Enterprise Architecture",
    subtitle: "High-Performance Systems & Clean Domain Modeling",
    tag: "Java",
    author: "James Gosling & OpenJDK",
    colorName: "Crimson & Amber",
    spineGradient: "from-rose-600 via-red-700 to-amber-900",
    coverGradient: "from-rose-800 via-red-900 to-slate-950",
    accentColor: "text-rose-400",
    tagColor: "bg-rose-400/20 text-rose-300 border-rose-400/40",
    edition: "Java 21 LTS Standard",
    pages: [
      {
        pageNumber: 1,
        chapterTitle: "Chapter 1: Records & Modern Object Orientation",
        summary:
          "Modern Java eliminates enterprise boilerplate using Records, Pattern Matching, and Sealed Types, providing crystal-clear data carriers and robust domain modeling.",
        codeSnippet: `// Java 21 Immutable Record Data Carrier
public record StudentRecord(String id, String email, double gpa) {
    public StudentRecord {
        if (gpa < 0.0 || gpa > 4.0) {
            throw new IllegalArgumentException("Invalid GPA range");
        }
    }
    
    public boolean isHonorRoll() {
        return this.gpa >= 3.6;
    }
}`,
        keyPoints: [
          "Records automatically generate equals, hashCode, toString, and canonical constructors.",
          "Sealed interfaces restrict inheritance, preventing illegal domain model extensions.",
          "Strong encapsulation: Guard internal states with defensive copies.",
        ],
        proTip:
          "💡 Senior Pro Tip: Always prioritize Records for DTOs and Value Objects over mutable JavaBeans.",
      },
      {
        pageNumber: 2,
        chapterTitle: "Chapter 2: Streams API & Virtual Threads",
        summary:
          "Transform data declaratively with Streams and achieve massive scalability with lightweight Virtual Threads (Project Loom) without operating system thread starvation.",
        codeSnippet: `// Declarative data filtering with Java Streams
List<String> topStudents = students.stream()
    .filter(s -> s.gpa() >= 3.5)
    .sorted(Comparator.comparingDouble(StudentRecord::gpa).reversed())
    .map(StudentRecord::email)
    .toList();

// Spawn 10,000 lightweight Virtual Threads effortlessly
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 10_000).forEach(i -> {
        executor.submit(() -> processCourseQuery(i));
    });
}`,
        keyPoints: [
          "Streams API fosters declarative, readable pipelines that are easy to test.",
          "Virtual Threads resolve thread pool starvation in high-concurrency Spring Boot services.",
          "Use Optional strictly for method return values to signal optional presence, never as class fields.",
        ],
        proTip:
          "💡 Senior Pro Tip: Favor composition over deep class inheritance to keep systems loosely coupled.",
      },
    ],
  },
  {
    id: "c",
    title: "C & Systems Programming",
    subtitle: "Hardware Architecture, Pointers & Memory Control",
    tag: "C / C++",
    author: "Dennis Ritchie & Ken Thompson",
    colorName: "Sapphire & Silver",
    spineGradient: "from-blue-700 via-indigo-800 to-slate-900",
    coverGradient: "from-blue-800 via-slate-900 to-slate-950",
    accentColor: "text-cyan-400",
    tagColor: "bg-cyan-400/20 text-cyan-300 border-cyan-400/40",
    edition: "C23 / Modern C++20",
    pages: [
      {
        pageNumber: 1,
        chapterTitle: "Chapter 1: Memory Layout & Pointer Mechanics",
        summary:
          "C grants direct, uncompromised control over system hardware. Understanding the Stack, the Heap, and memory layout distinguishes true systems engineers from ordinary coders.",
        codeSnippet: `#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int id;
    float score;
} Student;

int main(void) {
    // Dynamic Heap Allocation
    Student *s = (Student*)malloc(sizeof(Student));
    if (!s) return 1; // Memory safety verification
    
    s->id = 101;
    s->score = 9.5f;
    printf("Student #%d scored %.1f\\n", s->id, s->score);
    
    free(s);   // Release allocated memory immediately
    s = NULL;  // Prevent dangerous dangling pointer
    return 0;
}`,
        keyPoints: [
          "Stack allocation is blazing fast and scoped, but strictly bounded in size.",
          "Heap allocation supports dynamic lifetimes but requires meticulous manual cleanup.",
          "Pointer arithmetic is essential for high-throughput buffer indexing and OS drivers.",
        ],
        proTip:
          "💡 Senior Pro Tip: Every malloc() or calloc() must always have an exact corresponding free().",
      },
      {
        pageNumber: 2,
        chapterTitle: "Chapter 2: CPU Cache Locality & Hardware Prefetch",
        summary:
          "Raw speed in low-level programming comes from CPU cache friendliness (L1/L2/L3). Contiguous memory layout enables CPU hardware prefetchers to operate at peak bandwidth.",
        codeSnippet: `// Row-major traversal maximizes 64-byte CPU cache line hits
#define ROWS 1024
#define COLS 1024
int matrix[ROWS][COLS];

long long sum = 0;
// OPTIMIZED: Sequential contiguous memory access
for (int i = 0; i < ROWS; i++) {
    for (int j = 0; j < COLS; j++) {
        sum += matrix[i][j];
    }
}`,
        keyPoints: [
          "Column-major strides induce frequent CPU cache misses, degrading speed by 10x–20x.",
          "Use AddressSanitizer (-fsanitize=address) and Valgrind to uncover memory leaks early.",
          "RAII in modern C++ ensures resources are freed automatically when exiting scope.",
        ],
        proTip:
          "💡 Senior Pro Tip: Always compile code with strict warnings: '-Wall -Wextra -Werror'.",
      },
    ],
  },
  {
    id: "sql",
    title: "SQL & Relational Data Mastery",
    subtitle: "Schema Design, Indexing & Analytical Queries",
    tag: "SQL",
    author: "Edgar F. Codd & ISO Standards",
    colorName: "Violet & Magenta",
    spineGradient: "from-purple-600 via-indigo-700 to-blue-900",
    coverGradient: "from-purple-800 via-indigo-900 to-slate-950",
    accentColor: "text-purple-400",
    tagColor: "bg-purple-400/20 text-purple-300 border-purple-400/40",
    edition: "PostgreSQL 16 & ANSI SQL:2023",
    pages: [
      {
        pageNumber: 1,
        chapterTitle: "Chapter 1: Indexing & Query Execution Plans",
        summary:
          "Relational databases are the bedrock of enterprise persistence. Proper schema normalization and index optimization guarantee sub-millisecond query responses under high load.",
        codeSnippet: `-- B-Tree Index on foreign keys and search predicates
CREATE INDEX idx_enrollments_student_active
ON enrollments (student_id, course_id)
WHERE status = 'ACTIVE';

-- Inspect execution plan with EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT c.title, AVG(e.grade) AS avg_grade
FROM courses c
JOIN enrollments e ON c.id = e.course_id
WHERE e.status = 'ACTIVE'
GROUP BY c.id, c.title
HAVING AVG(e.grade) >= 3.0;`,
        keyPoints: [
          "B-Tree indexes speed up equality and range lookups (BETWEEN, <, >).",
          "Avoid SELECT * in production; project only needed columns to conserve I/O bandwidth.",
          "Foreign keys with ON DELETE CASCADE protect relational referential integrity.",
        ],
        proTip:
          "💡 Senior Pro Tip: Always run EXPLAIN ANALYZE before and after adding indexes to verify planner cost.",
      },
      {
        pageNumber: 2,
        chapterTitle: "Chapter 2: CTEs & Analytical Window Functions",
        summary:
          "Common Table Expressions (CTEs) and Window Functions unlock sophisticated analytical reporting without costly self-joins or temporary scratch tables.",
        codeSnippet: `-- Rank top 3 students per department with Window Functions
WITH RankedStudents AS (
    SELECT 
        id, name, department_id, gpa,
        DENSE_RANK() OVER (
            PARTITION BY department_id 
            ORDER BY gpa DESC
        ) AS rank_in_dept
    FROM students
)
SELECT * FROM RankedStudents 
WHERE rank_in_dept <= 3;`,
        keyPoints: [
          "Window functions perform partition aggregations without collapsing underlying rows.",
          "CTEs (WITH clause) dramatically improve complex query readability and maintainability.",
          "Understand database isolation levels (Read Committed vs Serializable) to avoid race conditions.",
        ],
        proTip:
          "💡 Senior Pro Tip: Use Partial Indexes on filtered subsets (e.g. WHERE is_active = true) to save index storage.",
      },
    ],
  },
  {
    id: "api",
    title: "REST API & Distributed Systems",
    subtitle: "HTTP Specifications, Idempotency & Scalability",
    tag: "REST API",
    author: "Roy Fielding & OpenAPI WG",
    colorName: "Teal & Emerald",
    spineGradient: "from-emerald-600 via-teal-700 to-cyan-900",
    coverGradient: "from-emerald-800 via-teal-900 to-slate-950",
    accentColor: "text-teal-400",
    tagColor: "bg-teal-400/20 text-teal-300 border-teal-400/40",
    edition: "OpenAPI 3.1 & HTTP/3 Spec",
    pages: [
      {
        pageNumber: 1,
        chapterTitle: "Chapter 1: Idempotency & Resourceful URI Design",
        summary:
          "Clean REST APIs are intuitive, predictable, and resilient. Designing idempotent endpoints prevents duplicate transactions and guarantees safety on network retries.",
        codeSnippet: `POST /api/v1/courses/cs101/enrollments HTTP/1.1
Host: api.academic.edu
Idempotency-Key: 7b848e1d-859a-4c92-9443-4dc91b92e703
Content-Type: application/json

{
  "student_id": "SE170123",
  "semester": "Fall2026"
}`,
        keyPoints: [
          "Use standard HTTP verbs: GET (Read), POST (Create), PUT/PATCH (Update), DELETE (Remove).",
          "Idempotency Keys prevent duplicate charges or duplicate enrollments upon network retries.",
          "Return standard status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found.",
        ],
        proTip:
          "💡 Senior Pro Tip: Keep API URIs noun-centric and plural (e.g., /api/courses, never /api/getCourseList).",
      },
      {
        pageNumber: 2,
        chapterTitle: "Chapter 2: Rate Limiting & Resilient Microservices",
        summary:
          "Production APIs must defend against traffic spikes and cascading failures through token-bucket rate limiting and standard problem details reporting.",
        codeSnippet: `// Standard RFC 7807 Problem Details Response
HTTP/1.1 429 Too Many Requests
Retry-After: 60
Content-Type: application/problem+json

{
  "type": "https://api.academic.edu/errors/rate-limit-exceeded",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "Limit of 100 requests per minute exceeded. Try again in 60s.",
  "instance": "/api/v1/courses/cs101/enrollments"
}`,
        keyPoints: [
          "Implement rate limiting headers (X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After).",
          "Use RFC 7807 Problem Details for standardized, actionable API error responses.",
          "Leverage ETags and HTTP caching headers (Cache-Control: public, max-age=3600) to offload servers.",
        ],
        proTip:
          "💡 Senior Pro Tip: Never expose internal database stack traces in production API 500 error responses.",
      },
    ],
  },
];
