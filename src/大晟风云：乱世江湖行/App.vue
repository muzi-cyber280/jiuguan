<template>
  <div class="jianghu-card" :class="themeClass">
    <header class="topbar">
      <button class="brand" type="button" @click="toggleDebugMode">
        <span class="brand-mark">晟</span>
        <span>
          <strong>乱世江湖行</strong>
          <small>{{ currentRegion }} · {{ currentLocation }}</small>
        </span>
        <span v-if="!collapsed" class="version-badge">v0610</span>
      </button>
      <div class="top-actions">
        <template v-if="collapsed">
          <span class="collapsed-badges">
            <span v-if="pendingTasks.length" class="collapsed-badge">任务 {{ pendingTasks.length }}</span>
            <span v-if="completedTasks.length" class="collapsed-badge reward-badge">奖励 {{ completedTasks.length }}</span>
            <span v-if="attributePoints" class="collapsed-badge attr-badge">属性 {{ attributePoints }}</span>
            <span v-if="longTermBadgeCount" class="collapsed-badge state-badge">江湖 {{ longTermBadgeCount }}</span>
            <span v-if="recycleBinCount" class="collapsed-badge">回收 {{ recycleBinCount }}</span>
          </span>
        </template>
        <span v-if="!collapsed" class="time-chip">第{{ worldYear }}年 {{ worldMonth }}月{{ worldDay }}日 {{ timeString }}</span>
        <button v-if="!collapsed" class="ghost-btn settings-btn" type="button" :class="{ active: settingsOpen }" title="设置" @click="settingsOpen = !settingsOpen">设置</button>
        <button class="ghost-btn" type="button" @click="collapsed = !collapsed">{{ collapsed ? '展开' : '收起' }}</button>
      </div>
    </header>

    <div v-if="!collapsed && settingsOpen" class="settings-panel">
      <div class="settings-group zoom-controls">
        <span class="settings-label">缩放</span>
        <button class="round-btn" type="button" @click="zoomOut">-</button>
        <span class="zoom-label">{{ zoomPercent }}%</span>
        <button class="round-btn" type="button" @click="zoomIn">+</button>
        <button class="round-btn" type="button" @click="zoomReset">重置</button>
      </div>
      <div class="settings-group mode-controls">
        <span class="settings-label">明暗</span>
        <button class="round-btn mode-btn" type="button" @click="toggleThemeMode">{{ themeMode === 'dark' ? '亮色' : '暗色' }}</button>
      </div>
      <div class="settings-group theme-controls" aria-label="主题色切换">
        <span class="settings-label">主题</span>
        <button v-for="tone in themeTones" :key="tone.id" class="theme-swatch" :class="[`swatch-${tone.id}`, { active: themeTone === tone.id }]" type="button" :title="tone.label" @click="setThemeTone(tone.id)">
          <span>{{ tone.label }}</span>
        </button>
      </div>
    </div>

    <main v-show="!collapsed" class="content" :style="{ zoom: `${zoomPercent}%` }">
      <nav class="tab-nav">
        <button v-for="tab in tabs" :key="tab.id" class="tab-btn" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
          {{ tab.label }}
          <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
          <span v-if="tab.rewardBadge" class="tab-badge reward-badge">{{ tab.rewardBadge }}</span>
        </button>
      </nav>

      <section v-if="activeTab === 'status'" class="tab-pane">
        <section class="panel player-profile-panel" :class="{ required: playerGenderMissing, compact: !playerProfileExpanded }">
          <div class="profile-head">
            <div>
              <div class="section-kicker">玩家速览</div>
              <p class="profile-hint">{{ playerGenderMissing ? '请先选择性别，AI会据此固定识别玩家角色。' : playerProfileSummary }}</p>
            </div>
            <div class="profile-actions">
              <span class="status-tag" :class="playerGenderMissing ? 'pending' : 'muted'">{{ playerGenderMissing ? '待选择' : '已记录' }}</span>
              <button v-if="!playerGenderMissing && !playerProfileEditing" class="mini-text-btn" type="button" @click="playerProfileEditing = true">编辑</button>
            </div>
          </div>
          <template v-if="playerProfileExpanded">
            <div class="gender-row" role="group" aria-label="玩家性别">
              <button v-for="option in playerGenderOptions" :key="option" class="gender-btn" :class="{ active: playerGender === option }" type="button" @click="setPlayerGender(option)">{{ option }}</button>
              <button class="gender-btn" :class="{ active: customGenderActive }" type="button" @click="enableCustomGender">自定义</button>
            </div>
            <label v-if="customGenderActive" class="profile-field compact-field">
              <span>自定义性别</span>
              <input :value="customGenderText" type="text" placeholder="例如：无性别、双性、扶她、按备注处理。" @input="setCustomGender(($event.target as HTMLInputElement).value)" />
            </label>
            <label class="profile-field">
              <span>特性</span>
              <textarea :value="playerTraits" rows="2" placeholder="例如：冷面少言、耳力极好、熟悉黑话、会机关术、记忆力惊人。" @input="setPlayerTraits(($event.target as HTMLTextAreaElement).value)"></textarea>
            </label>
            <label class="profile-field">
              <span>备注</span>
              <textarea :value="playerNote" rows="2" placeholder="例如：白发灰眼、边关出身、带一枚旧玉佩、左肩有箭伤、正在找失散亲人。" @input="setPlayerNote(($event.target as HTMLTextAreaElement).value)"></textarea>
            </label>
            <div class="button-row profile-save-row">
              <button class="action-btn success" type="button" :disabled="playerGenderMissing" @click="savePlayerProfile">保存</button>
              <button v-if="!playerGenderMissing" class="action-btn muted-btn" type="button" @click="playerProfileEditing = false">收起</button>
            </div>
          </template>
        </section>

        <div class="hero-grid">
          <article class="hero-card primary-card">
            <div class="section-kicker">境界</div>
            <div class="realm-line">
              <span class="realm-badge">{{ realm }}</span>
              <span class="silver-pill">{{ silver }} 文</span>
            </div>
            <div class="bar-shell large">
              <div class="bar-fill qi" :style="{ width: `${qiPercent}%` }"></div>
              <span>{{ qi }} / {{ qiMax }} 内力</span>
            </div>
          </article>

          <article class="hero-card">
            <div class="section-kicker">成长</div>
            <div class="level-line">
              <span class="level-left"><span class="level-badge">Lv.{{ level }}</span><button v-if="nextRealm" class="breakthrough-btn" type="button" :disabled="!canBreakthrough" @click="startBreakthrough">突破</button></span>
              <span class="muted">可分配 {{ attributePoints }} 点</span>
            </div>
            <div class="bar-shell">
              <div class="bar-fill exp" :style="{ width: `${expPercent}%` }"></div>
              <span>{{ currentExp }} / {{ expMax }} 经验</span>
            </div>
            <div class="breakthrough-line">
              <span>{{ breakthroughHint }}</span>
            </div>
            <div class="insight-line">阅历 <strong>{{ insight }}</strong></div>
          </article>
        </div>

        <section class="panel">
          <div class="panel-title">六维属性</div>
          <div class="attribute-grid">
            <div v-for="(label, key) in attributeLabels" :key="key" class="attribute-card">
              <span>{{ label }}</span>
              <strong>{{ attributes[key] }}</strong>
              <button v-if="attributePoints > 0" class="mini-btn" type="button" @click="allocateAttribute(key)">+</button>
            </div>
          </div>
        </section>

        <section class="panel compact-panel">
          <div class="panel-title">内功心法</div>
          <div class="empty-state strong">{{ neigong || '未习内功' }}</div>
        </section>

        <section v-if="debugMode" class="panel debug-panel">
          <div class="panel-title">调试面板</div>
          <div class="button-grid">
            <button class="action-btn" @click="debugAddSilver">+500 银钱</button>
            <button class="action-btn" @click="debugAddQi">+50 内力</button>
            <button class="action-btn" @click="debugRestoreQi">回满内力</button>
            <button class="action-btn" @click="debugAddExp">+300 经验</button>
            <button class="action-btn" @click="debugAddInsight">+300 阅历</button>
            <button class="action-btn" @click="debugAddAttrPoints">+3 属性点</button>
            <button class="action-btn" @click="debugAddTasks">生成任务</button>
            <button class="action-btn" @click="debugAddShop">生成商品</button>
            <button class="action-btn" @click="debugAddSkills">生成武学</button>
            <button class="action-btn" @click="debugAddNPCs">生成NPC</button>
          </div>
        </section>
      </section>

      <section v-if="activeTab === 'task'" class="tab-pane">
        <div v-for="([name, task]) in activeTasks" :key="name" class="panel highlight-panel">
          <div class="card-head">
            <strong>{{ stripGradePrefix(name) }}</strong>
            <span class="status-tag active">进行中</span>
          </div>
          <p class="desc">{{ task.任务描述 }}</p>
          <div class="reward-row"><span>银钱 {{ task.奖励_银钱 || 0 }} 文</span><span>经验 {{ task.奖励_经验 || 0 }}</span><span>阅历 {{ task.奖励_阅历 || 0 }}</span></div>
          <p v-if="task.失败后果 && task.失败后果 !== '无严重后果'" class="danger-text">失败后果: {{ task.失败后果 }}</p>
          <div class="button-row"><button class="action-btn danger" @click="setTaskStatus(name, '已失败')">放弃</button><button class="action-btn muted-btn" @click="setTaskStatus(name, '已忽略')">忽略</button></div>
        </div>

        <section class="panel">
          <div class="panel-title">悬赏委托</div>
          <div v-if="pendingTasks.length === 0 && activeTasks.length === 0" class="empty-state">暂无悬赏</div>
          <div v-for="([name, task]) in pendingTasks" :key="name" class="list-card">
            <div class="card-head"><strong>{{ task.任务等级 }} · {{ stripGradePrefix(name) }}</strong><span class="status-tag pending">待接取</span></div>
            <p class="desc">{{ task.任务描述 }}</p>
            <div class="reward-row"><span>银钱 {{ task.奖励_银钱 || 0 }} 文</span><span>经验 {{ task.奖励_经验 || 0 }}</span><span>阅历 {{ task.奖励_阅历 || 0 }}</span></div>
            <div class="button-row"><button class="action-btn success" @click="setTaskStatus(name, '进行中')">接取</button><button class="action-btn muted-btn" @click="setTaskStatus(name, '已忽略')">忽略</button></div>
          </div>
        </section>

        <section v-if="completedTasks.length > 0" class="panel">
          <div class="panel-title">待领取报酬</div>
          <div v-for="([name, task]) in completedTasks" :key="name" class="list-card reward-card">
            <div class="card-head"><strong>{{ stripGradePrefix(name) }}</strong><span class="status-tag done">已完成</span></div>
            <p class="desc">{{ task.任务描述 }}</p>
            <div class="reward-row"><span>银钱 {{ task.奖励_银钱 || 0 }} 文</span><span>经验 {{ task.奖励_经验 || 0 }}</span><span>阅历 {{ task.奖励_阅历 || 0 }}</span></div>
            <button class="action-btn success" @click="claimReward(name)">领取报酬</button>
          </div>
        </section>

        <section v-if="inactiveTasks.length > 0" class="panel muted-panel">
          <div class="panel-title">往期委托</div>
          <div v-for="([name, task]) in inactiveTasks" :key="name" class="list-card inactive">
            <div class="card-head"><strong>{{ stripGradePrefix(name) }}</strong><span class="status-tag muted">{{ task.奖励已领取 ? '已领取' : task.任务状态 }}</span></div>
            <div class="button-row"><button v-if="task.任务状态 === '已失败' || task.任务状态 === '已忽略'" class="action-btn" @click="setTaskStatus(name, '待接取')">恢复</button><button class="action-btn danger" @click="softDelete('任务', name)">删除</button></div>
          </div>
        </section>
      </section>

      <section v-if="activeTab === 'shop'" class="tab-pane">
        <section class="panel wallet-panel"><div class="panel-title">银钱</div><div class="wallet-value">{{ silver }} 文</div></section>
        <section class="panel">
          <div class="panel-title">市集货架</div>
          <div v-if="Object.keys(shopCatalog).length === 0" class="empty-state">货架暂无商品</div>
          <div v-for="(item, name) in shopCatalog" :key="name" class="list-card">
            <div class="card-head"><strong>{{ stripGradePrefix(name) }}</strong><span class="status-tag pending">{{ item.价格_银钱 || 0 }} 文</span></div>
            <p class="desc">{{ item.描述 }}</p>
            <div class="button-row"><button class="action-btn success" :disabled="silver < (item.价格_银钱 || 0)" @click="buyItem(name, item)">购买</button><button class="action-btn danger" @click="softDelete('商品', name)">移除</button></div>
          </div>
        </section>
        <section class="panel">
          <div class="panel-title">行囊</div>
          <div v-if="Object.keys(items).length === 0" class="empty-state">行囊空空</div>
          <div v-for="(item, name) in items" :key="name" class="list-card item-card">
            <div class="card-head"><strong>{{ stripGradePrefix(name) }} x{{ item.数量 || 0 }}</strong><span class="status-tag muted">{{ item.类型 }}</span></div>
            <p class="desc">{{ item.描述 }}</p>
            <div class="button-row"><button class="action-btn success" @click="fillInput('使用', name)">使用</button><button class="action-btn danger" @click="softDelete('物品', name)">丢弃</button></div>
          </div>
        </section>
      </section>

      <section v-if="activeTab === 'skill'" class="tab-pane">
        <section class="panel">
          <div class="panel-title">可习得武学</div>
          <div v-if="Object.keys(unlockableSkills).length === 0" class="empty-state">暂无可习得武学</div>
          <div v-for="(skill, name) in unlockableSkills" :key="name" class="list-card">
            <div class="card-head"><strong><span class="grade-badge" :class="getGradeClass(skill.品级)">{{ skill.品级 }}</span>{{ stripGradePrefix(name) }}</strong><span class="status-tag pending">{{ skill.消耗_阅历 || 0 }} 阅历</span></div>
            <p class="desc">{{ skill.描述 }}</p>
            <div class="reward-row"><span>{{ skill.类别 }}</span><span>内力消耗 {{ skill.内力消耗 || 10 }}</span></div>
            <div class="button-row"><button class="action-btn success" :disabled="insight < (skill.消耗_阅历 || 0)" @click="learnSkill(name, skill)">习得</button><button class="action-btn danger" @click="softDelete('可习得招式', name)">移除</button></div>
          </div>
        </section>
        <section class="panel">
          <div class="panel-title">已掌握招式</div>
          <div v-if="Object.keys(skills).length === 0" class="empty-state">尚无招式</div>
          <div v-for="(skill, name) in skills" :key="name" class="list-card skill-card">
            <div class="card-head"><strong><span class="grade-badge" :class="getGradeClass(skill.品级)">{{ skill.品级 }}</span>{{ stripGradePrefix(name) }}</strong><span class="status-tag muted">{{ skill.类别 }}</span></div>
            <p class="desc">{{ skill.描述 }}</p>
            <div class="button-row"><button class="action-btn success" :disabled="qi < (skill.内力消耗 || 10)" @click="castSkill(name, skill)">施展</button><button class="action-btn danger" @click="softDelete('招式', name)">遗忘</button></div>
          </div>
        </section>
      </section>

      <section v-if="activeTab === 'character'" class="tab-pane">
        <section class="panel location-panel">
          <div class="panel-title">世界定位</div>
          <div class="data-grid"><span>当前区域</span><strong>{{ currentRegion }}</strong><span>当前位置</span><strong>{{ currentLocation }}</strong><span>当前场景</span><strong>{{ currentScene }}</strong><span>当前事件</span><strong>{{ currentEvent }}</strong></div>
        </section>
        <section class="panel">
          <div class="panel-title">在场人物</div>
          <div v-if="presentNpcNames.length === 0" class="empty-state">当前无人在场</div>
          <div v-for="name in presentNpcNames" :key="name" class="npc-card present">
            <div class="card-head"><strong>{{ name }}</strong><span class="status-tag done">在场</span></div>
            <div class="data-grid small"><span>态度</span><strong>{{ npcs[name]?.当前态度 || '未知' }}</strong></div>
            <p v-if="npcs[name]?.备注" class="desc">{{ npcs[name].备注 }}</p>
            <button class="action-btn muted-btn" @click="setNpcPresence(name, false)">离场</button>
          </div>
        </section>
        <section class="panel muted-panel">
          <div class="panel-title">离场人物</div>
          <div v-if="absentNpcNames.length === 0" class="empty-state">暂无离场人物</div>
          <div v-for="name in absentNpcNames" :key="name" class="npc-card absent">
            <div class="card-head"><strong>{{ name }}</strong><span class="status-tag muted">离场</span></div>
            <div class="data-grid small"><span>态度</span><strong>{{ npcs[name]?.当前态度 || '未知' }}</strong></div>
            <p v-if="npcs[name]?.备注" class="desc">{{ npcs[name].备注 }}</p>
            <div class="button-row"><button class="action-btn success" @click="setNpcPresence(name, true)">入场</button><button class="action-btn danger" @click="softDelete('NPC', name)">删除</button></div>
          </div>
        </section>
        <section class="panel long-state-panel">
          <div class="panel-title">人物关系</div>
          <div v-if="relationEntries.length === 0" class="empty-state">暂无持续人物关系。AI 记录重要人物好感、信任、冲突后会显示在这里。</div>
          <div v-for="([name, relation]) in relationEntries" :key="name" class="list-card compact-list-card">
            <div class="card-head"><strong>{{ name }}</strong><span class="status-tag" :class="getRelationClass(relation.关系值)">{{ relation.关系阶段 || '陌生' }} {{ relation.关系值 || 0 }}</span></div>
            <p v-if="relation.关系标签" class="desc">{{ relation.关系标签 }}</p>
            <p v-if="relation.最近互动" class="desc muted-desc">最近: {{ relation.最近互动 }}</p>
            <div class="reward-row"><span>信任 {{ relation.信任点 || 0 }}</span><span>冲突 {{ relation.冲突点 || 0 }}</span></div>
          </div>
        </section>
      </section>

      <section v-if="activeTab === 'jianghu'" class="tab-pane">
        <section class="panel long-state-panel">
          <div class="panel-title">江湖身份</div>
          <div class="identity-card">
            <div class="card-head"><strong>{{ jianghuIdentity.当前名号 || '无名外来者' }}</strong><span class="status-tag active">{{ jianghuIdentity.名声等级 || '无名' }}</span></div>
            <div class="data-grid small"><span>公开身份</span><strong>{{ jianghuIdentity.公开身份 || '无路引的外来客' }}</strong><span>隐藏身份</span><strong>{{ jianghuIdentity.隐藏身份 || '未暴露' }}</strong><span>识破风险</span><strong>{{ jianghuIdentity.被识破风险 || '低' }}</strong></div>
            <p v-if="identityKeywords.length" class="desc muted-desc">关键词: {{ identityKeywords.join('、') }}</p>
          </div>
        </section>

        <section class="panel long-state-panel">
          <div class="panel-title">状态影响</div>
          <div v-if="activeStatusEffects.length === 0" class="empty-state">暂无伤势、中毒或通缉。</div>
          <div v-for="effect in activeStatusEffects" :key="effect.name" class="list-card compact-list-card">
            <div class="card-head"><strong>{{ effect.name }} · {{ effect.level }}</strong><span class="status-tag pending">持续中</span></div>
            <p v-if="effect.desc" class="desc">{{ effect.desc }}</p>
            <p v-if="effect.recovery" class="desc muted-desc">{{ effect.recovery }}</p>
          </div>
        </section>

        <section class="panel long-state-panel">
          <div class="panel-title">势力关系</div>
          <div v-if="factionEntries.length === 0" class="empty-state">暂无持续势力关系。</div>
          <div v-for="([name, faction]) in factionEntries" :key="name" class="list-card compact-list-card">
            <div class="card-head"><strong>{{ name }}</strong><span class="status-tag" :class="getRelationClass(faction.关系值)">{{ faction.关系阶段 || '中立' }} {{ faction.关系值 || 0 }}</span></div>
            <p class="desc">身份: {{ faction.已知身份 || '外来者' }}</p>
            <p v-if="faction.备注" class="desc muted-desc">{{ faction.备注 }}</p>
          </div>
        </section>

        <section class="panel long-state-panel">
          <div class="panel-title">区域流言</div>
          <div v-if="rumorEntries.length === 0" class="empty-state">当前区域暂无流言。</div>
          <div v-for="([name, rumor]) in rumorEntries" :key="name" class="list-card compact-list-card">
            <div class="card-head"><strong>{{ stripGradePrefix(name) }}</strong><span class="status-tag pending">{{ rumor.区域 || '全境' }} · {{ rumor.热度 || '低' }}</span></div>
            <p class="desc">{{ rumor.内容 || '无内容' }}</p>
            <p class="desc muted-desc">来源: {{ rumor.来源 || '市井' }}<template v-if="rumor.关联人物?.length"> · 关联: {{ rumor.关联人物.join('、') }}</template></p>
          </div>
        </section>
      </section>

      <section v-if="activeTab === 'recycle'" class="tab-pane">
        <section v-if="recycleBinCount === 0" class="panel"><div class="empty-state">回收站为空</div></section>
        <section v-for="group in recycleGroups" :key="group.category" v-show="Object.keys(group.items).length > 0" class="panel">
          <div class="panel-title">{{ group.title }}</div>
          <div v-for="(_, name) in group.items" :key="name" class="list-card inactive">
            <div class="card-head"><strong>{{ stripGradePrefix(String(name)) }}</strong><span class="status-tag muted">已删除</span></div>
            <div class="button-row"><button class="action-btn success" @click="restoreItem(group.category, String(name))">恢复</button><button class="action-btn danger" @click="permanentDelete(group.category, String(name))">永久删除</button></div>
          </div>
        </section>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useDataStore } from './store';

