<template>
  <div class="dungeon-card" :class="themeClass">
    <header class="topbar">
      <div class="brand">
        <span class="brand-mark">渊</span>
        <span>
          <strong>{{ store.data.地下城.城主.名号 }}</strong>
          <small>第 {{ store.data.地下城.日期 }} 日 · 声望 {{ '★'.repeat(Math.floor(store.data.地下城.声望)) }}{{ '☆'.repeat(10 - Math.floor(store.data.地下城.声望)) }}</small>
        </span>
        <span v-if="!collapsed" class="version-badge">V0704</span>
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
              <button class="build-btn" type="button" @click="fillRawInput('[建设 挖掘新楼层]')">挖掘楼层<small>30魔晶</small></button>
              <button class="build-btn" type="button" @click="fillRawInput('[建设 升级魅惑]')">升级魅惑<small>3碎片</small></button>
              <button class="build-btn" type="button" @click="fillRawInput('[建设 提升魔力上限]')">魔力上限<small>5碎片+20魔晶</small></button>
              <button class="build-btn" type="button" @click="fillRawInput('[建设 恢复魔力]')">恢复魔力<small>魔晶</small></button>
            </div>
          </div>
          <div class="build-group">
            <div class="build-label">设施</div>
            <div class="build-buttons">
              <button class="build-btn" type="button" @click="fillRawInput('[建设 建造设施 囚室]')">囚室<small>20魔晶</small></button>
              <button class="build-btn" type="button" @click="fillRawInput('[建设 建造设施 调教室]')">调教室<small>50魔晶+2碎片</small></button>
              <button class="build-btn" type="button" @click="fillRawInput('[建设 建造设施 祭坛]')">祭坛<small>80魔晶+5碎片</small></button>
              <button class="build-btn" type="button" @click="fillRawInput('[建设 建造设施 魔素泉]')">魔素泉<small>40魔晶</small></button>
              <button class="build-btn" type="button" @click="fillRawInput('[建设 建造设施 魅魔巢穴]')">魅魔巢穴<small>60魔晶+3碎片</small></button>
              <button class="build-btn" type="button" @click="fillRawInput('[建设 建造设施 宝箱陷阱]')">宝箱陷阱<small>15魔晶</small></button>
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
            <span v-for="(trap, tn) in floor.陷阱" :key="tn" class="tag" :class="'trap-' + trap.类型">
              {{ tn }} <small>{{ trap.伤害值 }}dmg {{ trap.触发概率 }}%</small>
            </span>
          </div>
          <div v-if="!_.isEmpty(floor.驻守魔物)" class="tag-section">
            <span class="tag-label">魔物</span>
            <span v-for="(mob, mn) in floor.驻守魔物" :key="mn" class="tag" :class="'mob-' + mob.类型">
              {{ mn }} <small>HP {{ mob.生命值 }}/{{ mob.生命上限 }}</small>
            </span>
          </div>
          <div class="floor-actions">
            <button class="build-btn sm" type="button" @click="fillRawInput(`[建设 强化防御 ${name}]`)">强化防御<small>10魔晶</small></button>
            <button class="build-btn sm" type="button" @click="fillRawInput(`[建设 布置陷阱 ${name}]`)">布置陷阱<small>10魔晶起</small></button>
            <button class="build-btn sm" type="button" @click="fillRawInput(`[建设 召唤魔物 ${name}]`)">召唤魔物<small>10魔晶起</small></button>
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
            <span class="status-tag" :class="npcAttitudeClass(npc.好感度)">{{ npc.态度 }}</span>
          </div>
          <div class="bar-shell"><div class="bar-fill favor" :style="{ width: npc.好感度 + '%' }"></div><span>好感 {{ npc.好感度 }}</span></div>
          <div class="bar-shell"><div class="bar-fill hp" :style="{ width: npcHpPct(npc) + '%' }"></div><span>HP {{ npc.生命值 }} / {{ npc.生命上限 }}</span></div>
          <div class="stat-row">
            <span>ATK {{ npc.攻击力 }}</span><span>DEF {{ npc.防御力 }}</span><span class="loc">{{ npc.类型 }}</span>
          </div>
          <div class="data-grid small">
            <span>位置</span><strong>{{ npc.当前位置 }}</strong>
            <span>状态</span><strong>{{ npc.状态 }}</strong>
            <span>在场</span><strong>{{ npc.在场 ? '是' : '否' }}</strong>
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
          <p class="desc muted-desc">{{ inv.性别 }} · {{ inv.种族 }} · {{ inv.职业 }} · Lv{{ inv.等级 }}</p>
          <div class="bar-shell"><div class="bar-fill hp" :style="{ width: hpPct(inv) + '%' }"></div><span>{{ inv.生命值 }} / {{ inv.生命上限 }} HP</span></div>
          <div class="bar-shell"><div class="bar-fill wp" :style="{ width: wpPct(inv) + '%' }"></div><span>{{ inv.意志力 }} / {{ inv.意志上限 }} WP</span></div>
          <div class="stat-row">
            <span>ATK {{ inv.攻击力 }}</span><span>DEF {{ inv.防御力 }}</span><span class="loc">→ {{ inv.当前楼层 }}</span>
          </div>
        </div>
      </section>

      <section v-if="activeTab === 'captive'" class="tab-pane">
        <div v-if="_.isEmpty(store.data.俘获者)" class="empty-state">囚室空空如也。击败冒险者后可俘获至此。</div>
        <div v-for="(cap, name) in store.data.俘获者" :key="name" class="panel captive-panel">
          <div class="card-head">
            <strong>{{ name }}</strong>
            <span class="status-tag captive-tag">{{ cap.$服从度阶段 }}</span>
          </div>
          <p class="desc muted-desc">{{ cap.性别 }} · {{ cap.种族 }} · {{ cap.职业 }} · Lv{{ cap.原等级 }}</p>
          <div class="bar-shell"><div class="bar-fill obey" :style="{ width: cap.服从度 + '%' }"></div><span>服从 {{ cap.服从度 }}</span></div>
          <div class="bar-shell"><div class="bar-fill shame" :style="{ width: cap.羞耻度 + '%' }"></div><span>羞耻 {{ cap.羞耻度 }}</span></div>
          <div class="data-grid small">
            <span>心理</span><strong>{{ cap.心理状态 }}</strong>
            <span>位置</span><strong>{{ cap.当前位置 }}</strong>
            <span>身体</span><strong>{{ cap.身体状态 }}</strong>
          </div>
          <div v-if="cap.标记.length > 0" class="tag-section">
            <span class="tag-label">标记</span>
            <span v-for="mark in cap.标记" :key="mark" class="tag mark-tag">{{ mark }}</span>
          </div>
          <p v-if="cap.外貌" class="desc">{{ cap.外貌 }}</p>
        </div>
      </section>

      <section v-if="activeTab === 'log'" class="tab-pane">
        <div v-if="store.data.事件日志.length === 0" class="empty-state">暂无事件记录</div>
        <div class="log-list">
          <div v-for="(event, i) in reversedLog" :key="i" class="log-entry">
            <span class="log-day">Day{{ logDay(event) }}</span>
            <span class="log-text">{{ event }}</span>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { ref, computed } from 'vue';
