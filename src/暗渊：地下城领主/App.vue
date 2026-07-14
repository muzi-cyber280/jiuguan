<template>
  <div class="dungeon-card" :class="themeClass">
    <header class="topbar">
      <div class="brand">
        <span class="brand-mark" @click="onBrandClick">渊</span>
        <span>
          <strong>{{ store.data.地下城.城主.名号 }}</strong>
          <small>第{{ worldDay }}日 {{ timeString }} · 声望 {{ '★'.repeat(Math.floor(store.data.地下城.声望)) }}{{ '☆'.repeat(10 - Math.floor(store.data.地下城.声望)) }}</small>
        </span>
        <span v-if="!collapsed" class="version-badge">V0714h</span>
      </div>
      <div class="top-actions">
        <template v-if="collapsed">
        </template>
        <span v-if="!collapsed" class="time-chip">Lv.{{ store.data.地下城.城主.魅惑等级 }} 魅惑 · {{ store.data.地下城.城主.性别 }}</span>
        <button v-if="!collapsed" class="ghost-btn" type="button" :class="{ active: settingsOpen }" @click="settingsOpen = !settingsOpen">设置</button>
        <button class="ghost-btn" type="button" @click="collapsed = !collapsed">{{ collapsed ? '展开' : '收起' }}</button>
      </div>
    </header>

    <div v-if="!collapsed && settingsOpen" class="settings-panel">
      <div class="settings-group">
        <span class="settings-label">缩放</span>
        <button class="round-btn" type="button" @click="zoomOut">-</button>
        <span class="zoom-label">{{ zoomPercent }}%</span>
        <button class="round-btn" type="button" @click="zoomIn">+</button>
        <button class="round-btn" type="button" @click="zoomReset">重置</button>
      </div>
      <div class="settings-group">
        <span class="settings-label">明暗</span>
        <button class="round-btn" type="button" @click="toggleThemeMode">{{ themeMode === 'dark' ? '亮色' : '暗色' }}</button>
      </div>
      <div class="settings-group">
        <span class="settings-label">主题</span>
        <button v-for="tone in themeTones" :key="tone.id" class="theme-swatch" :class="[`swatch-${tone.id}`, { active: themeTone === tone.id }]" type="button" :title="tone.label" @click="setThemeTone(tone.id)"><span>{{ tone.label }}</span></button>
      </div>
    </div>

    <main v-show="!collapsed" class="content" :style="{ zoom: `${zoomPercent}%` }">
      <nav class="tab-nav">
        <button v-for="tab in tabs" :key="tab.id" class="tab-btn" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
          {{ tab.label }}
        </button>
      </nav>

      <section v-if="activeTab === 'floor'" class="tab-pane">
        <section class="panel player-profile-panel" :class="{ required: playerGenderMissing, compact: !playerProfileExpanded }">
          <div class="profile-head">
            <div>
              <div class="section-kicker">玩家速览</div>
              <p class="profile-hint">{{ playerGenderMissing ? '请先选择城主性别，AI会据此固定识别玩家角色。' : playerProfileSummary }}</p>
            </div>
            <div class="profile-actions">
              <span class="status-tag" :class="playerGenderMissing ? 'pending' : 'muted'">{{ playerGenderMissing ? '待选择' : '已记录' }}</span>
              <button v-if="!playerGenderMissing && !playerProfileEditing" class="mini-text-btn" type="button" @click="playerProfileEditing = true">编辑</button>
            </div>
          </div>
          <template v-if="playerProfileExpanded">
            <div class="gender-row" role="group" aria-label="城主性别">
              <button v-for="option in playerGenderOptions" :key="option" class="gender-btn" :class="{ active: playerGender === option }" type="button" @click="setPlayerGender(option)">{{ option }}</button>
              <button class="gender-btn" :class="{ active: customGenderActive }" type="button" @click="enableCustomGender">自定义</button>
            </div>
            <label v-if="customGenderActive" class="profile-field compact-field">
              <span>自定义性别</span>
              <input :value="customGenderText" type="text" placeholder="例如：无性别、扶她、按备注处理。" @input="setCustomGender(($event.target as HTMLInputElement).value)" />
            </label>
            <label class="profile-field">
              <span>外貌与特性</span>
              <textarea :value="playerTraits" rows="2" placeholder="例如：银发红瞳、身形高挑、冷峻寡言、精通禁术。" @input="setPlayerTraits(($event.target as HTMLTextAreaElement).value)"></textarea>
            </label>
            <label class="profile-field">
              <span>偏好与备注</span>
              <textarea :value="playerNote" rows="2" placeholder="例如：偏好调教向、禁忌项目、希望出现的剧情方向。" @input="setPlayerNote(($event.target as HTMLTextAreaElement).value)"></textarea>
            </label>
            <div class="button-row profile-save-row">
              <button class="action-btn success" type="button" :disabled="playerGenderMissing" @click="savePlayerProfile">保存</button>
              <button v-if="!playerGenderMissing" class="action-btn muted-btn" type="button" @click="playerProfileEditing = false">收起</button>
            </div>
          </template>
        </section>

        <article class="hero-card primary-card">
          <div class="section-kicker">资源</div>
          <div class="resource-grid">
            <div class="resource-item"><span class="res-icon">◈</span><span class="res-label">魔晶</span><strong class="gold">{{ store.data.地下城.资源.魔晶 }}</strong></div>
            <div class="resource-item"><span class="res-icon">◊</span><span class="res-label">灵魂</span><strong class="purple">{{ store.data.地下城.资源.灵魂碎片 }}</strong></div>
            <div class="resource-item"><span class="res-icon">✦</span><span class="res-label">魔素</span><strong class="purple">{{ store.data.地下城.资源.魔素 }}</strong></div>
            <div class="resource-item"><span class="res-icon">▼</span><span class="res-label">魔力</span><strong class="blood">{{ store.data.地下城.城主.魔力 }}/{{ store.data.地下城.城主.魔力上限 }}</strong></div>
          </div>
          <div class="lord-combat">
            <div class="bar-shell"><div class="bar-fill hp" :style="{ width: lordHpPct + '%' }"></div><span>城主 {{ store.data.地下城.城主.生命值 }} / {{ store.data.地下城.城主.生命上限 }} HP</span></div>
            <div class="stat-row"><span>ATK {{ store.data.地下城.城主.攻击力 }}</span><span>DEF {{ store.data.地下城.城主.防御力 }}</span><span class="loc">魅惑 Lv.{{ store.data.地下城.城主.魅惑等级 }}</span></div>
          </div>
        </article>

        <div class="panel build-panel">
          <div class="section-kicker">建设</div>
          <div class="build-group">
            <div class="build-label">全局</div>
            <div class="build-buttons">
              <button class="build-btn" type="button" :disabled="楼层数 >= 10 || !checkResource(挖掘楼层魔晶, 0, 0)" @click="executeBuild('build', '挖掘楼层', exec挖掘楼层)">挖掘楼层<small>{{ 挖掘楼层魔晶 }}魔晶</small></button>
              <button v-if="lastUndo?.key === '挖掘楼层'" class="undo-btn" type="button" @click="performUndo">撤销</button>
              <button class="build-btn" type="button" :disabled="store.data.地下城.城主.魅惑等级 >= 10 || !checkResource(0, 魅惑升级碎片, 0)" @click="executeBuild('build', '升级魅惑', exec升级魅惑)">升级魅惑<small>{{ 魅惑升级碎片 }}碎片</small></button>
              <button v-if="lastUndo?.key === '升级魅惑'" class="undo-btn" type="button" @click="performUndo">撤销</button>
              <button class="build-btn" type="button" :disabled="!checkResource(魔力上限升级魔晶, 魔力上限升级碎片, 0)" @click="executeBuild('build', '魔力上限', exec魔力上限)">魔力上限<small>{{ fmtCost(魔力上限升级魔晶, 魔力上限升级碎片) }}</small></button>
              <button v-if="lastUndo?.key === '魔力上限'" class="undo-btn" type="button" @click="performUndo">撤销</button>
              <button class="build-btn" type="button" :disabled="魔力已满 || store.data.地下城.资源.魔晶 < 恢复魔力魔晶" @click="executeBuild('build', '恢复魔力', exec恢复魔力)">恢复魔力<small>{{ 魔力已满 ? '已满' : `${恢复魔力魔晶}魔晶` }}</small></button>
              <button v-if="lastUndo?.key === '恢复魔力'" class="undo-btn" type="button" @click="performUndo">撤销</button>
            </div>
          </div>
          <div class="build-group">
            <div class="build-label">转化</div>
            <div class="build-buttons">
              <button class="build-btn" type="button" :disabled="store.data.地下城.资源.灵魂碎片 < 1" @click="executeBuild('build', '转化:碎片换魔晶', () => exec转化('碎片换魔晶', 1))">碎片换魔晶<small>1碎片→5魔晶</small></button>
              <button v-if="lastUndo?.key === '转化:碎片换魔晶'" class="undo-btn" type="button" @click="performUndo">撤销</button>
              <button class="build-btn" type="button" :disabled="store.data.地下城.资源.灵魂碎片 < 1" @click="executeBuild('build', '转化:碎片换魔素', () => exec转化('碎片换魔素', 1))">碎片换魔素<small>1碎片→10魔素</small></button>
              <button v-if="lastUndo?.key === '转化:碎片换魔素'" class="undo-btn" type="button" @click="performUndo">撤销</button>
              <button class="build-btn" type="button" :disabled="store.data.地下城.资源.魔晶 < 8" @click="executeBuild('build', '转化:魔晶换碎片', () => exec转化('魔晶换碎片', 1))">魔晶换碎片<small>8魔晶→1碎片</small></button>
              <button v-if="lastUndo?.key === '转化:魔晶换碎片'" class="undo-btn" type="button" @click="performUndo">撤销</button>
              <button class="build-btn" type="button" :disabled="store.data.地下城.资源.魔晶 < 1" @click="executeBuild('build', '转化:魔晶换魔素', () => exec转化('魔晶换魔素', 1))">魔晶换魔素<small>1魔晶→2魔素</small></button>
              <button v-if="lastUndo?.key === '转化:魔晶换魔素'" class="undo-btn" type="button" @click="performUndo">撤销</button>
            </div>
          </div>
          <div class="build-group">
            <div class="build-label">设施</div>
            <div class="build-buttons">
              <template v-for="fac in 设施建设列表" :key="fac.名">
                <button class="build-btn" type="button" :disabled="!checkResource(fac.费用.魔晶, fac.费用.碎片, 0)" @click="executeBuild('build', '设施:' + fac.名, () => exec建造设施(fac.名))">{{ fac.名 }}<small>{{ fmtCost(fac.费用.魔晶, fac.费用.碎片) }}</small></button>
                <button v-if="lastUndo?.key === '设施:' + fac.名" class="undo-btn" type="button" @click="performUndo">撤销</button>
              </template>
            </div>
          </div>
        </div>

        <div v-for="(floor, name) in store.data.地下城.楼层" :key="name" class="panel floor-panel">
          <div class="card-head">
            <strong>{{ name }}</strong>
            <span class="status-tag muted">{{ floor.主题 }} · 防御 {{ floor.防御力 }}</span>
          </div>
          <p class="desc">{{ floor.描述 }}</p>
          <div v-if="!_.isEmpty(floor.陷阱)" class="tag-section">
            <span class="tag-label">陷阱</span>
            <span v-for="(trap, tn) in floor.陷阱" :key="tn" class="tag" :class="['trap-' + trap.类型, 'trap-tier-' + (trap.等级 || 1)]">
              {{ tn }} <small>{{ ['Ⅰ','Ⅱ','Ⅲ'][(trap.等级 || 1) - 1] }} {{ trap.伤害值 }}dmg {{ trap.触发概率 }}%</small>
            </span>
          </div>
          <div v-if="!_.isEmpty(floor.驻守魔物)" class="tag-section">
            <span class="tag-label">魔物</span>
            <span v-for="(mob, mn) in floor.驻守魔物" :key="mn" class="tag mob-tag" :class="'mob-' + (mob.档位 || '普通')" @click="toggleMobDetail(name + '/' + mn)">
              <span v-if="mob.档位 && mob.档位 !== '普通'" class="tier-mark">{{ mob.档位 }}</span>{{ mn }} <small>Lv{{ mob.等级 }} HP {{ mob.生命值 }}/{{ mob.生命上限 }}</small>
            </span>
          </div>
          <template v-for="(mob, mn) in floor.驻守魔物" :key="'detail-' + mn">
            <div v-if="expandedMob === name + '/' + mn" class="mob-detail-card" :class="'mob-detail-' + (mob.档位 || '普通')">
              <div class="mob-detail-header">
                <strong>{{ mn }}</strong>
                <span class="tier-badge" :class="'tier-' + (mob.档位 || '普通')">{{ mob.档位 || '普通' }}</span>
              </div>
              <div class="mob-detail-stats">
                <span>类型</span><b>{{ mob.类型 || '—' }}</b>
                <span>等级</span><b>Lv{{ mob.等级 }}</b>
                <span>生命</span><b>{{ mob.生命值 }} / {{ mob.生命上限 }}</b>
                <span>攻击</span><b>{{ mob.攻击力 }}</b>
                <span>防御</span><b>{{ mob.防御力 }}</b>
              </div>
              <div v-if="mob.特殊能力 && mob.特殊能力 !== '无'" class="mob-detail-row">
                <span class="mob-detail-label">特殊能力</span>
                <p>{{ mob.特殊能力 }}</p>
              </div>
              <div v-if="mob.描述" class="mob-detail-row">
                <span class="mob-detail-label">描述</span>
                <p>{{ mob.描述 }}</p>
              </div>
              <div class="mob-detail-actions">
                <button class="build-btn xs" type="button" :disabled="mob.等级 >= 20 || !checkResource(mob.等级 * 3, 0, 0)" @click="executeBuild('build', '升级魔物:' + name + ':' + mn, () => exec升级魔物(name, mn))">升级→Lv{{ mob.等级 + 1 }}<small>{{ mob.等级 * 3 }}魔晶</small></button>
                <button v-if="lastUndo?.key === '升级魔物:' + name + ':' + mn" class="undo-btn xs" type="button" @click="performUndo">撤销</button>
                <button v-if="(mob.档位 || '普通') === '普通' && mob.等级 >= 4" class="build-btn xs evolve-btn" type="button" :disabled="!checkResource(0, 2, 0)" @click="executeBuild('build', '进化:' + name + ':' + mn, () => exec进化魔物(name, mn))">进化<small>2碎片</small></button>
                <button v-if="(mob.档位 || '普通') === '普通' && mob.等级 >= 4 && lastUndo?.key === '进化:' + name + ':' + mn" class="undo-btn xs" type="button" @click="performUndo">撤销</button>
                <button v-if="mob.档位 === '精英' && mob.等级 >= 10" class="build-btn xs advance-btn" type="button" :disabled="!checkResource(0, 5, 0)" @click="executeBuild('build', '进阶:' + name + ':' + mn, () => exec进阶魔物(name, mn))">进阶<small>5碎片</small></button>
                <button v-if="mob.档位 === '精英' && mob.等级 >= 10 && lastUndo?.key === '进阶:' + name + ':' + mn" class="undo-btn xs" type="button" @click="performUndo">撤销</button>
              </div>
            </div>
          </template>
          <div class="floor-actions">
            <button class="build-btn sm" type="button" :disabled="floor.防御力 >= store.data.地下城.声望 * 5 || !checkResource(强化防御魔晶(floor.防御力), 0, 0)" @click="executeBuild('build', '防御:' + name, () => exec强化防御(name, floor.防御力))">强化防御<small>{{ 强化防御魔晶(floor.防御力) }}魔晶</small></button>
            <button v-if="lastUndo?.key === '防御:' + name" class="undo-btn sm" type="button" @click="performUndo">撤销</button>
            <button class="build-btn sm" type="button" @click="trapMenuFloor = trapMenuFloor === name ? null : name; mobMenuFloor = null; mobUpgradeFloor = null">布置陷阱<small>10魔晶起</small></button>
            <button class="build-btn sm" type="button" @click="mobMenuFloor = mobMenuFloor === name ? null : name; trapMenuFloor = null; mobUpgradeFloor = mobUpgradeFloor === name ? null : name">召唤魔物<small>10魔晶起</small></button>
          </div>
          <div v-if="trapMenuFloor === name" class="sub-menu trap-tier-menu">
            <div v-for="(c, t) in 陷阱费用表" :key="t" class="trap-tier-row">
              <span class="trap-tier-label">{{ t.replace('陷阱', '') }}</span>
              <template v-for="tier in [1, 2, 3]" :key="tier">
                <button class="build-btn xs" type="button" :disabled="!checkResource(c.魔晶 * tier, c.碎片 * tier, 0, c.魔素 * tier)" @click="executeBuild('build', '陷阱:' + name + ':' + t + ':' + tier, () => exec布置陷阱(name, t, tier))">{{ ['Ⅰ','Ⅱ','Ⅲ'][tier - 1] }}<small>{{ fmtCostFull(c.魔晶 * tier, c.碎片 * tier, c.魔素 * tier) }}</small></button>
                <button v-if="lastUndo?.key === '陷阱:' + name + ':' + t + ':' + tier" class="undo-btn xs" type="button" @click="performUndo">撤销</button>
              </template>
            </div>
          </div>
          <div v-if="mobMenuFloor === name" class="sub-menu">
            <template v-for="(c, t) in 魔物费用表" :key="t">
              <button class="build-btn xs" type="button" :disabled="!checkResource(c.魔晶, c.碎片, 0)" @click="executeBuild('build', '魔物:' + name + ':' + t, () => exec召唤魔物(name, t))">{{ t }}<small>{{ fmtCost(c.魔晶, c.碎片) }}</small></button>
              <button v-if="lastUndo?.key === '魔物:' + name + ':' + t" class="undo-btn xs" type="button" @click="performUndo">撤销</button>
            </template>
          </div>
          <div v-if="mobUpgradeFloor === name && !_.isEmpty(floor.驻守魔物)" class="sub-menu">
            <template v-for="(mob, mn) in floor.驻守魔物" :key="mn">
              <button class="build-btn xs" type="button" :disabled="mob.等级 >= 20 || !checkResource(mob.等级 * 3, 0, 0)" @click="executeBuild('build', '升级魔物:' + name + ':' + mn, () => exec升级魔物(name, mn))">{{ mn }} {{ mob.档位 && mob.档位 !== '普通' ? `[${mob.档位}]` : '' }} Lv{{ mob.等级 }}→{{ mob.等级 + 1 }}<small>{{ mob.等级 * 3 }}魔晶</small></button>
              <button v-if="lastUndo?.key === '升级魔物:' + name + ':' + mn" class="undo-btn xs" type="button" @click="performUndo">撤销</button>
              <button v-if="(mob.档位 || '普通') === '普通' && mob.等级 >= 4" class="build-btn xs evolve-btn" type="button" :disabled="!checkResource(0, 2, 0)" @click="executeBuild('build', '进化:' + name + ':' + mn, () => exec进化魔物(name, mn))">{{ mn }} 进化<small>2碎片</small></button>
              <button v-if="(mob.档位 || '普通') === '普通' && mob.等级 >= 4 && lastUndo?.key === '进化:' + name + ':' + mn" class="undo-btn xs" type="button" @click="performUndo">撤销</button>
              <button v-if="mob.档位 === '精英' && mob.等级 >= 10" class="build-btn xs advance-btn" type="button" :disabled="!checkResource(0, 5, 0)" @click="executeBuild('build', '进阶:' + name + ':' + mn, () => exec进阶魔物(name, mn))">{{ mn }} 进阶<small>5碎片</small></button>
              <button v-if="mob.档位 === '精英' && mob.等级 >= 10 && lastUndo?.key === '进阶:' + name + ':' + mn" class="undo-btn xs" type="button" @click="performUndo">撤销</button>
            </template>
          </div>
        </div>

        <div v-if="!_.isEmpty(store.data.地下城.设施)" class="panel facility-panel">
          <div class="section-kicker">设施</div>
          <div class="facility-grid">
            <div v-for="(fac, fn) in store.data.地下城.设施" :key="fn" class="facility-item" :class="'fac-' + fac.类型">
              <strong>{{ fn }}</strong>
              <small>{{ fac.类型 }}</small>
              <p v-if="fac.描述" class="desc muted-desc">{{ fac.描述 }}</p>
            </div>
          </div>
        </div>
      </section>

      <section v-if="activeTab === 'npc'" class="tab-pane">
        <div v-if="_.isEmpty(store.data.NPC)" class="empty-state">尚无部下。城主可通过深渊权能召唤新仆从。</div>
        <div v-for="(npc, name) in store.data.NPC" :key="name" class="panel npc-panel">
          <div class="card-head">
            <strong>{{ name }}</strong>
            <span class="status-tag lv-tag">Lv.{{ npc.等级 }}</span>
            <span v-if="npc.在场" class="status-tag present-tag">在场</span>
            <span v-else class="status-tag absent-tag">离场</span>
            <span class="status-tag" :class="npcAttitudeClass(npc.好感度)">{{ npc.态度 }}</span>
          </div>
          <p class="desc muted-desc">{{ npc.性别 }} · {{ npc.种族 }} · {{ npc.职业 }} · {{ npc.类型 }}</p>
          <div class="bar-shell"><div class="bar-fill favor" :style="{ width: npc.好感度 + '%' }"></div><span>好感 {{ npc.好感度 }}</span></div>
          <div class="bar-shell"><div class="bar-fill hp" :style="{ width: npcHpPct(npc) + '%' }"></div><span>HP {{ npc.生命值 }} / {{ npc.生命上限 }}</span></div>
          <div class="stat-row">
            <span>ATK {{ npc.攻击力 }}</span><span>DEF {{ npc.防御力 }}</span><span class="loc">{{ npc.类型 }}</span>
          </div>
          <div class="data-grid small">
            <span>位置</span><strong>{{ npc.当前位置 }}</strong>
            <span>状态</span><strong>{{ npc.状态 }}</strong>
          </div>
          <div v-if="npc.魔物化" class="fusion-info">
            <div class="fusion-badge">魔物化 {{ npc.融合次数 }}/3</div>
            <div v-if="npc.融合特征" class="tag-section">
              <span class="tag-label">特征</span>
              <span class="tag fusion-trait-tag">{{ npc.融合特征 }}</span>
            </div>
            <div v-if="npc.融合种族 && npc.融合种族.length > 0" class="tag-section">
              <span class="tag-label">血统</span>
              <span v-for="(r, ri) in npc.融合种族" :key="ri" class="tag fusion-race-tag">{{ r }}</span>
            </div>
            <div v-if="npc.融合能力 && npc.融合能力.length > 0" class="tag-section">
              <span class="tag-label">能力</span>
              <span v-for="(a, ai) in npc.融合能力" :key="ai" class="tag fusion-skill-tag">{{ a }}</span>
            </div>
          </div>
          <div v-if="npc.技能 && npc.技能.length > 0" class="tag-section">
            <span class="tag-label">技能</span>
            <span v-for="(s, si) in npc.技能" :key="si" class="tag inv-skill-tag">{{ s }}</span>
          </div>
          <div v-if="npc.装备 && npc.装备.length > 0" class="tag-section">
            <span class="tag-label">装备</span>
            <span v-for="(g, gi) in npc.装备" :key="gi" class="tag inv-gear-tag">{{ g }}</span>
          </div>
          <p v-if="npc.外貌" class="desc">{{ npc.外貌 }}</p>
          <div class="floor-actions">
            <button class="build-btn sm" type="button" :disabled="npc.等级 >= 20 || !checkResource(npc.等级 * 5, 1, 0)" @click="executeBuild('build', 'NPC:' + name, () => exec升级NPC(name))">升级<small>{{ npc.等级 * 5 }}魔晶+1碎片</small></button>
            <button v-if="lastUndo?.key === 'NPC:' + name" class="undo-btn sm" type="button" @click="performUndo">撤销</button>
            <button v-if="hasAltar && npc.魔物化 && npc.融合次数 < 3" class="build-btn sm fuse-btn" type="button" @click="fuseTargetNPC = fuseTargetNPC === name ? null : name">融合({{ npc.融合次数 }}/3)</button>
            <button v-if="hasAltar && !npc.魔物化 && npc.融合次数 < 3" class="build-btn sm fuse-btn" type="button" @click="fuseTargetNPC = fuseTargetNPC === name ? null : name">融合</button>
          </div>
          <div v-if="fuseTargetNPC === name && !_.isEmpty(allMobs)" class="sub-menu fuse-menu">
            <div class="fuse-hint">选择魔物继续融合（消耗15魔晶+3碎片，第{{ (npc.融合次数 ?? 0) + 1 }}次）</div>
            <template v-for="m in allMobs" :key="m.floor + ':' + m.name">
              <button class="build-btn xs" type="button" :disabled="!checkResource(15, 3, 0)" @click="executeBuild('fuse', '融合:' + name, () => exec融合NPC(name, npc, m.floor, m.name))">{{ m.name }}<small>{{ m.档位 }} Lv{{ m.等级 }} @{{ m.floor }}</small></button>
            </template>
          </div>
          <div v-else-if="fuseTargetNPC === name && _.isEmpty(allMobs)" class="sub-menu fuse-menu">
            <div class="fuse-hint">暂无可融合的魔物，请先召唤魔物到楼层</div>
          </div>
          <p v-if="npc.备注" class="desc muted-desc">{{ npc.备注 }}</p>
        </div>
      </section>

      <section v-if="activeTab === 'invader'" class="tab-pane">
        <div v-if="_.isEmpty(store.data.闯入者)" class="empty-state">地下城一片寂静……等待猎物上钩</div>
        <div v-for="(inv, name) in store.data.闯入者" :key="name" class="panel invader-panel" :class="'st-' + inv.状态">
          <div class="card-head">
            <strong>{{ name }}</strong>
            <span class="status-tag" :class="invStatusClass(inv.状态)">{{ inv.状态 }}</span>
          </div>
          <p class="desc muted-desc">{{ inv.性别 }} · {{ inv.种族 }} · {{ inv.职业 }} · Lv{{ inv.等级 }} · 逃跑{{ inv.逃跑次数 ?? 0 }}次</p>
          <template v-if="inv.状态 !== '撤退'">
            <div class="bar-shell"><div class="bar-fill hp" :style="{ width: hpPct(inv) + '%' }"></div><span>{{ inv.生命值 }} / {{ inv.生命上限 }} HP</span></div>
            <div class="bar-shell"><div class="bar-fill wp" :style="{ width: wpPct(inv) + '%' }"></div><span>{{ inv.意志力 }} / {{ inv.意志上限 }} WP</span></div>
            <div class="stat-row">
              <span>ATK {{ inv.攻击力 }}</span><span>DEF {{ inv.防御力 }}</span><span class="loc">→ {{ inv.当前位置 }}</span>
            </div>
            <div v-if="inv.技能 && inv.技能.length > 0" class="tag-section">
              <span class="tag-label">技能</span>
              <span v-for="(skill, si) in inv.技能" :key="si" class="tag inv-skill-tag">{{ skill }}</span>
            </div>
            <div v-if="inv.装备 && inv.装备.length > 0" class="tag-section">
              <span class="tag-label">装备</span>
              <span v-for="(gear, gi) in inv.装备" :key="gi" class="tag inv-gear-tag">{{ gear }}</span>
            </div>
          </template>
          <p v-if="inv.状态 === '撤退'" class="desc muted-desc">已逃离地下城，可能卷土重来并变得更强</p>
          <p v-if="inv.备注" class="desc muted-desc">{{ inv.备注 }}</p>
        </div>
      </section>

      <section v-if="activeTab === 'captive'" class="tab-pane">
        <div v-if="_.isEmpty(store.data.俘获者)" class="empty-state">囚室空空如也。击败冒险者后可俘获至此。</div>
        <div v-for="(cap, name) in store.data.俘获者" :key="name" class="panel captive-panel">
          <div class="card-head">
            <strong>{{ name }}</strong>
            <span class="status-tag captive-tag">{{ cap.$服从度阶段 }}</span>
          </div>
          <p class="desc muted-desc">{{ cap.性别 }} · {{ cap.种族 }} · {{ cap.职业 }} · Lv{{ cap.等级 }}</p>
          <div class="bar-shell"><div class="bar-fill obey" :style="{ width: cap.服从度 + '%' }"></div><span>服从 {{ cap.服从度 }}</span></div>
          <div class="bar-shell"><div class="bar-fill shame" :style="{ width: cap.羞耻度 + '%' }"></div><span>羞耻 {{ cap.羞耻度 }}</span></div>
          <div class="data-grid small">
            <span>状态</span><strong>{{ cap.状态 }}</strong>
            <span>位置</span><strong>{{ cap.当前位置 }}</strong>
            <span>身体</span><strong>{{ cap.身体状态 }}</strong>
          </div>
          <div v-if="cap.标记.length > 0" class="tag-section">
            <span class="tag-label">标记</span>
            <span v-for="mark in cap.标记" :key="mark" class="tag mark-tag">{{ mark }}</span>
          </div>
          <p v-if="cap.外貌" class="desc">{{ cap.外貌 }}</p>
          <p v-if="cap.备注" class="desc muted-desc">{{ cap.备注 }}</p>
          <div v-if="cap.服从度 >= 100" class="captive-actions">
            <button class="build-btn sm convert-btn" type="button" @click="executeBuild('convert', '转化暗堕:' + name, name, cap)">转化为暗堕随从</button>
            <button v-if="lastUndo?.key === '转化暗堕:' + name" class="undo-btn sm" type="button" @click="performUndo">撤销</button>
          </div>
          <div v-if="hasAltar && cap.服从度 >= 30" class="captive-actions">
            <button class="build-btn sm fuse-btn" type="button" @click="fuseTargetCaptive = fuseTargetCaptive === name ? null : name">融合炼金</button>
            <button v-if="lastUndo?.key === '融合:' + name" class="undo-btn sm" type="button" @click="performUndo">撤销</button>
          </div>
          <div v-if="fuseTargetCaptive === name && !_.isEmpty(allMobs)" class="sub-menu fuse-menu">
            <div class="fuse-hint">选择魔物进行融合（消耗15魔晶+3碎片，俘获者将转为部下）</div>
            <template v-for="m in allMobs" :key="m.floor + ':' + m.name">
              <button class="build-btn xs" type="button" :disabled="!checkResource(15, 3, 0)" @click="executeBuild('fuse', '融合:' + name, () => exec融合(name, cap, m.floor, m.name))">{{ m.name }}<small>{{ m.档位 }} Lv{{ m.等级 }} @{{ m.floor }}</small></button>
            </template>
          </div>
          <div v-else-if="fuseTargetCaptive === name && _.isEmpty(allMobs)" class="sub-menu fuse-menu">
            <div class="fuse-hint">暂无可融合的魔物，请先召唤魔物到楼层</div>
          </div>
        </div>
      </section>



      <section v-if="activeTab === 'test'" class="tab-pane test-panel">
        <div class="panel test-section">
          <div class="section-kicker">快捷场景</div>
          <div class="test-btn-grid">
            <button class="test-btn" type="button" @click="quickScenario('满资源')">满资源</button>
            <button class="test-btn" type="button" @click="quickScenario('穷光蛋')">穷光蛋</button>
            <button class="test-btn" type="button" @click="quickScenario('满级城主')">满级城主</button>
            <button class="test-btn" type="button" @click="quickScenario('满服俘获者')">满服俘获者</button>
            <button class="test-btn" type="button" @click="quickScenario('魔力耗尽')">魔力耗尽</button>
            <button class="test-btn" type="button" @click="quickScenario('跨天前')">跨天前(23:50)</button>
            <button class="test-btn warn" type="button" @click="quickScenario('初始状态')">重置初始</button>
          </div>
        </div>

        <div class="panel test-section">
          <div class="section-kicker">资源</div>
          <div class="test-field-grid">
            <label class="test-field"><span>魔晶</span><input type="number" :value="store.data.地下城.资源.魔晶" @input="testSet('地下城.资源.魔晶', Number(($event.target as HTMLInputElement).value))" /></label>
            <label class="test-field"><span>灵魂碎片</span><input type="number" :value="store.data.地下城.资源.灵魂碎片" @input="testSet('地下城.资源.灵魂碎片', Number(($event.target as HTMLInputElement).value))" /></label>
            <label class="test-field"><span>魔素</span><input type="number" :value="store.data.地下城.资源.魔素" @input="testSet('地下城.资源.魔素', Number(($event.target as HTMLInputElement).value))" /></label>
            <label class="test-field"><span>声望 (0~10)</span><input type="number" min="0" max="10" :value="store.data.地下城.声望" @input="testSet('地下城.声望', Number(($event.target as HTMLInputElement).value))" /></label>
          </div>
        </div>

        <div class="panel test-section">
          <div class="section-kicker">城主属性</div>
          <div class="test-field-grid">
            <label class="test-field"><span>魅惑等级 (0~10)</span><input type="number" min="0" max="10" :value="store.data.地下城.城主.魅惑等级" @input="testSet('地下城.城主.魅惑等级', Number(($event.target as HTMLInputElement).value))" /></label>
            <label class="test-field"><span>魔力</span><input type="number" :value="store.data.地下城.城主.魔力" @input="testSet('地下城.城主.魔力', Number(($event.target as HTMLInputElement).value))" /></label>
            <label class="test-field"><span>魔力上限</span><input type="number" :value="store.data.地下城.城主.魔力上限" @input="testSet('地下城.城主.魔力上限', Number(($event.target as HTMLInputElement).value))" /></label>
            <label class="test-field"><span>生命值</span><input type="number" :value="store.data.地下城.城主.生命值" @input="testSet('地下城.城主.生命值', Number(($event.target as HTMLInputElement).value))" /></label>
            <label class="test-field"><span>生命上限</span><input type="number" :value="store.data.地下城.城主.生命上限" @input="testSet('地下城.城主.生命上限', Number(($event.target as HTMLInputElement).value))" /></label>
            <label class="test-field"><span>攻击力</span><input type="number" :value="store.data.地下城.城主.攻击力" @input="testSet('地下城.城主.攻击力', Number(($event.target as HTMLInputElement).value))" /></label>
            <label class="test-field"><span>防御力</span><input type="number" :value="store.data.地下城.城主.防御力" @input="testSet('地下城.城主.防御力', Number(($event.target as HTMLInputElement).value))" /></label>
          </div>
        </div>

        <div class="panel test-section">
          <div class="section-kicker">世界时间</div>
          <div class="test-field-grid">
            <label class="test-field"><span>年</span><input type="number" min="1" :value="store.data.世界时间.年" @input="testSet('世界时间.年', Number(($event.target as HTMLInputElement).value))" /></label>
            <label class="test-field"><span>月 (1~12)</span><input type="number" min="1" max="12" :value="store.data.世界时间.月" @input="testSet('世界时间.月', Number(($event.target as HTMLInputElement).value))" /></label>
            <label class="test-field"><span>日 (1~30)</span><input type="number" min="1" max="30" :value="store.data.世界时间.日" @input="testSet('世界时间.日', Number(($event.target as HTMLInputElement).value))" /></label>
            <label class="test-field"><span>时 (0~23)</span><input type="number" min="0" max="23" :value="store.data.世界时间.时" @input="testSet('世界时间.时', Number(($event.target as HTMLInputElement).value))" /></label>
            <label class="test-field"><span>分 (0~59)</span><input type="number" min="0" max="59" :value="store.data.世界时间.分" @input="testSet('世界时间.分', Number(($event.target as HTMLInputElement).value))" /></label>
          </div>
        </div>

        <div class="panel test-section">
          <div class="section-kicker">楼层操作 <small class="test-count">当前 {{ 楼层数 }} 层</small></div>
          <div class="test-btn-grid">
            <button class="test-btn" type="button" :disabled="楼层数 >= 10" @click="testAddFloor">+测试楼层</button>
            <button class="test-btn" type="button" :disabled="楼层数 <= 3" @click="testRemoveLastFloor">-末层</button>
            <button class="test-btn warn" type="button" :disabled="楼层数 <= 3" @click="testClearFloors">清空多余</button>
          </div>
          <div v-if="楼层数 > 3" class="test-floor-list">
            <div v-for="(floor, name) in store.data.地下城.楼层" :key="name" class="test-floor-row">
              <span>{{ name }}</span>
              <small>防御 {{ floor.防御力 }} · 强化费 {{ 强化防御魔晶(floor.防御力) }}魔晶</small>
              <button class="test-btn sm" type="button" @click="testSet(`地下城.楼层.${name}.防御力`, floor.防御力 + 1)">+防御</button>
              <button class="test-btn sm" type="button" :disabled="floor.防御力 <= 0" @click="testSet(`地下城.楼层.${name}.防御力`, floor.防御力 - 1)">-防御</button>
            </div>
          </div>
        </div>

        <div class="panel test-section">
          <div class="section-kicker">设施操作 <small class="test-count">当前 {{ _.size(store.data.地下城.设施) }} 个</small></div>
          <div class="test-btn-grid">
            <button v-for="fac in 设施建设列表" :key="fac.名" class="test-btn" type="button" @click="testAddFacility(fac.名)">+{{ fac.名 }}</button>
            <button class="test-btn warn" type="button" @click="testClearFacilities">清空</button>
          </div>
          <div v-if="!_.isEmpty(store.data.地下城.设施)" class="test-fac-list">
            <div v-for="(fac, fn) in store.data.地下城.设施" :key="fn" class="test-fac-row">
              <span>{{ fn }}</span><small>{{ fac.类型 }}</small>
              <button class="test-btn sm warn" type="button" @click="_.unset(store.data.地下城.设施, fn)">删除</button>
            </div>
          </div>
        </div>

        <div class="panel test-section">
          <div class="section-kicker">测试数据注入</div>
          <div class="test-btn-grid">
            <button class="test-btn" type="button" @click="testInjectInvader">+闯入者</button>
            <button class="test-btn" type="button" @click="testInjectCaptive">+俘获者</button>
            <button class="test-btn" type="button" @click="testInjectNPC">+部下</button>
            <button class="test-btn warn" type="button" @click="testClearAllEntities">清空实体</button>
          </div>
        </div>

        <div class="panel test-section">
          <div class="section-kicker">费用预览表</div>
          <div class="test-cost-table">
            <div class="test-cost-header">
              <span>项目</span><span>费用</span><span></span>
            </div>
            <div v-for="(row, i) in 费用预览表" :key="i" class="test-cost-row" :class="{ disabled: row.禁用 }">
              <span>{{ row.项目 }}</span>
              <span class="cost-val">{{ row.费用 }}</span>
              <button class="test-btn sm" type="button" :disabled="row.禁用" @click="executeBuild('build', 'test:' + row.项目, row.执行)">执行</button>
              <button v-if="lastUndo?.key === 'test:' + row.项目" class="undo-btn sm" type="button" @click="performUndo">撤销</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { ref, computed, nextTick } from 'vue';