const collapsed = ref(false);
const activeTab = ref('status');
const debugMode = ref(false);
const settingsOpen = ref(false);
const playerProfileEditing = ref(false);
let debugClickCount = 0;
let debugClickTimer: ReturnType<typeof setTimeout> | null = null;

const ZOOM_MIN = 60;
const ZOOM_MAX = 150;
const ZOOM_STEP = 10;
const ZOOM_KEY = 'jianghu-card-zoom';
const THEME_MODE_KEY = 'jianghu-card-theme-mode';
const THEME_TONE_KEY = 'jianghu-card-theme-tone';
const zoomLevel = ref(Number(localStorage.getItem(ZOOM_KEY)) || 100);
const zoomPercent = computed(() => Math.round(zoomLevel.value));

type ThemeMode = 'dark' | 'light';
type ThemeTone = 'amber' | 'jade' | 'crimson' | 'indigo' | 'ink';

const themeTones: Array<{ id: ThemeTone; label: string }> = [
  { id: 'amber', label: '金' },
  { id: 'jade', label: '青' },
  { id: 'crimson', label: '红' },
  { id: 'indigo', label: '蓝' },
  { id: 'ink', label: '墨' },
];
const storedThemeMode = localStorage.getItem(THEME_MODE_KEY);
const storedThemeTone = localStorage.getItem(THEME_TONE_KEY);
const themeMode = ref<ThemeMode>(storedThemeMode === 'light' ? 'light' : 'dark');
const themeTone = ref<ThemeTone>(themeTones.some(tone => tone.id === storedThemeTone) ? storedThemeTone as ThemeTone : 'amber');
const themeClass = computed(() => [`theme-${themeMode.value}`, `tone-${themeTone.value}`]);

