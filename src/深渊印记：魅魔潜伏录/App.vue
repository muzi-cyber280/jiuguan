<template>
  <div class="succubus-card">
    <!-- 折叠按钮栏 -->
    <div class="collapse-bar">
      <span class="collapse-title" @click="toggleDebugMode">❦ 深渊印记 ❦</span>
      <button class="collapse-btn" type="button" @click="collapsed = !collapsed">
        {{ collapsed ? '展开 ▼' : '收起 ▲' }}
      </button>
    </div>

    <!-- 可折叠内容区 -->
    <div v-show="!collapsed" class="collapsible-content">
      <!-- 分页导航 -->
      <nav class="tab-nav">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}<span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span><span v-if="tab.rewardBadge" class="tab-badge reward-badge">{{ tab.rewardBadge }}</span>
        </button>
      </nav>

      <!-- 状态页 -->
      <div v-if="activeTab === 'status'" class="tab-pane">
        <!-- 角色成长 -->
        <div class="section-box">
          <div class="section-title">角色成长</div>
          <div class="level-display">
            <span class="level-badge">Lv.{{ level }}</span>
            <div class="exp-bar-container">
              <div class="exp-bar" :style="{ width: expPercent + '%' }"></div>
              <span class="exp-text">{{ currentExp }} / {{ expMax }}</span>
            </div>
          </div>
        </div>

        <!-- DND属性 -->
        <div class="section-box">
          <div class="section-title">
            六维属性
            <span class="attr-points-badge">可分配: {{ attributePoints }}</span>
          </div>
          <div class="dnd-attributes">
            <div v-for="(label, attr) in dndAttrLabels" :key="attr" class="attr-row">
              <span class="attr-label">{{ label }}</span>
              <div class="attr-value-container">
                <span class="attr-value">{{ dndAttributes[attr] }}</span>
              </div>
              <button
                v-if="attributePoints > 0"
                class="attr-plus-btn"
                @click="allocateAttribute(attr)"
              >+</button>
            </div>
          </div>
        </div>

        <!-- 核心资源 -->
        <div class="section-box">
          <div class="section-title">核心资源</div>
          <div class="resource-line">
            <span class="resource-label">💎 欲望点数 (DP)</span>
            <span class="resource-value">{{ dp }}</span>
          </div>
          <div class="resource-line">
            <span class="resource-label">⭐ 技能点 (SP)</span>
            <span class="resource-value">{{ sp }}</span>
          </div>
          <div class="resource-line">
            <span class="resource-label">💙 蓝条 (MP)</span>
            <div class="mp-bar-wrapper">
              <div class="mp-bar" :style="{ width: mpPercent + '%' }"></div>
              <span class="mp-text">{{ mp }} / {{ mpMax }}</span>
            </div>
          </div>
          <div class="resource-line">
            <span class="resource-label">饥饿度</span>
            <span class="resource-value">{{ hunger }}%</span>
          </div>
        </div>

        <!-- 调试面板 -->
        <div v-if="debugMode" class="section-box debug-panel">
          <div class="section-title" style="color: #ffd54f;">调试面板</div>
          <div class="debug-buttons">
            <button class="debug-btn" @click="debugAddExp">+1000 EXP</button>
            <button class="debug-btn" @click="debugAddAttrPoints">+5 属性点</button>
            <button class="debug-btn" @click="debugAddDP">+100 DP</button>
            <button class="debug-btn" @click="debugAddSP">+10 SP</button>
            <button class="debug-btn" @click="debugAddMP">+20 MP</button>
            <button class="debug-btn" @click="debugRestoreMP">回满MP</button>
            <button class="debug-btn" @click="debugAddHunger">+20 饥饿度</button>
            <button class="debug-btn" @click="debugResetHunger">清零饥饿度</button>
            <button class="debug-btn" @click="debugAddTasks">生成任务</button>
            <button class="debug-btn" @click="debugCompleteTask">完成任务待领取</button>
            <button class="debug-btn" @click="debugAddNPCs">生成NPC</button>
            <button class="debug-btn" @click="debugAddShop">生成商品</button>
            <button class="debug-btn" @click="debugAddSkills">生成技能</button>
          </div>
        </div>
      </div>

      <!-- 任务页 -->
      <div v-if="activeTab === 'task'" class="tab-pane">
        <!-- 进行中的任务（置顶高亮） -->
        <div v-for="([name, task]) in activeTasks" :key="name" class="section-box current-task">
          <div class="section-title">⚔ {{ stripGradePrefix(name) }}</div>
          <div class="task-card-header">
            <span class="task-level">{{ task.任务等级 }}级</span>
            <span class="task-status-tag status-active">进行中</span>
            <button v-if="debugMode" class="debug-complete-btn" @click="completeTask(name)" title="调试：完成任务">✓</button>
          </div>
          <div class="task-desc-text">{{ task.任务描述 }}</div>
          <div class="task-card-reward">
            <span>奖励: DP +{{ task.奖励_DP }} | SP +{{ task.奖励_SP }} | EXP +{{ task.奖励_EXP }}</span>
          </div>
          <div v-if="task.失败后果 && task.失败后果 !== '无严重后果'" class="task-card-penalty">
            <span>失败后果: {{ task.失败后果 }}</span>
          </div>
          <div class="task-buttons">
            <button class="task-btn giveup-btn" @click="setTaskStatus(name, '已失败')">放弃</button>
            <button class="task-btn ignore-btn" @click="setTaskStatus(name, '已忽略')">忽略</button>
          </div>
        </div>

        <!-- 待接取的任务 -->
        <div class="section-box">
          <div class="section-title">猎杀指令</div>
          <div v-if="pendingTasks.length === 0 && activeTasks.length === 0" class="list-item">暂无任务，等待深渊投喂……</div>
          <div v-if="pendingTasks.length === 0 && activeTasks.length > 0" class="list-item">暂无待接取任务</div>
          <div v-for="([name, task]) in pendingTasks" :key="name" class="task-card">
            <div class="task-card-header">
              <span class="task-level">{{ task.任务等级 }}级 · {{ stripGradePrefix(name) }}</span>
              <span class="task-status-tag status-pending">待接取</span>
            </div>
            <div class="task-desc-text">{{ task.任务描述 }}</div>
            <div class="task-card-reward">
              <span>DP: +{{ task.奖励_DP }}</span>
              <span>SP: +{{ task.奖励_SP }}</span>
              <span>EXP: +{{ task.奖励_EXP }}</span>
            </div>
            <div v-if="task.失败后果 && task.失败后果 !== '无严重后果'" class="task-card-penalty">
              <span>失败后果: {{ task.失败后果 }}</span>
            </div>
            <div class="task-buttons">
              <button class="task-btn accept-btn" @click="setTaskStatus(name, '进行中')">接取任务</button>
              <button class="task-btn ignore-btn" @click="setTaskStatus(name, '已忽略')">忽略</button>
            </div>
          </div>
        </div>

        <!-- 已失败/已忽略的任务 -->
        <div v-if="completedTasks.length > 0" class="section-box">
          <div class="section-title">🎁 待领取奖励</div>
          <div v-for="([name, task]) in completedTasks" :key="name" class="task-card reward-pending">
            <div class="task-card-header">
              <span class="task-level">{{ task.任务等级 }}级 · {{ stripGradePrefix(name) }}</span>
              <span class="task-status-tag status-done">已完成</span>
            </div>
            <div class="task-desc-text">{{ task.任务描述 }}</div>
            <div class="task-card-reward">
              <span>DP: +{{ task.奖励_DP }}</span>
              <span>SP: +{{ task.奖励_SP }}</span>
              <span>EXP: +{{ task.奖励_EXP }}</span>
            </div>
            <div class="task-buttons">
              <button class="task-btn accept-btn" @click="claimReward(name)">领取奖励</button>
            </div>
          </div>
        </div>

        <!-- 已失败/已忽略/已领取的任务 -->
        <div v-if="inactiveTasks.length > 0" class="section-box">
          <div class="section-title">往期任务</div>
          <div v-for="([name, task]) in inactiveTasks" :key="name" class="task-card inactive">
            <div class="task-card-header">
              <span class="task-level">{{ task.任务等级 }}级 · {{ stripGradePrefix(name) }}</span>
              <span class="task-status-tag" :class="task.奖励已领取 ? 'status-done' : task.任务状态 === '已失败' ? 'status-failed' : 'status-ignored'">{{ task.奖励已领取 ? '已领取' : task.任务状态 }}</span>
            </div>
            <div class="task-desc-text">{{ task.任务描述 }}</div>
            <div class="task-card-reward">
              <span>DP: {{ task.奖励_DP }}</span>
              <span>SP: {{ task.奖励_SP }}</span>
              <span>EXP: {{ task.奖励_EXP }}</span>
            </div>
            <div v-if="task.失败后果 && task.失败后果 !== '无严重后果'" class="task-card-penalty">
              <span>失败后果: {{ task.失败后果 }}</span>
            </div>
            <div class="task-buttons">
              <button v-if="task.任务状态 === '已失败' || task.任务状态 === '已忽略'" class="task-btn restore-btn" @click="setTaskStatus(name, '待接取')">恢复任务</button>
              <button class="task-btn delete-btn" @click="softDelete('任务', name)">删除</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 商店页 -->
      <div v-if="activeTab === 'shop'" class="tab-pane">
        <div class="resource-bar">
          <div class="resource-line">
            <span class="resource-label">💎 欲望点数 (DP)</span>
            <span class="resource-value">{{ dp }}</span>
          </div>
          <div class="resource-line">
            <span class="resource-label">⭐ 技能点 (SP)</span>
            <span class="resource-value">{{ sp }}</span>
          </div>
        </div>
        <div class="section-box">
          <div class="section-title">深渊橱窗</div>
          <div v-if="Object.keys(shopCatalog).length === 0" class="list-item">橱窗空空，等待进货……</div>
          <div v-for="(item, name) in shopCatalog" :key="'shop-'+name" class="task-card">
            <div class="task-card-header">
              <span class="task-level">{{ stripGradePrefix(name) }}</span>
              <span class="task-status-tag" :class="dp >= item.价格_DP ? 'status-pending' : 'status-ignored'">{{ item.价格_DP }} DP</span>
            </div>
            <div class="task-desc-text">{{ item.描述 }}</div>
            <div class="task-buttons">
              <button class="task-btn accept-btn" :disabled="dp < item.价格_DP" @click="buyItem(name, item)">购买</button>
              <button class="task-btn delete-btn" @click="softDelete('商品', name)">移除</button>
            </div>
          </div>
        </div>

        <div class="section-box">
          <div class="section-title">行囊</div>
          <div v-if="Object.keys(items).length === 0" class="list-item">行囊空空</div>
          <div v-for="(item, name) in items" :key="'item-'+name" class="item-row">
            <div class="item-info">
              <span class="item-name">✧ {{ stripGradePrefix(name) }} x{{ item.数量 || 0 }}</span>
              <span class="skill-desc">{{ item.作用 }}</span>
            </div>
            <div class="item-buttons">
              <button class="task-btn use-btn" @click="fillInput('使用', name)">使用</button>
              <button class="task-btn delete-btn item-delete-btn" @click="softDelete('物品', name)">删除</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 技能页 -->
      <div v-if="activeTab === 'skill'" class="tab-pane">
        <div class="resource-standalone">
          <div class="resource-line">
            <span class="resource-label">💙 蓝条 (MP)</span>
            <div class="mp-bar-wrapper">
              <div class="mp-bar" :style="{ width: mpPercent + '%' }"></div>
              <span class="mp-text">{{ mp }} / {{ mpMax }}</span>
            </div>
          </div>
        </div>
        <div class="section-box">
          <div class="section-title">可解锁异能</div>
          <div v-if="Object.keys(unlockableSkills).length === 0" class="list-item">暂无可解锁技能</div>
          <div v-for="(skill, name) in unlockableSkills" :key="'unlock-'+name" class="task-card">
            <div class="task-card-header">
              <span class="task-level">
                <span class="skill-grade-badge" :class="getGradeClass(getSkillGradeAndCost(name, skill).grade)">{{ getSkillGradeAndCost(name, skill).grade }}</span>
                {{ stripGradePrefix(name) }}
              </span>
              <span class="task-status-tag" :class="sp >= skill.消耗_SP ? 'status-pending' : 'status-ignored'">{{ skill.消耗_SP }} SP</span>
            </div>
            <div class="task-desc-text">{{ skill.描述 }}</div>
            <div class="skill-unlock-info">
              <span class="skill-cost-preview">蓝条消耗: {{ getSkillGradeAndCost(name, skill).mpCost }}</span>
            </div>
            <div class="task-buttons">
              <button class="task-btn accept-btn" :disabled="sp < skill.消耗_SP" @click="unlockSkill(name, skill)">解锁</button>
              <button class="task-btn delete-btn" @click="softDelete('可解锁技能', name)">移除</button>
            </div>
          </div>
        </div>

        <div class="section-box">
          <div class="section-title">已掌握异能</div>
          <div v-if="Object.keys(skills).length === 0" class="list-item">暂无技能</div>
          <div v-for="(skill, name) in skills" :key="'skill-'+name" class="skill-row">
            <div class="skill-header">
              <span class="item-name">
                <span class="skill-grade-badge" :class="getGradeClass(skill.等级)">{{ skill.等级 || 'D' }}</span>
                {{ stripGradePrefix(name) }}
              </span>
              <span class="skill-cost">MP消耗: {{ skill.蓝条消耗 || 10 }}</span>
              <button class="task-btn use-btn" :disabled="mp < (skill.蓝条消耗 || 10)" @click="castSkill(name, skill)">施展</button>
              <button class="task-btn delete-btn item-delete-btn" @click="softDelete('技能', name)">删除</button>
            </div>
            <div class="skill-desc">{{ skill.描述 }}</div>
          </div>
        </div>
      </div>

      <!-- 人物页 -->
      <div v-if="activeTab === 'character'" class="tab-pane">
        <!-- 世界时间 -->
        <div class="section-box">
          <div class="section-title">世界时间</div>
          <div class="data-row">
            <span class="data-label">当前时间</span>
            <span class="data-value">第{{ worldYear }}年 {{ worldMonth }}月{{ worldDay }}日 {{ timeString }}</span>
          </div>
        </div>

        <!-- 世界定位 -->
        <div class="section-box">
          <div class="section-title">世界定位</div>
          <div class="data-row">
            <span class="data-label">当前位置</span>
            <span class="data-value">{{ currentCity }}-{{ currentLocation }}</span>
          </div>
          <div class="data-row">
            <span class="data-label">当前场景</span>
            <span class="data-value">{{ currentScene }}</span>
          </div>
          <div class="data-row">
            <span class="data-label">当前事件</span>
            <span class="data-value">{{ currentEvent }}</span>
          </div>
        </div>

        <!-- 在场人物 -->
        <div class="section-box">
          <div class="section-title">在场人物</div>
          <div v-if="presentNpcNames.length === 0" class="list-item">当前无人在场</div>
          <div v-for="name in presentNpcNames" :key="'present-'+name" class="npc-card present">
            <div class="npc-header">
              <span class="npc-name">❖ {{ name }}</span>
              <div class="npc-actions">
                <span class="presence-tag present">在场</span>
                <button class="task-btn presence-btn leave-btn" @click="setNpcPresence(name, false)">离场</button>
              </div>
            </div>
            <div class="data-row">
              <span class="data-label" style="padding-left: 12px">态度</span>
              <span class="data-value">{{ npcs[name]?.当前态度 || '未知' }}</span>
            </div>
            <div class="data-row">
              <span class="data-label" style="padding-left: 12px">怀疑度 / 成瘾度</span>
              <span class="data-value">{{ npcs[name]?.怀疑度 ?? 0 }}% / {{ npcs[name]?.成瘾度 ?? 0 }}%</span>
            </div>
            <div v-if="npcs[name]?.备注" class="data-row">
              <span class="data-label" style="padding-left: 12px">备注</span>
              <span class="data-value">{{ npcs[name].备注 }}</span>
            </div>
          </div>
        </div>

        <!-- 离场人物 -->
        <div class="section-box">
          <div class="section-title">离场人物</div>
          <div v-if="absentNpcNames.length === 0" class="list-item">暂无离场人物</div>
          <div v-for="name in absentNpcNames" :key="'absent-'+name" class="npc-card absent">
            <div class="npc-header">
              <span class="npc-name">❖ {{ name }}</span>
              <div class="npc-actions">
                <span class="presence-tag absent">离场</span>
                <button class="task-btn presence-btn arrive-btn" @click="setNpcPresence(name, true)">入场</button>
                <button class="task-btn delete-btn npc-delete-btn" @click="softDelete('NPC', name)">删除</button>
              </div>
            </div>
            <div class="data-row">
              <span class="data-label" style="padding-left: 12px">态度</span>
              <span class="data-value">{{ npcs[name]?.当前态度 || '未知' }}</span>
            </div>
            <div class="data-row">
              <span class="data-label" style="padding-left: 12px">怀疑度 / 成瘾度</span>
              <span class="data-value">{{ npcs[name]?.怀疑度 ?? 0 }}% / {{ npcs[name]?.成瘾度 ?? 0 }}%</span>
            </div>
            <div v-if="npcs[name]?.备注" class="data-row">
              <span class="data-label" style="padding-left: 12px">备注</span>
              <span class="data-value">{{ npcs[name].备注 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 回收站页 -->
      <div v-if="activeTab === 'recycle'" class="tab-pane">
        <div v-if="recycleBinCount === 0" class="section-box">
          <div class="list-item" style="text-align: center; opacity: 0.6;">回收站为空</div>
        </div>

        <!-- 已删除任务 -->
        <div v-if="Object.keys(deletedTasks).length > 0" class="section-box">
          <div class="section-title">已删除任务</div>
          <div v-for="(task, name) in deletedTasks" :key="'dt-'+name" class="task-card inactive">
            <div class="task-card-header">
              <span class="task-level">{{ task.任务等级 }}级 · {{ stripGradePrefix(name) }}</span>
            </div>
            <div class="task-desc-text">{{ task.任务描述 }}</div>
            <div class="task-buttons">
              <button class="task-btn restore-btn" @click="restoreItem('任务', name)">恢复</button>
              <button class="task-btn delete-btn" @click="permanentDelete('任务', name)">永久删除</button>
            </div>
          </div>
        </div>

        <!-- 已删除物品 -->
        <div v-if="Object.keys(deletedItems).length > 0" class="section-box">
          <div class="section-title">已删除物品</div>
          <div v-for="(item, name) in deletedItems" :key="'di-'+name" class="task-card inactive">
            <div class="task-card-header">
              <span class="task-level">{{ stripGradePrefix(name) }} x{{ item.数量 || 0 }}</span>
            </div>
            <div class="task-desc-text">{{ item.作用 }}</div>
            <div class="task-buttons">
              <button class="task-btn restore-btn" @click="restoreItem('物品', name)">恢复</button>
              <button class="task-btn delete-btn" @click="permanentDelete('物品', name)">永久删除</button>
            </div>
          </div>
        </div>

        <!-- 已删除技能 -->
        <div v-if="Object.keys(deletedSkills).length > 0" class="section-box">
          <div class="section-title">已删除技能</div>
          <div v-for="(skill, name) in deletedSkills" :key="'ds-'+name" class="task-card inactive">
            <div class="task-card-header">
              <span class="task-level">
                <span class="skill-grade-badge" :class="getGradeClass(skill.等级)">{{ skill.等级 || 'D' }}</span>
                {{ stripGradePrefix(name) }}
              </span>
            </div>
            <div class="task-desc-text">{{ skill.描述 }}</div>
            <div class="task-buttons">
              <button class="task-btn restore-btn" @click="restoreItem('技能', name)">恢复</button>
              <button class="task-btn delete-btn" @click="permanentDelete('技能', name)">永久删除</button>
            </div>
          </div>
        </div>

        <!-- 已删除NPC -->
        <div v-if="Object.keys(deletedNPCs).length > 0" class="section-box">
          <div class="section-title">已删除NPC</div>
          <div v-for="(npc, name) in deletedNPCs" :key="'dn-'+name" class="task-card inactive">
            <div class="task-card-header">
              <span class="task-level">❖ {{ name }}</span>
              <span class="task-status-tag status-ignored">{{ npc.当前态度 }}</span>
            </div>
            <div class="task-desc-text">怀疑度 {{ npc.怀疑度 ?? 0 }}% / 成瘾度 {{ npc.成瘾度 ?? 0 }}%</div>
            <div class="task-buttons">
              <button class="task-btn restore-btn" @click="restoreItem('NPC', name)">恢复</button>
              <button class="task-btn delete-btn" @click="permanentDelete('NPC', name)">永久删除</button>
            </div>
          </div>
        </div>

        <!-- 已删除商品 -->
        <div v-if="Object.keys(deletedCatalog).length > 0" class="section-box">
          <div class="section-title">已删除商品</div>
          <div v-for="(item, name) in deletedCatalog" :key="'dc-'+name" class="task-card inactive">
            <div class="task-card-header">
              <span class="task-level">{{ stripGradePrefix(name) }}</span>
              <span class="task-status-tag status-ignored">{{ item.价格_DP }} DP</span>
            </div>
            <div class="task-desc-text">{{ item.描述 }}</div>
            <div class="task-buttons">
              <button class="task-btn restore-btn" @click="restoreItem('商品', name)">恢复</button>
              <button class="task-btn delete-btn" @click="permanentDelete('商品', name)">永久删除</button>
            </div>
          </div>
        </div>

        <!-- 已删除可解锁技能 -->
        <div v-if="Object.keys(deletedUnlockable).length > 0" class="section-box">
          <div class="section-title">已删除可解锁技能</div>
          <div v-for="(skill, name) in deletedUnlockable" :key="'du-'+name" class="task-card inactive">
            <div class="task-card-header">
              <span class="task-level">
                <span class="skill-grade-badge" :class="getGradeClass(skill.等级)">{{ skill.等级 || 'D' }}</span>
                {{ stripGradePrefix(name) }}
              </span>
              <span class="task-status-tag status-ignored">{{ skill.消耗_SP }} SP</span>
            </div>
            <div class="task-desc-text">{{ skill.描述 }}</div>
            <div class="task-buttons">
              <button class="task-btn restore-btn" @click="restoreItem('可解锁技能', name)">恢复</button>
              <button class="task-btn delete-btn" @click="permanentDelete('可解锁技能', name)">永久删除</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useDataStore } from './store';

const collapsed = ref(false);
const activeTab = ref('status');

// === 隐藏调试模式开关 ===
const debugMode = ref(false);
let debugClickCount = 0;
let debugClickTimer: ReturnType<typeof setTimeout> | null = null;

function toggleDebugMode() {
  debugClickCount++;
  if (debugClickTimer) clearTimeout(debugClickTimer);
  if (debugClickCount >= 5) {
    debugMode.value = !debugMode.value;
    debugClickCount = 0;
    if (debugMode.value) {
      toastr.success('调试模式已开启');
    } else {
      toastr.info('调试模式已关闭');
    }
  } else {
    debugClickTimer = setTimeout(() => {
      debugClickCount = 0;
    }, 1000);
  }
}

// === 蓝条自然恢复 ===
let mpRecoveryTimer: ReturnType<typeof setInterval> | null = null;
const MP_RECOVERY_INTERVAL = 10000; // 10秒触发一次

function startMPRecovery() {
  if (mpRecoveryTimer) return;
  mpRecoveryTimer = setInterval(() => {
    const current = mp.value;
    const max = mpMax.value;
    if (current < max) {
      // 每次恢复量 = (每小时恢复量) / 360，因为10秒触发一次，一小时360次
      const recoveryPerTick = intelligenceMpRecovery.value / 360;
      const newVal = Math.min(current + recoveryPerTick, max);
      _.set(data.value, '资源面板.蓝条', Math.floor(newVal));
    }
  }, MP_RECOVERY_INTERVAL);
}

function stopMPRecovery() {
  if (mpRecoveryTimer) {
    clearInterval(mpRecoveryTimer);
    mpRecoveryTimer = null;
  }
}

// === 技能等级自动修正 ===
const SKILL_GRADE_CONFIG: Record<string, { grade: string; mpCost: number }> = {
  'S级_': { grade: 'S', mpCost: 80 },
  'A级_': { grade: 'A', mpCost: 50 },
  'B级_': { grade: 'B', mpCost: 30 },
  'C级_': { grade: 'C', mpCost: 20 },
  'D级_': { grade: 'D', mpCost: 10 },
};

function fixSkillGrades() {
  const skills = _.get(data.value, '技能树.已解锁技能', {}) as Record<string, { 等级?: string; 蓝条消耗?: number }>;
  let fixed = false;

  Object.keys(skills).forEach(skillName => {
    for (const [prefix, config] of Object.entries(SKILL_GRADE_CONFIG)) {
      if (skillName.startsWith(prefix)) {
        if (skills[skillName].等级 !== config.grade || skills[skillName].蓝条消耗 !== config.mpCost) {
          skills[skillName].等级 = config.grade;
          skills[skillName].蓝条消耗 = config.mpCost;
          fixed = true;
        }
        break;
      }
    }
  });

  if (fixed) {
    _.set(data.value, '技能树.已解锁技能', skills);
  }
}

// === MVU 事件监听 ===
async function setupMVUEventListeners() {
  try {
    await waitGlobalInitialized('Mvu');
    console.log('[MVU Event] Setting up event listeners...');

    // 监听命令解析事件
    eventOn(Mvu.events.COMMAND_PARSED, (commands) => {
      console.log('[MVU Event] COMMAND_PARSED triggered');
      console.log('[MVU Event] commands:', commands);
    });

    // 监听更新开始事件
    eventOn(Mvu.events.VARIABLE_UPDATE_STARTED, (old_variables) => {
      console.log('[MVU Event] VARIABLE_UPDATE_STARTED triggered');
      console.log('[MVU Event] old_variables:', old_variables);
    });

    eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, async (new_variables) => {
      console.log('[MVU Event] VARIABLE_UPDATE_ENDED triggered');
      console.log('[MVU Event] new_variables:', new_variables);

      // 1. 修正技能等级和蓝条消耗
      fixSkillGrades();

      // 2. 自动删除数量为0的物品
      const items = _.get(new_variables, 'stat_data.道具商店.物品栏', {});
      console.log('[MVU Event] 物品栏:', items);

      const zeroItems = Object.entries(items).filter(([, item]: [string, any]) => (item?.数量 ?? 0) <= 0);
      console.log('[MVU Event] 数量为0的物品:', zeroItems);

      if (zeroItems.length > 0) {
        console.log('[MVU Event] 准备删除数量为0的物品...');
        // 使用 updateVariablesWith 删除数量为0的物品
        await updateVariablesWith((vars) => {
          const inventory = _.get(vars, 'stat_data.道具商店.物品栏', {});
          for (const [name] of zeroItems) {
            console.log(`[MVU Event] 删除物品: ${name}`);
            delete inventory[name];
          }
          return vars;
        }, { type: 'message', message_id: getCurrentMessageId() });
        console.log('[MVU Event] 删除完成');
      }
    });

    console.log('[MVU Event] Event listeners set up successfully');
  } catch (e) {
    console.error('[MVU Event] Setup failed:', e);
  }
}

