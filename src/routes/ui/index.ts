import { Hono } from 'hono';
import { auth } from '../../lib/auth';

const ui = new Hono<{ Bindings: CloudflareBindings }>();

// ==================== LOGIN PAGE ====================

const loginHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scraper Admin — Login</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.1/dist/cdn.min.js"></script>
  <style>[x-cloak]{display:none!important}</style>
</head>
<body class="bg-gray-950 min-h-screen flex items-center justify-center font-sans">
  <div x-data="loginForm()" class="w-full max-w-sm px-4">
    <div class="bg-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-800">
      <div class="mb-8 text-center">
        <div class="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-white">Scraper Admin</h1>
        <p class="text-gray-400 mt-1 text-sm">Sign in to manage the scheduler</p>
      </div>
      <div x-cloak x-show="error" class="mb-4 p-3 bg-red-900/40 border border-red-700/60 rounded-lg text-red-300 text-sm" x-text="error"></div>
      <form @submit.prevent="login()">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
          <input x-model="email" type="email" required autocomplete="email" placeholder="admin@example.com"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors">
        </div>
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
          <input x-model="password" type="password" required autocomplete="current-password" placeholder="••••••••"
            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors">
        </div>
        <button type="submit" :disabled="loading"
          class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors">
          <span x-show="!loading">Sign In</span>
          <span x-cloak x-show="loading">Signing in…</span>
        </button>
      </form>
    </div>
  </div>
  <script>
    function loginForm() {
      return {
        email: '', password: '', loading: false, error: '',
        async login() {
          this.loading = true; this.error = '';
          try {
            const res = await fetch('/api/auth/sign-in/email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'same-origin',
              body: JSON.stringify({ email: this.email, password: this.password }),
            });
            const data = await res.json();
            if (res.ok) { window.location.href = '/ui/dashboard'; }
            else { this.error = data.message || data.error || 'Invalid credentials.'; }
          } catch { this.error = 'Network error. Please try again.'; }
          finally { this.loading = false; }
        },
      };
    }
  </script>