import { useDataStore } from './store';

const store = useDataStore();
const collapsed = ref(false);
const activeTab = ref('floor');
const settingsOpen = ref(false);

const testMode = ref(false);
let brandClickCount = 0;
let brandClickTimer: ReturnType<typeof setTimeout> | null = null;
function onBrandClick() {
  brandClickCount++;
  if (brandClickTimer) clearTimeout(brandClickTimer);
  brandClickTimer = setTimeout(() => { brandClickCount = 0; }, 600);
  if (brandClickCount >= 3) {
    brandClickCount = 0;
    testMode.value = !testMode.value;
    if (testMode.value) { activeTab.value = 'test'; }
    try { (window as any).toastr?.info(testMode.value ? '测试模式已开启' : '测试模式已关闭'); } catch { /* noop */ }
  }
}

const ZOOM_MIN = 60, ZOOM_MAX = 150, ZOOM_STEP = 10;
const ZOOM_KEY = 'dungeon-card-zoom';
const THEME_MODE_KEY = 'dungeon-card-theme-mode';
const THEME_TONE_KEY = 'dungeon-card-theme-tone';

const zoomLevel = ref(Number(localStorage.getItem(ZOOM_KEY)) || 100);
const zoomPercent = computed(() => Math.round(zoomLevel.value));

