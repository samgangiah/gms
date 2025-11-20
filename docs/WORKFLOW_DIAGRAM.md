# Gilnokie Production Workflow - Visual Diagrams

## Proposed Two-Phase System

```mermaid
graph TD
    A[Customer Order Received] --> B[PHASE 1: OFFICE]
    B --> C[Create Job Card<br/>12 Core Fields<br/>3 minutes]
    C --> D[System Assigns:<br/>Job Card #<br/>QR Code]
    D --> E[Print Job Card<br/>with QR Code]
    E --> F[Deliver to Shop Floor]

    F --> G[PHASE 2: SHOP FLOOR]
    G --> H[Operator Scans QR<br/>on Tablet]
    H --> I[Production Entry Screen]
    I --> J[For Each Piece:]
    J --> K[1. Weight]
    J --> L[2. Photo]
    J --> M[3. Quality Grade]
    J --> N[4. Quick Notes]

    K --> O[Auto-sync to Office]
    L --> O
    M --> O
    N --> O

    O --> P[Real-time Dashboard<br/>Office Sees Progress]
    P --> Q[All Pieces Complete?]
    Q -->|Yes| R[Mark Job Complete]
    Q -->|No| J

    R --> S[Generate Reports<br/>with Photos]
    S --> T[Archive Job]
```

## Office vs Shop Floor Data Split

```mermaid
graph LR
    subgraph OFFICE["🏢 OFFICE SYSTEM (Desktop)"]
        A1[Customer Details]
        A2[Order Specs]
        A3[Fabric Quality]
        A4[Quantity Required]
        A5[Machine Assignment]
        A6[Target Date]
        A7[Yarn Planning]
        A8[Cost Estimates]
    end

    subgraph SHOPFLOOR["🏭 SHOP FLOOR (Tablet)"]
        B1[Actual Weight]
        B2[Photos]
        B3[Quality Grade]
        B4[Operator Name]
        B5[Timestamp]
        B6[Defects]
        B7[Machine Issues]
        B8[Progress %]
    end

    OFFICE -->|QR Code| SHOPFLOOR
    SHOPFLOOR -->|Real-time Sync| OFFICE
```

## Data Flow Timeline

```mermaid
sequenceDiagram
    participant C as Customer
    participant O as Office Staff
    participant S as System
    participant T as Tablet
    participant Op as Operator
    participant M as Manager

    C->>O: Places Order
    O->>S: Create Job Card (3 min)
    S->>S: Generate JC-20251112-001
    S->>S: Create QR Code
    S-->>O: Print Job Card
    O->>Op: Deliver to Machine

    Op->>T: Scan QR Code
    T->>Op: Show Production Form

    loop Each Piece
        Op->>T: Enter Weight (30 sec)
        Op->>T: Take Photo
        Op->>T: Select Quality Grade
        T->>S: Sync Data (real-time)
        S-->>M: Update Dashboard
    end

    Op->>T: Mark Complete
    T->>S: Final Sync
    S->>M: Notify Completion
    M->>S: Generate Reports
    S->>C: Share Quality Photos (optional)
```

## Screen Layout Comparison

### Office Desktop - Job Card Creation
```
┌─────────────────────────────────────────────┐
│  CREATE JOB CARD                        [X] │
├─────────────────────────────────────────────┤
│                                             │
│  [Tabs: Order | Fabric | Production | Notes]│
│                                             │
│  ┌─────────────────┐  ┌──────────────────┐ │
│  │ Customer ▼      │  │ Order Date       │ │
│  └─────────────────┘  └──────────────────┘ │
│                                             │
│  ┌─────────────────┐  ┌──────────────────┐ │
│  │ Fabric Quality▼ │  │ Quantity (kg)    │ │
│  └─────────────────┘  └──────────────────┘ │
│                                             │
│  [     Cancel     ] [   Create Job Card  ] │
└─────────────────────────────────────────────┘
```

### Shop Floor Tablet - Production Entry (Landscape)
```
┌─────────────────────────────────────────────────────────────┐
│  📋 Job Card: JC-20251112-001                          🔋95% │
│  Customer: MACBEAN | Quality: PD600 | Target: 500kg         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│   Current Piece: 12 / 20                   Progress: 60%    │
│                                                               │
│   ┌─────────────────────────┐                                │
│   │  WEIGHT (kg)            │   ┌───────────────────────┐   │
│   │                         │   │                       │   │
│   │      35.5               │   │   📷  TAKE PHOTO      │   │
│   │                         │   │                       │   │
│   │  [1][2][3]   [←]        │   │   (Camera Preview)    │   │
│   │  [4][5][6]   [OK]       │   │                       │   │
│   │  [7][8][9]              │   └───────────────────────┘   │
│   │  [.][0][⌫]              │                                │
│   └─────────────────────────┘                                │
│                                                               │
│   QUALITY GRADE:                                             │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│   │  ✓ PASS  │ │  MINOR   │ │  DEFECT  │                   │
│   │  (Green) │ │ (Yellow) │ │   (Red)  │                   │
│   └──────────┘ └──────────┘ └──────────┘                   │
│                                                               │
│   NOTES: ________________________________________________    │
│                                           [🎤 Voice Input]    │
│                                                               │
│   [      ← PREVIOUS      ]  [    SAVE & NEXT PIECE →    ]  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Photo Capture Flow

```mermaid
graph TD
    A[Operator on Production Entry] --> B{Piece Complete?}
    B -->|Yes| C[Tap 'Take Photo']
    C --> D[Camera Opens]
    D --> E[Preview Fabric]
    E --> F{Photo Good?}
    F -->|No| D
    F -->|Yes| G[Capture]
    G --> H[Thumbnail Preview]
    H --> I{Need More Photos?}
    I -->|Yes| D
    I -->|No| J[Continue with Weight/Grade]
    J --> K[Save All Data]
    K --> L[Sync to Server]
    L --> M[Photo Available in Office Dashboard]