import { useDataStore } from './store';

const store = useDataStore();
const collapsed = ref(false);
const activeTab = ref('floor');
const settingsOpen = ref(false);

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

const lordHpPct = computed(() => {
  const max = store.data.地下城.城主.生命上限;
  return max > 0 ? Math.max(0, Math.min(100, (store.data.地下城.城主.生命值 / max) * 100)) : 0;
});

const tabs = computed(() => [
  { id: 'floor', label: '地下城' },
  { id: 'npc', label: '部下', badge: npcCount.value || undefined },
  { id: 'invader', label: '闯入者', badge: invaderCount.value || undefined },
  { id: 'captive', label: '俘获者', badge: captiveCount.value || undefined },
  { id: 'log', label: '事件日志' },
]);

function hpPct(inv: { 生命值: number; 生命上限: number }) { return inv.生命上限 > 0 ? Math.max(0, Math.min(100, (inv.生命值 / inv.生命上限) * 100)) : 0; }
function wpPct(inv: { 意志力: number; 意志上限: number }) { return inv.意志上限 > 0 ? Math.max(0, Math.min(100, (inv.意志力 / inv.意志上限) * 100)) : 0; }
function npcHpPct(npc: { 生命值: number; 生命上限: number }) { return npc.生命上限 > 0 ? Math.max(0, Math.min(100, (npc.生命值 / npc.生命上限) * 100)) : 0; }
function invStatusClass(status: string) {
  return { 闯入中: 'active', 战斗中: 'danger-tag', 被击败: 'muted', 精神崩溃: 'captive-tag', 撤退: 'muted' }[status] || 'muted';
}
function npcAttitudeClass(favor: number) {
  if (favor >= 81) return 'captive-tag';
  if (favor >= 61) return 'done';
  if (favor >= 41) return 'active';
  if (favor >= 21) return 'pending';
  return 'muted';
}