type ThemeMode = 'dark' | 'light';
type ThemeTone = 'blood' | 'void' | 'gold' | 'ice';
const themeTones: Array<{ id: ThemeTone; label: string }> = [
  { id: 'blood', label: '血' },
  { id: 'void', label: '渊' },
  { id: 'gold', label: '金' },
  { id: 'ice', label: '霜' },
];
const storedThemeMode = localStorage.getItem(THEME_MODE_KEY);
const storedThemeTone = localStorage.getItem(THEME_TONE_KEY);
const themeMode = ref<ThemeMode>(storedThemeMode === 'light' ? 'light' : 'dark');
const themeTone = ref<ThemeTone>(themeTones.some(t => t.id === storedThemeTone) ? storedThemeTone as ThemeTone : 'blood');
const themeClass = computed(() => [`theme-${themeMode.value}`, `tone-${themeTone.value}`]);

function zoomIn() { zoomLevel.value = Math.min(ZOOM_MAX, zoomLevel.value + ZOOM_STEP); localStorage.setItem(ZOOM_KEY, String(zoomLevel.value)); }
function zoomOut() { zoomLevel.value = Math.max(ZOOM_MIN, zoomLevel.value - ZOOM_STEP); localStorage.setItem(ZOOM_KEY, String(zoomLevel.value)); }
function zoomReset() { zoomLevel.value = 100; localStorage.setItem(ZOOM_KEY, '100'); }
function toggleThemeMode() { themeMode.value = themeMode.value === 'dark' ? 'light' : 'dark'; localStorage.setItem(THEME_MODE_KEY, themeMode.value); }
function setThemeTone(tone: ThemeTone) { themeTone.value = tone; localStorage.setItem(THEME_TONE_KEY, tone); }