```

## User Interface Principles

### Desktop (Office)
- **Layout**: Standard form layout, multiple tabs
- **Input**: Keyboard and mouse
- **Target Size**: Standard (24px buttons acceptable)
- **Density**: Information-dense, multiple fields visible
- **Use Case**: Detailed planning, reporting, analysis

### Tablet (Shop Floor)
- **Layout**: Single-focus, one task at a time
- **Input**: Touch only (gloves possible)
- **Target Size**: Large (minimum 44px, prefer 60px+)
- **Density**: Minimal, reduce cognitive load
- **Use Case**: Quick data entry during production
- **Orientation**: Landscape (easier to hold and read)
- **Contrast**: High (visible in bright factory lighting)

## Integration Points

```mermaid
graph LR
    A[Office Desktop] --> B[PostgreSQL Database]
    C[Shop Floor Tablet] --> B
    B --> D[Supabase Storage<br/>Photos]
    B --> E[Real-time Dashboard]
    B --> F[PDF Reports]
    B --> G[Customer Portal<br/>Optional]

    style A fill:#e1f5ff
    style C fill:#fff4e1
    style B fill:#f0f0f0
    style D fill:#ffe1f5
```

## Offline Capability

```mermaid
sequenceDiagram
    participant T as Tablet
    participant L as Local Storage
    participant N as Network
    participant S as Server

    Note over T,S: ONLINE MODE
    T->>S: Save Production Data
    S-->>T: Confirmation ✓

    Note over T,S: WIFI DROPS (Offline)
    T->>L: Save to Local Queue
    L-->>T: Queued ✓

    Note over T,S: Production Continues Offline
    T->>L: More Production Data
    T->>L: Photos Stored Locally

    Note over T,S: WIFI RETURNS (Online)
    N->>T: Connection Restored
    T->>L: Get Queued Data
    L-->>T: Return Queue
    T->>S: Sync All Queued Data
    S-->>T: All Synced ✓
    T->>L: Clear Queue
```

## Quality Control Workflow

```mermaid
graph TD
    A[Piece Production] --> B[Operator Visual Check]
    B --> C{Quality?}
    C -->|Perfect| D[Mark PASS<br/>Take Standard Photo]
    C -->|Minor Issue| E[Mark MINOR<br/>Photo of Issue]
    C -->|Defect| F[Mark DEFECT<br/>Detailed Photos]

    D --> G[Continue Production]
    E --> H[Supervisor Notified]
    F --> I[Production HOLD]

    H --> J{Accept Minor?}
    J -->|Yes| K[Note: Discount Applied]
    J -->|No| I

    I --> L[Manager Review]
    L --> M{Decision}
    M -->|Rework| N[Return to Production]
    M -->|Scrap| O[Document Loss]
    M -->|Accept| P[Note: As-Is Sale]

    K --> G
    P --> G

    style F fill:#ffcccc
    style I fill:#ffcccc
    style D fill:#ccffcc
```

## Dashboard Real-Time Updates

```
MANAGER DASHBOARD VIEW:

┌───────────────────────────────────────────────────────────┐
│  ACTIVE PRODUCTION                              🔄 Live   │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  JC-20251112-001  MACBEAN   PD600                       │
│  ████████████░░░░░░░░ 60% (12/20 pieces)                │
│  Machine 3 | Operator: John | Last update: 2 min ago     │
│  📷 Latest photo: [thumbnail] Quality: ✓ PASS            │
│                                                           │
│  JC-20251112-002  TurboTex  T3                          │
│  ██░░░░░░░░░░░░░░░░░░ 10% (2/18 pieces)                 │
│  Machine 7 | Operator: Sarah | Last update: 15 min ago   │
│  ⚠️ MINOR DEFECT detected - Review needed                │
│  📷 [View defect photos]                                  │
│                                                           │
│  JC-20251112-003  MACBEAN   MED102                      │
│  ░░░░░░░░░░░░░░░░░░░░ 0% (0/25 pieces)                   │
│  Machine 5 | Waiting for operator...                     │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

**These diagrams illustrate the complete proposed workflow.**
**Present to client for feedback before proceeding with build.**