onMounted(() => {
  startMPRecovery();
  setupMVUEventListeners();
  fixSkillGrades(); // 初始化时也修正一次
});

onUnmounted(() => {
  stopMPRecovery();
});

// === 回收站数据路径映射 ===
type RecycleCategory = '任务' | '物品' | '技能' | 'NPC' | '商品' | '可解锁技能';

const recyclePaths: Record<RecycleCategory, { source: string; target: string }> = {
  '任务': { source: '任务列表', target: '回收站.已删除任务' },
  '物品': { source: '道具商店.物品栏', target: '回收站.已删除物品' },
  '技能': { source: '技能树.已解锁技能', target: '回收站.已删除技能' },
  'NPC': { source: 'NPC状态', target: '回收站.已删除NPC' },
  '商品': { source: '道具商店.商品目录', target: '回收站.已删除商品' },
  '可解锁技能': { source: '技能树.可解锁技能', target: '回收站.已删除可解锁技能' },
};

// 分页导航（computed 以支持动态 badge）
const tabs = computed(() => [
  { id: 'status', label: '状态' },
  { id: 'task', label: '任务', badge: pendingTasks.value.length > 0 ? pendingTasks.value.length : undefined, rewardBadge: completedTasks.value.length > 0 ? completedTasks.value.length : undefined },
  { id: 'shop', label: '商店' },
  { id: 'skill', label: '技能' },
  { id: 'character', label: '人物' },
  { id: 'recycle', label: '回收站' },
]);