const dataStore = useDataStore();
const { data } = storeToRefs(dataStore);

type RecycleCategory = '物品' | '招式' | '可习得招式' | '任务' | 'NPC' | '商品';

const recyclePaths: Record<RecycleCategory, { source: string; target: string }> = {
  物品: { source: '物品栏', target: '回收站.已删除物品' },
  招式: { source: '武学面板.招式', target: '回收站.已删除招式' },
  可习得招式: { source: '武学面板.可习得招式', target: '回收站.已删除可习得招式' },
  任务: { source: '任务列表', target: '回收站.已删除任务' },
  NPC: { source: 'NPC状态', target: '回收站.已删除NPC' },
  商品: { source: '商铺.商品目录', target: '回收站.已删除商品' },
};

const realm = computed(() => _.get(data.value, '主角状态.武学境界', '凡人'));
const qi = computed(() => _.get(data.value, '主角状态.内力', 0));
const qiMax = computed(() => _.get(data.value, '主角状态.内力上限', 100));
const qiPercent = computed(() => Math.min(100, qiMax.value > 0 ? (qi.value / qiMax.value) * 100 : 0));
const silver = computed(() => _.get(data.value, '主角状态.银钱', 0));
const neigong = computed(() => _.get(data.value, '武学面板.内功心法', ''));
const level = computed(() => _.get(data.value, '角色成长.等级', 1));
const currentExp = computed(() => _.get(data.value, '角色成长.当前经验', 0));
const insight = computed(() => _.get(data.value, '角色成长.阅历', 0));
const attributePoints = computed(() => _.get(data.value, '角色成长.属性点', 0));
const breakthroughStatus = computed(() => _.get(data.value, '角色成长.突破状态', '无'));
const expMax = computed(() => getExpMax(level.value));
const expPercent = computed(() => Math.min(100, (currentExp.value / expMax.value) * 100));
const majorRealmIndex = computed(() => getMajorRealmIndex(realm.value));
const realmLevelCap = computed(() => getMajorRealmLevelCap(majorRealmIndex.value));
const nextRealm = computed(() => getNextRealm(realm.value));
const breakthroughReady = computed(() => !!nextRealm.value && level.value >= realmLevelCap.value && currentExp.value >= expMax.value);
const canBreakthrough = computed(() => breakthroughReady.value && breakthroughStatus.value !== '突破中');
const breakthroughHint = computed(() => {
  if (!nextRealm.value) return '已至当前武学体系顶点';
  if (breakthroughStatus.value === '突破中') return `突破判定中: ${_.get(data.value, '角色成长.突破目标', nextRealm.value)}`;
  if (breakthroughReady.value) return `经验已满，需突破至 ${nextRealm.value}`;
  return `当前大境界上限 Lv.${realmLevelCap.value}，需巅峰满经验突破`;
});

