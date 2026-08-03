# Legacy Profile Import 任务拆分（临时文档）

> 临时讨论文档：用于拆分实现任务和单元测试边界。方案确认并实现后可以删除。

## 背景

Profile setup 阶段需要处理 legacy Firestore 用户资料和旧饮品偏好迁移。

新的业务流程是：

1. 用户激活后提交 `displayName`。
2. 后端把 `displayName` 保存到新的 `users.displayName`。
3. 后端用 `displayName` 查询 legacy Firestore users。
4. 如果没有匹配项，直接完成 profile setup，不导入 preferred drinks。
5. 如果有 1 个或多个匹配项，后端返回候选 legacy users 列表。
6. 前端展示候选列表，用户选择其中一个 legacy user。
7. 后端根据用户选择的 `legacyUserId` 导入该 legacy user 的 `options`。

原则：**不要在 profile setup 阶段自动导入旧 options。导入必须由用户选择确认后触发。**

---

## 目标

- 单一职责拆分。
- 每个类/服务都容易 mock。
- 每个业务分支都容易写单元测试。
- 先实现 profile setup 候选列表逻辑，再根据真实 Firestore option schema 实现 drink mapping。

---

## 建议模块拆分

## 1. Legacy Firestore 读取层

建议新增：

```ts
LegacyUsersRepository
```

职责：

- 只负责访问 Firestore。
- 不做业务判断。
- 不做 drink option mapping。
- 不创建 PostgreSQL 数据。

建议方法：

```ts
findByDisplayName(displayName: string): Promise<LegacyUser[]>
findById(legacyUserId: string): Promise<LegacyUser | null>
```

单元测试重点：

- `displayName` trim 后为空时不查询 Firestore。
- Firestore 返回 0 条时返回空数组。
- Firestore 返回 1 条时正确转换。
- Firestore 返回多条时正确转换。
- Firestore document id 要保留为 `legacyUserId` 或 `id`。

---

## 2. Legacy User Types

建议定义：

```ts
LegacyUser
LegacyDrinkOption
LegacyUserCandidateDto
```

职责：

- 描述 legacy Firestore user 数据。
- 描述返回给前端展示的候选 legacy user。

候选返回结构建议：

```ts
interface LegacyUserCandidateDto {
  legacyUserId: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  preferredDrinkCount: number;
}
```

注意：

- 这里暂时不要过度假设 Firestore 真实字段。
- `options` 结构需要等真实数据样例确认后再细化。

---

## 3. Legacy Candidate Mapper

建议新增：

```ts
LegacyUserCandidateMapper
```

职责：

- 把 `LegacyUser` 转成 `LegacyUserCandidateDto`。
- 只负责候选列表展示字段。
- 不负责 drink option 迁移。

建议方法：

```ts
toCandidate(legacyUser: LegacyUser): LegacyUserCandidateDto
```

单元测试重点：

- `options` 是数组时，`preferredDrinkCount = options.length`。
- `options` 不存在时，`preferredDrinkCount = 0`。
- `options` 不是数组时，`preferredDrinkCount = 0`。
- `firstName / lastName / displayName` 缺失时不报错。

---

## 4. Profile Setup Service

建议新增独立服务，或在 `UsersService` 中只保留很薄的入口：

```ts
ProfileSetupService
```

职责：

- 验证当前应用用户存在并已激活。
- 校验并 trim `displayName`。
- 更新 PostgreSQL `users.displayName`。
- 调用 `LegacyUsersRepository.findByDisplayName(displayName)`。
- 如果无匹配，返回 `profile_created`。
- 如果有 1 个或多个匹配，返回 `legacy_users_found` 和候选列表。

不负责：

- Firestore SDK 细节。
- legacy drink option mapping。
- `DrinkConfiguration` 创建。
- `PreferredDrink` 创建。

返回类型建议：

```ts
type SetupProfileResult =
  | {
      status: 'profile_created';
      user: UserDto;
      preferredDrinkCount: 0;
    }
  | {
      status: 'legacy_users_found';
      user: UserDto;
      legacyUsers: LegacyUserCandidateDto[];
    };
```

单元测试重点：

