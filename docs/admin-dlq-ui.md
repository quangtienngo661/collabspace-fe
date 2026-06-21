# Admin DLQ UI — Spec & Lộ Trình Implement

Tài liệu này mô tả giao diện vận hành DLQ cho admin trong `collabspace-fe`. UI này thuộc nhóm **Ops/Admin**, không trộn với analytics dashboard thông thường.

**Tài liệu liên quan:**
- BE spec: [`collabspace/docs/dlq-service.md`](../../collabspace/docs/dlq-service.md)
- Admin feature hiện tại: [`docs/features.md`](./features.md)
- Phân quyền: [`docs/roles-and-permissions.md`](./roles-and-permissions.md)

---

## 1. Nguyên Tắc

- FE **không đọc Kafka trực tiếp**. Mọi data và action đều qua `dlq-service` API.
- Route `/admin/dlq/*` chỉ render khi user có quyền `dlq.read`. Không có quyền → redirect `/admin`.
- Nút Replay/Discard chỉ render khi user có quyền `dlq.manage`.
- Mọi action (replay, discard, resolve) phải hiển thị confirm dialog trước khi gọi API.
- Sau mỗi action thành công, refetch list để phản ánh trạng thái mới.

---

## 2. Phân Quyền

| Quyền | Cho phép trong UI |
|-------|------------------|
| `dlq.read` | Xem Overview, List, Detail — toàn bộ data read-only |
| `dlq.manage` | Thấy và dùng nút Replay, Replay Batch, Discard, Resolve |

Check quyền từ `X-Permissions` header (đã inject bởi gateway vào JWT claims). Pattern giống `PlatformAdminGuard` hiện tại trong FE.

---

## 3. Routing & Navigation

Thêm vào admin nav (`adminNav.ts`):

```typescript
{ label: 'DLQ', href: '/admin/dlq', icon: AlertTriangleIcon, permission: 'dlq.read' }
```

Routes:

```
/admin/dlq                    → DlqOverviewPage
/admin/dlq/messages           → DlqMessageListPage
/admin/dlq/messages/:id       → DlqMessageDetailPage
```

---

## 4. API Client

Thêm `dlqApi.ts` vào `src/app/api/`:

```typescript
export const dlqApi = {
  getOverview(): Promise<DlqOverview>,
  listMessages(params: DlqListParams): Promise<DlqListResponse>,
  getMessage(id: string): Promise<DlqMessage>,
  replayMessage(id: string): Promise<DlqMessage>,
  replayBatch(body: ReplayBatchBody): Promise<ReplayBatchResult>,
  discardMessage(id: string, resolutionNote?: string): Promise<DlqMessage>,
  resolveMessage(id: string, resolutionNote?: string): Promise<DlqMessage>,
}
```

Base path: `/api/v1/dlq` (qua gateway như các service khác).
`resolutionNote` cho `discardMessage` và `resolveMessage` là optional, nếu nhập thì tối đa 1000 ký tự.

---

## 5. Types

```typescript
type DlqStatus = 'pending' | 'replaying' | 'requires_manual_review' | 'resolved' | 'discarded';
type ErrorCategory = 'transient' | 'logic' | 'schema' | 'unknown';

interface DlqMessage {
  id: string;
  sourceTopic: string;
  sourcePartition: number;
  sourceOffset: string;
  sourceKey: string | null;
  consumerGroup: string;
  payload: Record<string, unknown>;
  errorMessage: string;
  errorCategory: ErrorCategory;
  failedAt: string;
  status: DlqStatus;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: string | null;
  lastRetriedAt: string | null;
  replayedBy: string | null;
  retryHistory: Array<{
    at: string;
    by: string;
    action: 'auto_retry' | 'manual_replay' | 'resolve' | 'discard';
    result: 'success' | 'failure';
    errorMessage?: string;
  }>;
  resolvedBy: string | null;
  discardedBy: string | null;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DlqOverview {
  pending: number;
  requiresManualReview: number;
  replaySuccessTotal: number;
  replayFailTotal: number;
  topSourceTopics: Array<{ topic: string; count: number }>;
  recentActivity: Array<{ date: string; ingested: number; replayed: number }>;
}

interface DlqListParams {
  status?: DlqStatus | DlqStatus[];
  errorCategory?: ErrorCategory;
  sourceTopic?: string;
  from?: string;
  to?: string;
  limit?: number;
  cursor?: string;
}

interface DlqListResponse {
  data: DlqMessage[];
  nextCursor: string | null;
  total: number;
}
```

---

## 6. Màn Hình 1: DLQ Overview (`/admin/dlq`)

### Layout

```
┌─────────────────────────────────────────────────────┐
│  DLQ Overview                          [↻ Refresh]  │
├──────────┬──────────────┬──────────┬────────────────┤
│ Pending  │ Manual Review│ Replayed │  Replay Failed  │
│   12     │     3  🔴    │   847    │     5           │
└──────────┴──────────────┴──────────┴────────────────┘

Top Source Topics (errors)
┌─────────────────────────────────────────────────────┐
│ collabspace.task.events          ████████████  24   │
│ collabspace.workspace.events     ██████        12   │
│ collabspace.notification.events  ███            6   │
└─────────────────────────────────────────────────────┘

DLQ Activity (30 ngày)
[line chart: ingested vs replayed per day]

[→ Xem tất cả messages]
```

