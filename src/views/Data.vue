<template>
  <div class="data-view">
    <!-- 基本信息卡片 -->
    <div v-if="playerInfo" class="player-info-card">
      <div class="player-header">
        <el-avatar 
          :src="`/imgs/avatar/${querySteamId}.png`" 
          :alt="playerInfo.nickname" 
          :size="80"
          @error="handleImageError"
        />
        <div class="player-details">
          <h2>{{ playerInfo.nickname }}</h2>
          <p class="steam-id">Steam ID: {{ querySteamId }}</p>
          <p class="last-update">更新于: {{ formatTimestamp(playerInfo.lastUpdate) }}</p>
          <router-link :to="`/history?steamId=${querySteamId}`" class="view-matches-btn">
            <el-button type="primary" size="small">查看比赛记录</el-button>
          </router-link>
        </div>
      </div>
    </div>

    <!-- 详细数据卡片 -->
    <div v-if="playerDetail" class="detail-card">
      <div class="detail-header">
        <h2>详细数据</h2>
      </div>

      <div class="detail-sections">
        <!-- 基本信息 -->
        <el-card class="detail-section">
          <template #header>
            <div class="card-header">
              <span>基本信息</span>
            </div>
          </template>
          <div class="stat-grid">
            <div class="stat-item">
              <span class="label">天梯分</span>
              <div class="inline-value">
                <RankBadge :pvpScore="playerDetail.pvpScore" :pvpStars="playerDetail.pvpStars" :season="playerDetail.seasonId" />
                <span class="val">{{ playerDetail.pvpScore }}</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">比赛场次</span>
              <div class="inline-value">
                <span class="val">{{ playerDetail.cnt }}</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">胜率</span>
              <div class="inline-value">
                <span class="val">{{ formatValue(playerDetail.winRate) }}</span>
              </div>
            </div>
          </div>
        </el-card>
        <!-- 基础评分 -->
        <el-card class="detail-section">
          <template #header>
            <div class="card-header">
              <span>基础评分</span>
            </div>
          </template>
          <div class="stat-grid">
            <div class="stat-item">
              <span class="label">Rating</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.baseRating.pwRating.value > playerDetail.baseRating.pwRating.avgValue }">
                <span class="val">{{ playerDetail.baseRating.pwRating.value.toFixed(2) }}</span>
                <span class="avg">/ {{ playerDetail.baseRating.pwRating.avgValue.toFixed(2) }}</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">RWS</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.baseRating.rws.value > playerDetail.baseRating.rws.avgValue }">
                <span class="val">{{ playerDetail.baseRating.rws.value.toFixed(2) }}</span>
                <span class="avg">/ {{ playerDetail.baseRating.rws.avgValue.toFixed(2) }}</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">T方平均Rating</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.baseRating.pwRatingTAvg.value > playerDetail.baseRating.pwRatingTAvg.avgValue }">
                <span class="val">{{ playerDetail.baseRating.pwRatingTAvg.value.toFixed(2) }}</span>
                <span class="avg">/ {{ playerDetail.baseRating.pwRatingTAvg.avgValue.toFixed(2) }}</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">CT方平均Rating</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.baseRating.pwRatingCtAvg.value > playerDetail.baseRating.pwRatingCtAvg.avgValue }">
                <span class="val">{{ playerDetail.baseRating.pwRatingCtAvg.value.toFixed(2) }}</span>
                <span class="avg">/ {{ playerDetail.baseRating.pwRatingCtAvg.avgValue.toFixed(2) }}</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">每回合KAST</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.baseRating.kastPerRound.value > playerDetail.baseRating.kastPerRound.avgValue }">
                <span class="val">{{ (playerDetail.baseRating.kastPerRound.value * 100).toFixed(1) }}%</span>
                <span class="avg">/ {{ (playerDetail.baseRating.kastPerRound.avgValue * 100).toFixed(1) }}%</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 火力 -->
        <el-card class="detail-section">
          <template #header>
            <div class="card-header">
              <span>火力</span>
              <el-progress :percentage="playerDetail.firePower.score" show-text style="width: 150px" :color="getScoreColor(playerDetail.firePower.score)" :format="(percentage) => `${percentage.toFixed(0)}`" />
            </div>
          </template>
          <div class="stat-grid">
            <div class="stat-item">
              <span class="label">场均击杀</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.firePower.killsPerRound.value > playerDetail.firePower.killsPerRound.avgValue }">
                <span class="val">{{ playerDetail.firePower.killsPerRound.value.toFixed(2) }}</span>
                <span class="avg">/ {{ playerDetail.firePower.killsPerRound.avgValue.toFixed(2) }}</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">胜局场均击杀</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.firePower.killsPerWinRound.value > playerDetail.firePower.killsPerWinRound.avgValue }">
                <span class="val">{{ playerDetail.firePower.killsPerWinRound.value.toFixed(2) }}</span>
                <span class="avg">/ {{ playerDetail.firePower.killsPerWinRound.avgValue.toFixed(2) }}</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">场均伤害</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.firePower.damagePerRound.value > playerDetail.firePower.damagePerRound.avgValue }">
                <span class="val">{{ playerDetail.firePower.damagePerRound.value.toFixed(2) }}</span>
                <span class="avg">/ {{ playerDetail.firePower.damagePerRound.avgValue.toFixed(2) }}</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">胜局场均伤害</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.firePower.damagePerRoundWin.value > playerDetail.firePower.damagePerRoundWin.avgValue }">
                <span class="val">{{ playerDetail.firePower.damagePerRoundWin.value.toFixed(2) }}</span>
                <span class="avg">/ {{ playerDetail.firePower.damagePerRoundWin.avgValue.toFixed(2) }}</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">有击杀回合占比</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.firePower.roundsWithAKill.value > playerDetail.firePower.roundsWithAKill.avgValue }">
                <span class="val">{{ (playerDetail.firePower.roundsWithAKill.value * 100).toFixed(1) }}%</span>
                <span class="avg">/ {{ (playerDetail.firePower.roundsWithAKill.avgValue * 100).toFixed(1) }}%</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">多杀回合占比</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.firePower.multiKillRoundsPercentage.value > playerDetail.firePower.multiKillRoundsPercentage.avgValue }">
                <span class="val">{{ (playerDetail.firePower.multiKillRoundsPercentage.value * 100).toFixed(1) }}%</span>
                <span class="avg">/ {{ (playerDetail.firePower.multiKillRoundsPercentage.avgValue * 100).toFixed(1) }}%</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">WE</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.firePower.we.value > playerDetail.firePower.we.avgValue }">
                <span class="val">{{ playerDetail.firePower.we.value.toFixed(2) }}</span>
                <span class="avg">/ {{ playerDetail.firePower.we.avgValue.toFixed(2) }}</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">手枪局WE</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.firePower.pistolRoundRating.value > playerDetail.firePower.pistolRoundRating.avgValue }">
                <span class="val">{{ playerDetail.firePower.pistolRoundRating.value.toFixed(2) }}</span>
                <span class="avg">/ {{ playerDetail.firePower.pistolRoundRating.avgValue.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 枪法 -->
        <el-card class="detail-section">
          <template #header>
            <div class="card-header">
              <span>枪法</span>
              <el-progress :percentage="playerDetail.marksmanship.score" show-text style="width: 150px" :color="getScoreColor(playerDetail.marksmanship.score)" :format="(percentage) => `${percentage.toFixed(0)}`" />
            </div>
          </template>
          <div class="stat-grid">
            <div class="stat-item">
              <span class="label">爆头率</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.marksmanship.headshotRate.value > playerDetail.marksmanship.headshotRate.avgValue }">
                <span class="val">{{ (playerDetail.marksmanship.headshotRate.value * 100).toFixed(1) }}%</span>
                <span class="avg">/ {{ (playerDetail.marksmanship.headshotRate.avgValue * 100).toFixed(1) }}%</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">副武器命中率</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.marksmanship.smHitRate.value > playerDetail.marksmanship.smHitRate.avgValue }">
                <span class="val">{{ (playerDetail.marksmanship.smHitRate.value * 100).toFixed(1) }}%</span>
                <span class="avg">/ {{ (playerDetail.marksmanship.smHitRate.avgValue * 100).toFixed(1) }}%</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">反应时间</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.marksmanship.reactionTime.value < playerDetail.marksmanship.reactionTime.avgValue }">
                <span class="val">{{ playerDetail.marksmanship.reactionTime.value.toFixed(0) }}ms</span>
                <span class="avg">/ {{ playerDetail.marksmanship.reactionTime.avgValue.toFixed(0) }}ms</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">快速停枪率</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.marksmanship.rapidStopRate.value > playerDetail.marksmanship.rapidStopRate.avgValue }">
                <span class="val">{{ (playerDetail.marksmanship.rapidStopRate.value * 100).toFixed(1) }}%</span>
                <span class="avg">/ {{ (playerDetail.marksmanship.rapidStopRate.avgValue * 100).toFixed(1) }}%</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">平均击杀时间</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.marksmanship.killTime.value < playerDetail.marksmanship.killTime.avgValue }">
                <span class="val">{{ playerDetail.marksmanship.killTime.value.toFixed(0) }}ms</span>
                <span class="avg">/ {{ playerDetail.marksmanship.killTime.avgValue.toFixed(0) }}ms</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 突破 -->
        <el-card class="detail-section">
          <template #header>
            <div class="card-header">
              <span>突破</span>
              <el-progress :percentage="playerDetail.firstBlood.score" show-text style="width: 150px" :color="getScoreColor(playerDetail.firstBlood.score)" :format="(percentage) => `${percentage.toFixed(0)}`" />
            </div>
          </template>
          <div class="stat-grid">
            <div class="stat-item">
              <span class="label">首杀数</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.firstBlood.firstKill.value > playerDetail.firstBlood.firstKill.avgValue }">
                <span class="val">{{ playerDetail.firstBlood.firstKill.value.toFixed(1) }}</span>
                <span class="avg">/ {{ playerDetail.firstBlood.firstKill.avgValue.toFixed(1) }}</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">首杀率</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.firstBlood.firstRate.value > playerDetail.firstBlood.firstRate.avgValue }">
                <span class="val">{{ (playerDetail.firstBlood.firstRate.value * 100).toFixed(1) }}%</span>
                <span class="avg">/ {{ (playerDetail.firstBlood.firstRate.avgValue * 100).toFixed(1) }}%</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">首杀成功率</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.firstBlood.firstSuccessRate.value > playerDetail.firstBlood.firstSuccessRate.avgValue }">
                <span class="val">{{ (playerDetail.firstBlood.firstSuccessRate.value * 100).toFixed(1) }}%</span>
                <span class="avg">/ {{ (playerDetail.firstBlood.firstSuccessRate.avgValue * 100).toFixed(1) }}%</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">场均首伤</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.firstBlood.firstHurt.value > playerDetail.firstBlood.firstHurt.avgValue }">
                <span class="val">{{ playerDetail.firstBlood.firstHurt.value.toFixed(1) }}</span>
                <span class="avg">/ {{ playerDetail.firstBlood.firstHurt.avgValue.toFixed(1) }}</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">首杀后胜率</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.firstBlood.winAfterOpeningKill.value > playerDetail.firstBlood.winAfterOpeningKill.avgValue }">
                <span class="val">{{ (playerDetail.firstBlood.winAfterOpeningKill.value * 100).toFixed(1) }}%</span>
                <span class="avg">/ {{ (playerDetail.firstBlood.winAfterOpeningKill.avgValue * 100).toFixed(1) }}%</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 残局 -->
        <el-card class="detail-section">
          <template #header>
            <div class="card-header">
              <span>残局</span>
              <el-progress :percentage="playerDetail.clutch.score" show-text style="width: 150px" :color="getScoreColor(playerDetail.clutch.score)" :format="(percentage) => `${percentage.toFixed(0)}`" />
            </div>
          </template>
          <div class="stat-grid">
            <div class="stat-item">
              <span class="label">1v1胜率</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.clutch.v1WinPercentage.value > playerDetail.clutch.v1WinPercentage.avgValue }">
                <span class="val">{{ (playerDetail.clutch.v1WinPercentage.value * 100).toFixed(1) }}%</span>
                <span class="avg">/ {{ (playerDetail.clutch.v1WinPercentage.avgValue * 100).toFixed(1) }}%</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">最后活着占比</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.clutch.lastAlivePercentage.value > playerDetail.clutch.lastAlivePercentage.avgValue }">
                <span class="val">{{ (playerDetail.clutch.lastAlivePercentage.value * 100).toFixed(1) }}%</span>
                <span class="avg">/ {{ (playerDetail.clutch.lastAlivePercentage.avgValue * 100).toFixed(1) }}%</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">每回合存活时间</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.clutch.timeAlivePerRound.value > playerDetail.clutch.timeAlivePerRound.avgValue }">
                <span class="val">{{ playerDetail.clutch.timeAlivePerRound.value.toFixed(2) }}s</span>
                <span class="avg">/ {{ playerDetail.clutch.timeAlivePerRound.avgValue.toFixed(2) }}s</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">每回合残局得分</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.clutch.clutchPointsPerRound.value > playerDetail.clutch.clutchPointsPerRound.avgValue }">
                <span class="val">{{ playerDetail.clutch.clutchPointsPerRound.value.toFixed(2) }}</span>
                <span class="avg">/ {{ playerDetail.clutch.clutchPointsPerRound.avgValue.toFixed(2) }}</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">失利回合拯救率</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.clutch.savesPerRoundLoss.value > playerDetail.clutch.savesPerRoundLoss.avgValue }">
                <span class="val">{{ playerDetail.clutch.savesPerRoundLoss.value.toFixed(2) }}</span>
                <span class="avg">/ {{ playerDetail.clutch.savesPerRoundLoss.avgValue.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 狙击 -->
        <el-card class="detail-section">
          <template #header>
            <div class="card-header">
              <span>狙击</span>
              <el-progress :percentage="playerDetail.sniper.score" show-text style="width: 150px" :color="getScoreColor(playerDetail.sniper.score)" :format="(percentage) => `${percentage.toFixed(0)}`" />
            </div>
          </template>
          <div class="stat-grid">
            <div class="stat-item">
              <span class="label">狙击首杀占比</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.sniper.sniperFirstKillPercentage.value > playerDetail.sniper.sniperFirstKillPercentage.avgValue }">
                <span class="val">{{ (playerDetail.sniper.sniperFirstKillPercentage.value * 100).toFixed(1) }}%</span>
                <span class="avg">/ {{ (playerDetail.sniper.sniperFirstKillPercentage.avgValue * 100).toFixed(1) }}%</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">狙击击杀占比</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.sniper.sniperKillsPercentage.value > playerDetail.sniper.sniperKillsPercentage.avgValue }">
                <span class="val">{{ (playerDetail.sniper.sniperKillsPercentage.value * 100).toFixed(1) }}%</span>
                <span class="avg">/ {{ (playerDetail.sniper.sniperKillsPercentage.avgValue * 100).toFixed(1) }}%</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">每回合狙击击杀</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.sniper.sniperKillPerRound.value > playerDetail.sniper.sniperKillPerRound.avgValue }">
                <span class="val">{{ playerDetail.sniper.sniperKillPerRound.value.toFixed(2) }}</span>
                <span class="avg">/ {{ playerDetail.sniper.sniperKillPerRound.avgValue.toFixed(2) }}</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">有狙击击杀回合占比</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.sniper.roundsWithSniperKillsPercentage.value > playerDetail.sniper.roundsWithSniperKillsPercentage.avgValue }">
                <span class="val">{{ (playerDetail.sniper.roundsWithSniperKillsPercentage.value * 100).toFixed(1) }}%</span>
                <span class="avg">/ {{ (playerDetail.sniper.roundsWithSniperKillsPercentage.avgValue * 100).toFixed(1) }}%</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">狙击多杀回合占比</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.sniper.sniperMultipleKillRoundPercentage.value > playerDetail.sniper.sniperMultipleKillRoundPercentage.avgValue }">
                <span class="val">{{ (playerDetail.sniper.sniperMultipleKillRoundPercentage.value * 100).toFixed(1) }}%</span>
                <span class="avg">/ {{ (playerDetail.sniper.sniperMultipleKillRoundPercentage.avgValue * 100).toFixed(1) }}%</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 补枪 -->
        <el-card class="detail-section">
          <template #header>
            <div class="card-header">
              <span>补枪</span>
              <el-progress :percentage="playerDetail.followUpShot.score" show-text style="width: 150px" :color="getScoreColor(playerDetail.followUpShot.score)" :format="(percentage) => `${percentage.toFixed(0)}`" />
            </div>
          </template>
          <div class="stat-grid">
            <div class="stat-item">
              <span class="label">每回合拯救队友</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.followUpShot.savedTeammatePerRound.value > playerDetail.followUpShot.savedTeammatePerRound.avgValue }">
                <span class="val">{{ playerDetail.followUpShot.savedTeammatePerRound.value.toFixed(2) }}</span>
                <span class="avg">/ {{ playerDetail.followUpShot.savedTeammatePerRound.avgValue.toFixed(2) }}</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">每回合补枪击杀</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.followUpShot.tradeKillsPerRound.value > playerDetail.followUpShot.tradeKillsPerRound.avgValue }">
                <span class="val">{{ playerDetail.followUpShot.tradeKillsPerRound.value.toFixed(2) }}</span>
                <span class="avg">/ {{ playerDetail.followUpShot.tradeKillsPerRound.avgValue.toFixed(2) }}</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">补枪击杀占比</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.followUpShot.tradeKillsPercentage.value > playerDetail.followUpShot.tradeKillsPercentage.avgValue }">
                <span class="val">{{ (playerDetail.followUpShot.tradeKillsPercentage.value * 100).toFixed(1) }}%</span>
                <span class="avg">/ {{ (playerDetail.followUpShot.tradeKillsPercentage.avgValue * 100).toFixed(1) }}%</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">助攻击杀占比</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.followUpShot.assistKillsPercentage.value > playerDetail.followUpShot.assistKillsPercentage.avgValue }">
                <span class="val">{{ (playerDetail.followUpShot.assistKillsPercentage.value * 100).toFixed(1) }}%</span>
                <span class="avg">/ {{ (playerDetail.followUpShot.assistKillsPercentage.avgValue * 100).toFixed(1) }}%</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">每次击杀伤害</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.followUpShot.damagePerKill.value > playerDetail.followUpShot.damagePerKill.avgValue }">
                <span class="val">{{ playerDetail.followUpShot.damagePerKill.value.toFixed(2) }}</span>
                <span class="avg">/ {{ playerDetail.followUpShot.damagePerKill.avgValue.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 道具 -->
        <el-card class="detail-section">
          <template #header>
            <div class="card-header">
              <span>道具</span>
              <el-progress :percentage="playerDetail.item.score" show-text style="width: 150px" :color="getScoreColor(playerDetail.item.score)" :format="(percentage) => `${percentage.toFixed(0)}`" />
            </div>
          </template>
          <div class="stat-grid">
            <div class="stat-item">
              <span class="label">道具使用率</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.item.itemRate.value > playerDetail.item.itemRate.avgValue }">
                <span class="val">{{ (playerDetail.item.itemRate.value * 100).toFixed(1) }}%</span>
                <span class="avg">/ {{ (playerDetail.item.itemRate.avgValue * 100).toFixed(1) }}%</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">每回合道具伤害</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.item.utilityDamagePerRounds.value > playerDetail.item.utilityDamagePerRounds.avgValue }">
                <span class="val">{{ playerDetail.item.utilityDamagePerRounds.value.toFixed(2) }}</span>
                <span class="avg">/ {{ playerDetail.item.utilityDamagePerRounds.avgValue.toFixed(2) }}</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">每回合闪白助攻</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.item.flashAssistPerRound.value > playerDetail.item.flashAssistPerRound.avgValue }">
                <span class="val">{{ playerDetail.item.flashAssistPerRound.value.toFixed(2) }}</span>
                <span class="avg">/ {{ playerDetail.item.flashAssistPerRound.avgValue.toFixed(2) }}</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">闪光弹命中率</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.item.flashbangFlashRate.value > playerDetail.item.flashbangFlashRate.avgValue }">
                <span class="val">{{ (playerDetail.item.flashbangFlashRate.value * 100).toFixed(1) }}%</span>
                <span class="avg">/ {{ (playerDetail.item.flashbangFlashRate.avgValue * 100).toFixed(1) }}%</span>
              </div>
            </div>
            <div class="stat-item">
              <span class="label">敌人被闪白时间</span>
              <div class="inline-value" :class="{ 'above-avg': playerDetail.item.timeOpponentFlashedPerRound.value > playerDetail.item.timeOpponentFlashedPerRound.avgValue }">
                <span class="val">{{ playerDetail.item.timeOpponentFlashedPerRound.value.toFixed(2) }}s</span>
                <span class="avg">/ {{ playerDetail.item.timeOpponentFlashedPerRound.avgValue.toFixed(2) }}s</span>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <div v-if="!playerDetail && querySteamId" class="loading-placeholder">
      <p>加载详细数据中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElProgress } from 'element-plus'