const invaderCount = computed(() => _.size(store.data.闯入者));
const captiveCount = computed(() => _.size(store.data.俘获者));
const npcCount = computed(() => _.size(store.data.NPC));

const playerGenderOptions = ['男', '女'] as const;
type PlayerGender = typeof playerGenderOptions[number];
const playerGender = computed(() => _.get(store.data, '玩家资料.性别', '未选择'));
const playerGenderMissing = computed(() => !playerGender.value || playerGender.value === '未选择');
const customGenderActive = ref(false);
const customGenderText = computed(() => playerGenderOptions.includes(playerGender.value as PlayerGender) || playerGenderMissing.value ? '' : playerGender.value);
const playerTraits = computed(() => _.get(store.data, '玩家资料.特性', ''));
const playerNote = computed(() => _.get(store.data, '玩家资料.备注', ''));
const playerProfileEditing = ref(false);
const playerProfileExpanded = computed(() => playerGenderMissing.value || playerProfileEditing.value);
const playerProfileSummary = computed(() => {
  const parts = [`性别 ${playerGender.value}`];
  if (playerTraits.value) parts.push(`特性 ${shortText(playerTraits.value, 18)}`);
  if (playerNote.value) parts.push(`备注 ${shortText(playerNote.value, 18)}`);
  return parts.join(' · ');
});

function shortText(text: string, max: number) { return text.length > max ? `${text.slice(0, max)}...` : text; }
function setPlayerGender(gender: PlayerGender) {
  customGenderActive.value = false;
  playerProfileEditing.value = true;
  _.set(store.data, '玩家资料.性别', gender);
    if (['男', '女'].includes(gender)) _.set(store.data, '地下城.城主.性别', gender);
}
function enableCustomGender() {
  customGenderActive.value = true;
  playerProfileEditing.value = true;
  if (playerGenderOptions.includes(playerGender.value as PlayerGender)) _.set(store.data, '玩家资料.性别', '');
}
function setCustomGender(text: string) { playerProfileEditing.value = true; _.set(store.data, '玩家资料.性别', text.trim() || '未选择'); }
function setPlayerTraits(text: string) { _.set(store.data, '玩家资料.特性', text.trim()); }
function setPlayerNote(text: string) { _.set(store.data, '玩家资料.备注', text.trim()); }
function savePlayerProfile() {
  if (playerGenderMissing.value) { toastr.warning('请先选择城主性别'); return; }
  playerProfileEditing.value = false;
  toastr.success('玩家资料已保存');
}

function fillRawInput(text: string) {
  try {
    const $parent = window.parent?.$ || window.$;
    const input = $parent?.('#send_textarea');
    if (input?.length) { input.val(`${input.val() || ''}${text}`); input.trigger('input'); return; }
  } catch (e) {
    console.log('[dungeon-ui] input access failed', e);
  }
}

type BuildResult = { 成功: boolean; 描述: string; 额外?: string };
const pendingBuildResults = ref<BuildResult[]>([]);
const trapMenuFloor = ref<string | null>(null);
const mobMenuFloor = ref<string | null>(null);
const mobUpgradeFloor = ref<string | null>(null);
const npcUpgradeMenu = ref<string | null>(null);
const undoStack = ref<{ snapshot: any; prevInput: string; key: string }[]>([]);
const lastUndo = computed(() => undoStack.value.length > 0 ? undoStack.value[undoStack.value.length - 1] : null);
let undoTimer: ReturnType<typeof setTimeout> | null = null;

function checkResource(魔晶: number, 碎片: number, 魔力: number, 魔素 = 0): boolean {
  return store.data.地下城.资源.魔晶 >= 魔晶
    && store.data.地下城.资源.灵魂碎片 >= 碎片
    && store.data.地下城.资源.魔素 >= 魔素
    && store.data.地下城.城主.魔力 >= 魔力;
}
function deductResource(魔晶: number, 碎片: number, 魔力: number, 魔素 = 0) {
  store.data.地下城.资源.魔晶 -= 魔晶;
  store.data.地下城.资源.灵魂碎片 -= 碎片;
  store.data.地下城.资源.魔素 -= 魔素;
  store.data.地下城.城主.魔力 -= 魔力;
}

function exec挖掘楼层(): BuildResult {
  const 魔晶 = 挖掘楼层魔晶.value;
  if (楼层数.value >= 10) return { 成功: false, 描述: '楼层已达上限' };
  if (!checkResource(魔晶, 0, 0)) return { 成功: false, 描述: `资源不足(需${魔晶}魔晶)` };
  deductResource(魔晶, 0, 0);
  const floorName = `第${楼层数.value - 1}层`;
  const 王座 = (store.data.地下城.楼层 as any)['王座之间'];
  delete (store.data.地下城.楼层 as any)['王座之间'];
  _.set(store.data.地下城.楼层, floorName, { 主题: '未定', 防御力: 0, 陷阱: {}, 驻守魔物: {}, 描述: '新挖掘的楼层，尚待装修' });
  if (王座) _.set(store.data.地下城.楼层, '王座之间', 王座);
  store.data.地下城.声望 = Math.min(10, store.data.地下城.声望 + 1);
  return { 成功: true, 描述: `挖掘${floorName}(-${魔晶}魔晶,声望+1)` };
}

function exec升级魅惑(): BuildResult {
  const 碎片 = 魅惑升级碎片.value;
  if (store.data.地下城.城主.魅惑等级 >= 10) return { 成功: false, 描述: '魅惑已满级' };
  if (!checkResource(0, 碎片, 0)) return { 成功: false, 描述: `资源不足(需${碎片}碎片)` };
  deductResource(0, 碎片, 0);
  store.data.地下城.城主.魅惑等级 += 1;
  store.data.地下城.城主.生命上限 += 25;
  store.data.地下城.城主.生命值 += 25;
  store.data.地下城.城主.攻击力 += 5;
  store.data.地下城.城主.防御力 += 3;
  return { 成功: true, 描述: `魅惑Lv${store.data.地下城.城主.魅惑等级 - 1}→${store.data.地下城.城主.魅惑等级}(-${碎片}碎片,HP上限+25/ATK+5/DEF+3)` };
}

function exec魔力上限(): BuildResult {
  const 魔晶 = 魔力上限升级魔晶.value, 碎片 = 魔力上限升级碎片.value;
  if (!checkResource(魔晶, 碎片, 0)) return { 成功: false, 描述: `资源不足(需${魔晶}魔晶+${碎片}碎片)` };
  deductResource(魔晶, 碎片, 0);
  store.data.地下城.城主.魔力上限 += 20;
  return { 成功: true, 描述: `魔力上限${store.data.地下城.城主.魔力上限 - 20}→${store.data.地下城.城主.魔力上限}(-${魔晶}魔晶,-${碎片}碎片)` };
}

function exec恢复魔力(): BuildResult {
  if (魔力已满.value) return { 成功: false, 描述: '魔力已满' };
  const 魔晶 = 恢复魔力魔晶.value, 恢复量 = 可恢复魔力.value;
  if (store.data.地下城.资源.魔晶 < 魔晶) return { 成功: false, 描述: `魔晶不足(需${魔晶}有${store.data.地下城.资源.魔晶})` };
  store.data.地下城.资源.魔晶 -= 魔晶;
  store.data.地下城.城主.魔力 += 恢复量;
  return { 成功: true, 描述: `恢复${恢复量}魔力(-${魔晶}魔晶)` };
}

function exec转化(方向: '碎片换魔晶' | '碎片换魔素' | '魔晶换碎片' | '魔晶换魔素', 数量: number): BuildResult {
  const r = store.data.地下城.资源;
  if (数量 < 1) return { 成功: false, 描述: '数量须≥1' };
  switch (方向) {
    case '碎片换魔晶': {
      if (r.灵魂碎片 < 数量) return { 成功: false, 描述: `碎片不足(需${数量}有${r.灵魂碎片})` };
      r.灵魂碎片 -= 数量; r.魔晶 += 数量 * 5;
      return { 成功: true, 描述: `转化(-${数量}碎片,+${数量 * 5}魔晶)` };
    }
    case '碎片换魔素': {
      if (r.灵魂碎片 < 数量) return { 成功: false, 描述: `碎片不足(需${数量}有${r.灵魂碎片})` };
      r.灵魂碎片 -= 数量; r.魔素 += 数量 * 10;
      return { 成功: true, 描述: `转化(-${数量}碎片,+${数量 * 10}魔素)` };
    }
    case '魔晶换碎片': {
      const cost = 数量 * 8;
      if (r.魔晶 < cost) return { 成功: false, 描述: `魔晶不足(需${cost}有${r.魔晶})` };
      r.魔晶 -= cost; r.灵魂碎片 += 数量;
      return { 成功: true, 描述: `转化(-${cost}魔晶,+${数量}碎片)` };
    }
    case '魔晶换魔素': {
      if (r.魔晶 < 数量) return { 成功: false, 描述: `魔晶不足(需${数量}有${r.魔晶})` };
      r.魔晶 -= 数量; r.魔素 += 数量 * 2;
      return { 成功: true, 描述: `转化(-${数量}魔晶,+${数量 * 2}魔素)` };
    }
  }
}

function exec建造设施(类型: string): BuildResult {
  const 费用 = 设施费用(类型);
  if (!checkResource(费用.魔晶, 费用.碎片, 0)) return { 成功: false, 描述: `${类型}资源不足(需${fmtCost(费用.魔晶, 费用.碎片)})` };
  deductResource(费用.魔晶, 费用.碎片, 0);
  const count = _.filter(store.data.地下城.设施, f => f.类型 === 类型).length;
  const facName = `${类型}${count + 1}号`;
  _.set(store.data.地下城.设施, facName, { 类型, 描述: '' });
  return { 成功: true, 描述: `建造${facName}(${类型})(-${fmtCost(费用.魔晶, 费用.碎片)})` };
}

function exec强化防御(floorName: string, 当前防御: number): BuildResult {
  const 魔晶 = 强化防御魔晶(当前防御);
  if (当前防御 >= store.data.地下城.声望 * 5) return { 成功: false, 描述: `${floorName}防御已达上限` };
  if (!checkResource(魔晶, 0, 0)) return { 成功: false, 描述: `强化防御${floorName}资源不足(需${魔晶}魔晶)` };
  deductResource(魔晶, 0, 0);
  _.set(store.data.地下城.楼层[floorName], '防御力', 当前防御 + 1);
  return { 成功: true, 描述: `${floorName}防御${当前防御}→${当前防御 + 1}(-${魔晶}魔晶)` };
}

const 陷阱费用表: Record<string, { 魔晶: number; 碎片: number; 魔素: number }> = {
  物理陷阱: { 魔晶: 10, 碎片: 0, 魔素: 0 },
  魔法陷阱: { 魔晶: 15, 碎片: 0, 魔素: 5 },
  精神陷阱: { 魔晶: 0, 碎片: 0, 魔素: 10 },
  色欲陷阱: { 魔晶: 0, 碎片: 1, 魔素: 10 },
  宝箱陷阱: { 魔晶: 15, 碎片: 0, 魔素: 0 },
};

const 陷阱类型映射: Record<string, string> = {
  物理陷阱: '物理',
  魔法陷阱: '魔法',
  精神陷阱: '精神',
  色欲陷阱: '色欲',
  宝箱陷阱: '宝箱',
};

function exec布置陷阱(floorName: string, 陷阱类型: string, 等级: number = 1): BuildResult {
  const base = 陷阱费用表[陷阱类型];
  if (!base) return { 成功: false, 描述: `未知陷阱类型:${陷阱类型}` };
  const c = { 魔晶: base.魔晶 * 等级, 碎片: base.碎片 * 等级, 魔素: base.魔素 * 等级 };
  if (!checkResource(c.魔晶, c.碎片, 0, c.魔素)) return { 成功: false, 描述: `布置${陷阱类型}${['Ⅰ','Ⅱ','Ⅲ'][等级 - 1]}→${floorName}资源不足(需${fmtCostFull(c.魔晶, c.碎片, c.魔素)})` };
  deductResource(c.魔晶, c.碎片, 0, c.魔素);
  const 枚举类型 = 陷阱类型映射[陷阱类型] || '物理';
  const 档位罗马 = ['Ⅰ', 'Ⅱ', 'Ⅲ'][等级 - 1];
  const 伤害倍率提示 = 等级 === 1 ? '基础伤害值' : 等级 === 2 ? '约为1档的2倍' : '约为1档的3倍';
  const 概率提示 = 等级 === 1 ? '50%~70%' : 等级 === 2 ? '65%~85%' : '80%~100%';
  const 效果提示 = 等级 >= 3 ? '，特殊效果应明显增强（如必定附加状态、持续时间延长等）' : 等级 === 2 ? '，特殊效果可略有增强' : '';
  return { 成功: true, 描述: `布置${陷阱类型}${档位罗马}→${floorName}(-${fmtCostFull(c.魔晶, c.碎片, c.魔素)})`, 额外: `[AI需在JSONPatch中insert陷阱到/地下城/楼层/${floorName}/陷阱/{陷阱名}，等级=${等级}，类型必须为"${枚举类型}"，生成属性:等级/类型/伤害值/特殊效果/触发概率/描述。${等级}档陷阱：${伤害倍率提示}，触发概率建议${概率提示}${效果提示}]` };
}

