<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Admin Panel - ICTIMS</title>
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="bg-slate-950 text-slate-100 antialiased">
        <div class="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(8,145,178,0.18),_transparent_38%),linear-gradient(180deg,_#020617,_#0f172a)]">
            <div class="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
                <aside class="border-b border-white/10 bg-slate-950/70 backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:w-80 lg:border-b-0 lg:border-r lg:border-white/10">
                    <div class="flex items-center gap-3 border-b border-white/10 px-6 py-6">
                        <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400 text-lg font-bold text-slate-950">IA</div>
                        <div>
                            <p class="text-xs uppercase tracking-[0.3em] text-slate-400">Admin panel</p>
                            <h1 class="text-xl font-semibold text-white">{{ config('app.name', 'Asset Manager') }}</h1>
                        </div>
                    </div>

                    <nav class="space-y-2 px-4 py-5 text-sm font-medium text-slate-300">
                        <a href="#overview" class="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-cyan-200 ring-1 ring-inset ring-cyan-400/20">Overview <span class="text-xs uppercase tracking-[0.2em] text-cyan-300">Live</span></a>
                        <a href="#assets" class="flex items-center justify-between rounded-2xl px-4 py-3 transition hover:bg-white/5 hover:text-white">Assets <span class="text-xs text-slate-500">DB</span></a>
                        <a href="#roles" class="flex items-center justify-between rounded-2xl px-4 py-3 transition hover:bg-white/5 hover:text-white">Roles & permissions <span class="text-xs text-slate-500">DB</span></a>
                        <a href="#activity" class="flex items-center justify-between rounded-2xl px-4 py-3 transition hover:bg-white/5 hover:text-white">Activity <span class="text-xs text-slate-500">Recent</span></a>
                    </nav>
                </aside>

                <main class="flex-1 px-5 py-6 sm:px-6 lg:px-10 lg:py-8">
                    <header id="overview" class="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.4)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p class="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Dashboard</p>
                            <h2 class="mt-2 text-3xl font-semibold text-white">Operational overview</h2>
                            <p class="mt-2 text-sm text-slate-300">
                                Signed in as <span class="font-semibold text-white">
                                    @if(auth()->check())
                                        {{ auth()->user()->username ?? 'Guest' }}
                                    @else
                                        Guest
                                    @endif
                                </span>
                                @if(auth()->check())
                                    · Role: <span class="font-semibold text-cyan-300">{{ auth()->user()->role?->name ?? 'Unassigned' }}</span>
                                @endif
                            </p>
                        </div>

                        @if(auth()->check())
                        <form method="POST" action="{{ route('logout') }}">
                            @csrf
                            <button type="submit" class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Sign out</button>
                        </form>
                        @endif
                    </header>

                    <section class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        @php
                            $toneClasses = [
                                'sky' => 'border-sky-400/20 bg-sky-400/10 text-sky-200',
                                'emerald' => 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
                                'amber' => 'border-amber-400/20 bg-amber-400/10 text-amber-200',
                                'rose' => 'border-rose-400/20 bg-rose-400/10 text-rose-200',
                            ];
                        @endphp
                        @foreach ($stats as $stat)
                            <article class="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_50px_rgba(2,6,23,0.24)] backdrop-blur">
                                <div class="flex items-center justify-between gap-3">
                                    <p class="text-sm text-slate-300">{{ $stat['label'] }}</p>
                                    <span class="rounded-full border px-3 py-1 text-xs font-semibold {{ $toneClasses[$stat['tone']] ?? 'border-white/10 bg-white/5 text-white' }}">DB</span>
                                </div>
                                <p class="mt-4 text-4xl font-semibold tracking-tight text-white">{{ $stat['value'] }}</p>
                            </article>
                        @endforeach
                    </section>

                    <section class="mt-6 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
                        <div id="assets" class="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_50px_rgba(2,6,23,0.24)] backdrop-blur">
                            <div class="flex items-center justify-between gap-4">
                                <div>
                                    <p class="text-sm uppercase tracking-[0.25em] text-slate-400">Assets</p>
                                    <h3 class="mt-2 text-xl font-semibold text-white">Latest records from the database</h3>
                                </div>
                                <a href="{{ route('dashboard') }}" class="text-sm font-medium text-cyan-300 transition hover:text-cyan-200">Refresh</a>
                            </div>

                            <div class="mt-5 overflow-hidden rounded-2xl border border-white/10">
                                <table class="min-w-full divide-y divide-white/10 text-left text-sm">
                                    <thead class="bg-white/5 text-slate-300">
                                        <tr>
                                            <th class="px-4 py-3 font-medium">Asset</th>
                                            <th class="px-4 py-3 font-medium">Category</th>
                                            <th class="px-4 py-3 font-medium">Status</th>
                                            <th class="px-4 py-3 font-medium">Location</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-white/10 bg-slate-950/40 text-slate-200">
                                        @forelse ($assets as $asset)
                                            <tr>
                                                <td class="px-4 py-3 font-medium text-white">{{ $asset['name'] }}</td>
                                                <td class="px-4 py-3">{{ $asset['category'] }}</td>
                                                <td class="px-4 py-3">
                                                    @php
                                                        $statusColors = [
                                                            'Available' => 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                                                            'Assigned' => 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                                                            'Under Maintenance' => 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                                                            'Disposed' => 'bg-red-500/20 text-red-300 border-red-500/30',
                                                            'Lost' => 'bg-gray-500/20 text-gray-300 border-gray-500/30',
                                                        ];
                                                        $statusColor = $statusColors[$asset['status']] ?? 'bg-white/5 text-slate-100 border-white/10';
                                                    @endphp
                                                    <span class="rounded-full border px-2.5 py-1 text-xs font-medium {{ $statusColor }}">
                                                        {{ $asset['status'] }}
                                                    </span>
                                                </td>
                                                <td class="px-4 py-3">{{ $asset['location'] }}</td>
                                            </tr>
                                        @empty
                                            <tr>
                                                <td colspan="4" class="px-4 py-8 text-center text-slate-400">No asset records found yet.</td>
                                            </tr>
                                        @endforelse
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div class="space-y-6">
                            <div id="roles" class="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_50px_rgba(2,6,23,0.24)] backdrop-blur">
                                <p class="text-sm uppercase tracking-[0.25em] text-slate-400">Roles</p>
                                <h3 class="mt-2 text-xl font-semibold text-white">Permissions from the database</h3>

                                <div class="mt-5 space-y-3">
                                    @forelse ($roles as $role)
                                        <div class="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                                            <div class="flex items-center justify-between gap-4">
                                                <div>
                                                    <p class="font-semibold text-white">{{ $role->name }}</p>
                                                    <p class="text-sm text-slate-400">{{ $role->description ?? 'No description' }}</p>
                                                </div>
                                                <div class="text-right text-sm text-slate-300">
                                                    <p>{{ $role->permissions_count ?? 0 }} permissions</p>
                                                    <p>{{ $role->users_count ?? 0 }} users</p>
                                                </div>
                                            </div>
                                        </div>
                                    @empty
                                        <div class="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">No roles are seeded yet.</div>
                                    @endforelse
                                </div>
                            </div>

                            <div id="activity" class="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_50px_rgba(2,6,23,0.24)] backdrop-blur">
                                <p class="text-sm uppercase tracking-[0.25em] text-slate-400">Activity</p>
                                <h3 class="mt-2 text-xl font-semibold text-white">Recent database events</h3>

                                <div class="mt-5 space-y-3">
                                    @forelse ($recentActivities as $activity)
                                        <div class="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                                            <p class="font-medium text-white">{{ $activity['title'] }}</p>
                                            <p class="mt-1 text-sm text-slate-400">{{ $activity['time'] }}</p>
                                        </div>
                                    @empty
                                        <div class="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">No recent activity records are available yet.</div>
                                    @endforelse
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    </body>
</html>