import { authAPI, commonAPI, type PlayerBase, type PlayerDetailResponse } from '../api'
import RankBadge from '../components/RankBadge.vue'

const route = useRoute()
const router = useRouter()

const querySteamId = ref<string>(route.query.steamId as string || '')
const playerInfo = ref<PlayerBase | null>(null)
const playerDetail = ref<PlayerDetailResponse | null>(null)

const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-CN')
}

const formatValue = (item: any): string => {
  if (typeof item === 'object' && item.value !== undefined) {
    const value = item.value
    if (value >= 1 || (value >= 0 && value < 1)) {
      return (value * 100).toFixed(1) + '%'
    }
    return value.toFixed(2)
  }
  return '-'
}

const getScoreColor = (score: number): Array<{percentage: number, color: string}> => {
  // 参考排名页面的HSL渐变，使用红色(0°)到绿色(120°)的平滑渐变
  const hue = (score / 100) * 120
  const saturation = 75
  const lightness = 50
  return [
    { percentage: 0, color: `hsl(${hue}, ${saturation}%, ${lightness}%)` },
    { percentage: 100, color: `hsl(${hue}, ${saturation}%, ${lightness}%)` }
  ]
}

const handleImageError = (e: Event): void => {
  const img = e.target as HTMLImageElement
  img.src =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"%3E%3Crect fill="%23e5e7eb" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-size="28"%3E?%3C/text%3E%3C/svg%3E'
}