const attributeLabels: Record<string, string> = { 力道: '力道', 身法: '身法', 根骨: '根骨', 悟性: '悟性', 眼力: '眼力', 魅力: '魅力' };
const attributes = computed<Record<string, number>>(() => ({
  力道: _.get(data.value, '六维属性.力道', 10),
  身法: _.get(data.value, '六维属性.身法', 10),
  根骨: _.get(data.value, '六维属性.根骨', 10),
  悟性: _.get(data.value, '六维属性.悟性', 10),
  眼力: _.get(data.value, '六维属性.眼力', 10),
  魅力: _.get(data.value, '六维属性.魅力', 10),
}));

const skills = computed(() => _.get(data.value, '武学面板.招式', {}) as Record<string, any>);
const unlockableSkills = computed(() => _.get(data.value, '武学面板.可习得招式', {}) as Record<string, any>);
const items = computed(() => _.get(data.value, '物品栏', {}) as Record<string, any>);
const shopCatalog = computed(() => _.get(data.value, '商铺.商品目录', {}) as Record<string, any>);
const tasks = computed(() => _.get(data.value, '任务列表', {}) as Record<string, any>);
const npcs = computed(() => _.get(data.value, 'NPC状态', {}) as Record<string, any>);
const factions = computed(() => _.get(data.value, '势力关系', {}) as Record<string, any>);
const relations = computed(() => _.get(data.value, '人物关系', {}) as Record<string, any>);
const statusEffects = computed(() => _.get(data.value, '状态影响', {}) as Record<string, any>);
const jianghuIdentity = computed(() => _.get(data.value, '江湖身份', {}) as Record<string, any>);
const regionalRumors = computed(() => _.get(data.value, '区域流言', {}) as Record<string, any>);
const playerGenderOptions = ['男', '女'] as const;
type PlayerGender = typeof playerGenderOptions[number];
const playerGender = computed(() => _.get(data.value, '玩家资料.性别', '未选择'));
const playerGenderMissing = computed(() => !playerGender.value || playerGender.value === '未选择');
const customGenderActive = ref(false);
const customGenderText = computed(() => playerGenderOptions.includes(playerGender.value as PlayerGender) || playerGenderMissing.value ? '' : playerGender.value);
const playerTraits = computed(() => _.get(data.value, '玩家资料.特性', ''));
const playerNote = computed(() => _.get(data.value, '玩家资料.备注', ''));
const playerProfileExpanded = computed(() => playerGenderMissing.value || playerProfileEditing.value);
const playerProfileSummary = computed(() => {
  const parts = [`性别 ${playerGender.value}`];
  if (playerTraits.value) parts.push(`特性 ${shortText(playerTraits.value, 18)}`);
  if (playerNote.value) parts.push(`备注 ${shortText(playerNote.value, 18)}`);
  return parts.join(' · ');
});

const pendingTasks = computed(() => Object.entries(tasks.value).filter(([, t]: [string, any]) => t.任务状态 === '待接取'));
const activeTasks = computed(() => Object.entries(tasks.value).filter(([, t]: [string, any]) => t.任务状态 === '进行中'));
const completedTasks = computed(() => Object.entries(tasks.value).filter(([, t]: [string, any]) => t.任务状态 === '已完成' && !t.奖励已领取));
const inactiveTasks = computed(() => Object.entries(tasks.value).filter(([, t]: [string, any]) => t.任务状态 === '已失败' || t.任务状态 === '已忽略' || t.奖励已领取));
const presentNpcNames = computed(() => Object.keys(npcs.value).filter(name => npcs.value[name]?.在场));
const absentNpcNames = computed(() => Object.keys(npcs.value).filter(name => !npcs.value[name]?.在场));
const factionEntries = computed(() => Object.entries(factions.value));
const relationEntries = computed(() => Object.entries(relations.value));
const identityKeywords = computed(() => Array.isArray(jianghuIdentity.value.名声关键词) ? jianghuIdentity.value.名声关键词 : []);
const identityActive = computed(() => (jianghuIdentity.value.当前名号 && jianghuIdentity.value.当前名号 !== '无名外来者') || (jianghuIdentity.value.名声等级 && jianghuIdentity.value.名声等级 !== '无名') || identityKeywords.value.length > 0);
const rumorEntries = computed(() => Object.entries(regionalRumors.value).filter(([, rumor]: [string, any]) => !rumor.区域 || rumor.区域 === '全境' || rumor.区域 === currentRegion.value));
const activeStatusEffects = computed(() => {
  const wound = statusEffects.value.伤势 || {};
  const poison = statusEffects.value.中毒 || {};
  const wanted = statusEffects.value.通缉 || {};
  const result: Array<{ name: string; level: string; desc: string; recovery: string }> = [];
  if (wound.等级 && wound.等级 !== '无') result.push({ name: '伤势', level: wound.等级, desc: wound.描述 || '', recovery: wound.恢复条件 || '' });
  if (poison.等级 && poison.等级 !== '无') result.push({ name: '中毒', level: poison.等级, desc: poison.描述 || '', recovery: poison.恢复条件 || '' });
  if (wanted.等级 && wanted.等级 !== '无') result.push({ name: '通缉', level: wanted.等级, desc: wanted.原因 || '', recovery: wanted.区域 ? `通缉区域: ${wanted.区域}` : '' });
  return result;
});
const jianghuBadgeCount = computed(() => factionEntries.value.length + activeStatusEffects.value.length + rumorEntries.value.length + (identityActive.value ? 1 : 0));
const longTermBadgeCount = computed(() => jianghuBadgeCount.value + relationEntries.value.length);
const hasLongTermState = computed(() => longTermBadgeCount.value > 0);

