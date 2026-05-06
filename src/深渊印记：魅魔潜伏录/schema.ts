// MVU Schema for 魅魔完善中
// 注意：zod 是全局变量，不需要 import

const 城邦枚举 = z.enum(['圣玛丽亚', '艾瑟嘉德', '自由贸易港', '黑锋堡']);

export const Schema = z.object({
  世界定位: z.object({
    当前城邦: 城邦枚举.prefault('圣玛丽亚'),
    当前位置: z.string().prefault('修道院'),
    当前场景: z.string().prefault('走廊'),
    当前事件: z.string().prefault('无'),
  }).prefault({}),

  世界时间: z.object({
    年: z.coerce.number().transform(v => Math.max(1, v)).prefault(1),
    月: z.coerce.number().transform(v => Math.max(1, Math.min(12, v))).prefault(1),
    日: z.coerce.number().transform(v => Math.max(1, Math.min(30, v))).prefault(1),
    时: z.coerce.number().transform(v => Math.max(0, Math.min(23, v))).prefault(6),
    分: z.coerce.number().transform(v => Math.max(0, Math.min(59, v))).prefault(0),
  }).prefault({}),

  角色成长: z.object({
    等级: z.coerce.number().prefault(1),
    当前经验: z.coerce.number().prefault(0),
    属性点: z.coerce.number().prefault(0),
  }).transform(data => {
    const getExpMax = (lv) => Math.floor(100 * Math.pow(1.2, lv - 1) + 50 * (lv - 1));
    let { 等级, 当前经验, 属性点 } = data;
    等级 = Math.max(1, 等级 || 1);
    当前经验 = Math.max(0, 当前经验 || 0);
    属性点 = Math.max(0, 属性点 || 0);
    while (当前经验 >= getExpMax(等级)) {
      当前经验 -= getExpMax(等级);
      等级 += 1;
      属性点 += 1;
    }
    return { 等级, 当前经验, 经验上限: getExpMax(等级), 属性点 };
  }).prefault({}),

  DND属性: z.object({
    力量: z.coerce.number().transform(v => Math.max(1, v)).prefault(10),
    敏捷: z.coerce.number().transform(v => Math.max(1, v)).prefault(10),
    体质: z.coerce.number().transform(v => Math.max(1, v)).prefault(10),
    智力: z.coerce.number().transform(v => Math.max(1, v)).prefault(10),
    感知: z.coerce.number().transform(v => Math.max(1, v)).prefault(10),
    魅力: z.coerce.number().transform(v => Math.max(1, v)).prefault(10),
  }).prefault({}),

  资源面板: z.object({
    欲望点数_DP: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
    技能点_SP: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
    蓝条: z.coerce.number().transform(v => Math.max(0, v)).prefault(100),
    蓝条上限: z.coerce.number().transform(v => Math.max(1, v)).prefault(100),
  }).prefault({}),

  身体状态: z.object({
    饥饿度: z.coerce.number().transform(v => Math.max(0, Math.min(100, v))).prefault(0),
  }).prefault({}),

  技能树: z.object({
    可解锁技能: z.record(z.string(), z.object({ 
      描述: z.string().prefault(''), 
      消耗_SP: z.coerce.number().prefault(0),
      等级: z.enum(['D','C','B','A','S']).prefault('D'),
      蓝条消耗: z.coerce.number().prefault(10),
    }).prefault({})).prefault({}),
    已解锁技能: z.record(z.string(), z.object({ 
      等级: z.enum(['D','C','B','A','S']).prefault('D'), 
      描述: z.string().prefault(''),
      蓝条消耗: z.coerce.number().prefault(10),
    }).prefault({})).prefault({}),
  }).prefault({}),

  道具商店: z.object({
    商品目录: z.record(z.string(), z.object({ 
      描述: z.string().prefault(''), 
      价格_DP: z.coerce.number().prefault(0),
    }).prefault({})).prefault({}),
    物品栏: z.record(z.string(), z.object({ 
      数量: z.coerce.number().transform(v => Math.max(0, v)).prefault(1), 
      作用: z.string().prefault(''), 
      类型: z.enum(['消耗品', '耐用品']).prefault('消耗品'),
    }).prefault({})).prefault({}).transform(data => {
      return Object.fromEntries(Object.entries(data).filter(([k, v]) => (v.类型 ?? '消耗品') === '消耗品' ? v.数量 > 0 : true));
    }),
  }).prefault({}),

  任务列表: z.record(
    z.string().describe('任务名'),
    z.object({
      任务等级: z.enum(['D', 'C', 'B', 'A', 'S']).prefault('D'),
      任务描述: z.string().prefault(''),
      任务状态: z.enum(['待接取', '进行中', '已完成', '已失败', '已忽略']).prefault('待接取'),
      奖励_DP: z.number().prefault(0),
      奖励_SP: z.number().prefault(0),
      奖励_EXP: z.number().prefault(0),
      失败后果: z.string().prefault('无严重后果'),
    }),
  ).prefault({}),

  回收站: z.object({
    已删除物品: z.record(z.string(), z.any()).prefault({}),
    已删除技能: z.record(z.string(), z.any()).prefault({}),
    已删除NPC: z.record(z.string(), z.any()).prefault({}),
    已删除商品: z.record(z.string(), z.any()).prefault({}),
    已删除可解锁技能: z.record(z.string(), z.any()).prefault({}),
    已删除任务: z.record(z.string(), z.any()).prefault({}),
  }).prefault({}),

  NPC状态: z.record(
    z.string().describe('NPC名称'),
    z.object({
      在场: z.boolean().prefault(true),
      备注: z.string().prefault(''),
      怀疑度: z.number().prefault(0),
      成瘾度: z.number().prefault(0),
      当前态度: z.string().prefault(''),
    }),
  ).prefault({}),

  事件日历: z.object({
    创作事件: z.record(
      z.string().describe('事件名称'),
      z.object({
        触发日期: z.string().prefault(''),
        事件类型: z.enum(['周期', '年度', '一次性']).prefault('周期'),
        风险等级: z.enum(['低', '中', '高', '极高']).prefault('中'),
        发生地点: z.string().prefault(''),
        事件内容: z.string().prefault(''),
        影响与应对: z.string().prefault(''),
      }),
    ).prefault({}),
  }).prefault({}),
});

export type Schema = z.output<typeof Schema>;