const 魔物费用表: Record<string, { 魔晶: number; 碎片: number }> = {
  普通魔物: { 魔晶: 10, 碎片: 0 },
  精英魔物: { 魔晶: 30, 碎片: 2 },
  首领魔物: { 魔晶: 50, 碎片: 5 },
};

function exec召唤魔物(floorName: string, 魔物档位: string): BuildResult {
  const c = 魔物费用表[魔物档位];
  if (!c) return { 成功: false, 描述: `未知魔物档位:${魔物档位}` };
  if (!checkResource(c.魔晶, c.碎片, 0)) return { 成功: false, 描述: `召唤${魔物档位}→${floorName}资源不足(需${fmtCost(c.魔晶, c.碎片)})` };
  deductResource(c.魔晶, c.碎片, 0);
  const 档位提示 = 魔物档位 === '普通魔物' ? '普通(Lv1~3)' : 魔物档位 === '精英魔物' ? '精英(Lv4~8)' : '首领(Lv10~15)';
  return { 成功: true, 描述: `召唤${魔物档位}→${floorName}(-${fmtCost(c.魔晶, c.碎片)})`, 额外: `[AI需在JSONPatch中insert魔物到/地下城/楼层/${floorName}/驻守魔物/{魔物名}，档位:${档位提示}，生成属性:档位/等级/类型/生命值/生命上限/攻击力/防御力/特殊能力/描述。档位填"${魔物档位 === '普通魔物' ? '普通' : 魔物档位 === '精英魔物' ? '精英' : '首领'}"。数值公式:HP=等级×10,ATK=等级×2,DEF=等级×1.5(取整)]` };
}

function exec升级NPC(name: string): BuildResult {
  const npc = store.data.NPC[name];
  if (!npc) return { 成功: false, 描述: `${name}不存在` };
  if (npc.等级 >= 20) return { 成功: false, 描述: `${name}已满级` };
  const 魔晶 = npc.等级 * 5, 碎片 = 1;
  if (!checkResource(魔晶, 碎片, 0)) return { 成功: false, 描述: `升级${name}资源不足(需${魔晶}魔晶+${碎片}碎片)` };
  deductResource(魔晶, 碎片, 0);
  npc.等级 += 1;
  npc.生命上限 += 10; npc.生命值 += 10;
  npc.攻击力 += 2; npc.防御力 += 2;
  return { 成功: true, 描述: `${name}升级 Lv${npc.等级 - 1}→${npc.等级}(-${魔晶}魔晶-${碎片}碎片,HP上限+10/ATK+2/DEF+2)` };
}

function exec升级魔物(floorName: string, mobName: string): BuildResult {
  const mob = store.data.地下城.楼层[floorName]?.驻守魔物?.[mobName];
  if (!mob) return { 成功: false, 描述: `${mobName}不存在` };
  if (mob.等级 >= 20) return { 成功: false, 描述: `${mobName}已满级` };
  const 魔晶 = mob.等级 * 3;
  if (!checkResource(魔晶, 0, 0)) return { 成功: false, 描述: `升级${mobName}资源不足(需${魔晶}魔晶)` };
  deductResource(魔晶, 0, 0);
  mob.等级 += 1;
  mob.生命上限 += 10; mob.生命值 += 10;
  mob.攻击力 += 2; mob.防御力 += 2;
  return { 成功: true, 描述: `${mobName}升级 Lv${mob.等级 - 1}→${mob.等级}(-${魔晶}魔晶,HP上限+10/ATK+2/DEF+2)` };
}

function exec进化魔物(floorName: string, mobName: string): BuildResult {
  const mob = store.data.地下城.楼层[floorName]?.驻守魔物?.[mobName];
  if (!mob) return { 成功: false, 描述: `${mobName}不存在` };
  if ((mob as any).档位 && (mob as any).档位 !== '普通') return { 成功: false, 描述: `${mobName}已进化或非普通档位` };
  if (mob.等级 < 4) return { 成功: false, 描述: `${mobName}等级不足(需Lv4)` };
  const 碎片 = 2;
  if (!checkResource(0, 碎片, 0)) return { 成功: false, 描述: `进化${mobName}资源不足(需${碎片}碎片)` };
  deductResource(0, 碎片, 0);
  (mob as any).档位 = '精英';
  mob.生命上限 += 20; mob.生命值 += 20;
  mob.攻击力 += 4; mob.防御力 += 4;
  return { 成功: true, 描述: `${mobName}进化！普通→精英(-${碎片}碎片,HP上限+20/ATK+4/DEF+4)`, 额外: `[AI需更新魔物：可用move将/地下城/楼层/${floorName}/驻守魔物/${mobName}重命名为进化后的新名字（如"哥布林勇士"），然后replace /描述 为进化后的新形态描述，replace /特殊能力 为进化后获得的新能力。不要重复insert或remove]` };
}

function exec进阶魔物(floorName: string, mobName: string): BuildResult {
  const mob = store.data.地下城.楼层[floorName]?.驻守魔物?.[mobName];
  if (!mob) return { 成功: false, 描述: `${mobName}不存在` };
  if ((mob as any).档位 !== '精英') return { 成功: false, 描述: `${mobName}非精英档位，无法进阶` };
  if (mob.等级 < 10) return { 成功: false, 描述: `${mobName}等级不足(需Lv10)` };
  const 碎片 = 5;
  if (!checkResource(0, 碎片, 0)) return { 成功: false, 描述: `进阶${mobName}资源不足(需${碎片}碎片)` };
  deductResource(0, 碎片, 0);
  (mob as any).档位 = '首领';
  mob.生命上限 += 30; mob.生命值 += 30;
  mob.攻击力 += 6; mob.防御力 += 6;
  return { 成功: true, 描述: `${mobName}进阶！精英→首领(-${碎片}碎片,HP上限+30/ATK+6/DEF+6)`, 额外: `[AI需更新魔物：可用move将/地下城/楼层/${floorName}/驻守魔物/${mobName}重命名为进阶后的霸气新名字（如"深渊哥布林王"），然后replace /描述 为进阶后的霸气形态描述，replace /特殊能力 为进阶后获得的强大能力。不要重复insert或remove]` };
}

function fmtCostFull(魔晶 = 0, 碎片 = 0, 魔素 = 0): string {
  const parts: string[] = [];
  if (魔晶) parts.push(`${魔晶}魔晶`);
  if (碎片) parts.push(`${碎片}碎片`);
  if (魔素) parts.push(`${魔素}魔素`);
  return parts.join('+') || '—';
}

function exec转化暗堕(name: string, cap: any): BuildResult {
  if (!store.data.俘获者[name]) return { 成功: false, 描述: '俘获者不存在' };
  const 类型 = ['战士', '圣骑士', '武僧'].includes(cap.职业) ? '战斗' : ['法师', '牧师', '术士'].includes(cap.职业) ? '辅助' : '特殊';
  const lv = cap.等级 || 1;
  delete (store.data.俘获者 as any)[name];
  _.set(store.data.NPC, name, {
    性别: cap.性别, 种族: cap.种族, 职业: cap.职业,
    在场: true, 当前位置: '王座之间', 状态: '空闲',
    好感度: 100, 态度: '痴迷', 备注: `由俘获者转化而来，原职业${cap.职业}`,
    等级: lv, 生命值: lv * 10, 生命上限: lv * 10, 攻击力: lv * 2, 防御力: Math.floor(lv * 1.5), 类型,
    技能: [], 装备: [], 魔物化: false, 融合次数: 0, 融合特征: '', 融合种族: [], 融合能力: [], 外貌: cap.外貌 ?? '',
  });
  return { 成功: true, 描述: `${name}转化为暗堕随从(Lv${lv} HP${lv * 10}/ATK${lv * 2}/DEF${Math.floor(lv * 1.5)}/${类型})` };
}

const 融合系数表 = [0.8, 0.6, 0.4];
const 档位倍率: Record<string, number> = { 普通: 1, 精英: 1.2, 首领: 1.5 };

function exec融合(captiveName: string, cap: any, floorName: string, mobName: string): BuildResult {
  if (!store.data.俘获者[captiveName]) return { 成功: false, 描述: '俘获者不存在' };
  const floor = store.data.地下城.楼层[floorName];
  if (!floor) return { 成功: false, 描述: '楼层不存在' };
  const mob = floor.驻守魔物[mobName];
  if (!mob) return { 成功: false, 描述: '魔物不存在' };
  if (!checkResource(15, 3, 0)) return { 成功: false, 描述: '融合资源不足(需15魔晶+3碎片)' };

  deductResource(15, 3, 0);

  const 次数 = cap.融合次数 ?? 0;
  const 系数 = 融合系数表[次数] ?? 0.4;
  const 倍率 = 档位倍率[mob.档位] ?? 1;

  const newHp = Math.floor(mob.生命上限 * 系数 * 倍率);
  const newAtk = Math.floor(mob.攻击力 * 系数 * 倍率);
  const newDef = Math.floor(mob.防御力 * 系数 * 倍率);
  const newLv = Math.max(cap.等级 ?? 1, mob.等级);

  const 融合种族 = [...(cap.融合种族 ?? [])];
  if (!融合种族.includes(mob.描述?.split(' ')[0] || '')) 融合种族.push(mob.特殊能力?.split('，')[0] || mob.档位);

  _.set(store.data.NPC, captiveName, {
    性别: cap.性别, 种族: cap.种族, 职业: cap.职业,
    在场: true, 当前位置: '炼金祭坛', 状态: '空闲',
    好感度: Math.floor((cap.服从度 ?? 5) * 0.5), 态度: '忠诚',
    等级: newLv, 生命值: newHp, 生命上限: newHp, 攻击力: newAtk, 防御力: newDef,
    类型: mob.类型 ?? '战斗',
    技能: [], 装备: [],
    魔物化: true, 融合次数: 次数 + 1,
    融合特征: '', 融合种族: 融合种族, 融合能力: [],
    外貌: cap.外貌 ?? '',
    备注: `原俘获者，融合了${mobName}(${mob.档位 ?? '普通'})`,
  });

  delete (store.data.俘获者 as any)[captiveName];
  delete floor.驻守魔物[mobName];

  return {
    成功: true,
    描述: `${captiveName}与${mobName}融合！成为部下(Lv${newLv} HP${newHp}/ATK${newAtk}/DEF${newDef} 好感${Math.floor((cap.服从度 ?? 5) * 0.5)})`,
    额外: `[AI需生成融合形态：1.用replace修改/NPC/${captiveName}/外貌，描写融合后的新外貌（参考世界书融合炼金中${mob.档位 ?? '普通'}档${mob.类型 ?? '战斗'}型魔物的特征表）2.用replace修改/NPC/${captiveName}/融合特征，总结外貌变化（如"猫耳、猫尾、竖瞳"）3.用replace修改/NPC/${captiveName}/融合能力，列出继承的特殊能力 4.用replace修改/NPC/${captiveName}/技能，设置2-3个战斗技能。不要重复insert或remove]`,
  };
}

function exec融合NPC(npcName: string, npc: any, floorName: string, mobName: string): BuildResult {
  if (!store.data.NPC[npcName]) return { 成功: false, 描述: '部下不存在' };
  const floor = store.data.地下城.楼层[floorName];
  if (!floor) return { 成功: false, 描述: '楼层不存在' };
  const mob = floor.驻守魔物[mobName];
  if (!mob) return { 成功: false, 描述: '魔物不存在' };
  if ((npc.融合次数 ?? 0) >= 3) return { 成功: false, 描述: '已达融合上限(3次)' };
  if (!checkResource(15, 3, 0)) return { 成功: false, 描述: '融合资源不足(需15魔晶+3碎片)' };

  deductResource(15, 3, 0);

  const 次数 = npc.融合次数 ?? 0;
  const 系数 = 融合系数表[次数] ?? 0.4;
  const 倍率 = 档位倍率[mob.档位] ?? 1;

  npc.生命上限 += Math.floor(mob.生命上限 * 系数 * 倍率);
  npc.攻击力 += Math.floor(mob.攻击力 * 系数 * 倍率);
  npc.防御力 += Math.floor(mob.防御力 * 系数 * 倍率);
  npc.等级 = Math.max(npc.等级, mob.等级);
  npc.融合次数 = 次数 + 1;
  const 融合种族 = [...(npc.融合种族 ?? [])];
  融合种族.push(mob.特殊能力?.split('，')[0] || mob.档位 || '未知');
  npc.融合种族 = 融合种族;

  delete floor.驻守魔物[mobName];

  return {
    成功: true,
    描述: `${npcName}与${mobName}融合！(第${次数 + 1}次 HP+${Math.floor(mob.生命上限 * 系数 * 倍率)}/ATK+${Math.floor(mob.攻击力 * 系数 * 倍率)}/DEF+${Math.floor(mob.防御力 * 系数 * 倍率)})`,
    额外: `[AI需更新融合形态：1.用replace修改/NPC/${npcName}/外貌，追加新融合特征描写 2.用replace修改/NPC/${npcName}/融合特征，追加新特征 3.用replace修改/NPC/${npcName}/融合能力，追加继承的新能力。不要重复insert或remove]`,
  };
}