const worldYear = computed(() => _.get(data.value, '世界时间.年', 1));
const worldMonth = computed(() => _.get(data.value, '世界时间.月', 3));
const worldDay = computed(() => _.get(data.value, '世界时间.日', 1));
const worldHour = computed(() => _.get(data.value, '世界时间.时', 8));
const worldMinute = computed(() => _.get(data.value, '世界时间.分', 0));
const timeString = computed(() => `${String(worldHour.value).padStart(2, '0')}:${String(worldMinute.value).padStart(2, '0')}`);
const currentRegion = computed(() => _.get(data.value, '世界定位.当前区域', '临渊城'));
const currentLocation = computed(() => _.get(data.value, '世界定位.当前位置', '听雨茶楼'));
const currentScene = computed(() => _.get(data.value, '世界定位.当前场景', '大堂'));
const currentEvent = computed(() => _.get(data.value, '世界定位.当前事件', '无'));

const deletedItems = computed(() => _.get(data.value, '回收站.已删除物品', {}) as Record<string, any>);
const deletedSkills = computed(() => _.get(data.value, '回收站.已删除招式', {}) as Record<string, any>);
const deletedUnlockable = computed(() => _.get(data.value, '回收站.已删除可习得招式', {}) as Record<string, any>);
const deletedTasks = computed(() => _.get(data.value, '回收站.已删除任务', {}) as Record<string, any>);
const deletedNPCs = computed(() => _.get(data.value, '回收站.已删除NPC', {}) as Record<string, any>);
const deletedCatalog = computed(() => _.get(data.value, '回收站.已删除商品', {}) as Record<string, any>);

const recycleGroups = computed(() => [
  { title: '已删除物品', category: '物品' as const, items: deletedItems.value },
  { title: '已遗忘招式', category: '招式' as const, items: deletedSkills.value },
  { title: '已移除可习得武学', category: '可习得招式' as const, items: deletedUnlockable.value },
  { title: '已删除任务', category: '任务' as const, items: deletedTasks.value },
  { title: '已删除人物', category: 'NPC' as const, items: deletedNPCs.value },
  { title: '已移除商品', category: '商品' as const, items: deletedCatalog.value },
]);
const recycleBinCount = computed(() => recycleGroups.value.reduce((sum, group) => sum + Object.keys(group.items).length, 0));

const tabs = computed(() => [
  { id: 'status', label: '状态' },
  { id: 'task', label: '任务', badge: pendingTasks.value.length || undefined, rewardBadge: completedTasks.value.length || undefined },
  { id: 'shop', label: '商铺' },
  { id: 'skill', label: '武学' },
  { id: 'character', label: '人物' },
  { id: 'jianghu', label: '江湖', badge: jianghuBadgeCount.value || undefined },
  { id: 'recycle', label: '回收站', badge: recycleBinCount.value || undefined },
]);

const MAJOR_REALMS = ['凡胎境', '淬体境', '开脉境', '凝气境', '通玄境', '先天境', '宗师境', '大宗师境'];
const LEVELS_PER_MAJOR_REALM = 10;

function zoomIn() { zoomLevel.value = Math.min(ZOOM_MAX, zoomLevel.value + ZOOM_STEP); localStorage.setItem(ZOOM_KEY, String(zoomLevel.value)); }
function zoomOut() { zoomLevel.value = Math.max(ZOOM_MIN, zoomLevel.value - ZOOM_STEP); localStorage.setItem(ZOOM_KEY, String(zoomLevel.value)); }
function zoomReset() { zoomLevel.value = 100; localStorage.setItem(ZOOM_KEY, '100'); }
function toggleThemeMode() { themeMode.value = themeMode.value === 'dark' ? 'light' : 'dark'; localStorage.setItem(THEME_MODE_KEY, themeMode.value); }
function setThemeTone(tone: ThemeTone) { themeTone.value = tone; localStorage.setItem(THEME_TONE_KEY, tone); }
function getExpMax(lv: number) { return Math.floor(120 * Math.pow(1.18, lv - 1) + 40 * (lv - 1)); }
function getMajorRealmName(value: string) { return value.split('·')[0] || '凡胎境'; }
function getMajorRealmIndex(value: string) { return Math.max(0, MAJOR_REALMS.indexOf(getMajorRealmName(value))); }
function getMajorRealmLevelCap(index: number) { return (index + 1) * LEVELS_PER_MAJOR_REALM; }
function getLevelQiMax(lv: number) { return 100 + Math.max(0, lv - 1) * 8; }
function getNextRealm(value: string) {
  const nextMajor = MAJOR_REALMS[getMajorRealmIndex(value) + 1];
  return nextMajor ? `${nextMajor}·一层` : '';
}
function getRealmByLevel(lv: number) {
  const majorIndex = Math.min(MAJOR_REALMS.length - 1, Math.max(0, Math.floor((lv - 1) / LEVELS_PER_MAJOR_REALM)));
  const levelInMajor = ((lv - 1) % LEVELS_PER_MAJOR_REALM) + 1;
  const layer = levelInMajor <= 3 ? '一层' : levelInMajor <= 6 ? '二层' : levelInMajor <= 9 ? '三层' : '巅峰';
  return `${MAJOR_REALMS[majorIndex]}·${layer}`;
}
function stripGradePrefix(name: string) { return name.replace(/^(粗浅|寻常|精妙|绝学|神功|[DSCBA]级)_/, '').replace(/^[A-Za-z]+\.?[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ\d]*_/, ''); }
function shortText(text: string, max: number) { return text.length > max ? `${text.slice(0, max)}...` : text; }
function getRelationClass(value: number) {
  if (value >= 30) return 'done';
  if (value >= 10) return 'active';
  if (value <= -20) return 'danger-tag';
  if (value < 0) return 'pending';
  return 'muted';
}

function setPlayerGender(gender: PlayerGender) { customGenderActive.value = false; playerProfileEditing.value = true; _.set(data.value, '玩家资料.性别', gender); }
function enableCustomGender() {
  customGenderActive.value = true;
  playerProfileEditing.value = true;
  if (playerGenderOptions.includes(playerGender.value as PlayerGender)) _.set(data.value, '玩家资料.性别', '');
}
function setCustomGender(text: string) { playerProfileEditing.value = true; _.set(data.value, '玩家资料.性别', text.trim() || '未选择'); }
function setPlayerTraits(text: string) { _.set(data.value, '玩家资料.特性', text.trim()); }
function setPlayerNote(text: string) { _.set(data.value, '玩家资料.备注', text.trim()); }
function savePlayerProfile() {
  if (playerGenderMissing.value) { toastr.warning('请先选择玩家性别'); return; }
  playerProfileEditing.value = false;
  toastr.success('玩家资料已保存');
}

function toggleDebugMode() {
  debugClickCount += 1;
  if (debugClickTimer) clearTimeout(debugClickTimer);
  if (debugClickCount >= 5) {
    debugMode.value = !debugMode.value;
    debugClickCount = 0;
    toastr.success(debugMode.value ? '调试模式已开启' : '调试模式已关闭');
  } else {
    debugClickTimer = setTimeout(() => { debugClickCount = 0; }, 1000);
  }
}

function allocateAttribute(attr: string) {
  if (attributePoints.value <= 0) return;
  _.set(data.value, `六维属性.${attr}`, (attributes.value[attr] || 10) + 1);
  _.set(data.value, '角色成长.属性点', attributePoints.value - 1);
}

function setTaskStatus(name: string, status: string) { if (tasks.value[name]) tasks.value[name].任务状态 = status; }
function setNpcPresence(name: string, present: boolean) {
  _.set(data.value, `NPC状态.${name}.在场`, present);
  if (present) {
    _.set(data.value, `NPC状态.${name}.所在区域`, currentRegion.value);
    _.set(data.value, `NPC状态.${name}.当前位置`, currentLocation.value);
    _.set(data.value, `NPC状态.${name}.当前场景`, currentScene.value);
  }
}