const dataStore = useDataStore();
const { data } = storeToRefs(dataStore);

// === 状态页数据 ===
const dp = computed(() => _.get(data.value, '资源面板.欲望点数_DP', 0));
const sp = computed(() => _.get(data.value, '资源面板.技能点_SP', 0));
const mp = computed(() => _.get(data.value, '资源面板.蓝条', 0));
// MP上限由智力决定
const mpMax = computed(() => {
  const stored = _.get(data.value, '资源面板.蓝条上限');
  // 如果存储的上限与计算值不同，返回计算值（智力决定）
  return intelligenceMpMax.value;
});
const hunger = computed(() => _.get(data.value, '身体状态.饥饿度', 0));

// === 角色成长数据 ===
const level = computed(() => _.get(data.value, '角色成长.等级', 1));
const currentExp = computed(() => _.get(data.value, '角色成长.当前经验', 0));
const attributePoints = computed(() => _.get(data.value, '角色成长.属性点', 0));
// 经验上限由等级计算
const expMax = computed(() => Math.floor(100 * Math.pow(1.2, level.value - 1) + 50 * (level.value - 1)));
const expPercent = computed(() => Math.min(100, (currentExp.value / expMax.value) * 100));

// === DND属性数据 ===
const dndAttrLabels: Record<string, string> = {
  力量: '力量 STR',
  敏捷: '敏捷 DEX',
  体质: '体质 CON',
  智力: '智力 INT',
  感知: '感知 WIS',
  魅力: '魅力 CHA',
};