function executeBuild(action: 'build' | 'convert' | 'fuse', key: string, ...args: any[]) {
  const snapshot = _.cloneDeep(store.data);
  let prevInput = '';
  try { const $p = window.parent?.$ || window.$; prevInput = $p?.('#send_textarea')?.val() || ''; } catch { /* noop */ }

  let results: BuildResult[] = [];
  if (action === 'build') {
    const buildFn = args[0] as () => BuildResult;
    results = [buildFn()];
  } else if (action === 'convert') {
    results = [exec转化暗堕(args[0] as string, args[1] as any)];
  } else if (action === 'fuse') {
    const fn = args[0] as () => BuildResult;
    results = [fn()];
  }
  const anySuccess = results.some(r => r.成功);
  const lines = results.map(r => (r.成功 ? '✅' : '❌') + r.描述 + (r.额外 ? '\n' + r.额外 : ''));
  const r = store.data.地下城.资源;
  lines.push(`---剩余: 魔晶${r.魔晶} 碎片${r.灵魂碎片} 魔素${r.魔素} 魔力${store.data.地下城.城主.魔力}/${store.data.地下城.城主.魔力上限}`);
  lines.push('[以上建设已由UI自动处理，AI只需据此写剧情，不要在JSONPatch中重复扣减资源或增删楼层/设施]');
  const textToSend = lines.join('\n');
  nextTick(() => fillRawInput(textToSend));

  if (anySuccess) {
    undoStack.value.push({ snapshot, prevInput, key });
    if (undoTimer) clearTimeout(undoTimer);
    undoTimer = setTimeout(() => { undoStack.value = []; }, 60000);
  }
}

function performUndo() {
  const item = undoStack.value.pop();
  if (!item) return;
  const { snapshot, prevInput } = item;
  const keys = Object.keys(store.data);
  keys.forEach(k => { (store.data as any)[k] = snapshot[k]; });
  try {
    const $p = window.parent?.$ || window.$;
    $p?.('#send_textarea')?.val(prevInput)?.trigger('input');
  } catch { /* noop */ }
  if (undoStack.value.length > 0) {
    if (undoTimer) clearTimeout(undoTimer);
    undoTimer = setTimeout(() => { undoStack.value = []; }, 60000);
  } else {
    if (undoTimer) { clearTimeout(undoTimer); undoTimer = null; }
  }
}

const lordHpPct = computed(() => {
  const max = store.data.地下城.城主.生命上限;
  return max > 0 ? Math.max(0, Math.min(100, (store.data.地下城.城主.生命值 / max) * 100)) : 0;
});

const tabs = computed(() => [
  { id: 'floor', label: '地下城' },
  { id: 'npc', label: '部下', badge: npcCount.value || undefined },
  { id: 'invader', label: '闯入者', badge: invaderCount.value || undefined },
  { id: 'captive', label: '俘获者', badge: captiveCount.value || undefined },
  ...(testMode.value ? [{ id: 'test' as const, label: '测试' }] : []),
]);

function hpPct(inv: { 生命值: number; 生命上限: number }) { return inv.生命上限 > 0 ? Math.max(0, Math.min(100, (inv.生命值 / inv.生命上限) * 100)) : 0; }
function wpPct(inv: { 意志力: number; 意志上限: number }) { return inv.意志上限 > 0 ? Math.max(0, Math.min(100, (inv.意志力 / inv.意志上限) * 100)) : 0; }
function npcHpPct(npc: { 生命值: number; 生命上限: number }) { return npc.生命上限 > 0 ? Math.max(0, Math.min(100, (npc.生命值 / npc.生命上限) * 100)) : 0; }
function invStatusClass(status: string) {
  return { 闯入中: 'active', 战斗中: 'danger-tag', 被击败: 'muted', 精神崩溃: 'captive-tag', 撤退: 'muted' }[status] || 'muted';
}
const expandedMob = ref<string | null>(null);
function toggleMobDetail(key: string) {
  expandedMob.value = expandedMob.value === key ? null : key;
}
const hasAltar = computed(() => _.some(store.data.地下城.设施, f => f.类型 === '炼金祭坛'));
const fuseTargetCaptive = ref<string | null>(null);
const fuseTargetNPC = ref<string | null>(null);
const allMobs = computed(() => {
  const list: { floor: string; name: string; 档位: string; 等级: number; 生命上限: number; 攻击力: number; 防御力: number; 特殊能力: string }[] = [];
  _.forEach(store.data.地下城.楼层, (floor, fn) => {
    _.forEach(floor.驻守魔物, (mob, mn) => {
      list.push({ floor: fn, name: mn, 档位: mob.档位 ?? '普通', 等级: mob.等级, 生命上限: mob.生命上限, 攻击力: mob.攻击力, 防御力: mob.防御力, 特殊能力: mob.特殊能力 ?? '无' });
    });
  });
  return list;
});
function npcAttitudeClass(favor: number) {
  if (favor >= 81) return 'captive-tag';
  if (favor >= 61) return 'done';
  if (favor >= 41) return 'active';
  if (favor >= 21) return 'pending';
  return 'muted';
}

const worldDay = computed(() => _.get(store.data, '世界时间.日', 1));
const worldHour = computed(() => _.get(store.data, '世界时间.时', 8));
const worldMinute = computed(() => _.get(store.data, '世界时间.分', 0));
const timeString = computed(() => `${String(worldHour.value).padStart(2, '0')}:${String(worldMinute.value).padStart(2, '0')}`);

const 楼层数 = computed(() => _.size(store.data.地下城.楼层));
const 魅惑升级碎片 = computed(() => store.data.地下城.城主.魅惑等级 * 3);
const 魔力上限升级次数 = computed(() => Math.max(0, Math.round((store.data.地下城.城主.魔力上限 - 100) / 20)));
const 魔力上限升级碎片 = computed(() => 5 + 魔力上限升级次数.value * 2);
const 魔力上限升级魔晶 = computed(() => 20 + 魔力上限升级次数.value * 10);
const 挖掘楼层魔晶 = computed(() => 30 + (楼层数.value - 3) * 15);
const 魔力缺失 = computed(() => Math.max(0, store.data.地下城.城主.魔力上限 - store.data.地下城.城主.魔力));
const 可恢复魔力 = computed(() => Math.min(魔力缺失.value, Math.floor(store.data.地下城.城主.魔力上限 * 0.3)));
const 恢复魔力魔晶 = computed(() => Math.ceil(可恢复魔力.value / 2));
const 魔力已满 = computed(() => 魔力缺失.value === 0);

function 强化防御魔晶(防御力: number): number {
  return 10 + 防御力 * 5;
}

const 设施基础费用: Record<string, { 魔晶: number; 碎片: number }> = {
  囚室: { 魔晶: 20, 碎片: 0 },
  调教室: { 魔晶: 50, 碎片: 2 },
  祭坛: { 魔晶: 80, 碎片: 5 },
  魔素泉: { 魔晶: 40, 碎片: 0 },
  魅魔巢穴: { 魔晶: 60, 碎片: 3 },
  炼金祭坛: { 魔晶: 50, 碎片: 8 },
};

function 设施费用(类型: string): { 魔晶: number; 碎片: number } {
  const base = 设施基础费用[类型] || { 魔晶: 10, 碎片: 0 };
  const count = _.filter(store.data.地下城.设施, f => f.类型 === 类型).length;
  return {
    魔晶: base.魔晶 + count * Math.round(base.魔晶 * 0.5),
    碎片: base.碎片 + count * (base.碎片 > 0 ? 1 : 0),
  };
}

const 设施建设列表 = computed(() => Object.keys(设施基础费用).map(名 => ({ 名, 费用: 设施费用(名) })));

function fmtCost(魔晶 = 0, 碎片 = 0): string {
  const parts: string[] = [];
  if (魔晶) parts.push(`${魔晶}魔晶`);
  if (碎片) parts.push(`${碎片}碎片`);
  return parts.join('+') || '—';
}

const 费用预览表 = computed(() => [
  { 项目: '挖掘楼层', 费用: `${挖掘楼层魔晶.value}魔晶`, 执行: () => exec挖掘楼层(), 禁用: 楼层数.value >= 10 || !checkResource(挖掘楼层魔晶.value, 0, 0) },
  { 项目: '升级魅惑', 费用: `${魅惑升级碎片.value}碎片`, 执行: () => exec升级魅惑(), 禁用: store.data.地下城.城主.魅惑等级 >= 10 || !checkResource(0, 魅惑升级碎片.value, 0) },
  { 项目: '魔力上限', 费用: fmtCost(魔力上限升级魔晶.value, 魔力上限升级碎片.value), 执行: () => exec魔力上限(), 禁用: !checkResource(魔力上限升级魔晶.value, 魔力上限升级碎片.value, 0) },
  { 项目: '恢复魔力', 费用: 魔力已满.value ? '已满' : `${恢复魔力魔晶.value}魔晶→${可恢复魔力.value}魔力`, 执行: () => exec恢复魔力(), 禁用: 魔力已满.value || store.data.地下城.资源.魔晶 < 恢复魔力魔晶.value },
  { 项目: '碎片换魔晶', 费用: '1碎片→5魔晶', 执行: () => exec转化('碎片换魔晶', 1), 禁用: store.data.地下城.资源.灵魂碎片 < 1 },
  { 项目: '碎片换魔素', 费用: '1碎片→10魔素', 执行: () => exec转化('碎片换魔素', 1), 禁用: store.data.地下城.资源.灵魂碎片 < 1 },
  { 项目: '魔晶换碎片', 费用: '8魔晶→1碎片', 执行: () => exec转化('魔晶换碎片', 1), 禁用: store.data.地下城.资源.魔晶 < 8 },
  { 项目: '魔晶换魔素', 费用: '1魔晶→2魔素', 执行: () => exec转化('魔晶换魔素', 1), 禁用: store.data.地下城.资源.魔晶 < 1 },
  ...设施建设列表.value.map(f => ({ 项目: `建造${f.名}`, 费用: fmtCost(f.费用.魔晶, f.费用.碎片), 执行: () => exec建造设施(f.名), 禁用: !checkResource(f.费用.魔晶, f.费用.碎片, 0) })),
  ..._.map(store.data.地下城.楼层, (floor, name) => ({
    项目: `强化防御:${name}`,
    费用: `${强化防御魔晶(floor.防御力)}魔晶`,
    执行: () => exec强化防御(name, floor.防御力),
    禁用: floor.防御力 >= store.data.地下城.声望 * 5 || !checkResource(强化防御魔晶(floor.防御力), 0, 0),
  })),
  ..._.flatMap(store.data.地下城.楼层, (floor, name) => [
    ..._.flatMap(陷阱费用表, (c, t) => [1, 2, 3].map(tier => ({ 项目: `布置${t}${['Ⅰ','Ⅱ','Ⅲ'][tier - 1]}→${name}`, 费用: fmtCostFull(c.魔晶 * tier, c.碎片 * tier, c.魔素 * tier), 执行: () => exec布置陷阱(name, t, tier), 禁用: !checkResource(c.魔晶 * tier, c.碎片 * tier, 0, c.魔素 * tier) }))),
    ..._.map(魔物费用表, (c, t) => ({ 项目: `召唤${t}→${name}`, 费用: fmtCost(c.魔晶, c.碎片), 执行: () => exec召唤魔物(name, t), 禁用: !checkResource(c.魔晶, c.碎片, 0) })),
    ..._.flatMap(floor.驻守魔物, (mob: any, mn: string) => {
      const items: any[] = [{ 项目: `升级${mn}→${name}`, 费用: `${mob.等级 * 3}魔晶`, 执行: () => exec升级魔物(name, mn), 禁用: mob.等级 >= 20 || !checkResource(mob.等级 * 3, 0, 0) }];
      if ((mob.档位 || '普通') === '普通' && mob.等级 >= 4) items.push({ 项目: `进化${mn}→${name}`, 费用: `2碎片`, 执行: () => exec进化魔物(name, mn), 禁用: !checkResource(0, 2, 0) });
      if (mob.档位 === '精英' && mob.等级 >= 10) items.push({ 项目: `进阶${mn}→${name}`, 费用: `5碎片`, 执行: () => exec进阶魔物(name, mn), 禁用: !checkResource(0, 5, 0) });
      return items;
    }),
  ]),
  ..._.map(store.data.NPC, (npc, name) => ({ 项目: `升级${name}`, 费用: `${npc.等级 * 5}魔晶+1碎片`, 执行: () => exec升级NPC(name), 禁用: npc.等级 >= 20 || !checkResource(npc.等级 * 5, 1, 0) })),
]);

function testSet(路径: string, 值: any) { _.set(store.data, 路径, 值); }
function testGet(路径: string, 默认: any = 0) { return _.get(store.data, 路径, 默认); }

function quickScenario(场景: string) {
  const r = store.data.地下城.资源;
  const lord = store.data.地下城.城主;
  switch (场景) {
    case '满资源':
      r.魔晶 = 9999; r.灵魂碎片 = 9999; r.魔素 = 9999;
      break;
    case '穷光蛋':
      r.魔晶 = 0; r.灵魂碎片 = 0; r.魔素 = 0;
      break;
    case '满级城主':
      lord.魅惑等级 = 10; lord.魔力上限 = 300; lord.魔力 = 300;
      lord.生命上限 = 325; lord.生命值 = 325; lord.攻击力 = 60; lord.防御力 = 37;
      break;
    case '魔力耗尽':
      lord.魔力 = 0;
      break;
    case '满服俘获者':
      _.forEach(store.data.俘获者, c => { c.服从度 = 100; });
      if (_.isEmpty(store.data.俘获者)) {
        _.set(store.data.俘获者, '测试英雄', {
          性别: '女', 种族: '人类', 职业: '圣骑士', 等级: 5,
          服从度: 100, 羞耻度: 80, 状态: '完全臣服', 当前位置: '囚室',
          身体状态: '项圈', 标记: ['奴隶印记', '项圈'], 外貌: '金发碧眼，浑身烙印', 备注: '',
        });
      }
      break;
    case '跨天前':
      _.set(store.data, '世界时间.时', 23); _.set(store.data, '世界时间.分', 50);
      break;
    case '初始状态':
      r.魔晶 = 100; r.灵魂碎片 = 8; r.魔素 = 40;
      lord.魅惑等级 = 1; lord.魔力上限 = 100; lord.魔力 = 50;
      lord.生命上限 = 100; lord.生命值 = 100; lord.攻击力 = 15; lord.防御力 = 10;
      _.set(store.data, '世界时间.年', 1); _.set(store.data, '世界时间.月', 1);
      _.set(store.data, '世界时间.日', 1); _.set(store.data, '世界时间.时', 8);
      _.set(store.data, '世界时间.分', 0);
      break;
  }
}

