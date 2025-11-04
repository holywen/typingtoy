# 多人游戏系统实现方案

## 📋 项目概述

为TypingToy打字练习应用添加完整的多人游戏功能，包括实时对战、游戏大厅、排行榜等功能。

### 核心需求
- ✅ **实时对战模式**：WebSocket同步，玩家可实时看到对手进度
- ✅ **完整游戏大厅**：房间系统、快速匹配、观战、聊天
- ✅ **多维度排行榜**：全球榜、每日/每周/每月榜、好友榜
- ✅ **灵活用户系统**：支持游客模式（设备ID）和登录用户

---

## 📅 实施时间表

总计：**约3-4周的开发时间 (22-25天)**

| 阶段 | 任务 | 预计时间 | 状态 |
|------|------|----------|------|
| Phase 1 | 基础架构搭建 | 3-4天 | ✅ 已完成 |
| Phase 2 | 游戏大厅功能 | 4-5天 | ✅ 已完成 |
| Phase 3 | 实时游戏同步 | 5-6天 | ⏳ 进行中 (85%) |
| Phase 4 | 观战模式 | 2天 | ⏸️ 待开始 |
| Phase 5 | 排行榜系统 | 3天 | ⏸️ 待开始 |
| Phase 6 | UI集成与优化 | 3天 | ⏸️ 待开始 |
| Phase 7 | 国际化与测试 | 2天 | ⏸️ 待开始 |

---

## 🏗️ Phase 1: 基础架构搭建 (3-4天)

### 1.1 WebSocket服务器 (Socket.IO)

**任务清单:**
- [x] 安装依赖：`socket.io`, `socket.io-client`
- [x] 创建 `/app/api/socket/route.ts` - Socket.IO服务器
- [x] 实现基础事件：connection, disconnect, error
- [x] 配置CORS和认证中间件
- [ ] 测试连接和断线重连（待Phase 2测试）

**关键代码位置:**
```
/app/api/socket/route.ts
/lib/services/socketClient.ts
```

---

### 1.2 设备指纹识别 (游客支持)

**任务清单:**
- [x] 安装 `@fingerprintjs/fingerprintjs`
- [x] 创建 `/lib/services/deviceId.ts` - 生成/存储设备唯一ID
- [x] 实现设备ID持久化（localStorage + cookie）
- [ ] 测试多设备唯一性（待Phase 2集成测试）

**实现要点:**
```typescript
// 设备ID格式
interface DeviceIdentity {
  deviceId: string;      // FingerprintJS生成的唯一ID
  displayName: string;   // 游客昵称（可编辑）
  createdAt: Date;
}
```

---

### 1.3 数据库扩展

#### 新建Model: GameRoom.ts

**文件路径:** `/lib/db/models/GameRoom.ts`

**Schema设计:**
```typescript
{
  roomId: string,                    // 唯一房间ID
  gameType: 'falling-blocks' | 'blink' | 'typing-walk' | 'falling-words',
  roomName: string,                  // 房间名称
  password?: string,                 // 可选密码（加密存储）
  maxPlayers: number,                // 2-8人
  players: [{
    playerId: string,                // userId或deviceId
    displayName: string,
    isHost: boolean,
    isReady: boolean,
    joinedAt: Date
  }],
  spectators: string[],              // 观众ID列表
  status: 'waiting' | 'playing' | 'finished',
  settings: {
    lessonId?: number,               // 可选：限制字符范围
    difficulty?: string,
    timeLimit?: number,              // 游戏时长（秒）
    seed?: number                    // 随机种子（确保所有人相同内容）
  },
  createdAt: Date,
  startedAt?: Date,
  endedAt?: Date
}
```

**任务清单:**
- [x] 创建GameRoom Schema
- [x] 实现CRUD方法
- [x] 添加索引（roomId, status, gameType）
- [ ] 编写单元测试（Phase 7）

---

#### 新建Model: GameSession.ts

**文件路径:** `/lib/db/models/GameSession.ts`

**Schema设计:**
```typescript
{
  sessionId: string,
  roomId: string,
  gameType: string,
  players: [{
    playerId: string,              // userId或deviceId
    displayName: string,
    score: number,
    rank: number,                  // 1-N排名
    metrics: {
      grossWPM: number,
      netWPM: number,
      accuracy: number,
      keystrokeCount: number,
      errorCount: number
    },
    gameSpecificData: object,     // 游戏特定数据（如Typing Walk的路径完成度）
    completedAt?: Date,
    disconnectedAt?: Date
  }],
  winner: string,                  // 获胜者playerId
  gameData: {
    seed: number,
    duration: number,
    avgWPM: number,
    totalKeystrokes: number
  },
  startedAt: Date,
  endedAt: Date
}
```

**任务清单:**
- [x] 创建GameSession Schema
- [x] 实现保存会话方法
- [x] 实现查询历史记录方法
- [x] 添加复合索引（playerId + gameType）

---

#### 新建Model: Leaderboard.ts

**文件路径:** `/lib/db/models/Leaderboard.ts`

**Schema设计:**
```typescript
{
  _id: ObjectId,
  gameType: 'falling-blocks' | 'blink' | 'typing-walk' | 'falling-words',
  period: 'all-time' | 'daily' | 'weekly' | 'monthly',
  playerId: string,                // userId或deviceId
  playerType: 'user' | 'guest',    // 用于区分登录用户和游客
  displayName: string,
  score: number,                   // 游戏分数
  metrics: {
    wpm: number,
    accuracy: number,
    level?: number,
    time?: number                  // Typing Walk用
  },
  sessionId: string,               // 关联的GameSession
  achievedAt: Date,

  // 时间周期标识
  periodStart: Date,               // 该周期开始时间
  periodEnd?: Date,                // 该周期结束时间（all-time为null）

  // 排名缓存（定期更新）
  rank?: number,

  // 好友排行用
  friendIds?: string[]             // 该记录所属用户的好友列表快照
}
```

**索引策略:**
```typescript
// 复合索引
{ gameType: 1, period: 1, score: -1 }  // 查询排行榜
{ playerId: 1, gameType: 1, period: 1 } // 查询个人记录
{ periodStart: 1, periodEnd: 1 }        // 定时清理任务
```

**任务清单:**
- [x] 创建Leaderboard Schema
- [x] 实现提交记录方法
- [x] 实现查询Top N方法
- [x] 实现好友排行查询
- [x] 添加所有必要索引

---

#### 修改Model: User.ts

**文件路径:** `/lib/db/models/User.ts`

**新增字段:**
```typescript
{
  // 原有字段...

  // 新增：好友系统
  friends: ObjectId[],             // 已接受的好友列表
  friendRequests: [{
    from: ObjectId,
    createdAt: Date
  }],

  // 新增：游客关联
  linkedDeviceIds: string[],       // 该用户曾使用的设备ID（升级游客账号时关联）

  // 新增：游戏统计
  gameStats: {
    totalGamesPlayed: number,
    totalWins: number,
    favoriteGame?: string,
    skillRating: {                 // 匹配用技能评分
      'falling-blocks': number,
      'blink': number,
      'typing-walk': number,
      'falling-words': number
    }
  }
}
```

**任务清单:**
- [x] 添加新字段到User Schema
- [ ] 创建好友请求方法（Phase 5）
- [ ] 创建技能评分计算方法（Phase 2）
- [ ] 编写迁移脚本（如需要）

---

### 1.4 Redis配置

**任务清单:**
- [x] 配置Redis连接 (`/lib/redis/client.ts`)
- [x] 实现房间状态缓存 (`/lib/redis/roomCache.ts`)
- [x] 实现匹配队列 (`/lib/redis/matchQueue.ts`)
- [x] 实现聊天消息缓存
- [ ] 测试Redis读写性能（Phase 2集成测试）

**Redis数据结构设计:**

```typescript
// 1. 房间缓存 (Hash)
Key: `room:{roomId}`
Fields: { roomData: JSON, players: JSON, status: string }
TTL: 24小时

// 2. 匹配队列 (Sorted Set)
Key: `matchqueue:{gameType}:{skillTier}`
Score: 加入时间戳
Member: playerId
TTL: 5分钟（匹配超时）

// 3. 在线玩家 (Set)
Key: `online:players`
Members: playerId列表
TTL: 1小时（心跳刷新）

// 4. 聊天消息 (List)
Key: `chat:lobby` 或 `chat:room:{roomId}`
Type: List (LPUSH新消息，LTRIM保留50条)
TTL: 1小时
```

**文件结构:**
```
/lib/redis/
  client.ts          // Redis连接客户端
  roomCache.ts       // 房间缓存操作
  matchQueue.ts      // 匹配队列操作
  chatCache.ts       // 聊天消息缓存
  types.ts           // Redis相关类型定义
```

---

## 🎮 Phase 2: 游戏大厅功能 (4-5天)

### 2.1 大厅UI组件 ✅

**任务清单:**
- [x] 创建 `/app/multiplayer/page.tsx` - 多人游戏总入口
- [x] 创建 `/components/lobby/GameLobby.tsx` - 大厅主组件
- [x] 创建 `/components/lobby/RoomList.tsx` - 房间列表
- [x] 创建 `/components/lobby/CreateRoomDialog.tsx` - 创建房间弹窗
- [x] 创建 `/components/lobby/QuickMatchButton.tsx` - 快速匹配按钮
- [x] 创建 `/components/lobby/OnlinePlayerList.tsx` - 在线玩家列表
- [x] 创建 `/components/lobby/ChatBox.tsx` - 聊天组件
- [x] 实现响应式布局（移动端适配）

**UI布局:**
```
┌─────────────────────────────────────┐
│  游戏大厅                           │
├─────────────┬───────────────────────┤
│ 房间列表     │  在线玩家 (100+)      │
│             │  ┌─────────────────┐  │
│ [创建房间]  │  │ 玩家1 (准备中)  │  │
│ [快速匹配]  │  │ 玩家2 (游戏中)  │  │
│             │  └─────────────────┘  │
│ Room 1      │                       │
│ Room 2      │  聊天区              │
│ Room 3      │  ┌─────────────────┐  │
│             │  │ 玩家A: gg       │  │
│             │  │ 你: 求带        │  │
│             │  └─────────────────┘  │
└─────────────┴───────────────────────┘
```

---

### 2.2 房间系统功能 ✅

**Socket事件定义:**
```typescript
// 客户端 → 服务器
'room:create'      // 创建房间
'room:join'        // 加入房间
'room:leave'       // 离开房间
'room:ready'       // 准备/取消准备
'room:start'       // 房主开始游戏
'room:kick'        // 房主踢人

// 服务器 → 客户端
'room:created'     // 房间创建成功
'room:updated'     // 房间状态更新
'room:deleted'     // 房间已删除
'player:joined'    // 有玩家加入
'player:left'      // 有玩家离开
'player:ready'     // 玩家准备状态改变
'game:starting'    // 游戏即将开始（倒计时）
'game:started'     // 游戏已开始
```

**任务清单:**
- [x] 实现创建房间逻辑
- [x] 实现加入房间验证（密码、人数）
- [x] 实现房主权限控制
- [x] 实现玩家准备机制
- [x] 实现房间自动清理（空房间5分钟后删除）
- [x] 编写Socket事件处理器
- [x] 测试并发场景

**文件路径:**
```
/app/api/room/create/route.ts
/app/api/room/join/route.ts
/app/api/room/[roomId]/route.ts
/lib/services/roomManager.ts
```

---

### 2.3 快速匹配系统 ✅

**匹配算法流程:**
```
1. 用户点击"快速匹配" → 选择游戏类型
2. 后端计算用户技能评分 (基于历史数据)
3. 确定技能分段 (Beginner/Intermediate/Advanced/Expert)
4. 加入Redis匹配队列: matchqueue:{gameType}:{tier}
5. 每5秒运行匹配器:
   a. 从队列中取出等待最久的玩家
   b. 尝试匹配2-4个相近玩家
   c. 如果成功 → 创建房间，通知所有玩家,自动开始倒计时
   d. 如果失败 → 放宽匹配范围（跨tier）或继续等待
6. 30秒无匹配 → 提示用户"匹配人数较少，是否继续等待？"
```

**技能评分算法:**
```typescript
function calculateSkillRating(gameType: string, playerId: string): number {
  // 获取该玩家最近10场游戏的平均WPM
  const recentGames = getRecentGames(playerId, gameType, 10);
  const avgWPM = average(recentGames.map(g => g.metrics.netWPM));
  const avgAccuracy = average(recentGames.map(g => g.metrics.accuracy));

  // 综合评分 = WPM * 0.7 + Accuracy * 0.3
  return avgWPM * 0.7 + avgAccuracy * 0.3;
}

// 技能分段
function getSkillTier(rating: number): string {
  if (rating < 30) return 'beginner';
  if (rating < 50) return 'intermediate';
  if (rating < 70) return 'advanced';
  return 'expert';
}
```

**任务清单:**
- [x] 实现技能评分计算
- [x] 创建匹配队列服务
- [x] 实现匹配算法核心逻辑
- [x] 创建定时匹配任务（5秒间隔）
- [x] 实现取消匹配功能
- [x] 添加匹配超时处理
- [x] 测试匹配成功率

**文件路径:**
```
/lib/services/matchmaking.ts
/lib/services/skillRating.ts
/app/api/match/queue/route.ts
/app/api/match/cancel/route.ts
```

---

### 2.4 聊天系统 ✅

**功能需求:**
- 大厅全局聊天（所有在线玩家）
- 房间私聊（仅房间内玩家）
- 敏感词过滤
- 防刷屏限制

**Socket事件:**
```typescript
// 客户端 → 服务器
'chat:send' {
  type: 'lobby' | 'room',
  roomId?: string,
  message: string
}

// 服务器 → 客户端
'chat:message' {
  type: 'lobby' | 'room',
  playerId: string,
  displayName: string,
  message: string,
  timestamp: number
}

'chat:error' {
  code: 'RATE_LIMIT' | 'BAD_WORD' | 'TOO_LONG'
}
```

**限制规则:**
```typescript
const CHAT_LIMITS = {
  MAX_LENGTH: 200,           // 最大字符数
  RATE_LIMIT: 2,             // 每秒最多2条
  HISTORY_SIZE: 50,          // 保留最近50条消息
  MUTE_DURATION: 60000       // 违规禁言1分钟
};
```

**任务清单:**
- [x] 创建聊天组件UI
- [x] 实现Socket聊天事件
- [x] 实现速率限制（Redis计数器）
- [x] 实现敏感词过滤（简单版）
- [x] 实现消息历史加载
- [x] 添加举报功能（可选）
- [x] 测试高并发聊天

**文件路径:**
```
/components/lobby/ChatBox.tsx
/lib/services/chatService.ts
/lib/utils/profanityFilter.ts
```

---

## 🔄 Phase 3: 实时游戏同步 (5-6天)

### 3.1 游戏引擎抽象层 ✅

**任务清单:**
- [x] 创建 `/lib/game-engine/` 目录
- [x] 实现 `BaseMultiplayerGame.ts` 抽象类
- [x] 定义 `GameState.ts` 通用游戏状态
- [x] 定义 `PlayerState.ts` 玩家状态
- [x] 定义 `GameInput.ts` 输入事件类型
- [x] 实现游戏状态序列化/反序列化

**BaseMultiplayerGame 抽象类:**
```typescript
abstract class BaseMultiplayerGame {
  protected roomId: string;
  protected players: Map<string, PlayerState>;
  protected gameState: GameState;
  protected rngSeed: number;

  constructor(roomId: string, players: PlayerInfo[], seed: number) {
    this.roomId = roomId;
    this.rngSeed = seed;
    this.initPlayers(players);
    this.initGame();
  }

  // 子类必须实现
  abstract initGame(): void;
  abstract handlePlayerInput(playerId: string, input: GameInput): InputResult;
  abstract updateGameState(deltaTime: number): void;
  abstract checkWinCondition(): string | null;
  abstract serialize(): SerializedGameState;

  // 通用方法
  getPlayerState(playerId: string): PlayerState;
  getAllPlayerStates(): PlayerState[];
  isGameOver(): boolean;
  getWinner(): string | null;
}
```

**GameState 接口:**
```typescript
interface GameState {
  roomId: string;
  gameType: string;
  status: 'waiting' | 'countdown' | 'playing' | 'finished';
  startTime: number;
  currentTime: number;
  elapsedTime: number;
  seed: number;

  // 游戏特定状态（子类扩展）
  gameSpecificState: any;
}
```

**PlayerState 接口:**
```typescript
interface PlayerState {
  playerId: string;
  displayName: string;
  isConnected: boolean;
  isFinished: boolean;

  // 通用指标
  score: number;
  level: number;
  lives?: number;

  // 打字指标
  keystrokeCount: number;
  correctKeystrokes: number;
  errorCount: number;
  currentWPM: number;
  accuracy: number;

  // 游戏特定数据（子类扩展）
  gameSpecificData: any;
}
```

---

### 3.2 每个游戏的多人适配

#### 3.2.1 Falling Blocks 多人版 ✅

**文件:** `/lib/game-engine/FallingBlocksMultiplayer.ts`

**多人机制:**
- 所有玩家看到**相同的block生成序列**（共享RNG种子）
- 各自独立打字，互不干扰
- 实时同步各玩家的分数和level
- 胜利条件：时间到或所有人Game Over，最高分者胜

**状态同步:**
```typescript
interface FallingBlocksGameState extends GameState {
  gameSpecificState: {
    blocks: FallingBlock[];      // 当前屏幕上的所有blocks
    nextBlockId: number;
    spawnInterval: number;
    gameSpeed: number;
  };
}

interface FallingBlocksPlayerState extends PlayerState {
  gameSpecificData: {
    activeTargetBlockId?: number;  // 当前正在打的block
  };
}
```

**任务清单:**
- [x] 实现共享RNG的block生成逻辑
- [x] 修复初始block生成数量（从3个改为1个）
- [x] 实现平局检测逻辑
- [x] 修复聊天系统（添加type字段和callback处理）
- [x] 修复敏感词过滤假阳性（移除短词如'hell'）
- [x] 修复Socket断线重连问题（离开房间后返回大厅）
- [x] 创建离开房间测试（Playwright E2E）
- [x] 实现玩家输入验证（防作弊）
- [x] 实现分屏UI（2-4人布局）
- [x] 实现实时状态广播（每100ms）
- [ ] 测试多人同步准确性

---

#### 3.2.2 Blink 多人版

**文件:** `/lib/game-engine/BlinkMultiplayer.ts`

**多人机制:**
- 所有玩家看到**相同字符序列**
- 同时显示，比谁打得快
- 每个字符有时间限制，超时扣分
- 实时排名显示

**状态同步:**
```typescript
interface BlinkGameState extends GameState {
  gameSpecificState: {
    currentChar: string;
    charStartTime: number;
    timeLimit: number;
    charSequence: string[];      // 预生成的字符序列
    currentCharIndex: number;
  };
}

interface BlinkPlayerState extends PlayerState {
  gameSpecificData: {
    streak: number;              // 当前连击数
    bestStreak: number;
    responseTime: number;        // 最近一次反应时间（ms）
    avgResponseTime: number;
  };
}
```

**任务清单:**
- [x] 实现字符序列预生成 ✅ (使用 seeded RNG)
- [x] 实现精确计时（服务器时间戳） ✅
- [x] 实现抢答机制（先答对者得分最高） ✅ (Ranking: 1st=100+bonus, 2nd=50, 3rd=30, others=10)
- [x] 显示每个玩家的反应时间 ✅ (实时记录 responseTime)
- [x] 添加连击特效 ✅ (Streak bonus: 3+ consecutive = +10 per additional)
- [ ] 创建 MultiplayerBlink 客户端组件

---

#### 3.2.3 Typing Walk 多人版

**文件:** `/lib/game-engine/TypingWalkMultiplayer.ts`

**多人机制:**
- 所有玩家在**相同的地图**上赛跑
- 实时显示对手的位置（头像）
- 先到达终点者获胜
- 可以看到对手的移动轨迹

**状态同步:**
```typescript
interface TypingWalkGameState extends GameState {
  gameSpecificState: {
    grid: GridCell[][];          // 共享地图
    pathSequence: Position[];    // 预生成的路径
    gridSeed: number;
  };
}

interface TypingWalkPlayerState extends PlayerState {
  gameSpecificData: {
    currentRow: number;
    currentCol: number;
    pathIndex: number;           // 当前在路径上的位置索引
    visitedCells: Position[];
    remainingLives: number;
  };
}
```

**UI增强:**
```
┌────────────────────┐
│ 🏁              👤B│  <- 玩家B位置
│     👤A            │  <- 你的位置
│                    │
│         👤C        │  <- 玩家C位置
│                 🎯 │
└────────────────────┘
```

**任务清单:**
- [ ] 实现共享地图生成
- [ ] 实时同步所有玩家位置
- [ ] 显示对手头像和昵称
- [ ] 实现胜利判定（第一个到达）
- [ ] 添加位置平滑插值（减少卡顿感）

---

#### 3.2.4 Falling Words 多人版 ✅

**文件:** `/lib/game-engine/FallingWordsMultiplayer.ts`

**多人机制（独立进度模式）:**
- 所有玩家看到**相同的词汇序列**（共享RNG种子）
- 各自独立打字，互不干扰
- **每个玩家独立跟踪完成/丢失的词** - 完成的词只对该玩家消失
- 词汇仅在所有玩家都完成或丢失后才从共享状态移除
- 胜利条件：达到最大丢失词数前完成最多词汇者胜

**状态同步:**
```typescript
interface FallingWordsGameState extends GameState {
  gameSpecificState: {
    words: FallingWord[];        // 当前屏幕上的词（共享）
    wordPool: string[];          // 预生成的词汇池
    nextWordIndex: number;
    spawnInterval: number;
    bottomThreshold: number;     // 词汇掉落阈值
  };
}

interface FallingWord {
  id: number;
  word: string;
  x: number;
  y: number;
  speed: number;
}

interface FallingWordsPlayerState extends PlayerState {
  gameSpecificData: {
    currentWordId: number | null;      // 正在打的词
    typedProgress: string;             // 已输入进度
    wordsCompleted: number;
    wordsLost: number;                 // 掉落的词（惩罚）
    maxLostWords: number;              // 最大丢失数（5个）
    completedWordIds: Set<number>;     // 该玩家已完成的词ID
    lostWordIds: Set<number>;          // 该玩家已丢失的词ID
  };
}
```

**任务清单:**
- [x] 实现词汇池预生成（共享RNG种子）✅
- [x] 实现每玩家独立进度跟踪 ✅
- [x] 实现词汇仅在所有玩家处理后移除 ✅
- [x] 实现分屏UI（2-4人布局）✅
- [x] 每个玩家面板独立过滤显示词汇 ✅
- [x] 实现玩家输入验证（防作弊）✅
- [x] 显示每个玩家的实时统计（分数、完成数、准确率、生命值）✅
- [x] Playwright E2E测试验证 ✅

---

### 3.3 服务器权威验证

**防作弊策略:**

**文件:** `/lib/services/antiCheat.ts`

```typescript
class AntiCheatValidator {
  // 1. WPM合理性检测
  validateWPM(wpm: number, keystrokeHistory: Keystroke[]): boolean {
    const MAX_HUMAN_WPM = 200;
    if (wpm > MAX_HUMAN_WPM) return false;

    // 检查按键间隔
    const intervals = calculateIntervals(keystrokeHistory);
    const avgInterval = average(intervals);
    if (avgInterval < 30) return false; // 小于30ms不合理

    return true;
  }

  // 2. 准确率异常检测
  validateAccuracy(accuracy: number, wpm: number): boolean {
    // 100%准确率 + 超高WPM = 可疑
    if (accuracy === 100 && wpm > 150) return false;
    return true;
  }

  // 3. 输入时序验证
  validateTimestamps(keystrokes: Keystroke[]): boolean {
    for (let i = 1; i < keystrokes.length; i++) {
      const interval = keystrokes[i].timestamp - keystrokes[i-1].timestamp;
      if (interval < 0 || interval > 10000) return false; // 时间戳异常
    }
    return true;
  }

  // 4. 游戏物理验证（以Typing Walk为例）
  validatePosition(currentPos: Position, prevPos: Position): boolean {
    // 只能移动到相邻格子
    const dx = Math.abs(currentPos.col - prevPos.col);
    const dy = Math.abs(currentPos.row - prevPos.row);
    return dx + dy === 1;
  }
}
```

**任务清单:**
- [ ] 实现WPM验证
- [ ] 实现准确率验证
- [ ] 实现时间戳验证
- [ ] 实现游戏物理验证
- [ ] 记录可疑行为日志
- [ ] 创建管理员审查面板（可选）

**API端点:**
```
POST /api/game/validate/input
POST /api/game/validate/result
GET /api/admin/suspicious-players
```

---

### 3.4 客户端预测与服务器和解

**目标:** 减少延迟感，即使网络延迟200ms也能流畅游戏

**实现策略:**

```typescript
// 客户端代码
class GameClientPrediction {
  private localState: GameState;
  private serverState: GameState;
  private pendingInputs: GameInput[] = [];

  // 用户输入立即应用到本地状态
  handleInput(input: GameInput) {
    // 1. 立即更新本地状态（预测）
    this.localState = this.applyInput(this.localState, input);

    // 2. 记录输入，等待服务器确认
    this.pendingInputs.push(input);

    // 3. 发送到服务器
    socket.emit('game:input', input);

    // 4. 立即渲染（无延迟）
    this.render();
  }

  // 接收服务器权威状态
  onServerUpdate(serverState: GameState) {
    // 1. 保存服务器状态
    this.serverState = serverState;

    // 2. 检查差异
    const diff = this.compareStates(this.localState, serverState);

    if (diff.significant) {
      // 3a. 差异较大，强制同步（用户可能作弊被修正）
      this.localState = serverState;
      this.pendingInputs = [];
    } else {
      // 3b. 差异较小，平滑插值
      this.localState = this.interpolate(this.localState, serverState, 0.3);
    }

    // 4. 重新应用未确认的输入（客户端预测）
    for (const input of this.pendingInputs) {
      this.localState = this.applyInput(this.localState, input);
    }

    this.render();
  }
}
```

**任务清单:**
- [ ] 实现客户端预测逻辑
- [ ] 实现服务器和解逻辑
- [ ] 实现状态插值（位置、分数等）
- [ ] 测试高延迟场景（200ms）
- [ ] 优化同步频率（100ms vs 200ms）

---

## 👀 Phase 4: 观战模式 (2天)

### 4.1 观战系统

**功能需求:**
- 从房间列表进入观战
- 实时观看所有玩家的游戏画面
- 显示实时排名和统计数据
- 观众可以发送评论（不影响游戏）
- 观众上限：20人/房间

**Socket事件:**
```typescript
// 客户端 → 服务器
'spectator:join' { roomId: string }
'spectator:leave' { roomId: string }
'spectator:chat' { roomId: string, message: string }

// 服务器 → 观众
'spectator:joined' { roomId: string, currentState: GameState }
'game:state:spectator' { state: GameState } // 每200ms
'spectator:playerCount' { count: number }
```

**任务清单:**
- [ ] 创建 `/components/spectator/SpectatorView.tsx`
- [ ] 实现加入/离开观战逻辑
- [ ] 实现游戏状态广播（观众专用）
- [ ] 创建多画面展示UI
- [ ] 实现观众聊天（独立于玩家聊天）
- [ ] 添加观众人数限制
- [ ] 测试高观众数量场景

**UI布局:**
```
┌─────────────────────────────────────┐
│  🔴 LIVE - Typing Walk (观战模式)   │
├─────────────┬───────────────────────┤
│ 玩家1画面   │  实时排名             │
│ (第1名)     │  1. 玩家1  1250分     │
│             │  2. 玩家2  1100分     │
├─────────────┤  3. 玩家3   980分     │
│ 玩家2画面   │                       │
│ (第2名)     │  WPM统计图           │
│             │  📈 ╱╲╱╲             │
├─────────────┤                       │
│ 玩家3画面   │  观众评论 (50+人)     │
│ (第3名)     │  观众A: 666          │
│             │  观众B: 玩家1好强    │
└─────────────┴───────────────────────┘
```

---

## 🏆 Phase 5: 排行榜系统 (3天)

### 5.1 排行榜API

**任务清单:**
- [ ] 创建 `/app/api/leaderboard/[gameType]/route.ts`
- [ ] 实现查询全球榜（all-time）
- [ ] 实现查询周期榜（daily/weekly/monthly）
- [ ] 实现个人最佳记录查询
- [ ] 实现排名变化跟踪
- [ ] 添加缓存（Redis，5分钟）

**API端点:**
```typescript
// GET /api/leaderboard/falling-blocks?period=daily&limit=100
Response: {
  leaderboard: [{
    rank: 1,
    playerId: "xxx",
    displayName: "Player1",
    score: 5000,
    metrics: { wpm: 85, accuracy: 98 },
    achievedAt: "2025-01-10T12:00:00Z"
  }],
  myRank: 42,
  myBestScore: 4200,
  totalPlayers: 10000
}
```

---

### 5.2 好友排行榜

**任务清单:**
- [ ] 创建 `/app/api/leaderboard/friends/route.ts`
- [ ] 查询当前用户的好友列表
- [ ] 获取每个好友的最佳成绩
- [ ] 合并排序并返回
- [ ] 需要登录才能访问

**API端点:**
```typescript
// GET /api/leaderboard/friends?gameType=blink
Response: {
  friendsLeaderboard: [{
    rank: 1,
    userId: "friend1",
    displayName: "好友A",
    score: 3000,
    isFriend: true,
    achievedAt: "2025-01-10"
  }, {
    rank: 2,
    userId: "me",
    displayName: "我",
    score: 2500,
    isMe: true
  }]
}
```

---

### 5.3 排行榜UI

**任务清单:**
- [ ] 创建 `/components/leaderboard/LeaderboardTabs.tsx`
- [ ] 创建 `/components/leaderboard/LeaderboardTable.tsx`
- [ ] 创建 `/components/leaderboard/PlayerRankCard.tsx`
- [ ] 实现选项卡切换（游戏类型、时间周期）
- [ ] 实现分页加载（100条/页）
- [ ] 实现个人排名高亮
- [ ] 添加奖牌图标（前3名）

**页面路径:** `/app/leaderboard/page.tsx`

**UI布局:**
```
┌─────────────────────────────────────┐
│  🏆 排行榜                          │
├─────────────────────────────────────┤
│ [全球榜] [每日] [每周] [每月] [好友]│
├─────────────────────────────────────┤
│ [Falling Blocks] [Blink] [Walk] [Words]
├─────┬─────────────┬───────┬─────────┤
│ 排名│ 玩家        │ 分数  │ 详情    │
├─────┼─────────────┼───────┼─────────┤
│ 🥇1 │ Player1     │ 5000  │ 85WPM   │
│ 🥈2 │ Player2     │ 4800  │ 82WPM   │
│ 🥉3 │ Player3     │ 4500  │ 80WPM   │
│  4  │ Player4     │ 4200  │ 78WPM   │
│ ... │             │       │         │
│ 42  │ 你 👈       │ 3000  │ 65WPM   │
└─────┴─────────────┴───────┴─────────┘
```

---

### 5.4 定时任务 (排行榜重置)

**任务清单:**
- [ ] 安装 `node-cron` 库
- [ ] 创建 `/lib/cron/leaderboardReset.ts`
- [ ] 实现每日榜重置（每天0点UTC）
- [ ] 实现每周榜重置（每周一0点）
- [ ] 实现每月榜重置（每月1号0点）
- [ ] 归档旧数据到历史表
- [ ] 配置定时任务启动（在服务器启动时）

**Cron表达式:**
```typescript
import cron from 'node-cron';

// 每天0点UTC
cron.schedule('0 0 * * *', resetDailyLeaderboard);

// 每周一0点UTC
cron.schedule('0 0 * * 1', resetWeeklyLeaderboard);

// 每月1号0点UTC
cron.schedule('0 0 1 * *', resetMonthlyLeaderboard);
```

---

### 5.5 好友系统

**任务清单:**
- [ ] 创建 `/app/api/friends/add/route.ts` - 发送好友请求
- [ ] 创建 `/app/api/friends/accept/route.ts` - 接受请求
- [ ] 创建 `/app/api/friends/reject/route.ts` - 拒绝请求
- [ ] 创建 `/app/api/friends/remove/route.ts` - 删除好友
- [ ] 创建 `/app/api/friends/list/route.ts` - 好友列表
- [ ] 创建 `/app/api/friends/requests/route.ts` - 待处理请求
- [ ] 创建好友管理UI组件
- [ ] 实现好友搜索功能

**好友系统UI:**
```
┌─────────────────────────────────────┐
│  👥 好友 (15)                       │
├─────────────────────────────────────┤
│ [搜索好友]  [待处理请求(3)]        │
├─────────────────────────────────────┤
│ 好友A      🟢在线    [发起对战]    │
│ 好友B      ⚫离线    [查看资料]    │
│ 好友C      🎮游戏中  [观战]        │
└─────────────────────────────────────┘
```

---

## 🎨 Phase 6: UI集成与优化 (3天)

### 6.1 游戏页面改造

**任务清单:**

**修改以下文件:**
- [ ] `/app/games/falling-blocks/page.tsx`
- [ ] `/app/games/blink/page.tsx`
- [ ] `/app/games/typing-walk/page.tsx`
- [ ] `/app/games/falling-words/page.tsx`

**改造内容:**
1. 添加模式选择UI（单人 vs 多人）
2. 多人模式跳转到房间创建/匹配页面
3. 保留单人模式原有逻辑
4. 添加"邀请好友"按钮

**UI示例:**
```
┌─────────────────────────────────────┐
│  Falling Blocks                     │
├─────────────────────────────────────┤
│  选择游戏模式:                      │
│  ┌──────────┐  ┌──────────┐        │
│  │ 单人模式 │  │ 多人对战 │        │
│  │ 练习模式 │  │ 实时竞技 │        │
│  └──────────┘  └──────────┘        │
│                                     │
│  或者                               │
│  [创建私人房间]  [快速匹配]        │
└─────────────────────────────────────┘
```

---

### 6.2 多人游戏UI组件

**任务清单:**

**新建 `/components/multiplayer/` 目录:**
- [ ] `MultiplayerGameWrapper.tsx` - 多人游戏容器
- [ ] `PlayerList.tsx` - 实时玩家列表
- [ ] `GameCountdown.tsx` - 游戏开始倒计时
- [ ] `WinnerDialog.tsx` - 游戏结束结果弹窗
- [ ] `RealtimeStats.tsx` - 实时统计图表
- [ ] `DisconnectWarning.tsx` - 断线重连提示

**MultiplayerGameWrapper 功能:**
- 包裹实际游戏组件
- 显示所有玩家的实时状态
- 处理Socket连接/断线
- 同步游戏状态

**PlayerList UI:**
```
┌─────────────────────┐
│ 玩家列表            │
├─────────────────────┤
│ 👑 玩家1 (房主)    │
│ 📊 1250分  85WPM   │
│ ━━━━━━━━━━ 98%    │
├─────────────────────┤
│ 👤 玩家2 (你)      │
│ 📊 1100分  82WPM   │
│ ━━━━━━━━━━ 95%    │
├─────────────────────┤
│ 👤 玩家3            │
│ 📊 980分   78WPM   │
│ ━━━━━━━━━━ 92%    │
└─────────────────────┘
```

**GameCountdown UI:**
```
┌─────────────────────┐
│                     │
│       准备开始       │
│                     │
│         3          │
│                     │
│    所有玩家已准备   │
└─────────────────────┘
```

**WinnerDialog UI:**
```
┌─────────────────────────────┐
│  🏆 游戏结束                │
├─────────────────────────────┤
│  🥇 玩家1 - 1250分          │
│     85 WPM | 98% 准确率     │
├─────────────────────────────┤
│  🥈 你 - 1100分             │
│     82 WPM | 95% 准确率     │
├─────────────────────────────┤
│  🥉 玩家3 - 980分           │
│     78 WPM | 92% 准确率     │
├─────────────────────────────┤
│  [再来一局]  [返回大厅]    │
└─────────────────────────────┘
```

---

### 6.3 响应式分屏布局

**任务清单:**
- [ ] 实现2人横向分屏布局
- [ ] 实现3-4人网格布局
- [ ] 实现5-8人小窗布局
- [ ] 移动端适配（竖屏堆叠）
- [ ] 添加切换视角功能（焦点玩家）

**布局示例:**

**2人横向:**
```
┌─────────────┬─────────────┐
│  玩家1画面  │  你的画面   │
│             │             │
│             │             │
└─────────────┴─────────────┘
```

**4人网格:**
```
┌───────┬───────┐
│ 玩家1 │ 玩家2 │
├───────┼───────┤
│   你  │ 玩家4 │
└───────┴───────┘
```

**8人小窗 (可滚动):**
```
┌──────────────────────┐
│ 👤1 👤2 👤3 👤4 👤5  │
│ 👤你 👤7 👤8 ───→    │
└──────────────────────┘
```

---

## 🌍 Phase 7: 国际化与测试 (2天)

### 7.1 新增翻译

**任务清单:**

**更新以下文件 (6种语言):**
- [ ] `/lib/i18n/locales/en.json`
- [ ] `/lib/i18n/locales/zh.json`
- [ ] `/lib/i18n/locales/ja.json`
- [ ] `/lib/i18n/locales/es.json`
- [ ] `/lib/i18n/locales/fr.json`
- [ ] `/lib/i18n/locales/th.json`

**新增翻译键:**
```json
{
  "multiplayer": {
    "title": "多人游戏",
    "lobby": "游戏大厅",
    "createRoom": "创建房间",
    "joinRoom": "加入房间",
    "quickMatch": "快速匹配",
    "roomName": "房间名称",
    "password": "密码",
    "maxPlayers": "最大人数",
    "players": "玩家",
    "waiting": "等待中",
    "ready": "准备",
    "notReady": "未准备",
    "start": "开始游戏",
    "spectate": "观战",
    "spectators": "观众",
    "chat": "聊天",
    "online": "在线",
    "offline": "离线",
    "inGame": "游戏中",

    "matchmaking": {
      "searching": "匹配中...",
      "found": "找到对手！",
      "timeout": "匹配超时",
      "cancel": "取消匹配"
    },

    "room": {
      "host": "房主",
      "public": "公开",
      "private": "私密",
      "full": "已满",
      "kick": "踢出",
      "invite": "邀请"
    },

    "game": {
      "countdown": "游戏即将开始",
      "winner": "获胜者",
      "rank": "排名",
      "score": "分数",
      "wpm": "速度",
      "accuracy": "准确率",
      "rematch": "再来一局",
      "returnToLobby": "返回大厅"
    },

    "leaderboard": {
      "title": "排行榜",
      "rank": "排名",
      "player": "玩家",
      "score": "分数",
      "details": "详情",
      "allTime": "全球总榜",
      "daily": "每日榜",
      "weekly": "每周榜",
      "monthly": "每月榜",
      "friends": "好友榜",
      "myRank": "我的排名",
      "notRanked": "未上榜"
    },

    "friends": {
      "title": "好友",
      "addFriend": "添加好友",
      "friendRequests": "好友请求",
      "accept": "接受",
      "reject": "拒绝",
      "remove": "删除好友",
      "challenge": "发起对战",
      "viewProfile": "查看资料"
    },

    "errors": {
      "roomFull": "房间已满",
      "wrongPassword": "密码错误",
      "alreadyInGame": "已在游戏中",
      "connectionLost": "连接丢失",
      "reconnecting": "重新连接中..."
    }
  }
}
```

---

### 7.2 测试计划

#### 7.2.1 单元测试

**任务清单:**
- [ ] 游戏逻辑测试 (`lib/game-engine/*.test.ts`)
  - 测试每个游戏的初始化
  - 测试玩家输入处理
  - 测试胜利条件判定
  - 测试状态序列化/反序列化

- [ ] 匹配算法测试 (`lib/services/matchmaking.test.ts`)
  - 测试技能评分计算
  - 测试匹配队列操作
  - 测试匹配超时处理

- [ ] 排行榜查询测试 (`lib/db/models/Leaderboard.test.ts`)
  - 测试插入新记录
  - 测试查询Top N
  - 测试周期榜过滤
  - 测试好友排行

- [ ] 防作弊测试 (`lib/services/antiCheat.test.ts`)
  - 测试WPM异常检测
  - 测试准确率异常检测
  - 测试时间戳验证

**测试框架:** Jest + React Testing Library

---

#### 7.2.2 集成测试

**任务清单:**
- [ ] Socket连接测试
  - 测试客户端连接/断开
  - 测试房间加入/离开
  - 测试消息广播

- [ ] 房间系统测试
  - 测试创建房间
  - 测试加入房间（密码验证）
  - 测试房主权限
  - 测试游戏开始流程

- [ ] 游戏同步测试
  - 测试状态广播频率
  - 测试客户端预测准确性
  - 测试服务器和解逻辑

**工具:** Supertest + Socket.IO Client

---

#### 7.2.3 性能测试

**任务清单:**
- [ ] 并发玩家测试
  - 模拟100个并发玩家
  - 测试服务器CPU/内存使用
  - 测试Redis负载

- [ ] 网络延迟测试
  - 模拟50ms, 100ms, 200ms延迟
  - 测试游戏流畅度
  - 测试状态同步准确性

- [ ] 数据库查询性能
  - 测试排行榜查询速度（100k记录）
  - 测试索引效率

**工具:** Artillery.io + k6

---

#### 7.2.4 端到端测试

**任务清单:**
- [ ] 完整游戏流程测试
  1. 用户进入大厅
  2. 创建房间
  3. 其他用户加入
  4. 开始游戏
  5. 完成游戏
  6. 查看结果和排行榜

- [ ] 快速匹配流程测试
- [ ] 观战功能测试
- [ ] 好友系统测试

**工具:** Playwright / Cypress

---

## ✅ Phase 2 完成总结 (2025-01-11)

### 已完成的工作

**1. 游戏大厅UI组件**
- ✅ 创建多人游戏入口页面 `/app/multiplayer/page.tsx`
- ✅ 实现房间列表和创建房间对话框
- ✅ 实现快速匹配按钮和在线玩家列表
- ✅ 实现聊天组件（大厅全局聊天和房间私聊）
- ✅ 响应式布局支持移动端

**2. 房间系统功能**
- ✅ 实现房间创建、加入、离开逻辑
- ✅ 实现房主权限控制和玩家准备机制
- ✅ 实现三层自动清理策略：
  - 连接时自动清理玩家的陈旧房间成员资格
  - 定期清理（每5分钟）
  - 增强的清理方法（等待房间30分钟，游戏房间2小时）
- ✅ Socket事件处理器完整实现
- ✅ Playwright E2E测试验证（房间创建测试通过）

**3. 快速匹配系统**
- ✅ 实现技能评分计算（基于WPM和准确率）
- ✅ 创建Redis匹配队列服务
- ✅ 实现匹配算法（技能分段、超时处理）
- ✅ 实现取消匹配功能
- ✅ Playwright E2E测试验证（快速匹配测试通过）

**4. 聊天系统**
- ✅ 实现敏感词过滤系统（多语言支持）
- ✅ 实现速率限制（Redis计数器）
- ✅ 实现自动禁言机制（违规禁言1分钟）
- ✅ 实现消息历史缓存（保留最近50条）
- ✅ Socket聊天事件完整实现

**5. 工具和服务**
- ✅ 创建 `profanityFilter.ts` - 敏感词检测和过滤
- ✅ 创建 `nameGenerator.ts` - 游客昵称生成器
- ✅ 创建手动清理脚本 `scripts/cleanup-stale-rooms.ts`
- ✅ 集成自动清理到服务器启动流程

**6. 测试验证**
- ✅ 房间创建流程测试通过
- ✅ 快速匹配流程测试通过
- ✅ 陈旧房间清理机制验证通过

### 文件清单 (Phase 2新增)

**新增组件:**
```
/components/lobby/
  GameLobby.tsx
  RoomList.tsx
  RoomCard.tsx
  CreateRoomDialog.tsx
  JoinRoomDialog.tsx (可选)
  QuickMatchButton.tsx
  OnlinePlayerList.tsx
  ChatBox.tsx
```

**新增工具:**
```
/lib/utils/
  profanityFilter.ts
  nameGenerator.ts
```

**新增脚本:**
```
/scripts/
  cleanup-stale-rooms.ts
```

**测试文件:**
```
/playwright-tests/
  test-room-creation.ts
  test-quick-match.ts
```

### 下一步工作 (Phase 3)

Phase 3 将专注于实时游戏同步：
1. ✅ 游戏引擎抽象层（已完成）
2. ✅ Falling Blocks多人适配（基础已完成）
3. ⏳ 剩余3个游戏的多人适配
4. ⏳ 服务器权威验证（防作弊）
5. ⏳ 客户端预测与服务器和解
6. ⏳ Socket.IO游戏事件集成

---

## ✅ Phase 1 完成总结 (2025-01-11)

### 已完成的工作

**1. 核心依赖安装**
- ✅ Socket.IO (socket.io, socket.io-client)
- ✅ FingerprintJS (@fingerprintjs/fingerprintjs)
- ✅ Node-cron (node-cron, @types/node-cron)
- ✅ IORedis (ioredis)

**2. 类型系统**
- ✅ `/types/multiplayer.ts` - 多人游戏核心类型
- ✅ `/types/socket.ts` - Socket.IO事件类型

**3. Redis服务**
- ✅ `/lib/redis/client.ts` - Redis客户端连接
- ✅ `/lib/redis/roomCache.ts` - 房间缓存服务
- ✅ `/lib/redis/matchQueue.ts` - 匹配队列服务
- ✅ `/lib/redis/chatCache.ts` - 聊天缓存服务
- ✅ `/lib/redis/types.ts` - Redis类型定义

**4. Socket.IO基础架构**
- ✅ `/lib/services/socketServer.ts` - 服务器核心逻辑
- ✅ `/lib/services/socketClient.ts` - 客户端连接管理
- ✅ `/app/api/socket/route.ts` - Socket API路由
- ✅ 事件处理器框架 (roomHandlers, matchHandlers, gameHandlers, chatHandlers, spectatorHandlers)

**5. 设备识别服务**
- ✅ `/lib/services/deviceId.ts` - 设备指纹生成和管理
- ✅ 游客昵称生成
- ✅ localStorage持久化

**6. 数据库模型**
- ✅ `/lib/db/models/User.ts` - 扩展多人游戏字段（friends, gameStats等）
- ✅ `/lib/db/models/GameRoom.ts` - 游戏房间模型（含方法和索引）
- ✅ `/lib/db/models/GameSession.ts` - 游戏会话记录模型
- ✅ `/lib/db/models/Leaderboard.ts` - 排行榜模型（支持多周期）

### 文件清单 (Phase 1)

**新增文件: 20个**
```
/types/
  multiplayer.ts
  socket.ts

/lib/redis/
  client.ts
  types.ts
  roomCache.ts
  matchQueue.ts
  chatCache.ts

/lib/services/
  deviceId.ts
  socketServer.ts
  socketClient.ts
  socketHandlers/
    roomHandlers.ts
    matchHandlers.ts
    gameHandlers.ts
    chatHandlers.ts
    spectatorHandlers.ts

/lib/db/models/
  GameRoom.ts
  GameSession.ts
  Leaderboard.ts

/app/api/socket/
  route.ts
```

**修改文件: 1个**
```
/lib/db/models/User.ts (添加多人游戏字段)
```

### 下一步工作 (Phase 2)

即将开始游戏大厅系统的开发：
1. 房间管理API和逻辑
2. 快速匹配算法实现
3. 大厅UI组件
4. 聊天系统完善
5. Socket事件处理器实现

---

## 📦 依赖安装清单

```bash
# WebSocket (已安装 ✅)
npm install socket.io socket.io-client

# 设备指纹 (已安装 ✅)
npm install @fingerprintjs/fingerprintjs

# 定时任务
npm install node-cron
npm install --save-dev @types/node-cron

# Redis客户端（如果当前的不兼容）
npm install ioredis
npm install --save-dev @types/ioredis

# 测试工具
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev supertest @types/supertest
npm install --save-dev artillery k6

# 可选：性能监控
npm install @socket.io/admin-ui  # Socket.IO管理面板
```

---

## 📂 完整文件结构

```
/app/
  multiplayer/
    page.tsx                              ✅ 多人游戏入口
    room/
      [roomId]/
        page.tsx                          ✅ 房间页面
  leaderboard/
    page.tsx                              ✅ 排行榜页面
  api/
    socket/
      route.ts                            ✅ Socket.IO服务器
    room/
      create/route.ts                     ✅ 创建房间
      join/route.ts                       ✅ 加入房间
      [roomId]/
        route.ts                          ✅ 房间详情
        kick/route.ts                     ✅ 踢人
        start/route.ts                    ✅ 开始游戏
    match/
      queue/route.ts                      ✅ 加入匹配队列
      cancel/route.ts                     ✅ 取消匹配
    game/
      validate/
        input/route.ts                    ✅ 验证输入
        result/route.ts                   ✅ 验证结果
      session/
        [sessionId]/route.ts              ✅ 游戏会话详情
    leaderboard/
      [gameType]/
        route.ts                          ✅ 排行榜查询
        submit/route.ts                   ✅ 提交成绩
      friends/route.ts                    ✅ 好友排行
    friends/
      add/route.ts                        ✅ 添加好友
      accept/route.ts                     ✅ 接受请求
      reject/route.ts                     ✅ 拒绝请求
      remove/route.ts                     ✅ 删除好友
      list/route.ts                       ✅ 好友列表
      requests/route.ts                   ✅ 待处理请求
      search/route.ts                     ✅ 搜索用户

/components/
  lobby/
    GameLobby.tsx                         ✅ 游戏大厅主组件
    RoomList.tsx                          ✅ 房间列表
    RoomCard.tsx                          ✅ 房间卡片
    CreateRoomDialog.tsx                  ✅ 创建房间弹窗
    JoinRoomDialog.tsx                    ✅ 加入房间弹窗
    QuickMatchButton.tsx                  ✅ 快速匹配按钮
    OnlinePlayerList.tsx                  ✅ 在线玩家列表
    ChatBox.tsx                           ✅ 聊天组件
  spectator/
    SpectatorView.tsx                     ✅ 观战视图
    SpectatorList.tsx                     ✅ 观众列表
  leaderboard/
    LeaderboardTabs.tsx                   ✅ 排行榜选项卡
    LeaderboardTable.tsx                  ✅ 排名表格
    PlayerRankCard.tsx                    ✅ 玩家排名卡片
    LeaderboardFilters.tsx                ✅ 过滤器
  multiplayer/
    MultiplayerGameWrapper.tsx            ✅ 多人游戏容器
    PlayerList.tsx                        ✅ 实时玩家列表
    PlayerCard.tsx                        ✅ 玩家卡片
    GameCountdown.tsx                     ✅ 倒计时
    WinnerDialog.tsx                      ✅ 结果弹窗
    RealtimeStats.tsx                     ✅ 实时统计
    DisconnectWarning.tsx                 ✅ 断线提示
    GameModeSelector.tsx                  ✅ 模式选择
  friends/
    FriendsList.tsx                       ✅ 好友列表
    FriendCard.tsx                        ✅ 好友卡片
    FriendRequestList.tsx                 ✅ 好友请求列表
    AddFriendDialog.tsx                   ✅ 添加好友弹窗

/lib/
  game-engine/
    BaseMultiplayerGame.ts                ✅ 游戏基类
    GameState.ts                          ✅ 游戏状态类型
    PlayerState.ts                        ✅ 玩家状态类型
    GameInput.ts                          ✅ 输入事件类型
    FallingBlocksMultiplayer.ts           ✅ Falling Blocks多人版
    BlinkMultiplayer.ts                   ✅ Blink多人版
    TypingWalkMultiplayer.ts              ✅ Typing Walk多人版
    FallingWordsMultiplayer.ts            ✅ Falling Words多人版
    RNGGenerator.ts                       ✅ 随机数生成器（可预测种子）
  services/
    deviceId.ts                           ✅ 设备指纹服务
    socketClient.ts                       ✅ Socket客户端封装
    socketServer.ts                       ✅ Socket服务器逻辑
    matchmaking.ts                        ✅ 匹配系统
    skillRating.ts                        ✅ 技能评分
    roomManager.ts                        ✅ 房间管理
    chatService.ts                        ✅ 聊天服务
    antiCheat.ts                          ✅ 防作弊服务
    gameSession.ts                        ✅ 游戏会话管理
  db/
    models/
      GameRoom.ts                         ✅ 房间模型
      GameSession.ts                      ✅ 游戏会话模型
      Leaderboard.ts                      ✅ 排行榜模型
      User.ts (修改)                      ✅ 扩展用户模型
  redis/
    client.ts                             ✅ Redis客户端
    roomCache.ts                          ✅ 房间缓存
    matchQueue.ts                         ✅ 匹配队列
    chatCache.ts                          ✅ 聊天缓存
    types.ts                              ✅ Redis类型定义
  cron/
    leaderboardReset.ts                   ✅ 排行榜定时重置
    roomCleanup.ts                        ✅ 房间清理任务
  utils/
    profanityFilter.ts                    ✅ 敏感词过滤
    nameGenerator.ts                      ✅ 游客昵称生成
    validation.ts                         ✅ 输入验证工具

/types/
  index.ts (扩展)                         ✅ 添加多人游戏类型
  multiplayer.ts                          ✅ 多人游戏专用类型
  socket.ts                               ✅ Socket事件类型定义

/__tests__/
  game-engine/
    FallingBlocksMultiplayer.test.ts
    BlinkMultiplayer.test.ts
    TypingWalkMultiplayer.test.ts
    FallingWordsMultiplayer.test.ts
  services/
    matchmaking.test.ts
    skillRating.test.ts
    antiCheat.test.ts
  api/
    room.test.ts
    leaderboard.test.ts
  integration/
    multiplayer-flow.test.ts
```

**文件统计:**
- 新增文件：约 **60+**
- 修改文件：约 **10+**
- 测试文件：约 **15+**

---

## 🚀 实施顺序建议

### Week 1 (Phase 1 + Phase 2前半)
1. ✅ Socket.IO搭建
2. ✅ Redis配置
3. ✅ 设备指纹识别
4. ✅ 数据库模型创建
5. ✅ 游戏大厅UI
6. ✅ 房间系统基础

### Week 2 (Phase 2后半 + Phase 3前半)
1. ✅ 快速匹配系统
2. ✅ 聊天功能
3. ✅ 游戏引擎抽象层
4. ✅ Falling Blocks多人适配
5. ✅ Blink多人适配

### Week 3 (Phase 3后半 + Phase 4 + Phase 5前半)
1. ✅ Typing Walk多人适配
2. ✅ Falling Words多人适配
3. ✅ 防作弊系统
4. ✅ 观战模式
5. ✅ 排行榜API

### Week 4 (Phase 5后半 + Phase 6 + Phase 7)
1. ✅ 好友系统
2. ✅ 排行榜UI
3. ✅ UI集成与优化
4. ✅ 国际化
5. ✅ 全面测试
6. ✅ 性能优化

---

## 📊 进度追踪

| 阶段 | 进度 | 完成日期 | 备注 |
|------|------|----------|------|
| Phase 1 | 0% | - | 基础架构 |
| Phase 2 | 0% | - | 游戏大厅 |
| Phase 3 | 0% | - | 游戏同步 |
| Phase 4 | 0% | - | 观战模式 |
| Phase 5 | 0% | - | 排行榜 |
| Phase 6 | 0% | - | UI集成 |
| Phase 7 | 0% | - | 测试 |

**最后更新:** 2025-01-11

---

## 🎯 关键里程碑

- [ ] **里程碑1:** WebSocket服务器正常运行
- [ ] **里程碑2:** 第一个多人房间成功创建
- [ ] **里程碑3:** 两个玩家完成第一场对战
- [ ] **里程碑4:** 排行榜显示第一条记录
- [ ] **里程碑5:** 所有4个游戏支持多人模式
- [ ] **里程碑6:** 完整功能上线（测试服）
- [ ] **里程碑7:** 生产环境部署

---

## ⚠️ 风险与挑战

### 技术风险
1. **WebSocket扩展性**
   - 风险：单服务器支持的并发连接有限
   - 缓解：使用Socket.IO集群 + Redis适配器

2. **游戏同步延迟**
   - 风险：高延迟玩家体验差
   - 缓解：客户端预测 + 服务器和解

3. **防作弊难度**
   - 风险：客户端可能被修改
   - 缓解：服务器权威验证 + 行为分析

### 开发风险
1. **开发时间紧**
   - 缓解：按优先级分阶段上线，核心功能先行

2. **测试覆盖不足**
   - 缓解：自动化测试 + 内测用户反馈

---

## 📝 后续优化方向

### 短期（1-2个月）
- [ ] 添加更多游戏模式（团队赛、淘汰赛）
- [ ] 实现成就系统
- [ ] 添加表情和动效
- [ ] 优化移动端体验

### 中期（3-6个月）
- [ ] 引入赛季系统（Season Pass）
- [ ] 添加皮肤/主题商店
- [ ] 实现语音聊天
- [ ] 创建锦标赛系统

### 长期（6个月+）
- [ ] 支持自定义游戏规则
- [ ] AI陪练对手
- [ ] 游戏回放系统
- [ ] 电竞模式（官方赛事）

---

## 🔗 相关文档

- [Socket.IO官方文档](https://socket.io/docs/)
- [Redis文档](https://redis.io/documentation)
- [MongoDB聚合查询](https://docs.mongodb.com/manual/aggregation/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [FingerprintJS文档](https://dev.fingerprint.com/docs)

---

## 📞 联系与支持

如有技术问题，请参考：
- 项目README.md
- CLAUDE.md（代码架构说明）
- 本文档的实施细节

---

**文档版本:** v1.0
**创建日期:** 2025-01-11
**最后更新:** 2025-01-11