function claimReward(name: string) {
  const task = tasks.value[name];
  if (!task || task.奖励已领取) return;
  _.set(data.value, '主角状态.银钱', silver.value + (task.奖励_银钱 || 0));
  addExp(task.奖励_经验 || 0);
  addInsight(task.奖励_阅历 || 0);
  task.奖励已领取 = true;
}

function addExp(amount: number) {
  let lv = level.value;
  let exp = currentExp.value + amount;
  let points = attributePoints.value;
  const cap = realmLevelCap.value;
  while (lv < cap && exp >= getExpMax(lv)) { exp -= getExpMax(lv); lv += 1; points += 1; }
  if (lv >= cap && exp >= getExpMax(lv)) {
    exp = getExpMax(lv);
    if (nextRealm.value && breakthroughStatus.value !== '突破中') {
      _.set(data.value, '角色成长.突破状态', '可突破');
      _.set(data.value, '角色成长.突破目标', nextRealm.value);
    }
  }
  _.set(data.value, '角色成长.等级', lv);
  _.set(data.value, '角色成长.当前经验', exp);
  _.set(data.value, '角色成长.属性点', points);
  _.set(data.value, '主角状态.内力上限', Math.max(qiMax.value, getLevelQiMax(lv)));
  const expectedRealm = getRealmByLevel(lv);
  if (expectedRealm !== realm.value && breakthroughStatus.value !== '突破中') _.set(data.value, '主角状态.武学境界', expectedRealm);
}

function addInsight(amount: number) { _.set(data.value, '角色成长.阅历', insight.value + amount); }

function buyItem(name: string, item: any) {
  const price = item.价格_银钱 || 0;
  if (silver.value < price) return;
  _.set(data.value, '主角状态.银钱', silver.value - price);
  const existing = items.value[name];
  if (existing) existing.数量 = (existing.数量 || 0) + 1;
  else _.set(data.value, `物品栏.${name}`, { 数量: 1, 描述: item.描述, 类型: item.类型 || '杂物' });
  delete shopCatalog.value[name];
}

function learnSkill(name: string, skill: any) {
  const cost = skill.消耗_阅历 || 0;
  if (insight.value < cost) return;
  _.set(data.value, '角色成长.阅历', insight.value - cost);
  _.set(data.value, `武学面板.招式.${name}`, { 类别: skill.类别, 品级: skill.品级, 描述: skill.描述, 内力消耗: skill.内力消耗 || 10 });
  delete unlockableSkills.value[name];
}

function castSkill(name: string, skill: any) {
  const cost = skill.内力消耗 || 10;
  if (qi.value < cost) { toastr.warning('内力不足'); return; }
  _.set(data.value, '主角状态.内力', qi.value - cost);
  fillInput('施展', name);
}

function startBreakthrough() {
  if (!canBreakthrough.value || !nextRealm.value) return;
  const roll = Math.floor(Math.random() * 100) + 1;
  const keyword = `突破${nextRealm.value}`;
  _.set(data.value, '角色成长.突破状态', '突破中');
  _.set(data.value, '角色成长.突破目标', nextRealm.value);
  _.set(data.value, '角色成长.突破关键词', keyword);
  _.set(data.value, '角色成长.突破ROLL', roll);
  fillRawInput(`[${keyword}｜ROLL:${roll}]`);
  toastr.info('突破关键词和ROLL点已写入输入栏，请发送后由AI判定突破结果');
}

function fillInput(action: string, name: string) {
  fillRawInput(`[${action} ${stripGradePrefix(name)}]`);
}

function fillRawInput(text: string) {
  try {
    const $parent = window.parent?.$ || window.$;
    const input = $parent?.('#send_textarea');
    if (input?.length) { input.val(`${input.val() || ''}${text}`); input.trigger('input'); return; }
  } catch (e) {
    console.log('[jianghu-ui] input access failed', e);
  }
}

function softDelete(category: RecycleCategory, name: string) {
  const paths = recyclePaths[category];
  const source = _.get(data.value, paths.source, {});
  const item = source[name];
  if (!item) return;
  const target = _.get(data.value, paths.target, {});
  target[name] = JSON.parse(JSON.stringify(item));
  delete source[name];
}

function restoreItem(category: RecycleCategory, name: string) {
  const paths = recyclePaths[category];
  const target = _.get(data.value, paths.target, {});
  const item = target[name];
  if (!item) return;
  const source = _.get(data.value, paths.source, {});
  source[name] = JSON.parse(JSON.stringify(item));
  delete target[name];
}

function permanentDelete(category: RecycleCategory, name: string) { delete _.get(data.value, recyclePaths[category].target, {})[name]; }

function getGradeClass(grade: string) {
  return ({ 粗浅: 'grade-low', 寻常: 'grade-normal', 精妙: 'grade-fine', 绝学: 'grade-master', 神功: 'grade-legendary' } as Record<string, string>)[grade] || 'grade-normal';
}

function debugAddSilver() { _.set(data.value, '主角状态.银钱', silver.value + 500); }
function debugAddQi() { _.set(data.value, '主角状态.内力', Math.min(qi.value + 50, qiMax.value)); }
function debugRestoreQi() { _.set(data.value, '主角状态.内力', qiMax.value); }
function debugAddExp() { addExp(300); }
function debugAddInsight() { addInsight(300); }
function debugAddAttrPoints() { _.set(data.value, '角色成长.属性点', attributePoints.value + 3); }
function debugAddTasks() { const list = tasks.value; list[`寻常_临渊送药_${Date.now()}`] = { 任务等级: '寻常', 任务描述: '把回春堂药包送到码头客栈。', 任务状态: '待接取', 奖励_银钱: 180, 奖励_经验: 80, 奖励_阅历: 80, 失败后果: '药包延误', 奖励已领取: false }; }
function debugAddShop() { const list = shopCatalog.value; list[`药材_止血散_${Date.now()}`] = { 描述: '回春堂常用止血药。', 价格_银钱: 60, 类型: '药材' }; list[`武学残谱_碎云剑页_${Date.now()}`] = { 描述: '残缺剑谱一页，可作为线索或研习材料。', 价格_银钱: 300, 类型: '武学残谱' }; }
function debugAddSkills() { const list = unlockableSkills.value; list[`寻常_回风刀_${Date.now()}`] = { 类别: '刀法', 品级: '寻常', 描述: '借转身带出一刀，适合近身反击。', 消耗_阅历: 80, 内力消耗: 12 }; }
function debugAddNPCs() { const list = npcs.value; list[`镖师老周_${Date.now()}`] = { 在场: true, 所在区域: currentRegion.value, 当前位置: currentLocation.value, 当前场景: currentScene.value, 备注: '镇远镖局旧部，熟悉码头路线', 当前态度: '友好' }; }

function ensureDefaultStatusEffects() {
  if (!_.get(data.value, '状态影响.伤势')) _.set(data.value, '状态影响.伤势', { 等级: '无', 描述: '', 恢复条件: '' });
  if (!_.get(data.value, '状态影响.中毒')) _.set(data.value, '状态影响.中毒', { 等级: '无', 描述: '', 恢复条件: '' });
  if (!_.get(data.value, '状态影响.通缉')) _.set(data.value, '状态影响.通缉', { 等级: '无', 区域: '', 原因: '' });
  if (!_.get(data.value, '江湖身份')) _.set(data.value, '江湖身份', { 当前名号: '无名外来者', 公开身份: '无路引的外来客', 隐藏身份: '未暴露', 名声等级: '无名', 名声关键词: [], 被识破风险: '低' });
  if (!_.get(data.value, '区域流言')) _.set(data.value, '区域流言', {});
}