function testAddFloor() {
  const count = _.size(store.data.地下城.楼层);
  if (count >= 10) return;
  const name = `测试楼层${count + 1}`;
  _.set(store.data.地下城.楼层, name, { 主题: '测试', 防御力: 0, 陷阱: {}, 驻守魔物: {}, 描述: '测试用楼层' });
}
function testRemoveLastFloor() {
  const keys = Object.keys(store.data.地下城.楼层);
  if (keys.length <= 3) return;
  delete store.data.地下城.楼层[keys[keys.length - 1]];
}
function testClearFloors() {
  const keys = Object.keys(store.data.地下城.楼层);
  keys.slice(3).forEach(k => delete store.data.地下城.楼层[k]);
}

function testAddFacility(类型: string) {
  const count = _.filter(store.data.地下城.设施, f => f.类型 === 类型).length;
  const name = `${类型}${count + 1}号`;
  _.set(store.data.地下城.设施, name, { 类型, 描述: '测试设施' });
}
function testClearFacilities() {
  store.data.地下城.设施 = {};
}

function testInjectInvader() {
  const id = `测试冒险者${_.size(store.data.闯入者) + 1}`;
  const lv = Math.floor(Math.random() * 5) + 1;
  _.set(store.data.闯入者, id, {
    性别: Math.random() > 0.5 ? '男' : '女', 种族: '人类', 职业: '战士', 等级: lv,
    生命值: lv * 10, 生命上限: lv * 10, 攻击力: lv * 2, 防御力: lv,
    意志力: lv * 5, 意志上限: lv * 5, 当前位置: '入口大厅', 状态: '闯入中',
    技能: ['格挡强化'], 装备: ['铁剑', '皮甲'], 备注: '',
  });
  store.data.当前场景.正在闯入.push(id);
}
function testInjectCaptive() {
  const id = `测试俘获者${_.size(store.data.俘获者) + 1}`;
  _.set(store.data.俘获者, id, {
    性别: '女', 种族: '人类', 职业: '法师', 等级: 3,
    服从度: 15, 羞耻度: 30, 状态: '抗拒', 当前位置: '囚室',
    身体状态: '完好', 标记: [], 外貌: '测试用', 备注: '',
  });
}
function testInjectNPC() {
  const id = `测试部下${_.size(store.data.NPC) + 1}`;
  _.set(store.data.NPC, id, {
    性别: '女', 种族: '人类', 职业: '法师',
    在场: true, 当前位置: '王座之间',
    状态: '空闲', 好感度: 50, 态度: '忠诚', 备注: '测试NPC',
    等级: 3, 生命值: 30, 生命上限: 30, 攻击力: 6, 防御力: 5, 类型: '辅助',
    技能: [], 装备: [], 魔物化: false, 融合次数: 0, 融合特征: '', 融合种族: [], 融合能力: [], 外貌: '',
  });
}
function testClearAllEntities() {
  store.data.闯入者 = {};
  store.data.俘获者 = {};
  store.data.NPC = {};
  store.data.当前场景.正在闯入 = [];
  store.data.当前场景.当前战斗 = '无';
  store.data.当前场景.当前交互 = '无';
}
</script>

<style scoped lang="scss">
.dungeon-card {
  --accent: #c41e3a;
  --accent-rgb: 196, 30, 58;
  --bg: #0d0a14;
  --panel: #15102000;
  --panel-2: #1a1424;
  --line: rgba(var(--accent-rgb), 0.22);
  --line-strong: rgba(var(--accent-rgb), 0.45);
  --text: #e8e0d8;
  --muted: #8a8580;
  --gold: #c9a227;
  --purple: #9d5fe0;
  --blood: #c41e3a;
  --captive: #a020f0;
  --gold-soft: rgba(201, 162, 39, 0.14);
  --topbar-bg: rgba(255, 255, 255, 0.03);
  --control-bg: rgba(255, 255, 255, 0.05);
  --soft-bg: rgba(255, 255, 255, 0.04);
  --subtle-line: rgba(255, 255, 255, 0.06);
  --desc: #c4b8a5;
  --brand-text: #0d0a14;
  --card-gradient: linear-gradient(180deg, #15101e 0%, #0a0810 100%);
  --primary-gradient: linear-gradient(135deg, rgba(var(--accent-rgb), 0.14), rgba(21, 16, 30, 0.98));
  --shadow: 0 14px 30px rgba(0, 0, 0, 0.4);
  --danger: #c06455;
  width: 100%;
  box-sizing: border-box;
  color: var(--text);
  font-family: "Noto Sans SC", "Microsoft YaHei", system-ui, sans-serif;
  background: var(--card-gradient);
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow);
}