### Cards

| Card | Value | Style khi > 0 |
|------|-------|--------------|
| Pending | `overview.pending` | Vàng nếu > 10 |
| Manual Review | `overview.requiresManualReview` | Đỏ nếu > 0 (luôn cần chú ý) |
| Replay Success | `overview.replaySuccessTotal` | Xanh |
| Replay Failed | `overview.replayFailTotal` | Đỏ nếu > 0 |

### Component

```
src/app/components/pages/admin/dlq/
├── DlqOverviewPage.tsx
├── DlqOverviewCards.tsx
├── DlqTopTopicsChart.tsx
└── DlqActivityChart.tsx
```

---

## 7. Màn Hình 2: DLQ Message List (`/admin/dlq/messages`)

### Layout

```
┌─────────────────────────────────────────────────────┐
│  DLQ Messages                                       │
│                                                     │
│  [Status ▼]  [Topic ▼]  [Category ▼]  [From→To]   │
│  [Search: messageId / consumerGroup...]  [Reset]    │
├─────────────────────────────────────────────────────┤
│  Source Topic                │ Status  │ Category   │
│  Failed At   │ Retries │ Error              │ Actions│
├─────────────────────────────────────────────────────┤
│  collabspace.task.events     │ 🔴 review │ logic    │
│  2026-06-20 08:00  │ 0/0  │ TypeError: ...  │ [→]   │
│                                                     │
│  collabspace.workspace.events│ 🟡 pending│ transient│
│  2026-06-20 07:55  │ 1/3  │ ETIMEDOUT       │ [→]   │
└─────────────────────────────────────────────────────┘
[← Prev]  1–20 of 42  [Next →]
```

### Filters

| Filter | UI Control | API param |
|--------|-----------|-----------|
| Status | Multi-select dropdown | `status` |
| Source Topic | Select dropdown (danh sách từ API) | `sourceTopic` |
| Error Category | Select: transient/logic/schema/unknown | `errorCategory` |
| Thời gian | Date range picker | `from`, `to` |
| Search | Text input (messageId, consumerGroup) | `cursor` reset khi search |

### Status Badge colors

| Status | Badge |
|--------|-------|
| `pending` | Vàng |
| `replaying` | Xanh lam (loading spinner nhỏ) |
| `requires_manual_review` | Đỏ |
| `resolved` | Xanh lá |
| `discarded` | Xám |

### Error Category Badge

| Category | Badge |
|----------|-------|
| `transient` | Xanh dương nhạt |
| `logic` | Cam |
| `schema` | Tím |
| `unknown` | Xám |

### Component

```
src/app/components/pages/admin/dlq/
├── DlqMessageListPage.tsx
├── DlqMessageTable.tsx
├── DlqFilters.tsx
├── DlqStatusBadge.tsx
└── DlqCategoryBadge.tsx
```

---

## 8. Màn Hình 3: DLQ Message Detail (`/admin/dlq/messages/:id`)

### Layout

```
┌─────────────────────────────────────────────────────┐
│  ← Back to Messages                                 │
│                                                     │
│  DLQ Message — task.events / offset 1234            │
│  Status: 🔴 requires_manual_review                  │
│                                                     │
├─ Origin ────────────────────────────────────────────┤
│  Source Topic:    collabspace.task.events            │
│  Partition:       0    Offset: 1234                 │
│  Source Key:      task-abc-123                      │
│  Consumer Group:  notification-service              │
│  Failed At:       2026-06-20 08:00:15               │
│                                                     │
├─ Error ─────────────────────────────────────────────┤
│  Category: logic                                    │
│  Message:  TypeError: Cannot read property 'userId' │
│            of undefined                             │
│  Retries:  0 / 0 (no auto-retry for logic errors)  │
│                                                     │
├─ Payload ──────────────────────── [Copy Payload 📋] ┤
│  {                                                  │
│    "eventId": "...",                                │
│    "type": "task_created",                          │
│    "payload": { ... }                               │
│  }                                                  │
│                                                     │
├─ Audit Trail ───────────────────────────────────────┤
│  2026-06-20 08:00  Ingested (consumer: notif-svc)  │
│  2026-06-20 08:00  → requires_manual_review (auto)  │
│                                                     │
├─ Actions ───────────────────────────────────────────┤
│  [Replay Message]  [Discard]  [Mark Resolved]       │
│  (chỉ hiện khi có dlq.manage)                       │
└─────────────────────────────────────────────────────┘
```

### Tabs trong Detail

- **Overview** — origin, error, status tóm tắt
- **Payload** — JSON viewer có syntax highlight + copy button; copy payload/error là client-side từ response `GET /dlq/messages/:id`, không cần API riêng
- **Audit Trail** — timeline các lần retry/action từ `retryHistory`

