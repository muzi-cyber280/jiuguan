const RawSchema = z.object({
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
          生命值: z.coerce.number().prefault(100),
          生命上限: z.coerce.number().prefault(100),
          攻击力: z.coerce.number().prefault(15),
          防御力: z.coerce.number().prefault(10),
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
                      类型: z.string().prefault('物理'),
                      等级: z.coerce.number().transform(v => Math.max(1, Math.min(3, v))).prefault(1),
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
                      档位: z.string().prefault('普通'),
                      类型: z.string().prefault('战斗'),
                      等级: z.coerce.number().transform(v => Math.max(1, Math.min(20, v))).prefault(1),
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
      设施: z
        .record(
          z.string().describe('设施名'),
          z
            .object({
              类型: z.string().prefault('其他'),
              描述: z.string().prefault(''),
            })
            .prefault({}),
        )
        .prefault({}),
    })
    .prefault({}),

  世界时间: z
    .object({
      年: z.coerce.number().transform(v => Math.max(1, v)).prefault(1),
      月: z.coerce.number().transform(v => Math.max(1, Math.min(12, v))).prefault(1),
      日: z.coerce.number().transform(v => Math.max(1, Math.min(30, v))).prefault(1),
      时: z.coerce.number().transform(v => Math.max(0, Math.min(23, v))).prefault(8),
      分: z.coerce.number().transform(v => Math.max(0, Math.min(59, v))).prefault(0),
    })
    .prefault({}),

  闯入者: z
    .record(
      z.string().describe('闯入者名'),
      z
        .object({
          性别: z.string().prefault('女'),
          种族: z.string().prefault('人类'),
          职业: z.string().prefault('战士'),
          等级: z.coerce.number().prefault(1),
          生命值: z.coerce.number().prefault(10),
          生命上限: z.coerce.number().prefault(10),
          攻击力: z.coerce.number().prefault(2),
          防御力: z.coerce.number().prefault(1),
          意志力: z.coerce.number().prefault(5),
          意志上限: z.coerce.number().prefault(5),
          当前位置: z.string().prefault('入口'),
          状态: z.string().prefault('闯入中'),
          逃跑次数: z.coerce.number().prefault(0),
          技能: z.array(z.string()).prefault([]),
          装备: z.array(z.string()).prefault([]),
          备注: z.string().prefault(''),
        })
        .prefault({}),
    )
    .prefault({}),

  俘获者: z
    .record(
      z.string().describe('俘获者名'),
      z
        .object({
          性别: z.string().prefault('女'),
          种族: z.string().prefault('人类'),
          职业: z.string().prefault('战士'),
          等级: z.coerce.number().prefault(1),
          服从度: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(5),
          羞耻度: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(20),
          状态: z.string().prefault('抗拒'),
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

  NPC: z
    .record(
      z.string().describe('NPC名'),
      z
        .object({
          性别: z.string().prefault('女'),
          种族: z.string().prefault('人类'),
          职业: z.string().prefault('战士'),
          在场: z.boolean().prefault(false),
          当前位置: z.string().prefault('王座之间'),
          状态: z.string().prefault('空闲'),
          好感度: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(50),
          态度: z.string().prefault('忠诚'),
          等级: z.coerce.number().transform(v => Math.max(1, Math.min(20, v))).prefault(1),
          生命值: z.coerce.number().prefault(30),
          生命上限: z.coerce.number().prefault(30),
          攻击力: z.coerce.number().prefault(5),
          防御力: z.coerce.number().prefault(3),
          类型: z.string().prefault('辅助'),
          技能: z.array(z.string()).prefault([]),
          装备: z.array(z.string()).prefault([]),
          魔物化: z.boolean().prefault(false),
          融合次数: z.coerce.number().transform(v => _.clamp(v, 0, 3)).prefault(0),
          融合特征: z.string().prefault(''),
          融合种族: z.array(z.string()).prefault([]),
          融合能力: z.array(z.string()).prefault([]),
          外貌: z.string().prefault(''),
          备注: z.string().prefault(''),
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
export type Schema = z.output<typeof RawSchema>;

export const Schema = z.preprocess((data) => {
  const orig = data as any;
  let d = orig;
  let cloned = false;
  function clone() {
    if (!cloned) {
      d = _.cloneDeep(orig);
      cloned = true;
    }
  }
  if (d?.地下城?.设施) {
    let needClean = false;
    _.forEach(d.地下城.设施, (fac: any) => {
      if (fac?.类型 === '宝箱陷阱') needClean = true;
    });
    const oldNames = Object.keys(d.地下城.设施).filter(n => /^(\d+号.+|.+[号])$/.test(n) && !/^.+?\d+号$/.test(n));
    const needRename = oldNames.length > 0;
    if (needClean || needRename) {
      clone();
      _.forEach(d.地下城.设施, (fac: any, name: string) => {
        if (fac?.类型 === '宝箱陷阱') delete d.地下城.设施[name];
        else if (needRename) {
          const m = name.match(/^(\d+)号(.+)$/);
          if (m) {
            const newName = `${m[2]}${m[1]}号`;
            d.地下城.设施[newName] = d.地下城.设施[name];
            delete d.地下城.设施[name];
          }
        }
      });
      if (d?.NPC) {
        _.forEach(d.NPC, (npc: any) => {
          const m = npc?.当前位置?.match(/^(\d+)号(.+)$/);
          if (m) npc.当前位置 = `${m[2]}${m[1]}号`;
        });
      }
      if (d?.俘获者) {
        _.forEach(d.俘获者, (cap: any) => {
          const m = cap?.当前位置?.match(/^(\d+)号(.+)$/);
          if (m) cap.当前位置 = `${m[2]}${m[1]}号`;
        });
      }
    }
  }
  if (d?.地下城?.楼层) {
    const f = d.地下城.楼层;
    const keys = Object.keys(f);
    const needRename = !!f['第一层·回廊'] && !f['第一层'];
    const needReorder = keys.length > 0 && keys[keys.length - 1] !== '王座之间' && !!f['王座之间'];
    if (needRename || needReorder) {
      clone();
      const f2 = d.地下城.楼层;
      if (needRename) {
        f2['第一层'] = f2['第一层·回廊'];
        delete f2['第一层·回廊'];
      }
      if (needReorder) {
        const 王座 = f2['王座之间'];
        delete f2['王座之间'];
        f2['王座之间'] = 王座;
      }
    }
    if (d?.闯入者) {
      let needFixInv = false;
      _.forEach(d.闯入者, (inv: any) => {
        const cur = inv?.当前位置 ?? inv?.当前楼层;
        if (inv?.当前楼层 !== undefined) needFixInv = true;
        if (cur === '第一层·回廊') needFixInv = true;
      });
      if (needFixInv) {
        clone();
        _.forEach(d.闯入者, (inv: any) => {
          if (inv?.当前楼层 !== undefined) {
            inv.当前位置 = inv.当前楼层;
            delete inv.当前楼层;
          }
          if (inv?.当前位置 === '第一层·回廊') inv.当前位置 = '第一层';
        });
      }
    }
  }
  if (d?.俘获者) {
    let needFixCap = false;
    _.forEach(d.俘获者, (cap: any) => {
      if (cap?.心理状态 !== undefined) needFixCap = true;
    });
    if (needFixCap) {
      clone();
      _.forEach(d.俘获者, (cap: any) => {
        if (cap?.心理状态 !== undefined) {
          cap.状态 = cap.心理状态;
          delete cap.心理状态;
        }
      });
    }
  }
  if (d?.NPC) {
    let needFixNpc = false;
    _.forEach(d.NPC, (npc: any) => {
      if (npc?.所在区域 !== undefined) needFixNpc = true;
    });
    if (needFixNpc) {
      clone();
      _.forEach(d.NPC, (npc: any) => {
        if (npc?.所在区域 !== undefined) delete npc.所在区域;
      });
    }
  }
  return d;
}, RawSchema);