const reversedLog = computed(() => _(store.data.事件日志).takeRight(20).reverse().value());
function logDay(event: string): string {
  const m = event.match(/第(\d+)日/);
  return m ? m[1] : String(store.data.地下城.日期);
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
.tab-nav { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; margin-bottom: 7px; }
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
.mob-战斗 { border-color: var(--blood); color: var(--blood); }
.mob-辅助 { border-color: var(--gold); color: var(--gold); }
.mob-特殊 { border-color: var(--purple); color: #b080e0; }
.mob-守卫 { border-color: var(--blood); color: var(--blood); background: rgba(196, 30, 58, 0.1); }
.mark-tag { border-color: var(--blood); color: var(--blood); background: rgba(196, 30, 58, 0.1); }

.data-grid { display: grid; grid-template-columns: auto 1fr; gap: 5px 12px; font-size: 12px; margin: 6px 0; }
.data-grid span { color: var(--muted); }
.data-grid strong { color: var(--text); text-align: right; }
.data-grid.small { font-size: 11px; }

.empty-state { color: var(--muted); text-align: center; padding: 18px; font-size: 12px; }

.log-list { display: flex; flex-direction: column; gap: 6px; max-height: 360px; overflow-y: auto; }
.log-entry { display: flex; gap: 8px; padding: 6px 9px; background: var(--panel-2); border: 1px solid var(--subtle-line); border-left: 2px solid var(--accent); border-radius: 6px; font-size: 12px; line-height: 1.4; }
.log-day { color: var(--gold); font-weight: 800; flex-shrink: 0; font-size: 11px; }
.log-text { color: var(--desc); }

.invader-panel.st-战斗中 { border-color: var(--line-strong); }
.invader-panel.st-被击败 { opacity: 0.72; }
.invader-panel.st-精神崩溃 { border-color: rgba(160, 32, 240, 0.4); }
.invader-panel.st-撤退 { opacity: 0.6; }
.captive-panel { border-left: 3px solid var(--captive); }
.floor-panel { border-left: 3px solid var(--accent); }

.build-panel { padding: 9px; }
.build-group { margin-bottom: 7px; }
.build-group:last-child { margin-bottom: 0; }
.build-label { color: var(--muted); font-size: 11px; font-weight: 700; margin-bottom: 4px; }
.build-buttons { display: flex; gap: 5px; flex-wrap: wrap; }
.build-btn { display: inline-flex; flex-direction: column; align-items: center; gap: 1px; padding: 5px 9px; border: 1px solid var(--line); border-radius: 7px; background: var(--soft-bg); color: var(--text); cursor: pointer; font-size: 12px; transition: 0.18s ease; }
.build-btn:hover { border-color: var(--accent); color: var(--accent); }
.build-btn small { font-size: 9px; color: var(--muted); font-weight: 400; }
.build-btn.sm { flex-direction: row; gap: 4px; padding: 3px 7px; font-size: 11px; }
.build-btn.sm small { font-size: 9px; }
.floor-actions { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 7px; padding-top: 7px; border-top: 1px solid var(--subtle-line); }

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
.fac-宝箱陷阱 { border-color: var(--gold); }
.npc-panel { border-left: 3px solid #5a8a5a; }

@media (max-width: 560px) {
  .topbar { align-items: flex-start; }
  .brand strong { font-size: 16px; }
  .time-chip { display: none; }
  .settings-panel { flex-direction: column; align-items: flex-start; }
  .settings-group { width: 100%; }
  .tab-nav { grid-template-columns: repeat(3, 1fr); }
  .resource-grid { grid-template-columns: 1fr; }
  .card-head { align-items: flex-start; flex-direction: column; }
  .profile-head { flex-direction: column; gap: 5px; }
  .profile-actions { align-self: flex-end; }
}
</style>