</body>
</html>`;

// ==================== DASHBOARD PAGE ====================

const dashboardHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scraper Admin — Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.1/dist/cdn.min.js"></script>
  <style>
    [x-cloak]{display:none!important}
    .tab-active { background-color: rgb(31 41 55); color: white; }
    .tab-inactive { color: rgb(156 163 175); }
    .tab-inactive:hover { color: white; }
  </style>
</head>
<body class="bg-gray-950 min-h-screen text-white font-sans">
<div x-data="dashboard()" x-init="init()">

  <!-- HEADER -->
  <header class="bg-gray-900 border-b border-gray-800 sticky top-0 z-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
      <div class="flex items-center gap-2 flex-shrink-0">
        <div class="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <span class="font-bold text-sm hidden sm:block">Scraper Admin</span>
      </div>
      <nav class="flex items-center gap-1">
        <button @click="switchTab('scheduler')" :class="currentTab==='scheduler'?'tab-active':'tab-inactive'" class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">Scheduler</button>
        <button @click="switchTab('instagram')" :class="currentTab==='instagram'?'tab-active':'tab-inactive'" class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">Instagram</button>
        <button @click="switchTab('tiktok')" :class="currentTab==='tiktok'?'tab-active':'tab-inactive'" class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">TikTok</button>
      </nav>
      <button @click="logout()" class="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors flex-shrink-0">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
        </svg>
        <span class="hidden sm:block">Sign Out</span>
      </button>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 py-8">

    <!-- ============================================================ -->
    <!-- SCHEDULER TAB                                                -->
    <!-- ============================================================ -->
    <div x-show="currentTab === 'scheduler'">

      <!-- Trigger cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div class="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div class="flex items-start gap-3 mb-4">
            <div class="w-9 h-9 bg-indigo-900/60 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
              </svg>
            </div>
            <div>
              <h2 class="font-semibold">Listing Scraping Job</h2>
              <p class="text-gray-400 text-sm mt-0.5">Dispatch pending TikTok hashtag requests to the queue</p>
            </div>
          </div>
          <button @click="triggerJob('listing')" :disabled="triggering !== null"
            class="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <svg x-show="triggering !== 'listing'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <svg x-cloak x-show="triggering === 'listing'" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            <span x-show="triggering !== 'listing'">Trigger Now</span>
            <span x-cloak x-show="triggering === 'listing'">Running…</span>
          </button>
          <p x-cloak x-show="triggerResults.listing" :class="triggerErrors.listing?'text-red-400':'text-green-400'" class="mt-3 text-sm" x-text="triggerResults.listing"></p>
        </div>

        <div class="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div class="flex items-start gap-3 mb-4">
            <div class="w-9 h-9 bg-violet-900/60 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.069A1 1 0 0121 8.88v6.24a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
            </div>
            <div>
              <h2 class="font-semibold">Item Scraping Job</h2>
              <p class="text-gray-400 text-sm mt-0.5">Send scraped video URLs to BrightData for detail scraping</p>
            </div>
          </div>
          <button @click="triggerJob('item')" :disabled="triggering !== null"
            class="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <svg x-show="triggering !== 'item'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <svg x-cloak x-show="triggering === 'item'" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            <span x-show="triggering !== 'item'">Trigger Now</span>
            <span x-cloak x-show="triggering === 'item'">Running…</span>
          </button>
          <p x-cloak x-show="triggerResults.item" :class="triggerErrors.item?'text-red-400':'text-green-400'" class="mt-3 text-sm" x-text="triggerResults.item"></p>
        </div>
      </div>

      <!-- Cron Logs Table -->
      <div class="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 class="font-semibold">Scheduler Logs</h2>
          <button @click="loadSchedulerLogs()" :disabled="schedulerLoading" class="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-40 transition-colors">
            <svg :class="schedulerLoading?'animate-spin':''" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Refresh
          </button>
        </div>
        <div x-show="schedulerLoading && schedulerLogs.length === 0" class="py-16 text-center text-gray-600">
          <svg class="w-8 h-8 animate-spin mx-auto mb-3" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          <p class="text-sm">Loading logs…</p>
        </div>
        <div x-cloak x-show="!schedulerLoading && schedulerLogs.length === 0" class="py-16 text-center text-gray-600">
          <p class="text-sm">No scheduler logs yet.</p>
        </div>
        <div x-cloak x-show="schedulerLogs.length > 0" class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-800">
                <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Job</th>
                <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Trigger</th>
                <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Dispatched</th>
                <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Message</th>
                <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Time</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-800">
              <template x-for="log in schedulerLogs" :key="log.id">
                <tr class="hover:bg-gray-800/30 transition-colors">
                  <td class="px-6 py-4">
                    <span :class="log.status==='success'?'bg-green-900/40 text-green-400 border-green-700/50':'bg-red-900/40 text-red-400 border-red-700/50'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border">
                      <span :class="log.status==='success'?'bg-green-400':'bg-red-400'" class="w-1.5 h-1.5 rounded-full"></span>
                      <span x-text="log.status"></span>
                    </span>
                  </td>
                  <td class="px-6 py-4"><span :class="log.jobType==='listing'?'text-indigo-400':'text-violet-400'" class="text-sm font-medium capitalize" x-text="log.jobType"></span></td>
                  <td class="px-6 py-4"><span :class="log.triggeredBy==='manual'?'text-amber-400':'text-gray-500'" class="text-sm capitalize" x-text="log.triggeredBy"></span></td>
                  <td class="px-6 py-4"><span class="text-sm text-gray-300 tabular-nums" x-text="log.dispatched ?? 0"></span></td>
                  <td class="px-6 py-4 max-w-xs">
                    <span x-show="log.status==='success'" class="text-sm text-gray-400 truncate block" x-text="log.message || '—'"></span>
                    <span x-cloak x-show="log.status==='error'" class="text-sm text-red-400 truncate block" x-text="log.errorMessage || log.message || 'Unknown error'"></span>
                  </td>
                  <td class="px-6 py-4"><span class="text-sm text-gray-500 tabular-nums" x-text="fmtDate(log.createdAt)"></span></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <div x-cloak x-show="schedulerLogs.length > 0" class="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
          <span class="text-sm text-gray-600">Page <span x-text="schedulerPage" class="text-gray-400"></span></span>
          <div class="flex gap-2">
            <button @click="schedulerPage>1&&(schedulerPage--,loadSchedulerLogs())" :disabled="schedulerPage===1" class="text-sm text-gray-400 hover:text-white disabled:opacity-30 px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors">← Prev</button>
            <button @click="schedulerLogs.length>=schedulerPageSize&&(schedulerPage++,loadSchedulerLogs())" :disabled="schedulerLogs.length<schedulerPageSize" class="text-sm text-gray-400 hover:text-white disabled:opacity-30 px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors">Next →</button>
          </div>
        </div>
      </div>
    </div><!-- end scheduler tab -->

    <!-- ============================================================ -->
    <!-- INSTAGRAM TAB                                                -->
    <!-- ============================================================ -->
    <div x-cloak x-show="currentTab === 'instagram'">

      <!-- Loading -->
      <div x-show="igLoading" class="py-24 text-center text-gray-600">
        <svg class="w-10 h-10 animate-spin mx-auto mb-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
        <p>Loading Instagram analytics…</p>
      </div>

      <div x-cloak x-show="!igLoading && igOverview">

        <!-- Stats Cards -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <p class="text-gray-400 text-sm mb-1">Total Requests</p>
            <p class="text-3xl font-bold text-white tabular-nums" x-text="fmtNum(igOverview?.total)"></p>
          </div>
          <div class="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <p class="text-gray-400 text-sm mb-1">Unique Profiles</p>
            <p class="text-3xl font-bold text-white tabular-nums" x-text="fmtNum(igOverview?.byIdentifier?.length)"></p>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

          <!-- Doughnut: by identifier -->
          <div class="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 class="font-semibold mb-4">Requests by Profile (top 10)</h3>
            <div class="relative" style="height:260px">
              <canvas id="igDistChart"></canvas>
            </div>
          </div>

          <!-- Bar: timeline -->
          <div class="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold">Requests Over Time</h3>
              <div class="flex rounded-lg overflow-hidden border border-gray-700">
                <button @click="igPeriod='month'; loadIgTimeline()" :class="igPeriod==='month'?'bg-gray-700 text-white':'text-gray-400 hover:text-white'" class="px-3 py-1 text-xs font-medium transition-colors">Monthly</button>
                <button @click="igPeriod='week'; loadIgTimeline()" :class="igPeriod==='week'?'bg-gray-700 text-white':'text-gray-400 hover:text-white'" class="px-3 py-1 text-xs font-medium transition-colors border-l border-gray-700">Weekly</button>
              </div>
            </div>
            <div class="relative" style="height:260px">
              <canvas id="igTimelineChart"></canvas>
            </div>
          </div>
        </div>

        <!-- Filter by Identifier -->
        <div class="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
          <div class="flex flex-wrap items-center gap-4 mb-4">
            <h3 class="font-semibold">Profile Deep-Dive</h3>
            <select x-model="igIdentifier" @change="onIgIdentifierChange()"
              class="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500">
              <option value="">— All profiles —</option>
              <template x-for="id in (igOverview?.identifiers || [])" :key="id">
                <option :value="id" x-text="id"></option>
              </template>
            </select>
            <template x-if="igIdentifier">
              <div class="flex rounded-lg overflow-hidden border border-gray-700">
                <button @click="igIdentifierPeriod='month'; loadIgIdentifierTimeline()" :class="igIdentifierPeriod==='month'?'bg-gray-700 text-white':'text-gray-400 hover:text-white'" class="px-3 py-1 text-xs font-medium transition-colors">Monthly</button>
                <button @click="igIdentifierPeriod='week'; loadIgIdentifierTimeline()" :class="igIdentifierPeriod==='week'?'bg-gray-700 text-white':'text-gray-400 hover:text-white'" class="px-3 py-1 text-xs font-medium transition-colors border-l border-gray-700">Weekly</button>
              </div>
            </template>
          </div>
          <div x-show="igIdentifier" class="relative" style="height:220px">
            <canvas id="igIdentifierChart"></canvas>
          </div>
          <div x-show="!igIdentifier" class="py-8 text-center text-gray-600 text-sm">
            Select a profile above to see its request timeline.
          </div>
        </div>

        <!-- Request List -->
        <div class="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-800 flex flex-wrap items-center justify-between gap-3">
            <h3 class="font-semibold">All Requests <span x-show="igIdentifier" class="text-indigo-400 font-normal text-sm" x-text="'— ' + igIdentifier"></span></h3>
            <button @click="igPage=1; loadIgRequests()" class="text-sm text-gray-400 hover:text-white transition-colors">↻ Refresh</button>
          </div>
          <div x-show="igRequests.length === 0 && !igLoading" class="py-12 text-center text-gray-600 text-sm">No requests found.</div>
          <div x-show="igRequests.length > 0" class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-800">
                  <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Profile (Identifier)</th>
                  <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Data Size</th>
                  <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">API Key</th>
                  <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Time</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-800">
                <template x-for="req in igRequests" :key="req.id">
                  <tr class="hover:bg-gray-800/30 transition-colors">
                    <td class="px-6 py-3"><span class="text-sm text-indigo-400 font-medium" x-text="req.identifier || '—'"></span></td>
                    <td class="px-6 py-3"><span class="text-sm text-gray-300 tabular-nums" x-text="fmtNum(req.dataSize)"></span></td>
                    <td class="px-6 py-3"><span class="text-sm text-gray-500" x-text="req.keyName"></span></td>
                    <td class="px-6 py-3"><span class="text-sm text-gray-500 tabular-nums" x-text="fmtDate(req.createdAt)"></span></td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          <div x-show="igRequests.length > 0" class="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
            <span class="text-sm text-gray-600">Page <span x-text="igPage" class="text-gray-400"></span></span>
            <div class="flex gap-2">
              <button @click="igPage>1&&(igPage--,loadIgRequests())" :disabled="igPage===1" class="text-sm text-gray-400 hover:text-white disabled:opacity-30 px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors">← Prev</button>
              <button @click="igRequests.length>=igPageSize&&(igPage++,loadIgRequests())" :disabled="igRequests.length<igPageSize" class="text-sm text-gray-400 hover:text-white disabled:opacity-30 px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors">Next →</button>
            </div>
          </div>
        </div>
      </div>
    </div><!-- end instagram tab -->

    <!-- ============================================================ -->
    <!-- TIKTOK TAB                                                   -->
    <!-- ============================================================ -->
    <div x-cloak x-show="currentTab === 'tiktok'">

      <!-- Loading -->
      <div x-show="ttLoading" class="py-24 text-center text-gray-600">
        <svg class="w-10 h-10 animate-spin mx-auto mb-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
        <p>Loading TikTok analytics…</p>
      </div>

      <div x-cloak x-show="!ttLoading && ttOverview">

        <!-- Stats Cards -->
        <div class="grid grid-cols-3 gap-4 mb-6">
          <div class="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <p class="text-gray-400 text-sm mb-1">Total Requests</p>
            <p class="text-3xl font-bold text-white tabular-nums" x-text="fmtNum(ttOverview?.totalRequests)"></p>
          </div>
          <div class="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <p class="text-gray-400 text-sm mb-1">Unique Hashtags</p>
            <p class="text-3xl font-bold text-white tabular-nums" x-text="fmtNum(ttOverview?.totalHashtags)"></p>
          </div>
          <div class="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <p class="text-gray-400 text-sm mb-1">Videos Scraped</p>
            <p class="text-3xl font-bold text-violet-400 tabular-nums" x-text="fmtNum(ttOverview?.totalVideos)"></p>
          </div>
        </div>

        <!-- Video Timeline Chart -->
        <div class="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 class="font-semibold">Videos Scraped by Hashtag</h3>
            <div class="flex rounded-lg overflow-hidden border border-gray-700">
              <button @click="ttPeriod='day'; loadTtVideoTimeline()" :class="ttPeriod==='day'?'bg-gray-700 text-white':'text-gray-400 hover:text-white'" class="px-3 py-1 text-xs font-medium transition-colors">Daily</button>
              <button @click="ttPeriod='week'; loadTtVideoTimeline()" :class="ttPeriod==='week'?'bg-gray-700 text-white':'text-gray-400 hover:text-white'" class="px-3 py-1 text-xs font-medium transition-colors border-l border-gray-700">Weekly</button>
              <button @click="ttPeriod='month'; loadTtVideoTimeline()" :class="ttPeriod==='month'?'bg-gray-700 text-white':'text-gray-400 hover:text-white'" class="px-3 py-1 text-xs font-medium transition-colors border-l border-gray-700">Monthly</button>
            </div>
          </div>
          <div x-show="ttVideoTimeline.length === 0" class="py-10 text-center text-gray-600 text-sm">No video data yet.</div>
          <div x-show="ttVideoTimeline.length > 0" class="relative" style="height:300px">
            <canvas id="ttTimelineChart"></canvas>
          </div>
        </div>

        <!-- TikTok Requests List -->
        <div class="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h3 class="font-semibold">Scraping Requests</h3>
            <button @click="ttPage=1; loadTtRequests()" class="text-sm text-gray-400 hover:text-white transition-colors">↻ Refresh</button>
          </div>
          <div x-show="ttRequests.length === 0" class="py-12 text-center text-gray-600 text-sm">No TikTok scraping requests found.</div>
          <div x-show="ttRequests.length > 0" class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-800">
                  <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Hashtag</th>
                  <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">API Key</th>
                  <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Videos Scraped</th>
                  <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Time</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-800">
                <template x-for="req in ttRequests" :key="req.id">
                  <tr class="hover:bg-gray-800/30 transition-colors">
                    <td class="px-6 py-3">
                      <span class="inline-flex items-center gap-1.5 text-sm font-medium text-violet-400">
                        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.55V6.79a4.86 4.86 0 01-1.07-.1z"/></svg>
                        <span x-text="req.identifier || '—'"></span>
                      </span>
                    </td>
                    <td class="px-6 py-3"><span class="text-sm text-gray-500" x-text="req.keyName"></span></td>
                    <td class="px-6 py-3">
                      <span :class="req.videoCount > 0 ? 'text-violet-400' : 'text-gray-600'" class="text-sm font-semibold tabular-nums" x-text="fmtNum(req.videoCount)"></span>
                    </td>
                    <td class="px-6 py-3"><span class="text-sm text-gray-500 tabular-nums" x-text="fmtDate(req.createdAt)"></span></td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          <div x-show="ttRequests.length > 0" class="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
            <span class="text-sm text-gray-600">Page <span x-text="ttPage" class="text-gray-400"></span></span>
            <div class="flex gap-2">
              <button @click="ttPage>1&&(ttPage--,loadTtRequests())" :disabled="ttPage===1" class="text-sm text-gray-400 hover:text-white disabled:opacity-30 px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors">← Prev</button>
              <button @click="ttRequests.length>=ttPageSize&&(ttPage++,loadTtRequests())" :disabled="ttRequests.length<ttPageSize" class="text-sm text-gray-400 hover:text-white disabled:opacity-30 px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors">Next →</button>
            </div>
          </div>
        </div>
      </div>
    </div><!-- end tiktok tab -->

  </main>
</div>

<script>
const CHART_COLORS = [
  'rgba(99,102,241,0.75)','rgba(139,92,246,0.75)','rgba(236,72,153,0.75)',
  'rgba(59,130,246,0.75)','rgba(16,185,129,0.75)','rgba(245,158,11,0.75)',
  'rgba(239,68,68,0.75)','rgba(14,165,233,0.75)','rgba(168,85,247,0.75)',
  'rgba(34,197,94,0.75)',
];
const CHART_BORDERS = CHART_COLORS.map(c => c.replace('0.75','1'));

function dashboard() {
  return {
    currentTab: 'scheduler',

    // --- Scheduler ---
    schedulerLogs: [], schedulerLoading: false,
    schedulerPage: 1, schedulerPageSize: 50,
    triggering: null,
    triggerResults: { listing: '', item: '' },
    triggerErrors:  { listing: false, item: false },

    // --- Instagram ---
    igLoaded: false, igLoading: false,
    igOverview: null,
    igTimeline: [], igPeriod: 'month',
    igIdentifier: '', igIdentifierPeriod: 'month', igIdentifierTimeline: [],
    igRequests: [], igPage: 1, igPageSize: 20,

    // --- TikTok ---
    ttLoaded: false, ttLoading: false,
    ttOverview: null,
    ttRequests: [], ttPage: 1, ttPageSize: 20,
    ttVideoTimeline: [], ttPeriod: 'month',

    // --- Chart registry ---
    charts: {},

    async init() {
      await this.loadSchedulerLogs();
    },

    // ==================== NAV ====================
    async switchTab(tab) {
      this.currentTab = tab;
      await this.$nextTick();
      if (tab === 'instagram' && !this.igLoaded) {
        this.igLoaded = true;
        await this.loadInstagramAll();
      } else if (tab === 'instagram') {
        await this.$nextTick();
        this.renderIgDistChart();
        this.renderIgTimelineChart();
        if (this.igIdentifier) this.renderIgIdentifierChart();
      }
      if (tab === 'tiktok' && !this.ttLoaded) {
        this.ttLoaded = true;
        await this.loadTiktokAll();
      } else if (tab === 'tiktok') {
        await this.$nextTick();
        this.renderTtTimelineChart();
      }
    },

    async logout() {
      await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'same-origin' });
      window.location.href = '/ui';
    },

    // ==================== SCHEDULER ====================
    async loadSchedulerLogs() {
      this.schedulerLoading = true;
      try {
        const res = await fetch('/management/cron-logs?page=' + this.schedulerPage + '&limit=' + this.schedulerPageSize, { credentials: 'same-origin' });
        if (res.status === 401 || res.status === 403) { window.location.href = '/ui'; return; }
        const d = await res.json();
        this.schedulerLogs = d.logs || [];
      } catch(e) { console.error(e); }
      finally { this.schedulerLoading = false; }
    },

    async triggerJob(type) {
      this.triggering = type;
      this.triggerResults[type] = '';
      this.triggerErrors[type] = false;
      try {
        const endpoint = type === 'listing' ? '/management/trigger/listing' : '/management/trigger/item';
        const res = await fetch(endpoint, { method: 'POST', credentials: 'same-origin' });
        const d = await res.json();
        if (res.ok) {
          this.triggerResults[type] = d.message || 'Job triggered successfully';
          this.triggerErrors[type] = false;
          setTimeout(() => this.loadSchedulerLogs(), 800);
        } else {
          this.triggerResults[type] = d.error || 'Failed to trigger job';
          this.triggerErrors[type] = true;
        }
      } catch {
        this.triggerResults[type] = 'Network error. Please try again.';
        this.triggerErrors[type] = true;
      } finally { this.triggering = null; }
    },

    // ==================== INSTAGRAM ====================
    async loadInstagramAll() {
      this.igLoading = true;
      try {
        const [ovRes, tlRes, rqRes] = await Promise.all([
          fetch('/management/analytics/instagram', { credentials: 'same-origin' }),
          fetch('/management/analytics/instagram/timeline?period=' + this.igPeriod, { credentials: 'same-origin' }),
          fetch('/management/analytics/instagram/requests?page=1&limit=' + this.igPageSize, { credentials: 'same-origin' }),
        ]);
        this.igOverview  = await ovRes.json();
        this.igTimeline  = (await tlRes.json()).data || [];
        this.igRequests  = (await rqRes.json()).data || [];
        await this.$nextTick();
        this.renderIgDistChart();
        this.renderIgTimelineChart();
      } catch(e) { console.error(e); }
      finally { this.igLoading = false; }
    },

    async loadIgTimeline() {
      const res = await fetch('/management/analytics/instagram/timeline?period=' + this.igPeriod, { credentials: 'same-origin' });
      this.igTimeline = (await res.json()).data || [];
      this.renderIgTimelineChart();
    },

    async onIgIdentifierChange() {
      this.igPage = 1;
      await Promise.all([this.loadIgRequests(), this.loadIgIdentifierTimeline()]);
    },

    async loadIgIdentifierTimeline() {
      if (!this.igIdentifier) { this.igIdentifierTimeline = []; return; }
      const url = '/management/analytics/instagram/identifier?identifier=' + encodeURIComponent(this.igIdentifier) + '&period=' + this.igIdentifierPeriod;
      const res = await fetch(url, { credentials: 'same-origin' });
      this.igIdentifierTimeline = (await res.json()).data || [];
      await this.$nextTick();
      this.renderIgIdentifierChart();
    },

    async loadIgRequests() {
      const id = this.igIdentifier;
      const url = '/management/analytics/instagram/requests?page=' + this.igPage + '&limit=' + this.igPageSize + (id ? '&identifier=' + encodeURIComponent(id) : '');
      const res = await fetch(url, { credentials: 'same-origin' });
      this.igRequests = (await res.json()).data || [];
    },

    // ==================== TIKTOK ====================
    async loadTiktokAll() {
      this.ttLoading = true;
      try {
        const [ovRes, rqRes, vdRes] = await Promise.all([
          fetch('/management/analytics/tiktok', { credentials: 'same-origin' }),
          fetch('/management/analytics/tiktok/requests?page=1&limit=' + this.ttPageSize, { credentials: 'same-origin' }),
          fetch('/management/analytics/tiktok/videos?period=' + this.ttPeriod, { credentials: 'same-origin' }),
        ]);
        this.ttOverview      = await ovRes.json();
        this.ttRequests      = (await rqRes.json()).data || [];
        this.ttVideoTimeline = (await vdRes.json()).data || [];
        await this.$nextTick();
        this.renderTtTimelineChart();
      } catch(e) { console.error(e); }
      finally { this.ttLoading = false; }
    },

    async loadTtVideoTimeline() {
      const res = await fetch('/management/analytics/tiktok/videos?period=' + this.ttPeriod, { credentials: 'same-origin' });
      this.ttVideoTimeline = (await res.json()).data || [];
      this.renderTtTimelineChart();
    },

    async loadTtRequests() {
      const res = await fetch('/management/analytics/tiktok/requests?page=' + this.ttPage + '&limit=' + this.ttPageSize, { credentials: 'same-origin' });
      this.ttRequests = (await res.json()).data || [];
    },

    // ==================== CHARTS ====================
    destroyChart(id) {
      if (this.charts[id]) { this.charts[id].destroy(); delete this.charts[id]; }
    },

    renderIgDistChart() {
      this.destroyChart('igDist');
      const canvas = document.getElementById('igDistChart');
      if (!canvas || !this.igOverview) return;
      const top10 = (this.igOverview.byIdentifier || []).slice(0, 10);
      this.charts['igDist'] = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: top10.map(r => r.identifier || 'Unknown'),
          datasets: [{ data: top10.map(r => r.count), backgroundColor: CHART_COLORS, borderColor: CHART_BORDERS, borderWidth: 1 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'right', labels: { color: '#9ca3af', boxWidth: 12, padding: 10, font: { size: 11 } } } },
        },
      });
    },

    renderIgTimelineChart() {
      this.destroyChart('igTimeline');
      const canvas = document.getElementById('igTimelineChart');
      if (!canvas) return;
      this.charts['igTimeline'] = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: this.igTimeline.map(r => this.fmtPeriod(r.period, this.igPeriod)),
          datasets: [{
            label: 'Requests',
            data: this.igTimeline.map(r => r.count),
            backgroundColor: 'rgba(99,102,241,0.7)', borderColor: 'rgba(99,102,241,1)', borderWidth: 1, borderRadius: 4,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: 'rgba(55,65,81,0.4)' }, ticks: { color: '#9ca3af', font: { size: 11 } } },
            y: { grid: { color: 'rgba(55,65,81,0.4)' }, ticks: { color: '#9ca3af', precision: 0 }, beginAtZero: true },
          },
        },
      });
    },

    renderIgIdentifierChart() {
      this.destroyChart('igId');
      const canvas = document.getElementById('igIdentifierChart');
      if (!canvas) return;
      this.charts['igId'] = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: this.igIdentifierTimeline.map(r => this.fmtPeriod(r.period, this.igIdentifierPeriod)),
          datasets: [{
            label: this.igIdentifier,
            data: this.igIdentifierTimeline.map(r => r.count),
            backgroundColor: 'rgba(139,92,246,0.7)', borderColor: 'rgba(139,92,246,1)', borderWidth: 1, borderRadius: 4,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: 'rgba(55,65,81,0.4)' }, ticks: { color: '#9ca3af', font: { size: 11 } } },
            y: { grid: { color: 'rgba(55,65,81,0.4)' }, ticks: { color: '#9ca3af', precision: 0 }, beginAtZero: true },
          },
        },
      });
    },

    renderTtTimelineChart() {
      this.destroyChart('ttTimeline');
      const canvas = document.getElementById('ttTimelineChart');
      if (!canvas || !this.ttVideoTimeline.length) return;

      const periods  = [...new Set(this.ttVideoTimeline.map(r => r.period))].sort();
      const hashtags = [...new Set(this.ttVideoTimeline.map(r => r.hashtag))].slice(0, 10);

      const datasets = hashtags.map((tag, i) => ({
        label: tag,
        data: periods.map(p => {
          const e = this.ttVideoTimeline.find(r => r.period === p && r.hashtag === tag);
          return e ? e.count : 0;
        }),
        backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
        borderColor: CHART_BORDERS[i % CHART_BORDERS.length],
        borderWidth: 1,
        borderRadius: 3,
        stack: 'stack',
      }));

      this.charts['ttTimeline'] = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: periods.map(p => this.fmtPeriod(p, this.ttPeriod)),
          datasets,
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#9ca3af', boxWidth: 12, font: { size: 11 } } } },
          scales: {
            x: { grid: { color: 'rgba(55,65,81,0.4)' }, ticks: { color: '#9ca3af', font: { size: 11 } }, stacked: true },
            y: { grid: { color: 'rgba(55,65,81,0.4)' }, ticks: { color: '#9ca3af', precision: 0 }, beginAtZero: true, stacked: true },
          },
        },
      });
    },

    // ==================== HELPERS ====================
    fmtPeriod(period, granularity) {
      if (!period) return '';
      const d = new Date(period);
      if (granularity === 'month') return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
      if (granularity === 'week')  return 'Wk ' + d.toLocaleDateString('en-US', { month: 'M/d', timeZone: 'UTC' });
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    },

    fmtDate(s) {
      if (!s) return '—';
      return new Date(s).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    },

    fmtNum(n) { return (n ?? 0).toLocaleString(); },
  };
}
</script>
</body>
</html>`;

// ==================== ROUTES ====================

ui.get('/', (c) => c.html(loginHtml));

ui.get('/dashboard', async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.redirect('/ui');
  return c.html(dashboardHtml);
});

export default ui;
