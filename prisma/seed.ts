/* prisma/seed.ts */
import { PrismaClient, Prisma, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const log = (m: string) => console.log(`\x1b[36m[seed]\x1b[0m ${m}`);

function envStr(name: string, fallback?: string) {
  const v = process.env[name];
  if (typeof v === 'string' && v.trim()) return v.trim();
  return fallback;
}

function normalizePhone(raw: string): string {
  const d = (raw || '').replace(/\D+/g, '');
  if (!d) return '';
  // приводим казахстан/РФ к формату 7XXXXXXXXXX
  if (d.length === 11 && (d.startsWith('77') || d.startsWith('87'))) return '7' + d.slice(1);
  if (d.length === 10) return '7' + d;
  if (d.length === 11 && d.startsWith('7')) return d;
  return d;
}

async function ensureUser(opts: {
  email: string;
  password: string;
  role: Role;
  name?: string | null;
  resetIfEnv?: boolean; // если true — перехэшит пароль, если пользователь уже есть
}) {
  const email = opts.email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });

  if (!exists) {
    const passwordHash = await bcrypt.hash(opts.password, 10);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: opts.role,
        name: opts.name ?? null,
      },
    });
    log(`user created: ${email} (${opts.role})`);
    return;
  }

  if (opts.resetIfEnv) {
    const passwordHash = await bcrypt.hash(opts.password, 10);
    await prisma.user.update({
      where: { email },
      data: { passwordHash, role: opts.role, name: opts.name ?? exists.name ?? null },
    });
    log(`user updated (password reset): ${email} (${opts.role})`);
  } else {
    log(`user exists: ${email} (${exists.role}) — keep as is`);
  }
}

async function seedSettings() {
  const brandName = 'Lavender Travel KZ';
  await prisma.$transaction(async (tx) => {
    await tx.siteSettings.updateMany({ data: { isActive: false } });
    await tx.siteSettings.create({
      data: {
        isActive: true,
        brandName,
        brandTagline: 'Вылеты из Алматы и Астаны',
        metaTitle: 'Lavender Travel KZ — туры из Алматы и Астаны',
        metaDescription: 'Авторские туры, забота 24/7, маршруты под ваш стиль отдыха.',
        ogImageUrl: '/images/hero.jpg', // у тебя есть этот файл — безопаснее, чем /images/og.png
        whatsappNumber: normalizePhone('77080086191'),
        instagramUrl: 'https://www.instagram.com/lavender_travel_kz',
      },
    });
  });
  log('siteSettings: single active profile created');
}

async function seedHero() {
  await prisma.$transaction(async (tx) => {
    await tx.hero.updateMany({ data: { isActive: false } });

    await tx.hero.create({
      data: {
        isActive: true,
        variant: 'DEFAULT',
        kicker:      { ru: 'Lavender Travel', kk: 'Lavender Travel', en: 'Lavender Travel' } as Prisma.InputJsonValue,
        titleTop:    { ru: 'Путешествуй красиво', kk: 'Әдемі саяхатта', en: 'Travel beautifully' } as Prisma.InputJsonValue,
        titleBottom: { ru: 'с Lavender Travel', kk: 'Lavender Travel-мен', en: 'with Lavender Travel' } as Prisma.InputJsonValue,
        subtitle:    { ru: 'Авторские туры по миру, продуманные маршруты и забота 24/7. Минимум суеты — максимум впечатлений.', kk: 'Авторлық турлар, ойластырылған маршруттар және 24/7 қамқорлық. Аз әбігер — көп әсер.', en: 'Signature tours, thoughtful itineraries and 24/7 care. Less hassle — more memories.' } as Prisma.InputJsonValue,
        imageUrl:    '/images/hero.jpg',
        imageAlt:    { ru: 'Море и закат', kk: 'Теңіз бен күннің батуы', en: 'Sea and sunset' } as Prisma.InputJsonValue,
      },
    });
  });
  log('hero: single active profile created');
}

async function seedDestinations() {
  const dests = [
    { key: 'turkey',   title: { ru:'Турция',  kk:'Түркия',  en:'Turkey'  }, imageUrl:'/images/destinations/turkey.png'  },
    { key: 'vietnam',  title: { ru:'Вьетнам', kk:'Вьетнам', en:'Vietnam' }, imageUrl:'/images/destinations/vietnam.jpg' },
    { key: 'thailand', title: { ru:'Таиланд', kk:'Тайланд', en:'Thailand'}, imageUrl:'/images/destinations/thailand.jpg'},
    { key: 'uae',      title: { ru:'ОАЭ',     kk:'БАӘ',     en:'UAE'     }, imageUrl:'/images/destinations/uae.jpg'     },
    { key: 'egypt',    title: { ru:'Египет',  kk:'Мысыр',   en:'Egypt'   }, imageUrl:'/images/destinations/egypt.png'   },
  ] as const;

  // до 8 активных на витрине — у тебя так же в API
  let sortOrder = 0;
  for (const d of dests) {
    await prisma.destination.upsert({
      where: { key: d.key },
      create: {
        key: d.key,
        title: d.title as unknown as Prisma.InputJsonValue,
        imageUrl: d.imageUrl,
        sortOrder: sortOrder,
        isActive: true,
      },
      update: {
        title: d.title as unknown as Prisma.InputJsonValue,
        imageUrl: d.imageUrl,
        sortOrder: sortOrder,
        isActive: true,
      },
    });
    sortOrder += 1;
  }
  log(`destinations: upserted ${dests.length} and set active/sortOrder`);
}