Không có action "Mark manual review" trong UI mặc định. `requires_manual_review` là trạng thái backend tự set theo policy; nếu sau này cần escalate thủ công thì backend sẽ thêm route riêng.

### Actions trong Detail (Phase 2+)

**Replay:**
```
Dialog confirm:
"Replay message này về topic [sourceTopic]?
Payload giữ nguyên, không thay đổi.
Thao tác này sẽ được ghi audit."
[Cancel] [Replay]
```

**Discard:**
```
Dialog confirm + textarea:
"Lý do discard (optional):"
[textarea: resolutionNote]
[Cancel] [Discard]
```

**Mark Resolved:**
```
Dialog confirm + textarea:
"Ghi chú xử lý (optional):"
[textarea: resolutionNote]
[Cancel] [Mark Resolved]
```

### Component

```
src/app/components/pages/admin/dlq/
├── DlqMessageDetailPage.tsx
├── DlqDetailOverviewTab.tsx
├── DlqPayloadViewer.tsx         # JSON syntax highlight + copy
├── DlqAuditTrail.tsx
├── DlqActionButtons.tsx         # Replay, Discard, Resolve
└── DlqActionDialog.tsx          # Confirm dialog tái sử dụng
```

---

## 9. Folder Layout Đầy Đủ

```
src/app/components/pages/admin/dlq/
├── DlqOverviewPage.tsx
├── DlqOverviewCards.tsx
├── DlqTopTopicsChart.tsx
├── DlqActivityChart.tsx
│
├── DlqMessageListPage.tsx
├── DlqMessageTable.tsx
├── DlqFilters.tsx
├── DlqStatusBadge.tsx
├── DlqCategoryBadge.tsx
│
├── DlqMessageDetailPage.tsx
├── DlqDetailOverviewTab.tsx
├── DlqPayloadViewer.tsx
├── DlqAuditTrail.tsx
├── DlqActionButtons.tsx
└── DlqActionDialog.tsx

src/app/api/
└── dlqApi.ts
```

---

## 10. Lộ Trình Implement (4 Phase)

### Phase 1 — Read Only (sau `dlq-service` PR 2)

**Phụ thuộc:** `GET /dlq/messages`, `GET /dlq/messages/:id` đã có.

- `dlqApi.ts` — `getOverview`, `listMessages`, `getMessage`
- `DlqOverviewPage` — 4 cards, top topics bar, activity chart
- `DlqMessageListPage` — table, filter status/topic/category/date, cursor pagination
- `DlqMessageDetailPage` — tabs Overview + Payload viewer + Audit Trail (read-only)
- `DlqStatusBadge`, `DlqCategoryBadge`
- Route `/admin/dlq/*` + nav item (guard `dlq.read`)

### Phase 2 — Actions (sau `dlq-service` PR 3)

**Phụ thuộc:** `POST /replay`, `POST /discard`, `POST /resolve` đã có.

- `DlqActionButtons` — Replay, Discard, Resolve (guard `dlq.manage`)
- `DlqActionDialog` — confirm dialog tái sử dụng cho cả 3 action
- `dlqApi.ts` — thêm `replayMessage`, `discardMessage`, `resolveMessage`
- Toast success/error sau mỗi action
- Refetch detail + list sau action thành công

### Phase 3 — Batch + Charts (sau `dlq-service` PR 4)

**Phụ thuộc:** `POST /replay-batch`, metrics endpoint đã có.

- Checkbox multi-select trong table
- Toolbar "Replay Selected (N)" khi có selection
- `DlqActivityChart` — line chart ingested vs replayed 30 ngày
- `DlqTopTopicsChart` — horizontal bar chart
- Batch confirm dialog với preview count

### Phase 4 — Alert Badge

- Badge đỏ trên nav item "DLQ" khi `requiresManualReview > 0`
- Poll `GET /dlq/overview` mỗi 60 giây khi user đang ở admin area
- Hoặc dùng SSE nếu `dlq-service` mở endpoint invalidation stream (optional)

---

## 11. UX Notes

**Payload viewer:** dùng thư viện JSON highlight nhẹ (ví dụ `react-json-view` hoặc tự render với `<pre>` + highlight). Cần nút **Copy to clipboard** ở góc.

**Pagination:** dùng cursor-based (không phải offset) vì API trả `nextCursor`. Không hiển thị số trang tuyệt đối — chỉ Next/Prev.

**Loading state:** skeleton cho Overview cards và table rows, không dùng spinner toàn trang.

**Error state:** nếu `dlq-service` down, hiển thị banner "DLQ service không khả dụng" thay vì crash page.

**Empty state:** khi không có record nào match filter, hiển thị "Không có DLQ messages" với nút Reset filter.

**`requires_manual_review` nổi bật:** card "Manual Review" trên Overview luôn dùng màu đỏ nếu > 0, kể cả khi nhỏ. Đây là signal quan trọng nhất với ops.
