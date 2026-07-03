export const Schema = z.object({
  玩家资料: z
    .object({
      性别: z.string().prefault('未选择'),
      特性: z.string().prefault(''),
      备注: z.string().prefault(''),
    })
    .prefault({}),

  地下城: z
    .object({
      城主: z
        .object({
          名号: z.string().prefault('新任城主'),
          性别: z.string().prefault('男'),
          生命值: z.coerce.number().prefault(50),
          生命上限: z.coerce.number().prefault(50),
          攻击力: z.coerce.number().prefault(8),
          防御力: z.coerce.number().prefault(5),
          魔力: z.coerce.number().prefault(50),
          魔力上限: z.coerce.number().prefault(100),
          魅惑等级: z.coerce.number().transform(v => _.clamp(v, 0, 10)).prefault(1),
          描述: z.string().prefault('一位被深渊选中的新任城主，外貌由玩家设定'),
        })
        .prefault({}),
      楼层: z
        .record(
          z.string().describe('楼层名'),
          z
            .object({
              主题: z.string().prefault('未设定'),
              防御力: z.coerce.number().prefault(0),
              陷阱: z
                .record(
                  z.string().describe('陷阱名'),
                  z
                    .object({
                      类型: z.enum(['物理', '魔法', '精神', '色欲']).prefault('物理'),
                      伤害值: z.coerce.number().prefault(0),
                      特殊效果: z.string().prefault('无'),
                      触发概率: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(50),
                      描述: z.string().prefault(''),
                    })
                    .prefault({}),
                )
                .prefault({}),
              驻守魔物: z
                .record(
                  z.string().describe('魔物名'),
                  z
                    .object({
                      类型: z.enum(['战斗', '辅助', '特殊', '守卫']).prefault('战斗'),
                      生命值: z.coerce.number().prefault(0),
                      生命上限: z.coerce.number().prefault(0),
                      攻击力: z.coerce.number().prefault(0),
                      防御力: z.coerce.number().prefault(0),
                      特殊能力: z.string().prefault('无'),
                      描述: z.string().prefault(''),
                    })
                    .prefault({}),
                )
                .prefault({}),
              描述: z.string().prefault(''),
            })
            .prefault({}),
        )
        .prefault({}),
      资源: z
        .object({
          魔晶: z.coerce.number().prefault(60),
          灵魂碎片: z.coerce.number().prefault(5),
          魔素: z.coerce.number().prefault(30),
        })
        .prefault({}),
      声望: z.coerce.number().transform(v => _.clamp(v, 0, 10)).prefault(1),
      日期: z.coerce.number().prefault(1),
      设施: z
        .record(
          z.string().describe('设施名'),
          z
            .object({
              类型: z.enum(['囚室', '调教室', '祭坛', '魔素泉', '魅魔巢穴', '宝箱陷阱', '其他']).prefault('其他'),
              描述: z.string().prefault(''),
            })
            .prefault({}),
        )
        .prefault({}),
    })
    .prefault({}),

  闯入者: z
    .record(
      z.string().describe('闯入者名'),
      z
        .object({
          性别: z.enum(['男', '女']).prefault('女'),
          种族: z.string().prefault('人类'),
          职业: z.string().prefault('战士'),
          等级: z.coerce.number().prefault(1),
          生命值: z.coerce.number().prefault(10),
          生命上限: z.coerce.number().prefault(10),
          攻击力: z.coerce.number().prefault(2),
          防御力: z.coerce.number().prefault(1),
          意志力: z.coerce.number().prefault(5),
          意志上限: z.coerce.number().prefault(5),
          当前楼层: z.string().prefault('入口'),
          状态: z.enum(['闯入中', '战斗中', '被击败', '精神崩溃', '撤退']).prefault('闯入中'),
        })
        .prefault({}),
    )
    .prefault({}),

  俘获者: z
    .record(
      z.string().describe('俘获者名'),
      z
        .object({
          性别: z.enum(['男', '女']).prefault('女'),
          种族: z.string().prefault('人类'),
          职业: z.string().prefault('战士'),
          原等级: z.coerce.number().prefault(1),
          服从度: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(5),
          羞耻度: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(20),
          心理状态: z.string().prefault('抗拒'),
          当前位置: z.string().prefault('囚室'),
          身体状态: z.string().prefault('完好'),
          标记: z.array(z.string()).prefault([]),
          外貌: z.string().prefault(''),
          备注: z.string().prefault(''),
        })
        .transform(data => {
          const $服从度阶段 =
            data.服从度 <= 20
              ? '抗拒期'
              : data.服从度 <= 50
                ? '动摇期'
                : data.服从度 <= 80
                  ? '驯服期'
                  : '完全臣服';
          return { ...data, $服从度阶段 };
        })
        .prefault({}),
    )
    .prefault({}),

  事件日志: z.array(z.string()).prefault([]),

  NPC: z
    .record(
      z.string().describe('NPC名'),
      z
        .object({
          在场: z.boolean().prefault(true),
          所在区域: z.string().prefault('地下城'),
          当前位置: z.string().prefault('王座之间'),
          状态: z.string().prefault('空闲'),
          好感度: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(50),
          态度: z.string().prefault('忠诚'),
          备注: z.string().prefault(''),
          生命值: z.coerce.number().prefault(30),
          生命上限: z.coerce.number().prefault(30),
          攻击力: z.coerce.number().prefault(5),
          防御力: z.coerce.number().prefault(3),
          类型: z.enum(['战斗', '辅助', '特殊']).prefault('辅助'),
        })
        .prefault({}),
    )
    .prefault({}),

  当前场景: z
    .object({
      正在闯入: z.array(z.string()).prefault([]),
      当前战斗: z.string().prefault('无'),
      当前交互: z.string().prefault('无'),
    })
    .prefault({}),
});
export type Schema = z.output<typeof Schema>;
