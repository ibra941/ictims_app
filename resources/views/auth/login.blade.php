<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Sign in</title>
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="min-h-screen bg-slate-950 text-slate-100">
        <div class="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
            <section class="relative overflow-hidden border-b border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_35%),linear-gradient(135deg,_#020617,_#0f172a_55%,_#111827)] px-8 py-12 lg:px-14 lg:py-16">
                <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.07)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40"></div>
                <div class="relative flex h-full max-w-xl flex-col justify-between">
                    <div>
                        <p class="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Asset management</p>
                        <h1 class="mt-6 max-w-lg text-4xl font-semibold tracking-tight text-white sm:text-5xl">Admin access for every ICT role, powered from the database.</h1>
                        <p class="mt-6 max-w-lg text-base leading-7 text-slate-300">Authenticate with your username, then use the dashboard to view role-specific permissions, assets, procurement, maintenance, and audit data from the database.</p>
                    </div>

                    <div class="mt-12 grid gap-4 sm:grid-cols-3">
                        <div class="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                            <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Roles</p>
                            <p class="mt-2 text-2xl font-semibold text-white">8</p>
                        </div>
                        <div class="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                            <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Database</p>
                            <p class="mt-2 text-2xl font-semibold text-white">Live</p>
                        </div>
                        <div class="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                            <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Access</p>
                            <p class="mt-2 text-2xl font-semibold text-white">Protected</p>
                        </div>
                    </div>
                </div>
            </section>

            <section class="flex items-center justify-center bg-slate-100 px-6 py-10 text-slate-900 sm:px-10">
                <div class="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
                    <div>
                        <p class="text-sm font-medium uppercase tracking-[0.25em] text-cyan-700">Sign in</p>
                        <h2 class="mt-2 text-2xl font-semibold text-slate-950">Use your username and password</h2>
                    </div>

                    @if ($errors->any())
                        <div class="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {{ $errors->first() }}
                        </div>
                    @endif

                    <form class="mt-6 space-y-5" method="POST" action="{{ route('login') }}">
                        @csrf

                        <div>
                            <label for="username" class="mb-2 block text-sm font-medium text-slate-700">Username</label>
                            <input id="username" name="username" type="text" value="{{ old('username') }}" required autofocus class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10">
                        </div>

                        <div>
                            <label for="password" class="mb-2 block text-sm font-medium text-slate-700">Password</label>
                            <input id="password" name="password" type="password" required class="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10">
                        </div>

                        <button type="submit" class="flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600">
                            Sign in to dashboard
                        </button>
                    </form>

                    <p class="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        Default seeded account: <span class="font-semibold text-slate-900">admin</span> / <span class="font-semibold text-slate-900">password</span>
                    </p>
                </div>
            </section>
        </div>
    </body>
</html>
