const 区域枚举 = z.enum(['铁壁关', '临渊城', '苍木谷', '碎云山', '京畿']);

export const Schema = z.object({
  玩家资料: z.object({
    性别: z.string().prefault('未选择'),
    特性: z.string().prefault(''),
    备注: z.string().prefault(''),
  }).prefault({}),
  世界定位: z.object({
    当前区域: 区域枚举.prefault('临渊城'),
    当前位置: z.string().prefault('临渊城东门'),
    当前场景: z.string().prefault('城门外'),
    当前事件: z.string().prefault('无'),
    当前交互对象: z.string().prefault('无'),
  }).prefault({}),
  世界时间: z.object({
    年: z.coerce.number().transform(v => Math.max(1, v)).prefault(307),
    月: z.coerce.number().transform(v => Math.max(1, Math.min(12, v))).prefault(7),
    日: z.coerce.number().transform(v => Math.max(1, Math.min(30, v))).prefault(1),
    时: z.coerce.number().transform(v => Math.max(0, Math.min(23, v))).prefault(18),
    分: z.coerce.number().transform(v => Math.max(0, Math.min(59, v))).prefault(0),
  }).prefault({}),
  事件日历: z.object({
    创作事件: z.record(z.string().describe('事件名'), z.object({
      触发日期: z.string().prefault(''),
      事件类型: z.enum(['周期', '年度', '随机', '剧情']).prefault('剧情'),
      风险等级: z.enum(['低', '中', '高', '极高']).prefault('中'),
      区域: z.string().prefault('全境'),
      位置: z.string().prefault('无'),
      简述: z.string().prefault(''),
    }).prefault({})).prefault({}),
  }).prefault({}),
  主角状态: z.object({
    武学境界: z.string().prefault('凡胎境·一层'),
    内力: z.coerce.number().transform(v => Math.max(0, v)).prefault(10),
    内力上限: z.coerce.number().transform(v => Math.max(1, v)).prefault(100),
    银钱: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
  }).prefault({}),
  角色成长: z.object({
    等级: z.coerce.number().transform(v => Math.max(1, v)).prefault(1),
    当前经验: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
    阅历: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
    属性点: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
    突破状态: z.enum(['无', '可突破', '突破中', '成功', '失败']).prefault('无'),
    突破目标: z.string().prefault(''),
    突破关键词: z.string().prefault(''),
    突破ROLL: z.coerce.number().transform(v => Math.max(0, Math.min(100, v))).prefault(0),
  }).prefault({}),
  六维属性: z.object({
    力道: z.coerce.number().transform(v => Math.max(1, v)).prefault(10),
    身法: z.coerce.number().transform(v => Math.max(1, v)).prefault(10),
    根骨: z.coerce.number().transform(v => Math.max(1, v)).prefault(10),
    悟性: z.coerce.number().transform(v => Math.max(1, v)).prefault(10),
    眼力: z.coerce.number().transform(v => Math.max(1, v)).prefault(10),
    魅力: z.coerce.number().transform(v => Math.max(1, v)).prefault(10),
  }).prefault({}),
  武学面板: z.object({
    内功心法: z.string().prefault('无'),
    可习得招式: z.record(z.string().describe('招式名'), z.object({
      类别: z.enum(['拳掌', '刀法', '剑法', '腿法', '暗器', '轻功']).prefault('拳掌'),
      品级: z.enum(['粗浅', '寻常', '精妙', '绝学', '神功']).prefault('粗浅'),
      描述: z.string().prefault(''),
      消耗_阅历: z.coerce.number().prefault(0),
      内力消耗: z.coerce.number().prefault(10),
    }).prefault({})).prefault({}),
    招式: z.record(z.string().describe('招式名'), z.object({
      类别: z.enum(['拳掌', '刀法', '剑法', '腿法', '暗器', '轻功']).prefault('拳掌'),
      品级: z.enum(['粗浅', '寻常', '精妙', '绝学', '神功']).prefault('粗浅'),
      描述: z.string().prefault(''),
      内力消耗: z.coerce.number().prefault(10),
    }).prefault({})).prefault({}),
  }).prefault({}),
  物品栏: z.record(z.string().describe('物品名'), z.object({
    数量: z.coerce.number().transform(v => Math.max(0, v)).prefault(1),
    描述: z.string().prefault(''),
    类型: z.enum(['药材', '暗器', '杂物', '武学残谱', '信物']).prefault('杂物'),
  }).prefault({})).transform(data => {
    return Object.fromEntries(Object.entries(data).filter(([_, v]) => v.数量 > 0));
  }).prefault({}),
  商铺: z.object({
    商品目录: z.record(z.string().describe('商品名'), z.object({
      描述: z.string().prefault(''),
      价格_银钱: z.coerce.number().prefault(0),
      类型: z.enum(['药材', '暗器', '杂物', '武学残谱', '信物']).prefault('杂物'),
    }).prefault({})).prefault({}),
  }).prefault({}),
  任务列表: z.record(z.string().describe('任务名'), z.object({
    任务等级: z.enum(['粗浅', '寻常', '精妙', '绝学', '神功']).prefault('寻常'),
    任务描述: z.string().prefault(''),
    任务状态: z.enum(['待接取', '进行中', '已完成', '已失败', '已忽略']).prefault('待接取'),
    奖励_银钱: z.coerce.number().prefault(0),
    奖励_经验: z.coerce.number().prefault(0),
    奖励_阅历: z.coerce.number().prefault(0),
    失败后果: z.string().prefault('无严重后果'),
    奖励已领取: z.boolean().prefault(false),
  }).prefault({})).prefault({}),
  NPC状态: z.record(z.string().describe('NPC名'), z.object({
    在场: z.boolean().prefault(false),
    所在区域: z.string().prefault('未知'),
    当前位置: z.string().prefault('未知'),
    当前场景: z.string().prefault('未知'),
    备注: z.string().prefault(''),
    当前态度: z.string().prefault('中立'),
  }).prefault({})).prefault({}),
  势力关系: z.record(z.string().describe('势力名'), z.object({
    关系值: z.coerce.number().prefault(0),
    关系阶段: z.string().prefault('中立'),
    已知身份: z.string().prefault('外来者'),
    备注: z.string().prefault(''),
  }).prefault({})).prefault({}),
  人物关系: z.record(z.string().describe('人物名'), z.object({
    关系值: z.coerce.number().prefault(0),
    关系阶段: z.string().prefault('陌生'),
    信任点: z.coerce.number().prefault(0),
    冲突点: z.coerce.number().prefault(0),
    关系标签: z.string().prefault(''),
    最近互动: z.string().prefault(''),
  }).prefault({})).prefault({}),
  状态影响: z.object({
    伤势: z.object({
      等级: z.string().prefault('无'),
      描述: z.string().prefault(''),
      恢复条件: z.string().prefault(''),
    }).prefault({}),
    中毒: z.object({
      等级: z.string().prefault('无'),
      描述: z.string().prefault(''),
      恢复条件: z.string().prefault(''),
    }).prefault({}),
    通缉: z.object({
      等级: z.string().prefault('无'),
      区域: z.string().prefault(''),
      原因: z.string().prefault(''),
    }).prefault({}),
  }).prefault({}),
  江湖身份: z.object({
    当前名号: z.string().prefault('无名外来者'),
    公开身份: z.string().prefault('无路引的外来客'),
    隐藏身份: z.string().prefault('未暴露'),
    名声等级: z.string().prefault('无名'),
    名声关键词: z.array(z.string()).prefault([]),
    被识破风险: z.string().prefault('低'),
  }).prefault({}),
  区域流言: z.record(z.string().describe('流言名'), z.object({
    区域: z.string().prefault('全境'),
    来源: z.string().prefault('市井'),
    热度: z.string().prefault('低'),
    内容: z.string().prefault(''),
    关联人物: z.array(z.string()).prefault([]),
  }).prefault({})).prefault({}),
  回收站: z.object({
    已删除物品: z.record(z.string().describe('名称'), z.any()).prefault({}),
    已删除招式: z.record(z.string().describe('名称'), z.any()).prefault({}),
    已删除可习得招式: z.record(z.string().describe('名称'), z.any()).prefault({}),
    已删除商品: z.record(z.string().describe('名称'), z.any()).prefault({}),
    已删除任务: z.record(z.string().describe('名称'), z.any()).prefault({}),
    已删除NPC: z.record(z.string().describe('名称'), z.any()).prefault({}),
  }).prefault({}),
});