async function setupMVUEventListeners() {
  try {
    await waitGlobalInitialized('Mvu');
    eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, () => {
      const bag = _.get(data.value, '物品栏', {});
      Object.keys(bag).forEach(name => { if ((bag[name]?.数量 ?? 0) <= 0) delete bag[name]; });
      if (breakthroughStatus.value === '成功') {
        _.set(data.value, '角色成长.突破状态', '无');
        _.set(data.value, '角色成长.突破目标', '');
        _.set(data.value, '角色成长.突破关键词', '');
        _.set(data.value, '角色成长.突破ROLL', 0);
        addExp(0);
      } else if (breakthroughStatus.value === '失败') {
        _.set(data.value, '角色成长.等级', realmLevelCap.value);
        _.set(data.value, '角色成长.当前经验', Math.floor(getExpMax(realmLevelCap.value) * 0.8));
        _.set(data.value, '主角状态.内力上限', Math.max(qiMax.value, getLevelQiMax(realmLevelCap.value)));
        _.set(data.value, '角色成长.突破状态', breakthroughReady.value ? '可突破' : '无');
        _.set(data.value, '角色成长.突破目标', '');
        _.set(data.value, '角色成长.突破关键词', '');
        _.set(data.value, '角色成长.突破ROLL', 0);
      }
    });
  } catch (e) {
    console.error('[jianghu-ui] mvu setup failed', e);
  }
}

onMounted(() => { setupMVUEventListeners(); });
ensureDefaultStatusEffects();
</script>