.dungeon-card.theme-light {
  --bg: #f5eee0;
  --panel: rgba(255, 251, 242, 0.94);
  --panel-2: rgba(250, 240, 222, 0.92);
  --line: rgba(var(--accent-rgb), 0.26);
  --line-strong: rgba(var(--accent-rgb), 0.5);
  --text: #2a2118;
  --muted: #796a57;
  --gold-soft: rgba(201, 162, 39, 0.14);
  --topbar-bg: rgba(255, 255, 255, 0.46);
  --control-bg: rgba(255, 255, 255, 0.68);
  --soft-bg: rgba(var(--accent-rgb), 0.07);
  --subtle-line: rgba(89, 63, 31, 0.12);
  --desc: #675847;
  --brand-text: #fff8ea;
  --card-gradient: radial-gradient(circle at top left, rgba(var(--accent-rgb), 0.14), transparent 34%), linear-gradient(180deg, #fff8ea 0%, #efe0c8 100%);
  --primary-gradient: linear-gradient(135deg, rgba(var(--accent-rgb), 0.2), rgba(255, 251, 242, 0.98));
  --shadow: 0 12px 26px rgba(82, 55, 22, 0.16);
}

.dungeon-card.tone-blood { --accent: #c41e3a; --accent-rgb: 196, 30, 58; }
.dungeon-card.tone-void { --accent: #9d5fe0; --accent-rgb: 157, 95, 224; }
.dungeon-card.tone-gold { --accent: #c9a227; --accent-rgb: 201, 162, 39; }
.dungeon-card.tone-ice { --accent: #5a7a9a; --accent-rgb: 90, 122, 154; }

.topbar { display: flex; justify-content: space-between; gap: 8px; align-items: center; padding: 8px 10px; background: var(--topbar-bg); border-bottom: 1px solid var(--line); }
.brand { display: flex; align-items: center; gap: 8px; min-width: 0; }
.brand-mark { display: grid; place-items: center; width: 30px; height: 30px; flex: 0 0 auto; border-radius: 9px; color: var(--brand-text); background: var(--accent); font-size: 17px; font-weight: 900; }
.brand strong { display: block; color: var(--text); font-size: 15px; letter-spacing: 0.06em; line-height: 1.2; }
.brand small { display: block; margin-top: 1px; color: var(--muted); font-size: 10px; line-height: 1.25; }
.version-badge { color: var(--muted); font-size: 0.55em; font-weight: normal; opacity: 0.5; margin-left: 4px; flex-shrink: 0; letter-spacing: 0.5px; }
.top-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.time-chip, .ghost-btn, .round-btn { border: 1px solid var(--line); color: var(--text); background: var(--control-bg); border-radius: 8px; }
.time-chip { padding: 4px 8px; font-size: 10px; white-space: nowrap; }
.ghost-btn, .round-btn { padding: 4px 9px; cursor: pointer; font-size: 12px; }
.ghost-btn.active { border-color: var(--line-strong); color: var(--accent); background: var(--gold-soft); }

.collapsed-badges { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; justify-content: flex-end; }
.collapsed-badge { display: inline-flex; align-items: center; gap: 3px; padding: 2px 6px; border-radius: 999px; background: var(--danger); color: #fff; font-size: 10px; font-weight: 800; line-height: 1.2; white-space: nowrap; }
.captive-badge { background: var(--captive); }

.settings-panel { display: flex; justify-content: flex-end; align-items: center; gap: 9px; padding: 6px 8px; background: var(--topbar-bg); border-bottom: 1px solid var(--subtle-line); flex-wrap: wrap; }
.settings-group { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.settings-label { color: var(--muted); font-size: 11px; }
.zoom-label { color: var(--muted); font-size: 12px; min-width: 42px; text-align: center; }
.theme-swatch { width: 22px; height: 22px; padding: 0; border: 1px solid var(--line); border-radius: 999px; cursor: pointer; text-indent: -999px; overflow: hidden; box-shadow: inset 0 0 0 3px var(--panel); }
.theme-swatch.active { border-color: var(--text); transform: translateY(-1px); }
.theme-swatch span { pointer-events: none; }
.swatch-blood { background: #c41e3a; }
.swatch-void { background: #9d5fe0; }
.swatch-gold { background: #c9a227; }
.swatch-ice { background: #5a7a9a; }

.content { padding: 7px; }
.tab-nav { display: grid; grid-template-columns: repeat(auto-fit, minmax(0, 1fr)); gap: 4px; margin-bottom: 7px; }
.tab-btn { position: relative; min-height: 28px; border: 1px solid transparent; border-radius: 7px; background: var(--soft-bg); color: var(--muted); cursor: pointer; font-size: 11px; transition: 0.18s ease; }
.tab-btn.active { color: var(--accent); background: var(--gold-soft); border-color: var(--line-strong); font-weight: 700; }
.tab-badge { margin-left: 4px; padding: 1px 5px; border-radius: 999px; background: var(--danger); color: #fff; font-size: 10px; }
.tab-pane { display: grid; gap: 8px; }

.panel, .hero-card { padding: 9px; background: var(--panel-2); border: 1px solid var(--line); border-radius: 9px; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06); }
.primary-card { background: var(--primary-gradient); border-color: var(--line-strong); }
.section-kicker, .panel-title { color: var(--accent); font-size: 12px; font-weight: 800; letter-spacing: 0.08em; margin-bottom: 7px; }

.player-profile-panel { transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, padding 0.2s ease; }
.player-profile-panel.compact { padding: 7px 9px; opacity: 0.82; }
.player-profile-panel.required { border-color: rgba(192, 100, 85, 0.72); background: linear-gradient(135deg, rgba(192, 100, 85, 0.14), var(--panel-2)); box-shadow: 0 0 0 1px rgba(192, 100, 85, 0.22), var(--shadow); }
.profile-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 7px; }
.player-profile-panel.compact .profile-head { align-items: center; margin-bottom: 0; }
.profile-hint { margin: 4px 0 0; color: var(--muted); font-size: 12px; line-height: 1.45; }
.player-profile-panel.required .profile-hint { color: #dfa59b; font-weight: 700; }
.profile-actions { display: flex; align-items: center; gap: 7px; flex: 0 0 auto; }
.mini-text-btn { border: 1px solid var(--line); border-radius: 6px; padding: 2px 7px; color: var(--muted); background: var(--soft-bg); cursor: pointer; font-size: 11px; }
.mini-text-btn:hover { border-color: var(--line-strong); color: var(--accent); }
.gender-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 7px; }
.gender-btn { border: 1px solid var(--line); border-radius: 7px; padding: 5px 10px; background: var(--soft-bg); color: var(--text); cursor: pointer; font-size: 12px; }
.gender-btn.active { border-color: var(--line-strong); color: var(--brand-text); background: var(--accent); font-weight: 800; }
.profile-field { display: grid; gap: 4px; margin-top: 7px; color: var(--muted); font-size: 11px; }
.profile-field textarea, .profile-field input { width: 100%; box-sizing: border-box; border: 1px solid var(--line); border-radius: 7px; padding: 7px; color: var(--text); background: var(--bg); font: inherit; font-size: 12px; line-height: 1.45; }
.profile-field textarea { resize: vertical; min-height: 44px; }
.profile-field input { height: 31px; }
.profile-field textarea:focus, .profile-field input:focus { outline: none; border-color: var(--line-strong); box-shadow: 0 0 0 2px rgba(var(--accent-rgb), 0.16); }
.compact-field { margin-top: -2px; margin-bottom: 8px; }
.profile-save-row { margin-top: 7px; }
.action-btn { border: 1px solid var(--line); border-radius: 7px; padding: 4px 9px; background: var(--soft-bg); color: var(--text); cursor: pointer; font-size: 12px; }
.action-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.action-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.action-btn.success { border-color: rgba(104, 176, 141, 0.4); color: #96d7b9; }
.action-btn.muted-btn { color: var(--muted); }
.button-row { display: flex; align-items: center; justify-content: flex-start; gap: 8px; flex-wrap: wrap; margin-top: 6px; }

.resource-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
.resource-item { display: flex; align-items: center; gap: 5px; padding: 6px 8px; border-radius: 7px; background: var(--soft-bg); border: 1px solid var(--subtle-line); }
.res-icon { font-size: 14px; }
.res-label { color: var(--muted); font-size: 11px; }
.resource-item strong { font-size: 14px; margin-left: auto; }
.gold { color: var(--gold); }
.purple { color: var(--purple); }
.blood { color: var(--blood); }

.lord-combat { margin-top: 7px; }

.card-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.card-head strong { font-size: 13px; }
.desc { margin: 6px 0; color: var(--desc); font-size: 12px; line-height: 1.55; }
.muted-desc { color: var(--muted); }

.status-tag { display: inline-flex; align-items: center; border-radius: 6px; padding: 2px 7px; font-size: 10px; font-weight: 800; white-space: nowrap; }
.status-tag.muted { background: var(--soft-bg); color: var(--muted); }
.status-tag.pending { background: rgba(var(--accent-rgb), 0.14); color: var(--accent); }
.status-tag.active { background: rgba(var(--accent-rgb), 0.14); color: var(--accent); }
.status-tag.danger-tag { background: rgba(192, 100, 85, 0.18); color: var(--danger); }
.status-tag.captive-tag { background: rgba(160, 32, 240, 0.16); color: var(--captive); }
.status-tag.present-tag { background: rgba(90, 138, 90, 0.18); color: #6a9a5a; }
.status-tag.absent-tag { background: var(--soft-bg); color: var(--muted); }

.bar-shell { position: relative; height: 16px; border-radius: 999px; overflow: hidden; background: var(--soft-bg); border: 1px solid var(--subtle-line); margin: 4px 0; }
.bar-shell span { position: absolute; inset: 0; display: grid; place-items: center; font-size: 10px; font-weight: 700; color: var(--text); text-shadow: 0 1px 2px rgba(0, 0, 0, 0.55); }
.bar-fill { height: 100%; transition: width 0.25s ease; }
.bar-fill.hp { background: linear-gradient(90deg, #8b1a1a, #c41e3a); }
.bar-fill.wp { background: linear-gradient(90deg, #6b3fa0, #9d5fe0); }
.bar-fill.obey { background: linear-gradient(90deg, #6b3fa0, #a020f0); }
.bar-fill.shame { background: linear-gradient(90deg, #c455a0, #e070c0); }
.bar-fill.favor { background: linear-gradient(90deg, #5a8a5a, #8acb8a); }

.stat-row { display: flex; gap: 10px; font-size: 11px; color: var(--muted); margin: 4px 0; }
.loc { margin-left: auto; color: var(--gold); }

.tag-section { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; margin: 5px 0; }
.tag-label { color: var(--muted); font-size: 11px; font-weight: 700; }
.tag { display: inline-block; padding: 1px 7px; font-size: 11px; border: 1px solid; border-radius: 5px; }
.tag small { font-size: 9px; opacity: 0.7; }
.trap-物理 { border-color: var(--gold); color: var(--gold); }
.trap-魔法 { border-color: #4a7fb0; color: #6aafff; }
.trap-精神 { border-color: var(--purple); color: var(--purple); }
.trap-色欲 { border-color: #c455a0; color: #e070c0; }
.trap-tier-1 { opacity: 0.85; }
.trap-tier-2 { border-width: 2px; font-weight: 600; }
.trap-tier-3 { border-width: 2px; font-weight: 700; box-shadow: 0 0 4px currentColor; }
.trap-tier-menu { display: flex; flex-direction: column; gap: 4px; }
.trap-tier-row { display: flex; align-items: center; gap: 4px; }
.trap-tier-label { font-size: 10px; color: var(--muted); min-width: 32px; font-weight: 600; }
.mob-普通 { border-color: var(--blood); color: var(--blood); }
.mob-精英 { border-color: #7a5aba; color: #b896e8; }
.mob-首领 { border-color: #8b2500; color: #d4881a; }
.mob-tag { cursor: pointer; user-select: none; transition: filter 0.15s; }
.mob-tag:hover { filter: brightness(1.3); }
.tier-mark { font-size: 8px; font-weight: 900; padding: 0 3px; margin-right: 3px; border-radius: 2px; }
.tier-mark { background: rgba(255,255,255,0.15); }
.mob-detail-card { width: 100%; margin: 4px 0; padding: 8px 10px; border: 1px solid var(--subtle-line); border-radius: 8px; background: var(--soft-bg); font-size: 11px; line-height: 1.5; }
.mob-detail-普通 { border-left: 3px solid var(--blood); }
.mob-detail-精英 { border-left: 3px solid #7a5aba; }
.mob-detail-首领 { border-left: 3px solid #8b2500; }
.mob-detail-header { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.mob-detail-header strong { font-size: 13px; }
.tier-badge { font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 3px; }
.tier-普通 { background: rgba(178,34,34,0.25); color: #e85050; }
.tier-精英 { background: rgba(122,90,186,0.25); color: #b896e8; }
.tier-首领 { background: rgba(139,37,0,0.3); color: #d4881a; }
.mob-detail-stats { display: grid; grid-template-columns: auto 1fr auto 1fr; gap: 3px 8px; margin-bottom: 6px; }
.mob-detail-stats span { color: var(--muted); font-size: 10px; }
.mob-detail-stats b { font-size: 11px; text-align: left; }
.mob-detail-row { margin-top: 4px; }
.mob-detail-label { font-size: 9px; font-weight: 700; color: var(--muted); display: block; margin-bottom: 2px; }
.mob-detail-row p { margin: 0; font-size: 11px; line-height: 1.5; }
.mob-detail-actions { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 6px; }
.lv-tag { border-color: var(--gold); color: var(--gold); font-weight: bold; }

.mark-tag { border-color: var(--blood); color: var(--blood); background: rgba(196, 30, 58, 0.1); }
.inv-skill-tag { border-color: #4a7fb0; color: #6aafff; }
.inv-gear-tag { border-color: var(--gold); color: var(--gold); }

.data-grid { display: grid; grid-template-columns: auto 1fr; gap: 5px 12px; font-size: 12px; margin: 6px 0; }
.data-grid span { color: var(--muted); }
.data-grid strong { color: var(--text); text-align: right; }
.data-grid.small { font-size: 11px; }

.empty-state { color: var(--muted); text-align: center; padding: 18px; font-size: 12px; }



.invader-panel.st-战斗中 { border-color: var(--line-strong); }
.invader-panel.st-被击败 { opacity: 0.72; }
.invader-panel.st-精神崩溃 { border-color: rgba(160, 32, 240, 0.4); }
.invader-panel.st-撤退 { opacity: 0.6; }
.captive-panel { border-left: 3px solid var(--captive); }
.captive-actions { margin-top: 7px; padding-top: 7px; border-top: 1px solid var(--subtle-line); }
.convert-btn { border-color: var(--captive); color: var(--captive); }
.convert-btn:hover { border-color: var(--captive); color: #fff; background: var(--captive); }
.fuse-btn { border-color: #9b59b6; color: #9b59b6; }
.fuse-btn:hover { border-color: #9b59b6; color: #fff; background: #9b59b6; }
.fuse-menu { padding: 7px; border-radius: 7px; background: rgba(155, 89, 182, 0.08); border: 1px dashed rgba(155, 89, 182, 0.3); }
.fuse-hint { font-size: 10px; color: var(--muted); margin-bottom: 5px; }
.fusion-info { margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--subtle-line); }
.fusion-badge { display: inline-block; padding: 2px 7px; border-radius: 5px; font-size: 10px; font-weight: 700; background: rgba(155, 89, 182, 0.15); color: #9b59b6; border: 1px solid rgba(155, 89, 182, 0.3); margin-bottom: 4px; }
.fusion-trait-tag { border-color: #9b59b6; color: #9b59b6; background: rgba(155, 89, 182, 0.1); }
.fusion-race-tag { border-color: #e67e22; color: #e67e22; background: rgba(230, 126, 34, 0.1); }
.fusion-skill-tag { border-color: #f1c40f; color: #f1c40f; background: rgba(241, 196, 15, 0.1); }
.floor-panel { border-left: 3px solid var(--accent); }

.build-panel { padding: 9px; }
.build-group { margin-bottom: 7px; }
.build-group:last-child { margin-bottom: 0; }
.build-label { color: var(--muted); font-size: 11px; font-weight: 700; margin-bottom: 4px; }
.build-buttons { display: flex; gap: 5px; flex-wrap: wrap; }
.build-btn { display: inline-flex; flex-direction: column; align-items: center; gap: 1px; padding: 5px 9px; border: 1px solid var(--line); border-radius: 7px; background: var(--soft-bg); color: var(--text); cursor: pointer; font-size: 12px; transition: 0.18s ease; }
.build-btn:hover { border-color: var(--accent); color: var(--accent); }
.build-btn:disabled { opacity: 0.38; cursor: not-allowed; }
.build-btn:disabled:hover { border-color: var(--line); color: var(--text); }
.build-btn small { font-size: 9px; color: var(--muted); font-weight: 400; }
.build-btn.sm { flex-direction: row; gap: 4px; padding: 3px 7px; font-size: 11px; }
.build-btn.sm small { font-size: 9px; }
.build-btn.xs { flex-direction: row; gap: 3px; padding: 2px 6px; font-size: 10px; }
.build-btn.xs small { font-size: 8px; }
.build-btn.evolve-btn { border-color: #7a5aba; background: rgba(122,90,186,0.15); }
.build-btn.advance-btn { border-color: #ba5a5a; background: rgba(186,90,90,0.15); }
.undo-btn { display: inline-flex; align-items: center; padding: 5px 9px; border: 1px solid var(--danger); border-radius: 7px; background: rgba(192, 100, 85, 0.16); color: var(--danger); cursor: pointer; font-size: 12px; font-weight: 700; transition: 0.18s ease; animation: undo-flash 0.3s ease; }
.undo-btn:hover { background: rgba(192, 100, 85, 0.3); }
.undo-btn.sm { padding: 3px 7px; font-size: 11px; }
.undo-btn.xs { padding: 2px 6px; font-size: 10px; }
@keyframes undo-flash { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
.floor-actions { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 7px; padding-top: 7px; border-top: 1px solid var(--subtle-line); }
.sub-menu { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px; padding-left: 4px; }

.facility-panel { border-left: 3px solid var(--gold); }
.facility-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
.facility-item { padding: 6px 8px; border: 1px solid var(--subtle-line); border-radius: 7px; background: var(--soft-bg); }
.facility-item strong { font-size: 12px; display: block; }
.facility-item small { font-size: 10px; color: var(--gold); font-weight: 700; }
.facility-item .desc { margin: 4px 0 0; font-size: 11px; line-height: 1.4; }
.fac-囚室 { border-color: var(--blood); }
.fac-调教室 { border-color: var(--captive); }
.fac-祭坛 { border-color: var(--purple); }
.fac-魔素泉 { border-color: #4a7fb0; }
.fac-魅魔巢穴 { border-color: #c455a0; }
.npc-panel { border-left: 3px solid #5a8a5a; }

@media (max-width: 560px) {
  .topbar { align-items: flex-start; }
  .brand strong { font-size: 16px; }
  .time-chip { display: none; }
  .settings-panel { flex-direction: column; align-items: flex-start; }
  .settings-group { width: 100%; }
  .tab-nav { grid-template-columns: repeat(auto-fit, minmax(60px, 1fr)); }
  .resource-grid { grid-template-columns: 1fr; }
  .card-head { align-items: flex-start; flex-direction: column; }
  .profile-head { flex-direction: column; gap: 5px; }
  .profile-actions { align-self: flex-end; }
}

.test-panel { gap: 8px; }
.test-section { padding: 9px; }
.test-section .section-kicker { display: flex; align-items: center; gap: 8px; }
.test-count { color: var(--muted); font-size: 10px; font-weight: 400; }

.test-btn-grid { display: flex; gap: 5px; flex-wrap: wrap; }
.test-btn { padding: 4px 9px; border: 1px solid var(--line); border-radius: 6px; background: var(--soft-bg); color: var(--text); cursor: pointer; font-size: 11px; transition: 0.15s ease; }
.test-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.test-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.test-btn.warn { border-color: rgba(192, 100, 85, 0.35); color: var(--danger); }
.test-btn.warn:hover:not(:disabled) { border-color: var(--danger); color: var(--danger); background: rgba(192, 100, 85, 0.1); }
.test-btn.sm { padding: 2px 6px; font-size: 10px; }

.test-field-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
.test-field { display: grid; gap: 3px; }
.test-field span { color: var(--muted); font-size: 10px; }
.test-field input { width: 100%; box-sizing: border-box; border: 1px solid var(--line); border-radius: 6px; padding: 5px 7px; color: var(--text); background: var(--bg); font: inherit; font-size: 12px; }
.test-field input:focus { outline: none; border-color: var(--line-strong); }

.test-floor-list, .test-fac-list { margin-top: 7px; display: flex; flex-direction: column; gap: 4px; }
.test-floor-row, .test-fac-row { display: flex; align-items: center; gap: 6px; padding: 4px 7px; border: 1px solid var(--subtle-line); border-radius: 6px; background: var(--soft-bg); font-size: 11px; }
.test-floor-row span, .test-fac-row span { color: var(--text); font-weight: 600; min-width: 60px; }
.test-floor-row small, .test-fac-row small { color: var(--muted); flex: 1; }
.test-floor-row .test-btn, .test-fac-row .test-btn { flex-shrink: 0; }

.test-cost-table { display: flex; flex-direction: column; gap: 3px; }
.test-cost-header { display: grid; grid-template-columns: 100px 1fr 50px; gap: 6px; padding: 3px 7px; color: var(--muted); font-size: 10px; font-weight: 700; border-bottom: 1px solid var(--subtle-line); }
.test-cost-row { display: grid; grid-template-columns: 100px 1fr 50px; gap: 6px; padding: 3px 7px; align-items: center; border: 1px solid var(--subtle-line); border-radius: 5px; font-size: 11px; }
.test-cost-row.disabled { opacity: 0.4; }
.test-cost-row span { color: var(--text); }
.cost-val { color: var(--gold); font-weight: 600; }
</style>