const loadPlayerInfo = async (): Promise<void> => {
  try {
    playerInfo.value = await commonAPI.getPlayerBase(querySteamId.value)
  } catch (err) {
    console.error('获取玩家信息失败:', err)
    playerInfo.value = null
  }
}

const loadPlayerDetail = async (): Promise<void> => {
  try {
    playerDetail.value = await commonAPI.getPlayerDetail(querySteamId.value)
  } catch (err) {
    console.error('获取玩家详细信息失败:', err)
    playerDetail.value = null
  }
}

onMounted(async () => {
  // 如果没有 steamId 参数，则获取自己的 steamId
  if (!querySteamId.value) {
    try {
      const result = await authAPI.getInfoSteamId()
      if (result.steamId) {
        querySteamId.value = result.steamId
        // 更新 URL 参数
        await router.replace({
          path: '/data',
          query: {
            steamId: querySteamId.value
          }
        })
      }
    } catch (err) {
      console.error('获取 Steam ID 失败:', err)
      return
    }
  } else {
    // 如果 URL 中已有参数，直接加载玩家信息
    await loadPlayerInfo()
    await loadPlayerDetail()
  }
})

// 监听 route.query 变化，加载玩家信息
watch(() => route.query.steamId, async (newSteamId) => {
  if (newSteamId) {
    querySteamId.value = newSteamId as string
    await loadPlayerInfo()
    await loadPlayerDetail()
  }
})
</script>

