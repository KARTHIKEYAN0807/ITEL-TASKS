# Async Systems in AI Applications

## Study Notes & Documentation

**Reference:** [AWS SQS Developer Guide](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html)

---

## Table of Contents

1. [Why Async Systems Are Needed in AI Apps](#1-why-async-systems-are-needed-in-ai-apps)
2. [Producer–Consumer Architecture](#2-producerconsumer-architecture)
3. [Worker Services](#3-worker-services)
4. [Retry Strategies](#4-retry-strategies)
5. [Dead Letter Queues](#5-dead-letter-queues)
6. [Job Orchestration](#6-job-orchestration)
7. [Rate Limiting](#7-rate-limiting)
8. [AWS SQS – Practical Examples](#8-aws-sqs--practical-examples)

---

## 1. Why Async Systems Are Needed in AI Apps

### The Problem with Synchronous Processing

AI applications involve computationally expensive operations such as:

- **Model inference** — Running a large language model (LLM) can take seconds to minutes per request.
- **Embedding generation** — Converting documents/images to vector embeddings is CPU/GPU intensive.
- **Data preprocessing** — Cleaning, chunking, and transforming data before AI processing.
- **Report generation** — Compiling AI-driven analysis into reports is time-consuming.

In a **synchronous** (blocking) system, the user sends a request and waits for the response. If the AI task takes 30 seconds, the user (and all server resources) are blocked for 30 seconds.

```
❌ Synchronous Flow (Blocking)
┌──────┐         ┌──────────┐
│ User │──req──▶ │  Server  │──(30s AI work)──▶ response
│      │◀─wait─  │          │
└──────┘         └──────────┘
   ⚠️ User blocked for 30s
   ⚠️ Server thread occupied for 30s
   ⚠️ If 100 users hit at once → server overload
```

### The Async Solution

With an **asynchronous** (non-blocking) system, the server accepts the request, puts it on a **queue**, and immediately responds with "your job is being processed." A separate **worker** picks up the job and processes it in the background.

```
✅ Asynchronous Flow (Non-Blocking)
┌──────┐         ┌──────────┐       ┌───────┐       ┌────────┐
│ User │──req──▶ │  Server  │──▶    │ Queue │──▶    │ Worker │
│      │◀─ack──  │          │       │(SQS)  │       │        │
└──────┘         └──────────┘       └───────┘       └────────┘
   ✅ User gets immediate response ("Job accepted")
   ✅ Server is free to handle more requests
   ✅ Worker processes at its own pace
   ✅ Can scale workers independently
```

### Key Reasons for Async in AI

| Reason | Explanation |
|--------|-------------|
| **Long-running tasks** | AI inference, training, and data processing take significant time |
| **Scalability** | Decouple request acceptance from processing — scale workers independently |
| **Reliability** | If a worker crashes, the message stays in the queue for retry |
| **Cost efficiency** | Use GPU workers only when needed, not idle waiting for requests |
| **User experience** | Users get instant feedback instead of waiting for long operations |
| **Rate limit management** | Control how fast you call external AI APIs (OpenAI, etc.) |

### Real-World AI Use Cases

- **Chatbot with document processing**: User uploads a PDF → async pipeline chunks it, generates embeddings, stores in vector DB
- **AI report generation**: User requests analysis → job queued → worker generates report → user notified
- **Batch inference**: Process thousands of images through an ML model without blocking the web server
- **Fine-tuning pipelines**: Queue training jobs that run for hours on GPU instances

---

## 2. Producer–Consumer Architecture

### What Is It?

The **Producer–Consumer** pattern is the foundational architecture behind async systems. It separates the component that **creates** work (producer) from the component that **processes** work (consumer) using a **queue** as a buffer between them.

```
┌───────────┐     ┌─────────────────────┐     ┌───────────┐
│ PRODUCER  │     │        QUEUE        │     │ CONSUMER  │
│           │     │                     │     │           │
│ Creates   │────▶│  Message A          │────▶│ Processes │
│ messages  │     │  Message B          │     │ messages  │
│ (tasks)   │     │  Message C          │     │ (tasks)   │
│           │     │  Message D          │     │           │
└───────────┘     └─────────────────────┘     └───────────┘
    (Web App)          (Amazon SQS)            (Worker)
```

### How It Works (from AWS SQS docs)

According to the [AWS SQS documentation](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html):

> *"There are three main parts in a distributed messaging system: the components of your distributed system, your queue (distributed on Amazon SQS servers), and the messages in the queue."*

> *"Your system has several producers (components that send messages to the queue) and consumers (components that receive messages from the queue). The queue (which holds messages A through E) redundantly stores the messages across multiple Amazon SQS servers."*

### Producer–Consumer in AI Apps: Example

**Scenario:** An AI-powered interview platform that generates candidate reports.

```python
# === PRODUCER (Web Server / API) ===

import boto3
import json

sqs = boto3.client('sqs', region_name='us-east-1')
QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123456789/ai-reports-queue'

def handle_interview_complete(interview_id, candidate_id):
    """Called when an interview finishes — sends a job to the queue."""
    
    message = {
        'task': 'generate_report',
        'interview_id': interview_id,
        'candidate_id': candidate_id,
        'timestamp': '2026-03-19T10:00:00Z'
    }
    
    response = sqs.send_message(
        QueueUrl=QUEUE_URL,
        MessageBody=json.dumps(message),
        MessageAttributes={
            'TaskType': {
                'DataType': 'String',
                'StringValue': 'report_generation'
            }
        }
    )
    
    print(f"Job queued! MessageId: {response['MessageId']}")
    # The web server is now free to handle other requests
    return {"status": "Report generation started", "job_id": response['MessageId']}
```

```python
# === CONSUMER (Worker Service) ===

import boto3
import json
import time

sqs = boto3.client('sqs', region_name='us-east-1')
QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123456789/ai-reports-queue'

def process_report(message_body):
    """Process a single report generation job."""
    data = json.loads(message_body)
    interview_id = data['interview_id']
    
    # Step 1: Fetch interview transcript
    transcript = fetch_transcript(interview_id)
    
    # Step 2: Run AI analysis (this takes time!)
    analysis = run_llm_analysis(transcript)
    
    # Step 3: Generate PDF report
    report_url = generate_pdf(analysis)
    
    # Step 4: Notify the user
    notify_user(data['candidate_id'], report_url)
    
    return report_url

def poll_queue():
    """Continuously poll the queue for new messages."""
    while True:
        response = sqs.receive_message(
            QueueUrl=QUEUE_URL,
            MaxNumberOfMessages=1,
            WaitTimeSeconds=20  # Long polling — waits up to 20s for a message
        )
        
        if 'Messages' in response:
            for message in response['Messages']:
                try:
                    process_report(message['Body'])
                    
                    # Delete the message after successful processing
                    sqs.delete_message(
                        QueueUrl=QUEUE_URL,
                        ReceiptHandle=message['ReceiptHandle']
                    )
                    print("Job completed and message deleted!")
                    
                except Exception as e:
                    print(f"Error processing message: {e}")
                    # Message becomes visible again after visibility timeout
        
        time.sleep(1)  # Brief pause before next poll

if __name__ == '__main__':
    poll_queue()
```

### Message Lifecycle (from AWS SQS Docs)

The AWS SQS documentation describes the message lifecycle:

> 1. *"A producer (Component 1) sends message A to a queue, and the message is distributed across the Amazon SQS servers redundantly."*
> 2. *"When a consumer (Component 2) is ready to process messages, it consumes messages from the queue, and message A is returned. While message A is being processed, it remains in the queue and isn't returned to subsequent receive requests for the duration of the **visibility timeout**."*
> 3. *"The consumer (Component 2) deletes message A from the queue to prevent the message from being received and processed again when the visibility timeout expires."*

```
Message Lifecycle in SQS:

  SEND ──▶ STORED ──▶ RECEIVED ──▶ PROCESSING ──▶ DELETED
                         │                           │
                         ▼                           │
                   Visibility Timeout          Success: Delete
                   (message hidden             Failure: Message
                    from other                 becomes visible
                    consumers)                 again for retry
```

### Key Benefits

| Benefit | Description |
|---------|-------------|
| **Decoupling** | Producer and consumer don't need to know about each other |
| **Buffering** | Queue absorbs traffic spikes — workers process at their own pace |
| **Redundancy** | SQS stores messages across multiple servers for durability |
| **Scalability** | Add more producers or consumers independently |

---

## 3. Worker Services

### What Is a Worker Service?

A **worker service** is a standalone process (or set of processes) that runs in the background, separate from the main web application. Its job is to **consume messages from a queue** and execute the tasks they describe.

```
                    ┌────────────────────────────────────────────┐
                    │           WORKER SERVICE                   │
                    │                                            │
  ┌───────┐         │  ┌──────────┐   ┌──────────┐   ┌────────┐ │
  │ Queue │────────▶│  │  Poll    │──▶│ Process  │──▶│ Report │ │
  │ (SQS) │         │  │  Message │   │ Task     │   │ Result │ │
  └───────┘         │  └──────────┘   └──────────┘   └────────┘ │
                    │                                            │
                    │  Runs independently of the web server      │
                    └────────────────────────────────────────────┘
```

### Worker Architecture for AI Apps

```
┌──────────────────────────────────────────────────────────────┐
│                    AI WORKER SERVICE                          │
│                                                              │
│  ┌──────────────┐                                           │
│  │ Queue Poller │  ← Pulls messages from SQS                │
│  └──────┬───────┘                                           │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────┐                                           │
│  │ Task Router  │  ← Routes to correct handler              │
│  └──────┬───────┘                                           │
│         │                                                    │
│    ┌────┴────┬──────────┐                                   │
│    ▼         ▼          ▼                                    │
│ ┌──────┐ ┌────────┐ ┌──────────┐                           │
│ │Report│ │Embedding│ │Transcript│  ← Task-specific handlers │
│ │Gen   │ │Gen      │ │Analysis  │                           │
│ └──────┘ └────────┘ └──────────┘                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Example: Multi-Task Worker

```python
# worker.py — A worker service that handles multiple AI tasks

import boto3
import json
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('ai-worker')

sqs = boto3.client('sqs', region_name='us-east-1')
QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123456789/ai-tasks-queue'

# Task handlers registry
TASK_HANDLERS = {
    'generate_report': handle_report_generation,
    'generate_embeddings': handle_embedding_generation,
    'analyze_transcript': handle_transcript_analysis,
}

def handle_report_generation(data):
    """Generate an AI-powered report from interview data."""
    logger.info(f"Generating report for interview {data['interview_id']}")
    # ... AI processing logic ...
    return {"status": "completed", "report_url": "https://..."}

def handle_embedding_generation(data):
    """Generate vector embeddings for a document."""
    logger.info(f"Generating embeddings for document {data['document_id']}")
    # ... embedding model inference ...
    return {"status": "completed", "vectors_count": 150}

def handle_transcript_analysis(data):
    """Analyze an interview transcript with AI."""
    logger.info(f"Analyzing transcript {data['transcript_id']}")
    # ... LLM analysis ...
    return {"status": "completed", "insights": [...]}

def run_worker():
    """Main worker loop that continuously polls SQS for new tasks."""
    logger.info("Worker service started. Polling for messages...")
    
    while True:
        try:
            response = sqs.receive_message(
                QueueUrl=QUEUE_URL,
                MaxNumberOfMessages=10,   # Process up to 10 messages at a time
                WaitTimeSeconds=20,       # Long polling
                VisibilityTimeout=300     # 5 minutes to process
            )
            
            messages = response.get('Messages', [])
            
            for message in messages:
                body = json.loads(message['Body'])
                task_type = body.get('task')
                
                handler = TASK_HANDLERS.get(task_type)
                if handler:
                    try:
                        result = handler(body)
                        logger.info(f"Task {task_type} completed: {result}")
                        
                        # Delete message on success
                        sqs.delete_message(
                            QueueUrl=QUEUE_URL,
                            ReceiptHandle=message['ReceiptHandle']
                        )
                    except Exception as e:
                        logger.error(f"Task {task_type} failed: {e}")
                        # Message will become visible again after VisibilityTimeout
                else:
                    logger.warning(f"Unknown task type: {task_type}")
                    
        except Exception as e:
            logger.error(f"Worker error: {e}")
            time.sleep(5)  # Back off on errors

if __name__ == '__main__':
    run_worker()
```

### Scaling Workers

```
Low Load:
  Queue ──▶ [Worker 1]

High Load (scale horizontally):
  Queue ──▶ [Worker 1]
        ──▶ [Worker 2]
        ──▶ [Worker 3]
        ──▶ [Worker 4]

Each worker independently polls the queue.
SQS ensures each message is delivered to only one worker (visibility timeout).
```

---

## 4. Retry Strategies

### Why Retries Matter in AI Apps

AI operations can fail for many reasons:
- **API rate limits** — OpenAI, Claude, etc. have rate limits
- **Transient network errors** — Temporary connectivity issues
- **GPU out of memory** — Model inference fails on large inputs
- **Timeout** — Long-running inference exceeds time limits
- **Service unavailability** — External AI services temporarily down

### SQS Built-in Retry Mechanism

Amazon SQS has a built-in retry mechanism through **visibility timeout**:

1. A worker receives a message → message becomes **invisible** to other workers
2. If the worker **succeeds** → it **deletes** the message
3. If the worker **fails** (crashes or doesn't delete) → after the **visibility timeout** expires, the message becomes **visible** again → another worker can pick it up

```
  Attempt 1: Worker receives message → Fails (crashes)
     ↓ (visibility timeout expires)
  Attempt 2: Message visible again → Worker receives → Fails (API error)
     ↓ (visibility timeout expires)
  Attempt 3: Message visible again → Worker receives → Succeeds! → Deleted
```

### Exponential Backoff Strategy

```python
import time
import random

def retry_with_backoff(func, max_retries=5, base_delay=1):
    """
    Retry a function with exponential backoff and jitter.
    
    Delays: 1s → 2s → 4s → 8s → 16s (plus random jitter)
    """
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise  # Final attempt failed, propagate the error
            
            # Exponential backoff with jitter
            delay = base_delay * (2 ** attempt)
            jitter = random.uniform(0, delay * 0.1)  # 10% jitter
            total_delay = delay + jitter
            
            print(f"Attempt {attempt + 1} failed: {e}")
            print(f"Retrying in {total_delay:.2f} seconds...")
            time.sleep(total_delay)

# Usage in a worker:
def process_with_ai(data):
    def call_openai():
        return openai.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": data['prompt']}]
        )
    
    result = retry_with_backoff(call_openai, max_retries=3, base_delay=2)
    return result
```

### Retry Strategies Comparison

| Strategy | Pattern | Best For |
|----------|---------|----------|
| **Immediate retry** | Retry instantly | Very transient glitches |
| **Fixed delay** | Wait N seconds between retries | Simple cases |
| **Exponential backoff** | 1s → 2s → 4s → 8s... | API rate limits, network errors |
| **Exponential backoff + jitter** | Backoff + random delay | Avoiding thundering herd |
| **SQS visibility timeout** | Auto-retry after timeout | Worker crashes/failures |

### SQS `maxReceiveCount` (Redrive Policy)

SQS allows you to set a **maxReceiveCount** that limits how many times a message can be received (retried). After exceeding this count, the message is sent to a **Dead Letter Queue** (see next section).

```json
{
    "RedrivePolicy": {
        "deadLetterTargetArn": "arn:aws:sqs:us-east-1:123456789:ai-tasks-dlq",
        "maxReceiveCount": 3
    }
}
```

This means: "If a message fails 3 times, move it to the dead letter queue."

---

## 5. Dead Letter Queues

### What Is a Dead Letter Queue (DLQ)?

A **Dead Letter Queue** is a special queue that receives messages that could not be successfully processed after a specified number of attempts. It acts as a safety net for "poison messages" — messages that consistently fail.

From the [AWS SQS docs](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html):

> Amazon SQS offers common constructs such as **dead-letter queues** and cost allocation tags.

```
Normal Flow:
  Main Queue ──▶ Worker ──▶ Success ──▶ Delete message ✅

Failure Flow:
  Main Queue ──▶ Worker ──▶ Fail (attempt 1)
  Main Queue ──▶ Worker ──▶ Fail (attempt 2)
  Main Queue ──▶ Worker ──▶ Fail (attempt 3)  ← maxReceiveCount reached!
       │
       ▼
  Dead Letter Queue ──▶ Message stored for investigation 🔍
```

### Why DLQs Are Critical in AI Apps

| Scenario | Without DLQ | With DLQ |
|----------|-------------|----------|
| Malformed input | Message retries infinitely, wasting resources | After 3 fails, moved to DLQ for review |
| AI model bug | Poison message blocks queue | Quarantined in DLQ, other messages proceed |
| Corrupt data | Worker crashes repeatedly | Isolated, logged, and alertable |

### Example: Setting Up a DLQ with AWS SQS

```python
import boto3

sqs = boto3.client('sqs', region_name='us-east-1')

# Step 1: Create the Dead Letter Queue
dlq_response = sqs.create_queue(
    QueueName='ai-tasks-dlq',
    Attributes={
        'MessageRetentionPeriod': '1209600'  # 14 days (max retention)
    }
)
dlq_url = dlq_response['QueueUrl']

# Get the DLQ ARN
dlq_attrs = sqs.get_queue_attributes(
    QueueUrl=dlq_url,
    AttributeNames=['QueueArn']
)
dlq_arn = dlq_attrs['Attributes']['QueueArn']

# Step 2: Create the Main Queue with a Redrive Policy pointing to the DLQ
import json
main_queue_response = sqs.create_queue(
    QueueName='ai-tasks-queue',
    Attributes={
        'VisibilityTimeout': '300',           # 5 minutes
        'MessageRetentionPeriod': '345600',   # 4 days
        'RedrivePolicy': json.dumps({
            'deadLetterTargetArn': dlq_arn,
            'maxReceiveCount': '3'            # Move to DLQ after 3 failures
        })
    }
)

print(f"Main Queue: {main_queue_response['QueueUrl']}")
print(f"DLQ: {dlq_url}")
```

### Monitoring the DLQ

```python
def check_dlq_messages():
    """Monitor the dead letter queue for failed messages."""
    response = sqs.receive_message(
        QueueUrl=DLQ_URL,
        MaxNumberOfMessages=10,
        WaitTimeSeconds=5
    )
    
    messages = response.get('Messages', [])
    if messages:
        print(f"⚠️ {len(messages)} failed messages in DLQ!")
        for msg in messages:
            body = json.loads(msg['Body'])
            print(f"  Failed task: {body.get('task')} | ID: {body.get('interview_id')}")
            # Alert the team, log the error, or attempt manual reprocessing
    else:
        print("✅ DLQ is empty — all messages processed successfully")
```

---

## 6. Job Orchestration

### What Is Job Orchestration?

**Job orchestration** is the coordination of multiple dependent tasks in a workflow. In AI apps, a single user action often triggers a **pipeline** of tasks that must run in a specific order.

### Example: AI Document Processing Pipeline

```
User uploads a document
         │
         ▼
  ┌──────────────┐
  │ Step 1:      │
  │ Extract text │    ← OCR / text extraction
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │ Step 2:      │
  │ Chunk text   │    ← Split into smaller pieces
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │ Step 3:      │
  │ Generate     │    ← Create vector embeddings
  │ embeddings   │
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │ Step 4:      │
  │ Store in     │    ← Save to vector database
  │ vector DB    │
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │ Step 5:      │
  │ Notify user  │    ← "Document ready for search!"
  └──────────────┘
```

### Orchestration Patterns

#### Pattern 1: Sequential (Chained Messages)

Each step, upon completion, sends a message for the next step:

```python
def handle_step_1(data):
    """Extract text from uploaded document."""
    text = extract_text(data['document_url'])
    
    # Queue the next step
    sqs.send_message(
        QueueUrl=QUEUE_URL,
        MessageBody=json.dumps({
            'task': 'chunk_text',        # Step 2
            'document_id': data['document_id'],
            'text': text
        })
    )

def handle_step_2(data):
    """Chunk the extracted text."""
    chunks = chunk_text(data['text'], chunk_size=512)
    
    # Queue the next step
    sqs.send_message(
        QueueUrl=QUEUE_URL,
        MessageBody=json.dumps({
            'task': 'generate_embeddings',  # Step 3
            'document_id': data['document_id'],
            'chunks': chunks
        })
    )

# ... and so on for each step
```

#### Pattern 2: Fan-Out / Fan-In

Process multiple chunks in parallel, then aggregate:

```
                    ┌──▶ [Embed Chunk 1] ──┐
                    │                       │
  [Chunk Text] ────┼──▶ [Embed Chunk 2] ──┼──▶ [Store All in DB]
                    │                       │
                    └──▶ [Embed Chunk 3] ──┘
                    
  "Fan-Out"                                  "Fan-In"
  (split work)                               (aggregate results)
```

#### Pattern 3: Saga Pattern (with Compensation)

For complex workflows where each step may need to be **undone** if a later step fails:

```
Step 1: Charge customer    → Success
Step 2: Generate AI report → Success
Step 3: Send email         → FAIL!
   ↓
Compensate: Refund customer (undo Step 1)
Compensate: Delete report  (undo Step 2)
```

---

## 7. Rate Limiting

### Why Rate Limiting Matters in AI Apps

AI services like OpenAI, Anthropic, Google, etc. impose **rate limits**:

- **Requests per minute (RPM)**: e.g., 60 requests/minute
- **Tokens per minute (TPM)**: e.g., 90,000 tokens/minute
- **Requests per day (RPD)**: e.g., 10,000 requests/day

Without rate limiting, your workers could overwhelm the AI API and get **429 Too Many Requests** errors.

### Rate Limiting Strategies

#### Strategy 1: Token Bucket

```python
import time
import threading

class TokenBucket:
    """
    Token Bucket rate limiter.
    
    Tokens are added at a fixed rate. Each request consumes one token.
    If no tokens available, the request waits.
    """
    def __init__(self, rate, capacity):
        self.rate = rate            # Tokens added per second
        self.capacity = capacity    # Maximum tokens in bucket
        self.tokens = capacity      # Current tokens
        self.last_refill = time.time()
        self.lock = threading.Lock()
    
    def acquire(self):
        """Wait until a token is available, then consume it."""
        while True:
            with self.lock:
                # Refill tokens based on elapsed time
                now = time.time()
                elapsed = now - self.last_refill
                self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
                self.last_refill = now
                
                if self.tokens >= 1:
                    self.tokens -= 1
                    return True
            
            time.sleep(0.1)  # Wait before checking again

# Usage: Allow 1 request per second (60 RPM)
limiter = TokenBucket(rate=1, capacity=5)

def call_ai_api(prompt):
    limiter.acquire()  # Blocks until token available
    return openai.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
```

#### Strategy 2: Queue-Based Rate Limiting with SQS

Control processing rate by adjusting how fast workers consume messages:

```python
import time

RATE_LIMIT = 1.0  # seconds between API calls

def rate_limited_worker():
    """Worker that processes messages at a controlled rate."""
    while True:
        response = sqs.receive_message(
            QueueUrl=QUEUE_URL,
            MaxNumberOfMessages=1,    # Only one at a time
            WaitTimeSeconds=20
        )
        
        if 'Messages' in response:
            start_time = time.time()
            
            message = response['Messages'][0]
            process_message(message)
            
            # Ensure minimum time between API calls
            elapsed = time.time() - start_time
            if elapsed < RATE_LIMIT:
                time.sleep(RATE_LIMIT - elapsed)
```

#### Strategy 3: Concurrency Control

```python
import concurrent.futures

MAX_CONCURRENT_AI_CALLS = 5  # Limit concurrent API calls

executor = concurrent.futures.ThreadPoolExecutor(max_workers=MAX_CONCURRENT_AI_CALLS)

def process_batch(messages):
    """Process a batch of messages with limited concurrency."""
    futures = []
    for message in messages:
        future = executor.submit(process_single_message, message)
        futures.append(future)
    
    # Wait for all to complete
    for future in concurrent.futures.as_completed(futures):
        try:
            result = future.result()
            print(f"Completed: {result}")
        except Exception as e:
            print(f"Failed: {e}")
```

### Rate Limiting Summary

| Strategy | Mechanism | Best For |
|----------|-----------|----------|
| **Token Bucket** | Tokens refill at fixed rate | Smooth rate control |
| **Queue throttling** | Control `MaxNumberOfMessages` + delay | SQS-based workflows |
| **Concurrency limit** | Limit parallel workers/threads | Controlling API load |
| **Exponential backoff** | Slow down on 429 errors | Reactive rate limiting |

---

## 8. AWS SQS – Practical Examples

### SQS Key Features (from AWS Docs)

Amazon SQS provides:

| Feature | Description |
|---------|-------------|
| **Security** | Control who can send/receive messages; server-side encryption (SSE) with AWS KMS |
| **Durability** | Messages stored on multiple servers; standard queues = at-least-once delivery; FIFO = exactly-once |
| **Availability** | Redundant infrastructure for high availability |
| **Scalability** | Transparently scales to handle any load without provisioning |
| **Reliability** | Locks messages during processing; supports multiple producers and consumers |
| **Customization** | Delay queues, message retention (60s to 14 days), large message support via S3 |

### Queue Types

| | Standard Queue | FIFO Queue |
|--|---------------|------------|
| **Ordering** | Best-effort ordering | Strict first-in-first-out |
| **Delivery** | At-least-once (may deliver duplicates) | Exactly-once processing |
| **Throughput** | Nearly unlimited | 300 msg/sec (or 3,000 with batching in high-throughput mode) |
| **Use case** | High throughput tasks | Order-critical tasks |

### SQS vs SNS vs Amazon MQ (from AWS Docs)

From the AWS documentation:

> *"Amazon SQS decouples and scales distributed software systems and components as a queue service. It processes messages through a single subscriber typically."*

> *"Amazon SNS allows publishers to send messages to multiple subscribers through topics."*

> *"Amazon MQ fits best with enterprises looking to migrate from traditional message brokers, supporting standard messaging protocols like AMQP and MQTT."*

| Service | Type | Best For |
|---------|------|----------|
| **Amazon SQS** | Queue (point-to-point) | Task processing, decoupling services |
| **Amazon SNS** | Pub/Sub (fan-out) | Notifications, broadcasting to multiple subscribers |
| **Amazon MQ** | Message Broker | Legacy system migration (AMQP, MQTT, etc.) |

### Important SQS Configuration Values

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| **VisibilityTimeout** | 30 seconds | 0s – 12 hours | How long a message is hidden after being received |
| **MessageRetentionPeriod** | 4 days | 60s – 14 days | How long messages are kept in the queue |
| **WaitTimeSeconds** | 0 (short poll) | 0 – 20s | Long polling wait time |
| **MaxReceiveCount** | N/A | Set in redrive policy | Attempts before sending to DLQ |
| **DelaySeconds** | 0 | 0 – 900s (15 min) | Delay before message becomes visible |

---

## Summary

| Concept | Key Takeaway |
|---------|-------------|
| **Async systems** | Essential for AI apps due to long-running, resource-intensive operations |
| **Producer-consumer** | Decouples request handling from processing using a queue buffer |
| **Worker services** | Independent processes that consume and execute queued tasks |
| **Retry strategies** | Exponential backoff + jitter is the gold standard for AI APIs |
| **Dead letter queues** | Safety net for messages that repeatedly fail processing |
| **Job orchestration** | Coordinates multi-step AI pipelines (sequential, fan-out, saga) |
| **Rate limiting** | Controls the pace of AI API calls to stay within service limits |

---

## References

- [AWS SQS Developer Guide](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html)
- [AWS SQS Dead Letter Queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html)
- [AWS SQS Visibility Timeout](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html)
- [AWS SQS Delay Queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-delay-queues.html)