// === 六维属性效果计算 ===
const dndAttributes = computed(() => ({
  力量: _.get(data.value, 'DND属性.力量', 10),
  敏捷: _.get(data.value, 'DND属性.敏捷', 10),
  体质: _.get(data.value, 'DND属性.体质', 10),
  智力: _.get(data.value, 'DND属性.智力', 10),
  感知: _.get(data.value, 'DND属性.感知', 10),
  魅力: _.get(data.value, 'DND属性.魅力', 10),
}));

// 智力影响MP上限: 100 + (智力-10) × 10
const intelligenceMpMax = computed(() => 100 + (dndAttributes.value.智力 - 10) * 10);
// 智力影响MP恢复速度(每小时): 10 + (智力-10) × 3
const intelligenceMpRecovery = computed(() => 10 + (dndAttributes.value.智力 - 10) * 3);
// 魅力影响魅惑成功率: 30% + (魅力-10) × 5%
const charismaCharmRate = computed(() => 30 + (dndAttributes.value.魅力 - 10) * 5);
// 魅力影响吸取体液获得MP: 20 + 魅力 × 2
const charismaFluidMp = computed(() => 20 + dndAttributes.value.魅力 * 2);

// 属性效果汇总（用于UI显示）
const attributeEffects = computed(() => ({
  力量: {
    负重上限: `${dndAttributes.value.力量 * 5} kg`,
    物理伤害倍率: (1 + (dndAttributes.value.力量 - 10) * 0.05).toFixed(2),
  },
  敏捷: {
    闪避率: `${Math.max(0, dndAttributes.value.敏捷 - 10) * 2}%`,
    暴击率: `${Math.max(0, dndAttributes.value.敏捷 - 10) * 1}%`,
  },
  体质: {
    'HP上限': 100 + (dndAttributes.value.体质 - 10) * 10,
    '饥饿度增长/日': Math.max(0, 20 - (dndAttributes.value.体质 - 10) * 2),
  },
  智力: {
    'MP上限': intelligenceMpMax.value,
    'MP恢复/时': intelligenceMpRecovery.value,
    '技能伤害倍率': (1 + (dndAttributes.value.智力 - 10) * 0.1).toFixed(2),
    '可装备技能数': 3 + Math.floor((dndAttributes.value.智力 - 10) / 2),
  },
  感知: {
    侦查成功率: `${50 + (dndAttributes.value.感知 - 10) * 5}%`,
    识破隐藏: `${dndAttributes.value.感知 * 3}%`,
  },
  魅力: {
    魅惑成功率: `${charismaCharmRate.value}%`,
    吸取体液MP: charismaFluidMp.value,
  },
}));;