<style scoped>
.data-view {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.player-info-card {
  background: white;
  padding: 1.5rem;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.player-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.player-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.player-details h2 {
  margin: 0;
  font-size: 1.375rem;
  color: #111827;
  font-weight: 600;
}

.steam-id {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.last-update {
  margin: 0;
  font-size: 0.875rem;
  color: #9ca3af;
}

.view-matches-btn {
  text-decoration: none;
  margin-top: 0.5rem;
}

.detail-card {
  background: white;
  padding: 1.5rem;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.detail-header {
  margin-bottom: 2rem;
}

.detail-header h2 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  color: #111827;
}

.detail-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.detail-section {
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.stat-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.stat-item .label {
  font-size: 0.7rem;
  color: #6b7280;
  font-weight: 500;
  white-space: nowrap;
}

.stat-item .value {
  font-size: 1.25rem;
  color: #111827;
  font-weight: 600;
}

.stat-item .range {
  font-size: 0.75rem;
  color: #9ca3af;
}

.value-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-value {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: #f9fafb;
  padding: 0.75rem;
  border-radius: 3px;
}

.inline-value {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  font-size: 0.8rem;
  font-weight: 600;
}

.inline-value .val {
  font-weight: 600;
  font-size: 1.125rem;
}

.detail-sections > .detail-section:first-child .inline-value .val {
  color: #111827;
}

.inline-value.above-avg .val {
  color: #22c55e;
}

.inline-value:not(.above-avg) .val {
  color: #ef4444;
}

.inline-value .avg {
  color: #6b7280;
  font-weight: 400;
  font-size: 0.75rem;
}

.inline-simple {
  display: inline;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.loading-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #9ca3af;
}

:deep(.el-card) {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

:deep(.el-card__header) {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.el-card__body) {
  padding: 1.5rem;
}

@media (max-width: 768px) {
  .player-header {
    gap: 1rem;
  }

  .player-details h2 {
    font-size: 1.25rem;
  }

  .detail-sections {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .player-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .detail-header h2 {
    font-size: 1.125rem;
  }
  
  .basic-stats {
    grid-template-columns: 1fr;
  }
}
</style>
