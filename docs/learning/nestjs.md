# NestJS 学习分类

## 需要理解的核心概念

### 1. Module

Module 是 NestJS 的组织单位。

当前项目中的根模块：

```text
src/app.module.ts
```

后续业务模块：

```text
src/auth/
src/users/
src/activation-codes/
src/orders/
```

### 2. Controller

Controller 负责 HTTP 请求入口。

例如：

```http
POST /activation-codes
GET /auth/me
```

Controller 不应该直接写复杂业务逻辑，也不应该直接操作数据库。

### 3. Service

Service 负责业务逻辑。

例如：

- 创建 activation code
- 验证 activation code 是否可用
- 激活用户
- 更新订单状态

### 4. Dependency Injection

NestJS 通过依赖注入管理对象。

例如：

```ts
constructor(private readonly prisma: PrismaService) {}
```

表示当前 service 需要使用 PrismaService。

### 5. DTO

DTO 用来定义请求数据结构。

例如创建 activation code 的 body：

```ts
class CreateActivationCodeDto {
  role: UserRole;
}
```

DTO 不只是 TypeScript 类型。TypeScript 类型在运行时会消失，所以外部请求传入 `{}`、`123`、`[]` 这类值时，service 里直接调用 `.trim()` 等字符串方法仍可能抛 `TypeError`。

最佳实践是在 DTO 上用 `class-validator` 描述运行时校验规则，并在应用入口启用全局 `ValidationPipe`：

```ts
import { IsNotEmpty, IsString } from 'class-validator';

class ActivateUserDto {
  @IsString()
  @IsNotEmpty()
  activationCode!: string;
}
```

```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

含义：

- `whitelist: true`：移除 DTO 未声明的字段。
- `forbidNonWhitelisted: true`：请求包含未声明字段时返回 400。
- `transform: true`：按 DTO 元数据进行基础转换。

原则：Controller/DTO/Pipe 在边界层拦截非法输入，Service 只处理已经通过校验的业务数据。

### 6. Guard

Guard 用于请求进入业务逻辑前的拦截判断。

常见用途：

- 是否登录
- 用户是否 active
- 用户是否拥有某个角色

## 当前项目中需要重点学习

- `@Module()`
- `@Controller()`
- `@Injectable()`
- `@Get()` / `@Post()` / `@Patch()`
- DTO 与 ValidationPipe
- Guard
- Provider
- Global Module