/** 分配属性点 */
function allocateAttribute(attr: string) {
  if (attributePoints.value <= 0) return;
  const currentValue = dndAttributes.value[attr as keyof typeof dndAttributes.value];

  _.set(data.value, `DND属性.${attr}`, currentValue + 1);
  _.set(data.value, '角色成长.属性点', attributePoints.value - 1);
}

// === 任务页数据 ===
const taskList = computed(() => _.get(data.value, '任务列表', {}));
const activeTasks = computed(() => Object.entries(_.pickBy(taskList.value, (t: any) => t.任务状态 === '进行中')));
const pendingTasks = computed(() => Object.entries(_.pickBy(taskList.value, (t: any) => t.任务状态 === '待接取')));
// 已完成但未领取奖励的任务
const completedTasks = computed(() => Object.entries(_.pickBy(taskList.value, (t: any) => t.任务状态 === '已完成' && !t.奖励已领取)));
// 已失败/已忽略/已领取的任务
const inactiveTasks = computed(() => Object.entries(_.pickBy(taskList.value, (t: any) => ['已失败', '已忽略'].includes(t.任务状态) || (t.任务状态 === '已完成' && t.奖励已领取))));

function setTaskStatus(name: string, status: string) {
  const task = taskList.value[name];
  if (!task) return;

  // 直接操作对象，避免_.set把任务名中的.解析为路径分隔符
  task.任务状态 = status;
}

/** 完成任务并发放奖励 - UI层处理，不依赖AI */
function completeTask(name: string) {
  const task = taskList.value[name];
  if (!task || task.任务状态 !== '进行中') return;

  // 发放奖励
  const rewardDp = task.奖励_DP || 0;
  const rewardSp = task.奖励_SP || 0;
  const rewardExp = task.奖励_EXP || 0;

  if (rewardDp > 0) {
    _.set(data.value, '资源面板.欲望点数_DP', dp.value + rewardDp);
  }
  if (rewardSp > 0) {
    _.set(data.value, '资源面板.技能点_SP', sp.value + rewardSp);
  }
  if (rewardExp > 0) {
    _.set(data.value, '角色成长.当前经验', currentExp.value + rewardExp);
  }

  // 领取后直接删除任务
  delete taskList.value[name];
}

/** 领取已完成任务的奖励 - 领取后删除任务 */
function claimReward(name: string) {
  const task = taskList.value[name];
  if (!task || task.奖励已领取) return;

  const rewardDp = task.奖励_DP || 0;
  const rewardSp = task.奖励_SP || 0;
  const rewardExp = task.奖励_EXP || 0;

  if (rewardDp > 0) {
    _.set(data.value, '资源面板.欲望点数_DP', dp.value + rewardDp);
  }
  if (rewardSp > 0) {
    _.set(data.value, '资源面板.技能点_SP', sp.value + rewardSp);
  }
  if (rewardExp > 0) {
    // 处理经验增加和自动升级
    let lv = level.value;
    let exp = currentExp.value + rewardExp;
    let pts = attributePoints.value;

    // 自动升级循环（使用 getExpMax 函数确保每次用新等级计算上限）
    while (exp >= getExpMax(lv)) {
      exp -= getExpMax(lv);
      lv += 1;
      pts += 1;
    }

    _.set(data.value, '角色成长.等级', lv);
    _.set(data.value, '角色成长.当前经验', exp);
    _.set(data.value, '角色成长.属性点', pts);
  }

  // 领取后直接删除任务
  delete taskList.value[name];
}

function stripGradePrefix(name: string): string {
  let result = name;
  // 移除等级前缀：D级_、C级_、B级_、A级_、S级_
  result = result.replace(/^[DSCBA]级_/, '');
  // 移除任务ID格式前缀：MQ.Ⅰ_、SQ.Ⅱ_、DQ.Ⅲ_ 等
  // 格式：类型(字母) + 可选编号(罗马数字或数字) + _
  result = result.replace(/^[A-Za-z]+\.?[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ\d]*_/, '');
  return result;
}

/** 获取技能等级对应的CSS类名 */
function getGradeClass(grade: string): string {
  const gradeMap: Record<string, string> = {
    'D': 'grade-d',
    'C': 'grade-c',
    'B': 'grade-b',
    'A': 'grade-a',
    'S': 'grade-s',
  };
  return gradeMap[grade] || 'grade-d';
}

// === 技能页数据 ===
const unlockableSkills = computed(() => _.get(data.value, '技能树.可解锁技能', {}));
const skills = computed(() => _.get(data.value, '技能树.已解锁技能', {}));

/** 根据技能名和技能对象获取等级和蓝条消耗（优先使用对象中的值，缺失时用前缀推断） */
function getSkillGradeAndCost(skillName: string, skillObj?: any): { grade: string; mpCost: number } {
  // 优先使用技能对象中的值
  if (skillObj?.等级 && skillObj?.蓝条消耗) {
    return { grade: skillObj.等级, mpCost: skillObj.蓝条消耗 };
  }
  // 缺失时根据前缀推断
  for (const [prefix, config] of Object.entries(SKILL_GRADE_CONFIG)) {
    if (skillName.startsWith(prefix)) {
      return config;
    }
  }
  return { grade: 'D', mpCost: 10 };
}

// === 商店页数据 ===
const shopCatalog = computed(() => _.get(data.value, '道具商店.商品目录', {}));
const items = computed(() => _.get(data.value, '道具商店.物品栏', {}));

/** 购买商品 */
function buyItem(name: string, item: any) {
  if (dp.value < item.价格_DP) return;
  _.set(data.value, '资源面板.欲望点数_DP', dp.value - item.价格_DP);
  const existing = _.get(data.value, `道具商店.物品栏.${name}`);
  if (existing) {
    _.set(data.value, `道具商店.物品栏.${name}.数量`, (existing.数量 || 0) + 1);
  } else {
    _.set(data.value, `道具商店.物品栏.${name}`, { 数量: 1, 作用: item.描述 });
  }
  const catalog = _.get(data.value, '道具商店.商品目录', {});
  delete catalog[name];
}

// 蓝条百分比
const mpPercent = computed(() => Math.min(100, (mp.value / mpMax.value) * 100));

/** 施展技能 - 检查蓝条是否足够 */
function castSkill(name: string, skill: any) {
  const mpCost = skill.蓝条消耗 || 10;
  if (mp.value < mpCost) {
    toastr.error(`蓝条不足！需要 ${mpCost} MP，当前只有 ${mp.value} MP`);
    return;
  }
  // 扣除蓝条
  _.set(data.value, '资源面板.蓝条', mp.value - mpCost);
  // 填入输入框让AI描述技能效果
  fillInput('施展', name);
}

/** 填入输入框 */
function fillInput(action: string, name: string) {
  const text = `${action}${stripGradePrefix(name)} `;
  // 通过父窗口的 jQuery 操作 SillyTavern 输入框
  try {
    const $parent = window.parent?.$ || window.$;
    if ($parent) {
      const $textarea = $parent('#send_textarea');
      if ($textarea.length) {
        const currentVal = $textarea.val() || '';
        $textarea.val(currentVal + text);
        $textarea.trigger('input');
        return;
      }
    }
  } catch (e) {
    console.log('[调试] 跨域访问受限:', e);
  }
  console.log('[调试] 未找到输入框，文本:', text);
}

/** 解锁技能 - 优先使用技能对象中的值，缺失时根据技能名前缀推断 */
function unlockSkill(name: string, skill: any) {
  if (sp.value < skill.消耗_SP) return;
  _.set(data.value, '资源面板.技能点_SP', sp.value - skill.消耗_SP);

  // 优先使用技能对象中的等级和蓝条消耗，缺失时根据前缀推断
  const { grade, mpCost } = getSkillGradeAndCost(name, skill);

  _.set(data.value, `技能树.已解锁技能.${name}`, {
    等级: grade,
    描述: skill.描述,
    蓝条消耗: mpCost,
  });
  const unlockable = _.get(data.value, '技能树.可解锁技能', {});
  delete unlockable[name];
}