<style scoped lang="scss">
.jianghu-card {
  --accent: #d3ae60;
  --accent-rgb: 211, 174, 96;
  --bg: #0c1117;
  --panel: #111922;
  --panel-2: #151f2b;
  --line: rgba(var(--accent-rgb), 0.2);
  --line-strong: rgba(var(--accent-rgb), 0.42);
  --text: #eadfca;
  --muted: #958a78;
  --gold: var(--accent);
  --gold-soft: rgba(var(--accent-rgb), 0.16);
  --topbar-bg: rgba(255, 255, 255, 0.025);
  --control-bg: rgba(255, 255, 255, 0.04);
  --soft-bg: rgba(255, 255, 255, 0.035);
  --subtle-line: rgba(255, 255, 255, 0.055);
  --desc: #c4b8a5;
  --reward: #c9ad73;
  --brand-text: #111922;
  --card-gradient: linear-gradient(180deg, #111922 0%, #080c11 100%);
  --primary-gradient: linear-gradient(135deg, rgba(var(--accent-rgb), 0.13), rgba(21, 31, 43, 0.98));
  --shadow: 0 14px 30px rgba(0, 0, 0, 0.32);
  --jade: #68b08d;
  --cyan: #61a9b6;
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

.jianghu-card.theme-light {
  --bg: #f6efe2;
  --panel: rgba(255, 251, 242, 0.94);
  --panel-2: rgba(250, 240, 222, 0.92);
  --line: rgba(var(--accent-rgb), 0.24);
  --line-strong: rgba(var(--accent-rgb), 0.5);
  --text: #2a2118;
  --muted: #796a57;
  --gold-soft: rgba(var(--accent-rgb), 0.14);
  --topbar-bg: rgba(255, 255, 255, 0.46);
  --control-bg: rgba(255, 255, 255, 0.68);
  --soft-bg: rgba(var(--accent-rgb), 0.08);
  --subtle-line: rgba(89, 63, 31, 0.12);
  --desc: #675847;
  --reward: #7d5e26;
  --brand-text: #fff8ea;
  --card-gradient: radial-gradient(circle at top left, rgba(var(--accent-rgb), 0.16), transparent 34%), linear-gradient(180deg, #fff8ea 0%, #efe0c8 100%);
  --primary-gradient: linear-gradient(135deg, rgba(var(--accent-rgb), 0.2), rgba(255, 251, 242, 0.98));
  --shadow: 0 12px 26px rgba(82, 55, 22, 0.16);
}

.jianghu-card.tone-amber { --accent: #d3ae60; --accent-rgb: 211, 174, 96; }
.jianghu-card.tone-jade { --accent: #64b489; --accent-rgb: 100, 180, 137; }
.jianghu-card.tone-crimson { --accent: #d16b61; --accent-rgb: 209, 107, 97; }
.jianghu-card.tone-indigo { --accent: #6e8bd9; --accent-rgb: 110, 139, 217; }
.jianghu-card.tone-ink { --accent: #9aa0a6; --accent-rgb: 154, 160, 166; }

.topbar {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  background: var(--topbar-bg);
  border-bottom: 1px solid var(--line);
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 0;
  color: inherit;
  background: transparent;
  border: 0;
  text-align: left;
  cursor: pointer;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  border-radius: 9px;
  color: var(--brand-text);
  background: var(--gold);
  font-size: 17px;
  font-weight: 900;
}

.brand strong { display: block; color: var(--text); font-size: 15px; letter-spacing: 0.08em; line-height: 1.2; }
.brand small { display: block; margin-top: 1px; color: var(--muted); font-size: 10px; line-height: 1.25; }
.version-badge { color: var(--muted); font-size: 0.55em; font-weight: normal; opacity: 0.5; margin-left: 4px; flex-shrink: 0; letter-spacing: 0.5px; }
.top-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.time-chip, .ghost-btn, .round-btn { border: 1px solid var(--line); color: var(--text); background: var(--control-bg); border-radius: 8px; }
.time-chip { padding: 4px 8px; font-size: 10px; white-space: nowrap; }
.ghost-btn, .round-btn { padding: 4px 9px; cursor: pointer; font-size: 12px; }
.settings-btn.active { border-color: var(--line-strong); color: var(--gold); background: var(--gold-soft); }

.collapsed-badges { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; justify-content: flex-end; }
.collapsed-badge { display: inline-flex; align-items: center; gap: 3px; padding: 2px 6px; border-radius: 999px; background: var(--danger); color: #fff; font-size: 10px; font-weight: 800; line-height: 1.2; white-space: nowrap; }
.state-badge { background: #7c6633; }

.settings-panel { display: flex; justify-content: flex-end; align-items: center; gap: 9px; padding: 6px 8px; background: var(--topbar-bg); border-bottom: 1px solid var(--subtle-line); }
.settings-group { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.settings-label { color: var(--muted); font-size: 11px; }
.zoom-label { color: var(--muted); font-size: 12px; min-width: 42px; text-align: center; }
.theme-swatch { width: 22px; height: 22px; padding: 0; border: 1px solid var(--line); border-radius: 999px; cursor: pointer; text-indent: -999px; overflow: hidden; box-shadow: inset 0 0 0 3px var(--panel); }
.theme-swatch.active { border-color: var(--text); transform: translateY(-1px); }
.theme-swatch span { pointer-events: none; }
.swatch-amber { background: #d3ae60; }
.swatch-jade { background: #64b489; }
.swatch-crimson { background: #d16b61; }
.swatch-indigo { background: #6e8bd9; }
.swatch-ink { background: #9aa0a6; }
.content { padding: 7px; }

.tab-nav { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 7px; }
.tab-btn { position: relative; min-height: 28px; border: 1px solid transparent; border-radius: 7px; background: var(--soft-bg); color: var(--muted); cursor: pointer; font-size: 11px; transition: 0.18s ease; }
.tab-btn.active { color: var(--gold); background: var(--gold-soft); border-color: var(--line-strong); font-weight: 700; }
.tab-badge { margin-left: 4px; padding: 1px 5px; border-radius: 999px; background: var(--danger); color: #fff; font-size: 10px; }
.reward-badge { background: var(--jade); }
.attr-badge { background: var(--cyan); }
.tab-pane { display: grid; gap: 8px; }
.hero-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 8px; }

.panel, .hero-card {
  padding: 9px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 9px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.primary-card { background: var(--primary-gradient); border-color: var(--line-strong); }
.section-kicker, .panel-title { color: var(--gold); font-size: 12px; font-weight: 800; letter-spacing: 0.08em; }
.panel-title { margin-bottom: 7px; padding-bottom: 5px; border-bottom: 1px solid var(--line); }
.realm-line, .level-line, .card-head, .reward-row, .button-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.player-profile-panel { transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, padding 0.2s ease; }
.player-profile-panel.compact { padding: 7px 9px; opacity: 0.82; }
.player-profile-panel.required { border-color: rgba(192, 100, 85, 0.72); background: linear-gradient(135deg, rgba(192, 100, 85, 0.14), var(--panel)); box-shadow: 0 0 0 1px rgba(192, 100, 85, 0.22), var(--shadow); }
.profile-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 7px; }
.player-profile-panel.compact .profile-head { align-items: center; margin-bottom: 0; }
.profile-hint { margin: 4px 0 0; color: var(--muted); font-size: 12px; line-height: 1.45; }
.player-profile-panel.required .profile-hint { color: #dfa59b; font-weight: 700; }
.profile-actions { display: flex; align-items: center; gap: 7px; flex: 0 0 auto; }
.mini-text-btn { border: 1px solid var(--line); border-radius: 6px; padding: 2px 7px; color: var(--muted); background: var(--soft-bg); cursor: pointer; font-size: 11px; }
.mini-text-btn:hover { border-color: var(--line-strong); color: var(--gold); }
.gender-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 7px; }
.gender-btn { border: 1px solid var(--line); border-radius: 7px; padding: 5px 10px; background: var(--soft-bg); color: var(--text); cursor: pointer; }
.gender-btn.active { border-color: var(--line-strong); color: var(--brand-text); background: var(--gold); font-weight: 800; }
.profile-field { display: grid; gap: 4px; margin-top: 7px; color: var(--muted); font-size: 11px; }
.profile-field textarea, .profile-field input { width: 100%; box-sizing: border-box; border: 1px solid var(--line); border-radius: 7px; padding: 7px; color: var(--text); background: var(--panel-2); font: inherit; font-size: 12px; line-height: 1.45; }
.profile-field textarea { resize: vertical; min-height: 44px; }
.profile-field input { height: 31px; }
.profile-field textarea:focus, .profile-field input:focus { outline: none; border-color: var(--line-strong); box-shadow: 0 0 0 2px var(--gold-soft); }
.compact-field { margin-top: -2px; margin-bottom: 8px; }
.profile-save-row { margin-top: 7px; }
.realm-line, .level-line { margin: 6px 0; }
.level-left { display: inline-flex; align-items: center; gap: 6px; }
.breakthrough-line { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 7px; color: var(--muted); font-size: 11px; }
.breakthrough-btn { border: 1px solid var(--line); border-radius: 6px; padding: 3px 8px; background: var(--gold-soft); color: var(--gold); cursor: pointer; font-size: 11px; line-height: 1.2; }
.breakthrough-btn:disabled { opacity: 0.42; cursor: not-allowed; }
.insight-line { margin-top: 6px; color: var(--muted); font-size: 12px; }
.insight-line strong { color: var(--gold); }
.realm-badge, .level-badge, .silver-pill { display: inline-flex; align-items: center; border-radius: 7px; padding: 3px 8px; font-weight: 800; }
.realm-badge { color: var(--brand-text); background: var(--gold); }
.level-badge { color: var(--jade); background: rgba(104, 176, 141, 0.12); border: 1px solid rgba(104, 176, 141, 0.32); }
.silver-pill { color: var(--gold); background: var(--gold-soft); border: 1px solid var(--line); }
.muted { color: var(--muted); }
.bar-shell { position: relative; height: 16px; border-radius: 999px; overflow: hidden; background: var(--soft-bg); border: 1px solid var(--subtle-line); }
.bar-shell.large { height: 19px; }
.bar-shell span { position: absolute; inset: 0; display: grid; place-items: center; font-size: 11px; font-weight: 700; color: var(--text); text-shadow: 0 1px 2px rgba(0, 0, 0, 0.55); }
.bar-fill { height: 100%; transition: width 0.25s ease; }
.bar-fill.qi { background: linear-gradient(90deg, #3f7f8f, #5fa889); }
.bar-fill.exp { background: linear-gradient(90deg, #7c6633, var(--gold)); }
.attribute-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.attribute-card { position: relative; padding: 7px 8px; border-radius: 8px; background: var(--panel-2); border: 1px solid var(--subtle-line); }
.attribute-card span { display: block; color: var(--muted); font-size: 11px; }
.attribute-card strong { color: var(--text); font-size: 18px; }
.mini-btn { position: absolute; right: 7px; top: 7px; border: 1px solid var(--line); border-radius: 6px; width: 22px; height: 22px; background: var(--gold-soft); color: var(--gold); cursor: pointer; }
.empty-state { color: var(--muted); text-align: center; padding: 9px; font-size: 12px; }
.empty-state.strong { color: var(--text); font-size: 14px; font-weight: 700; }
.list-card, .npc-card { padding: 8px 0; border-top: 1px solid var(--subtle-line); }
.list-card:first-of-type, .npc-card:first-of-type { border-top: 0; }
.compact-list-card { padding: 6px 0; }
.state-block + .state-block { margin-top: 9px; padding-top: 8px; border-top: 1px solid var(--subtle-line); }
.state-heading { margin-bottom: 2px; color: var(--muted); font-size: 11px; font-weight: 800; letter-spacing: 0.08em; }
.muted-desc { color: var(--muted); }
.card-head strong { font-size: 13px; }
.desc { margin: 6px 0; color: var(--desc); font-size: 12px; line-height: 1.55; }
.status-tag, .grade-badge { display: inline-flex; align-items: center; border-radius: 6px; padding: 2px 7px; font-size: 10px; font-weight: 800; white-space: nowrap; }
.status-tag.pending { background: rgba(var(--accent-rgb), 0.13); color: var(--gold); }
.status-tag.active { background: rgba(97, 169, 182, 0.13); color: #8cd5df; }
.status-tag.done { background: rgba(104, 176, 141, 0.14); color: #96d7b9; }
.status-tag.muted { background: var(--soft-bg); color: var(--muted); }
.status-tag.danger-tag { background: rgba(192, 100, 85, 0.14); color: var(--danger); }
.reward-row { color: var(--reward); font-size: 11px; flex-wrap: wrap; }
.danger-text { color: var(--danger); font-size: 11px; }
.button-row { justify-content: flex-start; flex-wrap: wrap; margin-top: 6px; }
.action-btn { border: 1px solid var(--line); border-radius: 7px; padding: 4px 9px; background: var(--soft-bg); color: var(--text); cursor: pointer; font-size: 12px; }
.action-btn:hover:not(:disabled) { border-color: var(--gold); color: var(--gold); background: var(--gold-soft); }
.action-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.action-btn.success { border-color: rgba(104, 176, 141, 0.4); color: #96d7b9; }
.action-btn.danger { border-color: rgba(167, 67, 51, 0.5); color: var(--danger); }
.action-btn.muted-btn { color: var(--muted); }
.highlight-panel { border-color: var(--line-strong); }
.muted-panel { opacity: 0.86; }
.wallet-value { font-size: 24px; font-weight: 900; color: var(--gold); }
.data-grid { display: grid; grid-template-columns: auto 1fr; gap: 7px 12px; font-size: 12px; }
.data-grid span { color: var(--muted); }
.data-grid strong { color: var(--text); text-align: right; }
.data-grid.small { margin: 7px 0; }
.grade-badge { margin-right: 6px; color: #fff; background: #716352; }
.grade-low { background: #5a6470; }
.grade-normal { background: #3f8a67; }
.grade-fine { background: #b78d3b; color: #111922; }
.grade-master { background: #9d4e45; }
.grade-legendary { background: #39727b; }
.debug-panel { border-color: rgba(255, 213, 79, 0.6); }
.button-grid { display: flex; gap: 7px; flex-wrap: wrap; }

@media (max-width: 560px) {
  .topbar { align-items: flex-start; }
  .brand strong { font-size: 16px; }
  .time-chip { display: none; }
  .settings-panel { align-items: flex-start; flex-direction: column; }
  .settings-group { width: 100%; }
  .theme-controls { justify-content: flex-start; }
  .tab-nav { grid-template-columns: repeat(3, 1fr); }
  .hero-grid { grid-template-columns: 1fr; }
  .attribute-grid { grid-template-columns: repeat(2, 1fr); }
  .card-head { align-items: flex-start; flex-direction: column; }
}
</style>