async function seedAdmins() {
  const adminEmail = envStr('ADMIN_EMAIL', 'admin@lavender.local')!;
  const adminPass  = envStr('ADMIN_PASSWORD', 'admin12345')!;
  const resetAdmin = process.env.SEED_RESET_ADMIN === '1'; // опционально сбрасывать пароль при повторном сееде

  if (adminPass.length < 6) {
    throw new Error('ADMIN_PASSWORD must be at least 6 characters');
  }

  await ensureUser({
    email: adminEmail,
    password: adminPass,
    role: 'ADMIN',
    name: 'Admin',
    resetIfEnv: resetAdmin,
  });

  // Опционально: создать редактора, если заданы переменные
  const editorEmail = envStr('EDITOR_EMAIL');
  const editorPass  = envStr('EDITOR_PASSWORD');
  if (editorEmail && editorPass) {
    await ensureUser({
      email: editorEmail,
      password: editorPass,
      role: 'EDITOR',
      name: 'Editor',
      resetIfEnv: process.env.SEED_RESET_EDITOR === '1',
    });
  }
}

function rand<T>(arr: readonly T[]) { return arr[Math.floor(Math.random() * arr.length)]; }

async function seedFakeAnalytics() {
  if (process.env.SEED_FAKE_ANALYTICS !== '1') {
    log('analytics: skip (SEED_FAKE_ANALYTICS != 1)');
    return;
  }
  log('analytics: generating demo events (safe size)');

  const types = ['page_view','click_whatsapp','submit_form'] as const;
  const devices = [null,'mobile','desktop'] as const;
  const locales = [null,'ru','kk','en'] as const;
  const paths   = [null,'/','/ru','/kk','/tours','/contact'] as const;
  const sources = [null,'google','instagram','direct','referral'] as const;
  const mediums = [null,'cpc','social','organic','email'] as const;

  // немного за 14 дней + за сегодня по часам, чтобы графики жили
  const now = new Date();
  const events: Prisma.AnalyticsEventCreateManyInput[] = [];

  for (let d = 14; d >= 1; d--) {
    const day = new Date(now);
    day.setHours(12, 0, 0, 0);
    day.setDate(day.getDate() - d);

    const n = 10 + Math.floor(Math.random() * 20);
    for (let i = 0; i < n; i++) {
      events.push({
        createdAt: new Date(day.getTime() + i * 60000),
        type: rand(types),
        path: rand(paths),
        locale: rand(locales),
        referrer: null,
        device: rand(devices),
        utm: {
          source: rand(sources) ?? undefined,
          medium: rand(mediums) ?? undefined,
          campaign: Math.random() > 0.7 ? 'spring' : undefined,
        } as unknown as Prisma.InputJsonValue,
        // денормы (если у тебя такие поля есть — ты их добавлял миграцией)
        source: rand(sources) ?? undefined,
        medium: rand(mediums) ?? undefined,
        campaign: Math.random() > 0.7 ? 'spring' : undefined,
        channel: undefined,
      });
    }
  }

  // за сегодня по часам
  const today = new Date();
  today.setMinutes(0,0,0);
  for (let h = 0; h < 12; h++) {
    const base = new Date(today);
    base.setHours(today.getHours() - (12 - h));
    const n = 5 + Math.floor(Math.random() * 10);
    for (let i = 0; i < n; i++) {
      events.push({
        createdAt: new Date(base.getTime() + i * 120000),
        type: rand(types),
        path: rand(paths),
        locale: rand(locales),
        referrer: null,
        device: rand(devices),
        utm: {} as unknown as Prisma.InputJsonValue,
        source: null,
        medium: null,
        campaign: null,
        channel: null,
      });
    }
  }

  // безопасная порционная вставка
  const chunk = 500;
  for (let i = 0; i < events.length; i += chunk) {
    const slice = events.slice(i, i + chunk);
    await prisma.analyticsEvent.createMany({ data: slice, skipDuplicates: true });
  }
  log(`analytics: inserted ~${events.length} demo rows`);
}

async function maybeLogActivity() {
  try {
    await prisma.activity.create({
      data: {
        ts: new Date(),
        action: 'seed.run',
        status: 'OK',
        route: '/prisma/seed',          // ← обязателен
        method: 'SYSTEM',               // ← обязателен (можно 'SEED' или 'POST' — строка)
        targetType: 'System',
        targetId: null,
        payload: { env: Object.keys(process.env || {}) } as Prisma.InputJsonValue,
        // diff: {} as Prisma.InputJsonValue, // добавь, если у тебя diff NOT NULL
      },
    });
    log('activity: seed.run logged');
  } catch {
    // таблицы может не быть в старой БД — молча пропускаем
  }
}

async function main() {
  log('start');
  await seedSettings();
  await seedHero();
  await seedDestinations();
  await seedAdmins();
  await seedFakeAnalytics();
  await maybeLogActivity();
  log('done');
}

main()
  .catch((e) => {
    console.error('\n[seed] FATAL:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });