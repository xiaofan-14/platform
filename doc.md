# 登录认证系统架构说明

本文档面向团队成员，说明当前项目的**基于 Session 的登录认证系统**的设计思路、涉及文件与使用方式。

---

## 一、设计原则

- **浏览器不存 JWT**：前端只持有一个**加密的 Session 标识**（存在 Cookie 里），不直接存 JWT 或敏感信息。
- **后端以 Session 为准**：登录成功后服务端创建 Session 记录（带过期时间），存到 **PostgreSQL**，并在 **Redis** 中做一层缓存，加速校验。
- **Cookie 安全**：Session Cookie 使用 `httpOnly`、`secure`（生产环境）、`sameSite: "lax"`，由 **iron-session** 做加密/签名，防止篡改。
- **校验顺序**：每次校验 Session 时，**先查 Redis，未命中再查 PostgreSQL，并回填 Redis**，兼顾性能与一致性。

---

## 二、整体流程

### 2.1 登录流程

```
用户提交 用户名 + 密码
    → POST /api/auth/login
    → 校验用户（未软删 + 密码 verify）
    → 创建 Session 记录（PostgreSQL）
    → 生成 sessionToken，写入 Redis（key: session:{token}）
    → 将 sessionToken 经 iron-session 加密后写入 Cookie（app_session）
    → 返回用户信息（不含密码）
```

### 2.2 请求时的 Session 校验

```
请求携带 Cookie（app_session）
    → 服务端解密得到 sessionToken
    → Redis.get("session:" + sessionToken)
    → 命中：直接使用缓存的用户信息
    → 未命中：从 PostgreSQL 查 Session + User，校验过期后回写 Redis
    → 返回当前用户或 null
```

### 2.3 登出流程

```
POST /api/auth/logout
    → 从 Cookie 取出 sessionToken
    → 删除 PostgreSQL 中对应 Session
    → 删除 Redis 中 session:{token}
    → 清除 Cookie
```

---

## 三、涉及文件一览

| 文件 | 职责 |
|------|------|
| **`app/lib/session.ts`** | Session 核心逻辑：Cookie 读写（iron-session）、Redis 缓存、PostgreSQL Session 的增删查；暴露 `getUser()`、`createSession()`、`destroySession()`。 |
| **`app/lib/utils/crypto.ts`** | 密码哈希与校验：`hashPassword()`（注册）、`verifyPassword()`（登录），与注册接口使用同一套算法。 |
| **`app/lib/prismaClient.ts`** | Prisma 客户端，访问 PostgreSQL（User、Session 等）。 |
| **`app/lib/redisClient.ts`** | Redis 客户端，用于 Session 缓存。 |
| **`proxy.ts`** | 路由守卫逻辑：无 Cookie 时重定向到 `/login`；已登录访问 `/login`、`/register` 时重定向到 `/`。 |
| **`middleware.ts`** | Next.js 中间件入口，调用 `proxy()`，使上述守卫生效。 |
| **`app/api/auth/login/route.ts`** | 登录 API：校验用户名密码，创建 Session，写 Redis，设 Cookie。 |
| **`app/api/auth/logout/route.ts`** | 登出 API：销毁当前 Session（DB + Redis + Cookie）。 |
| **`app/api/auth/register/route.ts`** | 注册 API：创建用户（密码经 `hashPassword` 存储），不涉及 Session。 |
| **`app/api/auth/session/route.ts`** | GET 当前会话：返回当前登录用户信息，未登录返回 401。 |
| **`app/(auth)/login/page.tsx`** | 登录页，表单提交到 `/api/auth/login`。 |
| **`app/(auth)/register/page.tsx`** | 注册页，表单提交到 `/api/auth/register`。 |
| **`prisma/schema.prisma`** | 数据模型：`User`（含软删除）、`Session`（sessionToken、userId、expires、ipAddress、userAgent 等）。 |

---

## 四、在服务端获取当前用户

在 **Server Component**、**Route Handler**、**Server Action** 等服务端代码中，需要“当前请求对应的登录用户”时：

```ts
import { getUser } from "@/app/lib/session";

const user = await getUser();
if (!user) {
  // 未登录，可 redirect("/login") 或返回 401
}
// user: { id: number; username: string; email: string }
```

---

## 五、路由与重定向规则（proxy / middleware）

- **未登录** 访问需要登录的页面（除登录/注册/静态/API 等）→ 重定向到 **`/login`**。
- **已登录** 访问 **`/login`** 或 **`/register`** → 重定向到 **`/`**。
- 登录、注册、`/api/auth/*`、`/_next`、静态资源等按原样放行，不强制 Cookie。

Session 的**真实性**（是否过期、是否被删）在服务端通过 `getUser()`（Redis + DB）校验；middleware 只根据**是否存在 Session Cookie** 做重定向，不做解密或查库。

---

## 六、环境与配置

- **`SESSION_SECRET`**（必填）：用于 iron-session 加密 Cookie，建议至少 32 位随机字符串。
- **`DATABASE_URL`**：PostgreSQL 连接，供 Prisma 使用（User、Session 表）。
- **`REDIS_URL`**：Redis 连接，供 Session 缓存使用。

Session 默认有效期在 `app/lib/session.ts` 中配置（如 7 天），可根据需要修改常量。

---

## 七、安全要点小结

1. Cookie 仅存加密后的 sessionToken，不存用户敏感信息。
2. 密码仅以哈希形式存库，登录用 `verifyPassword` 校验。
3. Session 有过期时间，并同时存在于 PostgreSQL（持久）与 Redis（加速），便于失效与审计。
4. 登录可记录 ipAddress、userAgent，便于安全审计与多端管理。

如需扩展（如刷新 Session 有效期、单设备登录、踢人下线等），可在 `app/lib/session.ts` 和对应 API 中基于现有 Session 与 Redis 设计扩展逻辑。