- `displayName` 为空时报 `BadRequestException`。
- 当前用户不存在时报 `NotFoundException`。
- 当前用户未激活时报错。
- 无 legacy match 时返回 `profile_created`。
- 1 个 legacy match 时返回 `legacy_users_found`。
- 多个 legacy match 时也返回 `legacy_users_found`。
- profile setup 阶段不会创建 preferred drinks。
- profile setup 阶段不会调用 drink mapping。

---

## 5. Legacy Drink Option Mapper

建议新增：

```ts
LegacyDrinkOptionMapper
```

职责：

- 把 legacy `options[]` 中的一条 option 映射为新的 `CreateDrinkConfigurationDto`。
- 不访问数据库。
- 不创建 preferred drink。

建议方法：

```ts
map(option: LegacyDrinkOption): CreateDrinkConfigurationDto | null
```

单元测试重点：

- `title` 映射到 `drinkType`。
- legacy milk 值映射到 `MilkType`。
- legacy strength 值映射到 `DrinkStrength`。
- legacy sugar / sweetener 映射到 `PortionAmount`。
- 无法识别或无效 option 返回 `null`，或按确认后的规则使用默认值。

注意：

- 这一块必须等真实 Firestore `options` 样例确认后再实现。
- 不要基于猜测写死 mapping。

---

## 6. Legacy Profile Import Service

建议新增：

```ts
LegacyProfileImportService
```

职责：

- 当前用户提交 `legacyUserId`。
- 根据 `legacyUserId` 读取 legacy Firestore user。
- 遍历 legacy user 的 `options`。
- 调用 `LegacyDrinkOptionMapper.map(option)`。
- 调用 `DrinkConfigurationsService.findOrCreate(...)` 复用或创建 drink configuration。
- 创建 `PreferredDrink`。
- 返回导入结果。

建议方法：

```ts
importSelectedLegacyProfile(
  authorizationHeader: string | undefined,
  legacyUserId: string,
): Promise<LegacyProfileImportResult>
```

返回类型建议：

```ts
interface LegacyProfileImportResult {
  status: 'profile_mapped';
  user: UserDto;
  preferredDrinkCount: number;
}
```

单元测试重点：

- 当前用户不存在时报错。
- 当前用户未激活时报错。
- `legacyUserId` 为空时报 `BadRequestException`。
- legacy user 不存在时报 `NotFoundException`。
- legacy user 没有 options 时返回 `preferredDrinkCount = 0`。
- mapper 返回 `null` 的 option 被跳过。
- 每个有效 option 都调用 `DrinkConfigurationsService.findOrCreate`。
- 每个有效 option 都创建 `PreferredDrink`。
- `sortOrder` 按 legacy options 顺序写入。
- 第一杯是否设置 `isDefault = true` 需要确认规则。
- 重复导入如何处理需要确认规则。

待讨论问题：

- 如果用户已经有 preferred drinks，再导入 legacy options，是阻止、追加、覆盖，还是跳过已有配置？
- 一个 legacy profile 是否允许被多个新用户导入？
- 是否需要记录某个用户已经从哪个 `legacyUserId` 导入过？目前数据库没有对应字段。

---

## 7. Controller 层

新增两个 endpoint：

```http
POST /users/me/profile/setup
POST /users/me/profile/import-legacy
```

Controller 职责：

- 接收 request body。
- 读取 authorization header。
- 调用对应 service。
- 返回统一 `{ data: ... }` envelope。

Controller 不负责：

- Firestore 查询。
- drink mapping。
- Prisma 写入细节。

单元测试重点：

- 参数传递正确。
- response envelope 正确。
- 不在 controller 中写业务逻辑。

---

## 推荐实现顺序

1. 定义 DTO / Types / Response shape。
2. 实现 `LegacyUsersRepository`。
3. 实现 `LegacyUserCandidateMapper`。
4. 实现 `ProfileSetupService`。
5. 补 profile setup 单元测试。
6. 获取并确认真实 Firestore `options` schema。
7. 实现 `LegacyDrinkOptionMapper`。
8. 实现 `LegacyProfileImportService`。
9. 补 import 单元测试。
10. 接 controller endpoint。
11. 补 controller 单元测试。

---

## 暂不实现内容

以下内容先不要实现，等真实数据和规则确认：

- legacy drink option 的完整 mapping。
- 重复导入处理策略。
- 是否记录 legacy import history。
- 是否限制一个 legacy user 只能被一个新 user 导入。
- 候选列表需要展示哪些更多字段。