// === 人物页数据 ===
const npcs = computed(() => _.get(data.value, 'NPC状态', {}));

// 世界时间
const worldYear = computed(() => _.get(data.value, '世界时间.年', 1));
const worldMonth = computed(() => _.get(data.value, '世界时间.月', 1));
const worldDay = computed(() => _.get(data.value, '世界时间.日', 1));
const worldHour = computed(() => _.get(data.value, '世界时间.时', 6));
const worldMinute = computed(() => _.get(data.value, '世界时间.分', 0));
const timeString = computed(() => {
  const h = String(worldHour.value).padStart(2, '0');
  const m = String(worldMinute.value).padStart(2, '0');
  return `${h}:${m}`;
});

// 世界定位
const currentCity = computed(() => _.get(data.value, '世界定位.当前城邦', '未知'));
const currentLocation = computed(() => _.get(data.value, '世界定位.当前位置', '未知'));
const currentScene = computed(() => _.get(data.value, '世界定位.当前场景', '未知'));
const currentEvent = computed(() => _.get(data.value, '世界定位.当前事件', '无'));

// 在场/离场人物列表（直接从 NPC状态 读取在场字段）
const presentNpcNames = computed(() => {
  const npcStatus = npcs.value;
  return Object.keys(npcStatus).filter(name => {
    return npcStatus[name]?.在场 === true;
  });
});
const absentNpcNames = computed(() => {
  const npcStatus = npcs.value;
  return Object.keys(npcStatus).filter(name => {
    return npcStatus[name]?.在场 === false;
  });
});

/** 设置NPC在场状态 */
function setNpcPresence(name: string, isPresent: boolean) {
  const npc = npcs.value[name];
  if (!npc) return;
  _.set(data.value, `NPC状态.${name}.在场`, isPresent);
  if (isPresent) {
    _.set(data.value, `NPC状态.${name}.备注`, '');
  }
}

// === 回收站数据 ===
const deletedTasks = computed(() => _.get(data.value, '回收站.已删除任务', {}));
const deletedItems = computed(() => _.get(data.value, '回收站.已删除物品', {}));
const deletedSkills = computed(() => _.get(data.value, '回收站.已删除技能', {}));
const deletedNPCs = computed(() => _.get(data.value, '回收站.已删除NPC', {}));
const deletedCatalog = computed(() => _.get(data.value, '回收站.已删除商品', {}));
const deletedUnlockable = computed(() => _.get(data.value, '回收站.已删除可解锁技能', {}));

// 回收站计数
const recycleBinCount = computed(() => {
  return (
    Object.keys(deletedTasks.value).length +
    Object.keys(deletedItems.value).length +
    Object.keys(deletedSkills.value).length +
    Object.keys(deletedNPCs.value).length +
    Object.keys(deletedCatalog.value).length +
    Object.keys(deletedUnlockable.value).length
  );
});

/** 软删除：移到回收站 */
function softDelete(category: RecycleCategory, name: string) {
  const paths = recyclePaths[category];
  const source = _.get(data.value, paths.source, {});
  const item = source[name];
  if (!item) return;
  // 复制到回收站（直接操作对象，避免_.set解析问题）
  const target = _.get(data.value, paths.target, {});
  target[name] = JSON.parse(JSON.stringify(item));
  // 从源删除
  delete source[name];
}

/** 恢复：从回收站移回原位 */
function restoreItem(category: RecycleCategory, name: string) {
  const paths = recyclePaths[category];
  const recycleBin = _.get(data.value, paths.target, {});
  const item = recycleBin[name];
  if (!item) return;
  // 复制回原位（直接操作对象，避免_.set解析问题）
  const source = _.get(data.value, paths.source, {});
  source[name] = JSON.parse(JSON.stringify(item));
  // 从回收站删除
  delete recycleBin[name];
}

/** 永久删除 */
function permanentDelete(category: RecycleCategory, name: string) {
  const paths = recyclePaths[category];
  const recycleBin = _.get(data.value, paths.target, {});
  delete recycleBin[name];
}

// === 调试功能 ===
// 经验上限公式
const getExpMax = (lv: number) => Math.floor(100 * Math.pow(1.2, lv - 1) + 50 * (lv - 1));

function debugAddExp() {
  let lv = level.value;
  let exp = currentExp.value + 1000;
  let pts = attributePoints.value;

  // 自动升级循环
  while (exp >= getExpMax(lv)) {
    exp -= getExpMax(lv);
    lv += 1;
    pts += 1;
  }

  _.set(data.value, '角色成长.等级', lv);
  _.set(data.value, '角色成长.当前经验', exp);
  _.set(data.value, '角色成长.属性点', pts);
}

function debugAddAttrPoints() {
  const current = attributePoints.value;
  _.set(data.value, '角色成长.属性点', current + 5);
}

function debugAddDP() {
  const current = dp.value;
  _.set(data.value, '资源面板.欲望点数_DP', current + 100);
}

function debugAddSP() {
  const current = sp.value;
  _.set(data.value, '资源面板.技能点_SP', current + 10);
}

function debugAddMP() {
  const current = mp.value;
  const max = mpMax.value;
  _.set(data.value, '资源面板.蓝条', Math.min(current + 20, max));
}

function debugRestoreMP() {
  _.set(data.value, '资源面板.蓝条', mpMax.value);
}

function debugAddHunger() {
  const current = hunger.value;
  _.set(data.value, '身体状态.饥饿度', Math.min(current + 20, 100));
}

function debugResetHunger() {
  _.set(data.value, '身体状态.饥饿度', 0);
}

function debugAddTasks() {
  const grades = ['D', 'C', 'B', 'A', 'S'];
  const tasks = _.get(data.value, '任务列表', {});
  for (let i = 0; i < 3; i++) {
    const grade = grades[Math.floor(Math.random() * grades.length)];
    const gradeIndex = grades.indexOf(grade) + 1;
    const name = `${grade}级_调试任务_${Date.now()}_${i}`;
    tasks[name] = {
      任务等级: grade,
      任务描述: `这是一个${grade}级调试任务，用于测试界面显示效果。`,
      任务状态: '待接取',
      奖励_DP: Math.floor(Math.random() * 50 + 10) * gradeIndex,
      奖励_SP: Math.floor(Math.random() * 5 + 1) * gradeIndex,
      奖励_EXP: Math.floor(Math.random() * 100 + 50) * gradeIndex,
      失败后果: ['声望下降', '失去关键情报', '被敌人发现行踪', '任务委托人不满'][Math.floor(Math.random() * 4)],
    };
  }
}

function debugCompleteTask() {
  const tasks = _.get(data.value, '任务列表', {});
  const activeTaskNames = Object.keys(tasks).filter(name => tasks[name].任务状态 === '进行中');
  if (activeTaskNames.length === 0) {
    // 如果没有进行中的任务，先创建一个
    const name = `S级_调试完成任务_${Date.now()}`;
    tasks[name] = {
      任务等级: 'S',
      任务描述: '这是一个调试任务，已设置为完成待领取状态。',
      任务状态: '已完成',
      奖励_DP: 100,
      奖励_SP: 10,
      奖励_EXP: 200,
      失败后果: '无严重后果',
    };
  } else {
    // 将第一个进行中的任务设为已完成
    const taskName = activeTaskNames[0];
    tasks[taskName].任务状态 = '已完成';
  }
}

function debugAddNPCs() {
  const npcs = _.get(data.value, 'NPC状态', {});
  const names = ['调试村民甲', '调试商人乙', '调试贵族丙'];
  names.forEach((name, i) => {
    npcs[name] = {
      怀疑度: Math.floor(Math.random() * 50),
      成瘾度: Math.floor(Math.random() * 30),
      当前态度: ['友好', '中立', '警惕'][i % 3],
    };
  });
}

function debugAddShop() {
  const catalog = _.get(data.value, '道具商店.商品目录', {});
  const items = ['调试药水', '调试卷轴', '调试神器'];
  items.forEach((name, i) => {
    catalog[name] = {
      描述: `这是一个调试${name}，用于测试商店功能。`,
      价格_DP: (i + 1) * 30,
    };
  });
}

function debugAddSkills() {
  const unlockable = _.get(data.value, '技能树.可解锁技能', {});
  const skills = _.get(data.value, '技能树.已解锁技能', {});
  const skillData = [
    { name: 'D级_调试火焰术', grade: 'D', cost: 10, sp: 5 },
    { name: 'C级_调试冰霜术', grade: 'C', cost: 20, sp: 10 },
    { name: 'A级_调试雷电术', grade: 'A', cost: 50, sp: 25 },
  ];
  skillData.forEach(({ name, grade, cost, sp }) => {
    unlockable[name] = {
      描述: `这是一个${grade}级调试技能：${name}，用于测试技能解锁功能。`,
      消耗_SP: sp,
      等级: grade,
      蓝条消耗: cost,
    };
  });
  // 也添加一个已解锁技能用于测试
  skills['S级_调试暗影术'] = {
    描述: '这是一个S级调试技能，用于测试技能施展。',
    等级: 'S',
    蓝条消耗: 80,
  };
}
</script>

<style lang="scss" scoped>
.succubus-card {
  width: 100%;
  background: linear-gradient(145deg, #1a0b16 0%, #2a081a 100%);
  border: 1px solid #8e1b4b;
  border-radius: 8px;
  box-shadow:
    0 0 15px rgba(220, 20, 60, 0.3),
    inset 0 0 20px rgba(142, 27, 75, 0.4);
  color: #f8bbd0;
  font-family: 'Microsoft YaHei', sans-serif;
  padding: 12px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.collapse-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  user-select: none;
}

.collapse-title {
  color: #ff4081;
  font-size: 1.1em;
  font-weight: bold;
  text-shadow: 0 0 8px #f50057;
  letter-spacing: 2px;
}

.collapse-btn {
  background: linear-gradient(145deg, #d81b60, #880e4f);
  border: 1px solid #ff4081;
  border-radius: 4px;
  color: #ffffff;
  font-size: 0.75em;
  padding: 4px 10px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(145deg, #ff4081, #d81b60);
    box-shadow: 0 0 10px rgba(255, 64, 129, 0.5);
  }
}

.collapsible-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 分页导航 */
.tab-nav {
  display: flex;
  border-bottom: 2px solid #880e4f;
  gap: 2px;
}

.tab-btn {
  flex: 1;
  padding: 6px 0;
  border: none;
  border-radius: 4px 4px 0 0;
  background: rgba(0, 0, 0, 0.4);
  color: #ce93d8;
  font-size: 0.8em;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.25s ease;
  letter-spacing: 1px;
  position: relative;

  &:hover {
    background: rgba(216, 27, 96, 0.3);
    color: #ff80ab;
  }

  &.active {
    background: rgba(216, 27, 96, 0.5);
    color: #ff4081;
    text-shadow: 0 0 6px rgba(255, 64, 129, 0.6);
    border-bottom: 2px solid #ff4081;
    margin-bottom: -2px;
  }
}

.tab-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ff4081;
  color: #fff;
  font-size: 0.65em;
  font-weight: bold;
  min-width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  opacity: 1;
  z-index: 10;
}

.tab-badge.reward-badge {
  right: 13px;
  background: #ffc107;
  color: #333;
}

.tab-pane {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 区块样式 */
.section-box {
  background: rgba(0, 0, 0, 0.5);
  border-left: 3px solid #d81b60;
  border-radius: 4px;
  padding: 8px;
}

.section-title {
  color: #ff80ab;
  font-size: 0.9em;
  font-weight: bold;
  margin-bottom: 6px;
  text-shadow: 0 0 4px rgba(255, 128, 171, 0.5);
}

.resource-bar,
.resource-standalone {
  margin-bottom: 8px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 4px;
  border-left: 3px solid #d81b60;
}

.resource-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.resource-label {
  color: #ce93d8;
  font-size: 0.8em;
  min-width: 130px;
}

.resource-value {
  color: #ffffff;
  text-shadow: 0 0 3px #ff4081;
  font-size: 0.8em;
  font-weight: 500;
}

.data-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8em;
  margin-bottom: 4px;
  line-height: 1.4;
}

.data-label {
  color: #ce93d8;
}

.data-value {
  color: #ffffff;
  text-shadow: 0 0 3px #ff4081;
}

/* 等级和经验条样式 */
.level-display {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.level-badge {
  background: linear-gradient(135deg, #d81b60, #880e4f);
  color: #fff;
  font-size: 0.8em;
  font-weight: bold;
  padding: 3px 10px;
  border-radius: 10px;
  text-shadow: 0 0 6px rgba(255, 64, 129, 0.8);
  white-space: nowrap;
}

.attr-points-badge {
  float: right;
  font-size: 0.7em;
  color: #ffd54f;
  font-weight: normal;
}

.exp-bar-container {
  flex: 1;
  height: 16px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(216, 27, 96, 0.5);
}

.exp-bar {
  height: 100%;
  background: linear-gradient(90deg, #880e4f, #d81b60, #ff4081);
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(255, 64, 129, 0.6);
}

.exp-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.7em;
  color: #fff;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
  white-space: nowrap;
}

.attr-points-hint {
  color: #ffd54f;
  font-size: 0.8em;
  text-align: center;
  padding: 4px;
  background: rgba(255, 213, 79, 0.1);
  border-radius: 4px;
  animation: pulse-glow 2s infinite;
}

/* DND属性样式 */
.dnd-attributes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.attr-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.3);
  padding: 4px 8px;
  border-radius: 4px;
  border-left: 2px solid #d81b60;
}

.attr-label {
  color: #ce93d8;
  font-size: 0.8em;
  min-width: 70px;
}

.attr-value-container {
  display: flex;
  align-items: center;
  gap: 4px;
}

.attr-value {
  color: #fff;
  font-size: 0.9em;
  font-weight: bold;
  min-width: 20px;
  text-align: center;
}

.attr-plus-btn {
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  border: none;
  color: #fff;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  font-size: 0.8em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
  }

  &:active {
    transform: scale(0.95);
  }
}

/* 任务页样式 */
.current-task {
  border-left-color: #ff4081;
  box-shadow: 0 0 8px rgba(255, 64, 129, 0.2);
}

@keyframes pulse-glow {
  0%, 100% { text-shadow: 0 0 3px #ff4081; }
  50% { text-shadow: 0 0 10px #ff4081, 0 0 20px rgba(255, 64, 129, 0.4); }
}

.task-desc-text {
  color: #f48fb1;
  font-size: 0.8em;
  margin: 4px 0;
  padding: 4px 8px;
  border-left: 2px solid #d81b60;
  background: rgba(216, 27, 96, 0.1);
  border-radius: 2px;
}

.task-card {
  background: rgba(216, 27, 96, 0.08);
  border: 1px solid rgba(216, 27, 96, 0.25);
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 6px;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(216, 27, 96, 0.5);
    background: rgba(216, 27, 96, 0.15);
  }

  &.inactive {
    opacity: 0.6;

    &:hover {
      opacity: 0.8;
    }
  }
}

.task-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  gap: 6px;
}

.debug-complete-btn {
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  border: 1px solid #81c784;
  border-radius: 4px;
  color: #fff;
  font-size: 0.7em;
  padding: 2px 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: auto;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
  }

  &:active {
    transform: scale(0.95);
  }
}

.task-level {
  color: #ff80ab;
  font-weight: bold;
  font-size: 0.8em;
}

.task-status-tag {
  font-size: 0.7em;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: bold;

  &.status-pending {
    background: rgba(255, 152, 0, 0.3);
    color: #ffb74d;
  }
  &.status-active {
    background: rgba(255, 64, 129, 0.3);
    color: #ff4081;
    animation: pulse-glow 1.5s ease-in-out infinite;
  }
  &.status-done {
    background: rgba(76, 175, 80, 0.3);
    color: #81c784;
  }
  &.status-failed {
    background: rgba(244, 67, 54, 0.3);
    color: #ef9a9a;
  }
  &.status-ignored {
    background: rgba(158, 158, 158, 0.3);
    color: #9e9e9e;
  }
}

.task-card-reward {
  display: flex;
  gap: 12px;
  font-size: 0.75em;
  color: #81c784;
  margin-bottom: 4px;
}

.task-card-penalty {
  display: flex;
  gap: 12px;
  font-size: 0.75em;
  color: #ef9a9a;
  margin-bottom: 6px;
}

.task-buttons {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.task-btn {
  border-radius: 4px;
  font-size: 0.7em;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 4px 8px;
  border: 1px solid;

  &:active {
    transform: scale(0.98);
  }
}

.accept-btn {
  flex: 2;
  background: linear-gradient(145deg, #d81b60, #880e4f);
  border-color: #ff4081;
  color: #ffffff;
  text-shadow: 0 0 4px rgba(255, 64, 129, 0.5);

  &:hover {
    background: linear-gradient(145deg, #ff4081, #d81b60);
    box-shadow: 0 0 10px rgba(255, 64, 129, 0.5);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.giveup-btn {
  flex: 2;
  background: linear-gradient(145deg, #5c1818, #3d0f0f);
  border-color: #8b0000;
  color: #ff9999;

  &:hover {
    background: linear-gradient(145deg, #8b0000, #5c1818);
    box-shadow: 0 0 8px rgba(139, 0, 0, 0.5);
  }
}

.ignore-btn {
  flex: 1;
  background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
  border-color: #555;
  color: #9e9e9e;

  &:hover {
    background: linear-gradient(145deg, #3a3a3a, #2a2a2a);
  }
}

.restore-btn {
  flex: 1;
  background: linear-gradient(145deg, #1a3a2a, #0f2a1a);
  border-color: #4caf50;
  color: #81c784;

  &:hover {
    background: linear-gradient(145deg, #2e5a3e, #1a3a2a);
    box-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
  }
}

.delete-btn {
  flex: 1;
  background: linear-gradient(145deg, #3a1a1a, #2a0f0f);
  border-color: #8b0000;
  color: #ef9a9a;

  &:hover {
    background: linear-gradient(145deg, #5c1818, #3a1a1a);
    box-shadow: 0 0 8px rgba(139, 0, 0, 0.5);
  }
}

/* 物品/技能行样式 */
.item-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.8em;
  color: #e1bee7;
  margin-left: 8px;
  line-height: 1.4;
  border-bottom: 1px dashed rgba(136, 14, 79, 0.3);
  padding-bottom: 4px;
  margin-bottom: 4px;
}

.item-info {
  flex: 1;
}

.item-name {
  font-weight: 500;
}

.item-buttons {
  display: flex;
  gap: 4px;
}

/* 技能行样式 */
.skill-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.8em;
  color: #e1bee7;
  margin-left: 8px;
  line-height: 1.4;
  border-bottom: 1px dashed rgba(136, 14, 79, 0.3);
  padding-bottom: 4px;
  margin-bottom: 4px;
}

.skill-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.item-buttons {
  display: flex;
  gap: 4px;
}

.item-delete-btn {
  flex: none;
  font-size: 0.7em;
  padding: 2px 6px;
}

.use-btn {
  flex: none;
  font-size: 0.7em;
  padding: 2px 8px;
  background: linear-gradient(145deg, #1a3a2a, #0f2a1a);
  border-color: #4caf50;
  color: #81c784;

  &:hover {
    background: linear-gradient(145deg, #2e5a3e, #1a3a2a);
    box-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
  }

  &:disabled {
    background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
    border-color: #555;
    color: #666;
    cursor: not-allowed;
    box-shadow: none;
  }
}

/* NPC删除行 */
.npc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.npc-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}

.npc-card {
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px dashed rgba(136, 14, 79, 0.3);

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }
}

.npc-name {
  color: #f48fb1;
  font-size: 0.8em;
  margin-top: 4px;
  margin-bottom: 2px;
}

.npc-delete-btn {
  font-size: 0.65em;
  padding: 2px 6px;
  flex: none;
}

/* 在场/离场人物卡片 */
.npc-card.present {
  border-left: 3px solid #4caf50;
  background: rgba(76, 175, 80, 0.08);
}

.npc-card.absent {
  border-left: 3px solid #78909c;
  opacity: 0.7;
}

.presence-tag {
  font-size: 0.65em;
  padding: 2px 6px;
  border-radius: 3px;
  margin-left: 8px;

  &.present {
    background: rgba(76, 175, 80, 0.3);
    color: #a5d6a7;
    border: 1px solid #4caf50;
  }

  &.absent {
    background: rgba(120, 144, 156, 0.3);
    color: #b0bec5;
    border: 1px solid #78909c;
  }
}

.presence-btn {
  font-size: 0.65em;
  padding: 2px 8px;
  margin-left: 8px;

  &.leave-btn {
    background: linear-gradient(135deg, #ef5350, #c62828);
    border-color: #ef5350;

    &:hover {
      box-shadow: 0 0 8px rgba(239, 83, 80, 0.5);
    }
  }

  &.arrive-btn {
    background: linear-gradient(135deg, #4caf50, #2e7d32);
    border-color: #4caf50;

    &:hover {
      box-shadow: 0 0 8px rgba(76, 175, 80, 0.5);
    }
  }
}

/* 技能描述 */
.skill-desc {
  color: #ab47bc;
  font-size: 0.9em;
  margin-left: 0;
}

.skill-cost {
  color: #64b5f6;
  font-size: 0.8em;
}

/* 技能等级徽章 */
.skill-grade-badge {
  display: inline-block;
  min-width: 18px;
  height: 18px;
  border-radius: 3px;
  font-size: 0.7em;
  font-weight: bold;
  text-align: center;
  line-height: 18px;
  margin-right: 4px;

  &.grade-d {
    background: linear-gradient(135deg, #616161, #424242);
    color: #e0e0e0;
    border: 1px solid #757575;
  }
  &.grade-c {
    background: linear-gradient(135deg, #4caf50, #2e7d32);
    color: #fff;
    border: 1px solid #81c784;
  }
  &.grade-b {
    background: linear-gradient(135deg, #2196f3, #1565c0);
    color: #fff;
    border: 1px solid #64b5f6;
  }
  &.grade-a {
    background: linear-gradient(135deg, #9c27b0, #6a1b9a);
    color: #fff;
    border: 1px solid #ba68c8;
  }
  &.grade-s {
    background: linear-gradient(135deg, #ff9800, #e65100);
    color: #fff;
    border: 1px solid #ffb74d;
    box-shadow: 0 0 6px rgba(255, 152, 0, 0.5);
  }
}

/* 蓝条样式 */
.mp-bar-wrapper {
  flex: 1;
  height: 16px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(33, 150, 243, 0.5);
}

.mp-bar {
  height: 100%;
  background: linear-gradient(90deg, #1565c0, #2196f3, #64b5f6);
  transition: width 0.3s ease;
  box-shadow: 0 0 8px rgba(33, 150, 243, 0.5);
}

.mp-text {
  position: absolute;
  top: 50%;
  left: 8px;
  transform: translateY(-50%);
  font-size: 0.7em;
  color: #fff;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
  white-space: nowrap;
}

.skill-unlock-info {
  margin-bottom: 6px;
}

.skill-cost-preview {
  color: #64b5f6;
  font-size: 0.75em;
}

.list-item {
  font-size: 0.8em;
  color: #e1bee7;
  margin-left: 8px;
  line-height: 1.4;
  border-bottom: 1px dashed rgba(136, 14, 79, 0.3);
  padding-bottom: 2px;
  margin-bottom: 2px;
}

/* 调试面板 */
.debug-panel {
  border: 1px dashed rgba(255, 213, 79, 0.5);
  background: rgba(255, 193, 7, 0.05);
}

.debug-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.debug-btn {
  background: linear-gradient(145deg, #3a3a3a, #2a2a2a);
  border: 1px solid #555;
  border-radius: 4px;
  color: #ffd54f;
  font-size: 0.7em;
  padding: 4px 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(145deg, #4a4a4a, #3a3a3a);
    border-color: #ffd54f;
    box-shadow: 0 0 8px rgba(255, 213, 79, 0.3);
  }

  &:active {
    transform: scale(0.95);
  }
}
</style>
